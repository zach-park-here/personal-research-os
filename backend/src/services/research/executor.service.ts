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
  SubtaskResult,
  TaskType,
} from '@personal-research-os/shared/types/research';
import type { UserProfile } from '@personal-research-os/shared/types';
import { getWebSearchClient } from '../search/web-search.client';
import { getUserProfile } from '../../db/repositories/user-profile.repository';
import type { MeetingContext } from './classifier.service';
import { buildMeetingPrepPrompt } from './prompts/meeting-prep';

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
  subtask_results: SubtaskResult[];
  sourcesCount: number;
  pagesAnalyzed: number;
}

/**
 * Execute all research subtasks and generate report
 */
export async function executeResearch(
  subtasks: ResearchSubtask[],
  intent: ResearchIntent,
  userId: string,
  taskType?: TaskType,
  meetingContext?: MeetingContext
): Promise<ExecutionResult> {
  console.log(`[Executor] Starting research execution for ${subtasks.length} subtasks (type: ${taskType || 'general'})`);

  const searchClient = getWebSearchClient();
  const allResults: RawSearchResult[] = [];
  const subtaskResults: SubtaskResult[] = [];
  const urlsSeen = new Set<string>();

  // Step 1: Run all subtask queries
  for (const subtask of subtasks) {
    console.log(`[Executor] Executing subtask: "${subtask.title}"`);

    try {
      const results = await searchClient.searchWeb(subtask.query, 5);

      // Track sources for this specific subtask
      const subtaskSources: RawSearchResult[] = [];

      // Deduplicate by URL
      for (const result of results) {
        if (!urlsSeen.has(result.url)) {
          urlsSeen.add(result.url);
          allResults.push(result);
          subtaskSources.push(result);
        }
      }

      // Store subtask result with its specific sources
      subtaskResults.push({
        subtask_id: subtask.id,
        subtask_title: subtask.title,
        query: subtask.query,
        sources: subtaskSources,
      });

    } catch (error: any) {
      console.error(`[Executor] Subtask "${subtask.title}" failed:`, error);
      // Still add subtask result with empty sources
      subtaskResults.push({
        subtask_id: subtask.id,
        subtask_title: subtask.title,
        query: subtask.query,
        sources: [],
      });
    }
  }

  console.log(`[Executor] Collected ${allResults.length} unique results across ${subtaskResults.length} subtasks`);

  // Step 2: Synthesize report and recommendations
  const { report, recommended_pages } = await synthesizeReport(
    allResults,
    intent,
    userId,
    taskType,
    meetingContext
  );

  return {
    report,
    recommended_pages,
    subtask_results: subtaskResults,
    sourcesCount: allResults.length,
    pagesAnalyzed: allResults.length,
  };
}

/**
 * Synthesize final report from search results
 */
async function synthesizeReport(
  results: RawSearchResult[],
  intent: ResearchIntent,
  userId: string,
  taskType?: TaskType,
  meetingContext?: MeetingContext
): Promise<{ report: ResearchReport; recommended_pages: RecommendedPage[] }> {
  console.log(`[Executor] Synthesizing report from ${results.length} results (type: ${taskType || 'general'})`);

  const client = getOpenAI();
  if (client) {
    return await synthesizeWithLLM(results, intent, userId, taskType, meetingContext, client);
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
  userId: string,
  taskType: TaskType | undefined,
  meetingContext: MeetingContext | undefined,
  client: OpenAI
): Promise<{ report: ResearchReport; recommended_pages: RecommendedPage[] }> {
  // Get user profile for context
  let userProfile: UserProfile | null = null;
  try {
    userProfile = await getUserProfile(userId);
  } catch (error) {
    console.warn('[Executor] Could not load user profile, proceeding without user context');
  }

  // Prepare search results summary for LLM
  const resultsSummary = results
    .slice(0, 15) // Limit to top 15 to save tokens
    .map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.snippet}`)
    .join('\n\n---\n\n');

  // Use specialized prompt for meeting prep
  let prompt: string;
  if (taskType === 'meeting_prep' && meetingContext) {
    console.log('[Executor] Using MEETING PREP specialized prompt');
    prompt = buildMeetingPrepPrompt(meetingContext, userProfile, resultsSummary);
  } else {
    // Default general research prompt
    console.log('[Executor] Using GENERAL RESEARCH prompt');

    // Build user context string
    let userContext = '';
    if (userProfile) {
      const contextParts: string[] = [];

      if (userProfile.name) contextParts.push(`Name: ${userProfile.name}`);
      if (userProfile.jobTitle) contextParts.push(`Role: ${userProfile.jobTitle}`);
      if (userProfile.company) contextParts.push(`Company: ${userProfile.company}`);
      if (userProfile.companyDescription) contextParts.push(`Company Description: ${userProfile.companyDescription}`);
      if (userProfile.industry) contextParts.push(`Industry: ${userProfile.industry}`);
      if (userProfile.goals && userProfile.goals.length > 0) {
        contextParts.push(`Goals: ${userProfile.goals.join(', ')}`);
      }

      if (contextParts.length > 0) {
        userContext = `\n\nUser Context:\n${contextParts.join('\n')}\n`;
      }
    }

    prompt = `You are a research analyst. Based on the search results below and user context, generate a comprehensive research report tailored to this specific user.
${userContext}
Research Intent: ${intent}

Search Results:
${resultsSummary}

Generate a JSON report with this EXACT structure:
{
  "report": {
    "overview": "2-3 paragraph executive summary tailored to the user's role and context",
    "key_findings": ["finding 1", "finding 2", "finding 3", ...],
    "risks_or_unknowns": ["risk 1", "risk 2", ...],
    "recommendations": ["recommendation 1 specific to user's context", "recommendation 2", ...]
  },
  "recommended_pages": [
    {
      "title": "page title",
      "url": "page url",
      "why_read": "1-2 sentences explaining why this page is valuable FOR THIS USER",
      "highlights": ["key point 1", "key point 2", "key point 3"]
    }
  ]
}

Select 3-5 most valuable pages for recommended_pages.
Be specific, actionable, and cite sources when possible.
IMPORTANT: Tailor recommendations and insights to the user's role, company, and goals.`;
  }

  try {
    console.log('[Executor] 🤖 Calling o1 model for synthesis...');
    console.log('[Executor] Prompt length:', prompt.length, 'characters');

    const completion = await client.chat.completions.create({
      model: 'o1',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = completion.choices[0].message.content || '{}';
    console.log('[Executor] 📥 RAW LLM RESPONSE:');
    console.log(content);

    const parsed = JSON.parse(content);
    console.log('[Executor] 📋 PARSED RESPONSE STRUCTURE:');
    console.log(JSON.stringify({
      reportKeys: Object.keys(parsed.report || {}),
      report: parsed.report,
      recommendedPagesCount: (parsed.recommended_pages || []).length,
    }, null, 2));

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
