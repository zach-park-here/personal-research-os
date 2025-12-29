/**
 * Research Executor Service
 *
 * Executes research subtasks and generates structured report.
 * This is the CORE of the research pipeline.
 */

import OpenAI from 'openai';
import type {
  ResearchSubtask,
  RawSearchResult,
  ResearchReport,
  RecommendedPage,
  ResearchIntent,
} from '@personal-research-os/shared/types/research';
import { getWebSearchClient } from '../search/web-search.client';

// Lazy initialize OpenAI (to ensure .env is loaded first)
let openai: OpenAI | null = null;
let openaiInitialized = false;

function getOpenAI(): OpenAI | null {
  if (!openaiInitialized) {
    if (process.env.OPENAI_API_KEY) {
      console.log('[Executor] OpenAI API key found, initializing client');
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      console.warn('[Executor] OPENAI_API_KEY not found in environment');
    }
    openaiInitialized = true;
  }
  return openai;
}

export interface ExecutionResult {
  report: ResearchReport;
  recommended_pages: RecommendedPage[];
  sourcesCount: number;
  pagesAnalyzed: number;
}

/**
 * Execute all research subtasks and generate report
 */
export async function executeResearch(
  subtasks: ResearchSubtask[],
  intent: ResearchIntent
): Promise<ExecutionResult> {
  console.log(`[Executor] Starting research execution for ${subtasks.length} subtasks`);

  const searchClient = getWebSearchClient();
  const allResults: RawSearchResult[] = [];
  const urlsSeen = new Set<string>();

  // Step 1: Run all subtask queries
  for (const subtask of subtasks) {
    console.log(`[Executor] Executing subtask: "${subtask.title}"`);

    try {
      const results = await searchClient.searchWeb(subtask.query, 5);

      // Deduplicate by URL
      for (const result of results) {
        if (!urlsSeen.has(result.url)) {
          urlsSeen.add(result.url);
          allResults.push(result);
        }
      }

    } catch (error: any) {
      console.error(`[Executor] Subtask "${subtask.title}" failed:`, error);
      // Continue with other subtasks
    }
  }

  console.log(`[Executor] Collected ${allResults.length} unique results`);

  // Step 2: Synthesize report and recommendations
  const { report, recommended_pages } = await synthesizeReport(allResults, intent);

  return {
    report,
    recommended_pages,
    sourcesCount: allResults.length,
    pagesAnalyzed: allResults.length,
  };
}

/**
 * Synthesize final report from search results
 */
async function synthesizeReport(
  results: RawSearchResult[],
  intent: ResearchIntent
): Promise<{ report: ResearchReport; recommended_pages: RecommendedPage[] }> {
  console.log(`[Executor] Synthesizing report from ${results.length} results`);

  const client = getOpenAI();
  if (client) {
    return await synthesizeWithLLM(results, intent, client);
  }

  console.warn('[Executor] No LLM available, using rule-based synthesis');
  return synthesizeWithRules(results);
}

/**
 * LLM-based synthesis
 */
async function synthesizeWithLLM(
  results: RawSearchResult[],
  intent: ResearchIntent,
  client: OpenAI
): Promise<{ report: ResearchReport; recommended_pages: RecommendedPage[] }> {
  // Prepare search results summary for LLM
  const resultsSummary = results
    .slice(0, 15) // Limit to top 15 to save tokens
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet}`)
    .join('\n\n---\n\n');

  const prompt = `You are a research analyst. Based on the search results below, generate a comprehensive research report.

Research Intent: ${intent}

Search Results:
${resultsSummary}

Generate a JSON report with this EXACT structure:
{
  "report": {
    "overview": "2-3 paragraph executive summary",
    "key_findings": ["finding 1", "finding 2", "finding 3", ...],
    "risks_or_unknowns": ["risk 1", "risk 2", ...],
    "recommendations": ["recommendation 1", "recommendation 2", ...]
  },
  "recommended_pages": [
    {
      "title": "page title",
      "url": "page url",
      "why_read": "1-2 sentences explaining why this page is valuable",
      "highlights": ["key point 1", "key point 2", "key point 3"]
    }
  ]
}

Select 3-5 most valuable pages for recommended_pages.
Be specific, actionable, and cite sources when possible.`;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert research analyst. Generate comprehensive, well-structured reports.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content || '{}';
    const parsed = JSON.parse(content);

    return {
      report: parsed.report || createFallbackReport(results),
      recommended_pages: (parsed.recommended_pages || []).slice(0, 5),
    };

  } catch (error: any) {
    console.error('[Executor] LLM synthesis failed:', error);
    console.warn('[Executor] Falling back to rule-based synthesis');
    return synthesizeWithRules(results);
  }
}

/**
 * Rule-based synthesis (fallback)
 */
function synthesizeWithRules(
  results: RawSearchResult[]
): { report: ResearchReport; recommended_pages: RecommendedPage[] } {
  const report = createFallbackReport(results);

  const recommended_pages: RecommendedPage[] = results
    .slice(0, 5)
    .map(r => ({
      title: r.title,
      url: r.url,
      why_read: `Relevant source found during research: ${r.snippet.slice(0, 100)}...`,
      highlights: [r.snippet.slice(0, 200)],
    }));

  return { report, recommended_pages };
}

/**
 * Create fallback report
 */
function createFallbackReport(results: RawSearchResult[]): ResearchReport {
  return {
    overview: `Research completed with ${results.length} sources analyzed. ` +
      `The search covered multiple aspects and found relevant information. ` +
      `Review the recommended pages below for detailed insights.`,
    key_findings: results.slice(0, 5).map((r, i) =>
      `Finding ${i + 1}: ${r.snippet.slice(0, 150)}...`
    ),
    risks_or_unknowns: [
      'Limited synthesis available - manual review of sources recommended',
      'Some sources may require deeper analysis',
    ],
    recommendations: [
      'Review all recommended pages for comprehensive understanding',
      'Cross-reference findings with multiple sources',
      'Consider conducting deeper research if needed',
    ],
  };
}
