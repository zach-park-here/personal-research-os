/**
 * Query Extraction Service
 *
 * Uses Llama 3.1 70B via Groq to extract search queries from Chrome titles
 */

import Groq from 'groq-sdk';

// Initialize Groq only if API key is provided
let groq: Groq | null = null;
if (process.env.GROQ_API_KEY) {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}

export interface ExtractedQuery {
  query: string;
  searchSource: string; // google, bing, duckduckgo, etc.
  confidence: number; // 0-1
}

/**
 * Extract search query from Chrome history title
 *
 * Examples:
 * - "how to deploy nextjs - Google Search" → "how to deploy nextjs"
 * - "Best productivity apps 2024 - YouTube" → "Best productivity apps 2024"
 */
export async function extractSearchQuery(title: string): Promise<ExtractedQuery | null> {
  // Quick regex check first (avoid LLM if obvious)
  const simpleMatch = title.match(/^(.+?)\s*-\s*(Google|Bing|DuckDuckGo|Yahoo)\s+Search$/i);
  if (simpleMatch) {
    return {
      query: simpleMatch[1].trim(),
      searchSource: simpleMatch[2].toLowerCase(),
      confidence: 1.0,
    };
  }

  // Use LLM for complex cases (if available)
  if (!groq) {
    console.warn('[Query Extraction] Groq API key not set, skipping LLM extraction');
    return null;
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a search query extractor. Given a browser page title, extract the original search query.
Return JSON only: {"query": "...", "searchSource": "google|bing|youtube|etc", "confidence": 0.0-1.0}
If not a search, return {"query": null}`,
        },
        {
          role: 'user',
          content: `Extract search query from: "${title}"`,
        },
      ],
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    if (!result.query) {
      return null;
    }

    return {
      query: result.query,
      searchSource: result.searchSource || 'unknown',
      confidence: result.confidence || 0.5,
    };
  } catch (error) {
    console.error('[Query Extraction] Failed:', error);
    return null;
  }
}

/**
 * Batch extract queries (more efficient)
 */
export async function extractSearchQueriesBatch(
  titles: string[]
): Promise<(ExtractedQuery | null)[]> {
  // Process in parallel batches of 10
  const batchSize = 10;
  const results: (ExtractedQuery | null)[] = [];

  for (let i = 0; i < titles.length; i += batchSize) {
    const batch = titles.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(title => extractSearchQuery(title))
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Group related queries into search flows
 *
 * Groups queries within 15 minutes of each other with similar keywords
 */
export function groupSearchFlows(
  entries: Array<{
    query: string;
    timestamp: Date;
    date: string;
    url: string;
    domain: string;
    title?: string;
  }>
): Array<{
  query: string;
  searchDate: string;
  urls: Array<{ url: string; domain: string; title?: string; order: number }>;
}> {
  const flows: Array<{
    query: string;
    searchDate: string;
    urls: Array<{ url: string; domain: string; title?: string; order: number }>;
    lastTimestamp: Date;
  }> = [];

  const TIME_THRESHOLD = 15 * 60 * 1000; // 15 minutes

  for (const entry of entries) {
    // Find existing flow
    const existingFlow = flows.find(flow => {
      const timeDiff = entry.timestamp.getTime() - flow.lastTimestamp.getTime();
      const isSimilar = areSimilarQueries(flow.query, entry.query);
      return timeDiff <= TIME_THRESHOLD && isSimilar;
    });

    if (existingFlow && existingFlow.urls.length < 3) {
      // Add to existing flow (top 3 only)
      existingFlow.urls.push({
        url: entry.url,
        domain: entry.domain,
        title: entry.title,
        order: existingFlow.urls.length + 1,
      });
      existingFlow.lastTimestamp = entry.timestamp;
    } else if (!existingFlow) {
      // Create new flow
      flows.push({
        query: entry.query,
        searchDate: entry.date,
        urls: [{
          url: entry.url,
          domain: entry.domain,
          title: entry.title,
          order: 1,
        }],
        lastTimestamp: entry.timestamp,
      });
    }
  }

  return flows.map(({ query, searchDate, urls }) => ({ query, searchDate, urls }));
}

/**
 * Check if two queries are similar (simple keyword overlap)
 */
function areSimilarQueries(q1: string, q2: string): boolean {
  const words1 = new Set(q1.toLowerCase().split(/\s+/));
  const words2 = new Set(q2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  // Jaccard similarity > 0.5
  return intersection.size / union.size > 0.5;
}
