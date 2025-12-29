/**
 * Chrome History Import Service
 *
 * Imports Chrome browsing history from CSV export with aggregation
 */

import { parse } from 'csv-parse/sync';
import { extractSearchQuery, groupSearchFlows } from './query-extraction.service';
import { getRepositories } from '../db/repositories';

export interface ChromeHistoryEntry {
  order: number;
  id: string;
  date: string; // MM/DD/YYYY
  time: string; // HH:MM:SS
  title: string;
  url: string;
  visitCount: number;
  typedCount: number;
  transition: string;
}

export interface ImportResult {
  totalRows: number;
  aggregatedRows: number;
  searchFlows: number;
  skipped: number;
  errors: string[];
}

/**
 * Import Chrome history from CSV content
 */
export async function importChromeHistoryFromCsv(
  userId: string,
  csvContent: string
): Promise<ImportResult> {
  console.log(`[Chrome Import] Starting import for user: ${userId}`);

  const result: ImportResult = {
    totalRows: 0,
    aggregatedRows: 0,
    searchFlows: 0,
    skipped: 0,
    errors: [],
  };

  try {
    // Parse CSV (handle UTF-8 BOM)
    const cleanCsv = csvContent.replace(/^\uFEFF/, '');
    const records = parse(cleanCsv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as any[];

    result.totalRows = records.length;
    console.log(`[Chrome Import] Parsed ${records.length} rows`);

    // Convert to ChromeHistoryEntry
    const entries: ChromeHistoryEntry[] = records.map(r => ({
      order: parseInt(r.order),
      id: r.id,
      date: r.date,
      time: r.time,
      title: r.title || '',
      url: r.url,
      visitCount: parseInt(r.visitCount) || 1,
      typedCount: parseInt(r.typedCount) || 0,
      transition: r.transition,
    }));

    // Step 1: Extract search queries
    console.log('[Chrome Import] Step 1: Extracting search queries...');
    const titlesWithQueries = await Promise.all(
      entries.map(async (entry) => {
        const extracted = await extractSearchQuery(entry.title);
        return { entry, query: extracted };
      })
    );

    // Step 2: Aggregate by URL + Date
    console.log('[Chrome Import] Step 2: Aggregating by URL + Date...');
    const aggregated = aggregateEntries(entries, userId);
    result.aggregatedRows = aggregated.length;

    // Step 3: Group into search flows
    console.log('[Chrome Import] Step 3: Grouping search flows...');
    const searchEntries = titlesWithQueries
      .filter(({ query }) => query !== null)
      .map(({ entry, query }) => ({
        query: query!.query,
        timestamp: parseDateTime(entry.date, entry.time),
        date: parseDate(entry.date), // Convert to ISO format
        url: entry.url,
        domain: extractDomain(entry.url),
        title: entry.title,
      }));

    const flows = groupSearchFlows(searchEntries);
    result.searchFlows = flows.length;

    // Step 4: Insert to database
    console.log('[Chrome Import] Step 4: Inserting to database...');
    const repos = getRepositories();

    // Insert aggregated history
    await repos.browsingHistory.batchInsert(aggregated);
    console.log(`  ✓ Inserted ${aggregated.length} aggregated entries`);

    // Insert search flows
    const flowsForDb = flows.map(flow => ({
      userId,
      searchQuery: flow.query,
      searchDate: flow.searchDate,
      urlsClicked: flow.urls,
      searchSource: 'chrome',
    }));
    await repos.searchFlows.batchInsert(flowsForDb);
    console.log(`  ✓ Inserted ${flows.length} search flows`);

    // Refresh domain stats (async, don't wait)
    repos.browsingHistory.refreshDomainStats().catch(err => {
      console.warn('[Chrome Import] Failed to refresh domain_stats:', err.message);
    });

    console.log('[Chrome Import] ✅ Import completed');
    return result;

  } catch (error: any) {
    console.error('[Chrome Import] Failed:', error);
    result.errors.push(error.message);
    return result;
  }
}

/**
 * Aggregate entries by URL + Date
 */
function aggregateEntries(
  entries: ChromeHistoryEntry[],
  userId: string
): Array<{
  userId: string;
  domain: string;
  url: string;
  title: string;
  date: string; // ISO date
  visitCount: number;
  firstVisitTime: string; // ISO datetime
  lastVisitTime: string; // ISO datetime
  source: string;
}> {
  const grouped = new Map<string, any>();

  for (const entry of entries) {
    const date = parseDate(entry.date);
    const timestamp = parseDateTime(entry.date, entry.time);
    const key = `${entry.url}_${date}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        userId,
        domain: extractDomain(entry.url),
        url: entry.url,
        title: entry.title,
        date,
        visitCount: 0,
        firstVisitTime: timestamp.toISOString(),
        lastVisitTime: timestamp.toISOString(),
        source: 'chrome',
      });
    }

    const agg = grouped.get(key);
    agg.visitCount += entry.visitCount;

    // Update time range
    if (timestamp < new Date(agg.firstVisitTime)) {
      agg.firstVisitTime = timestamp.toISOString();
    }
    if (timestamp > new Date(agg.lastVisitTime)) {
      agg.lastVisitTime = timestamp.toISOString();
    }

    // Keep most descriptive title
    if (!agg.title || entry.title.length > agg.title.length) {
      agg.title = entry.title;
    }
  }

  return Array.from(grouped.values());
}

/**
 * Parse Chrome date (MM/DD/YYYY) to ISO date (YYYY-MM-DD)
 */
function parseDate(chromeDate: string): string {
  const [month, day, year] = chromeDate.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

/**
 * Parse Chrome date + time to Date object
 */
function parseDateTime(chromeDate: string, chromeTime: string): Date {
  const [month, day, year] = chromeDate.split('/');
  const [hour, minute, second] = chromeTime.split(':');

  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  );
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return 'unknown';
  }
}
