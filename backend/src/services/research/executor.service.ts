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
import { getWebSearchClient, PerplexitySearchClient } from '../search/web-search.client';
import type { MeetingContext } from './classifier.service';
import { buildMeetingPrepPrompt } from './prompts/meeting-prep';
import { analyzeIntentWithO1, type IntentAnalysis, type Intent } from './intent-analyzer.service';
import {
  synthesizeIntentWithO1,
  type IntentResult,
  type PerplexityResponse
} from './intent-synthesizer.service';
import { LLM_MODELS } from '../../config/llm.config';
import { RESEARCH_LIMITS } from '../../config/research.config';
import { extractJSON, parseJSONSafe } from '../../utils/llm-response-parser';

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

  // Use multi-step search for meeting prep
  if (taskType === 'meeting_prep' && meetingContext?.prospectEmail) {
    console.log('[Executor] Using MULTI-STEP SEARCH for meeting prep');
    return await executeMultiStepMeetingPrepSearch(intent, userId, meetingContext);
  }

  // Default: Use original subtask-based search for general research
  console.log('[Executor] Using SUBTASK-BASED SEARCH for general research');
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
 * Multi-step search specifically for meeting prep
 * Stage 1: Company website deep dive
 * Stage 2A: LinkedIn profile discovery
 * Stage 2B: LinkedIn activity analysis (GPT-4o)
 * Stage 3: Industry context + pain points
 */
async function executeMultiStepMeetingPrepSearch(
  intent: ResearchIntent,
  userId: string,
  meetingContext: MeetingContext
): Promise<ExecutionResult> {
  const { prospectName, prospectTitle, prospectCompany, prospectEmail } = meetingContext;
  const companyDomain = extractDomain(prospectEmail);

  console.log(`[MultiStep] 🎯 Starting multi-step search for ${prospectName} at ${prospectCompany}`);

  const searchClient = getWebSearchClient();
  const allResults: RawSearchResult[] = [];
  const subtaskResults: SubtaskResult[] = [];

  // ============ STAGE 1: Company Website Deep Dive ============
  console.log(`[MultiStep] 📍 STAGE 1: Company website analysis (${companyDomain})`);

  const stage1Query = `CONTEXT: This is research for preparing a meeting with ${prospectName}, ${prospectTitle} at ${prospectCompany}.
All findings MUST be based on factual information only.

Please search ${companyDomain} and provide:
1. COMPANY SUMMARY: What does this company do? What are their main products/services?
2. RECENT PRODUCTS: Any new product launches or major announcements in the last 3 months?
3. CEO MESSAGES: Recent annual reports, filings, or CEO statements about company direction?
4. STRATEGIC CHANGES: Any pivots, new initiatives, or strategic shifts mentioned on their website?

Focus on official company sources from ${companyDomain} or verified news outlets.
This information will be treated as PRIMARY SOURCE with highest priority.`;

  const stage1Results = await searchClient.searchWeb(stage1Query, 10);
  console.log(`[MultiStep] ✅ Stage 1 complete: ${stage1Results.length} results`);
  allResults.push(...stage1Results);

  subtaskResults.push({
    subtask_id: 'stage1',
    subtask_title: 'Company Website Analysis',
    query: stage1Query,
    sources: stage1Results,
  });

  // ============ STAGE 2A: LinkedIn Profile Discovery ============
  console.log(`[MultiStep] 📍 STAGE 2A: LinkedIn profile discovery`);

  const stage2AQuery = `CONTEXT: Preparing for meeting with ${prospectName}, ${prospectTitle} at ${prospectCompany} (${companyDomain}).
All findings MUST be factual and verifiable.

Find the LinkedIn profile for ${prospectName}.
- Full name: ${prospectName}
- Current role: ${prospectTitle} at ${prospectCompany}
- Company domain: ${companyDomain}

IMPORTANT: Return the exact LinkedIn profile URL (e.g., linkedin.com/in/daniel-park-...).
Verify it matches: correct name, company, and title.`;

  const stage2AResults = await searchClient.searchWeb(stage2AQuery, 5);
  console.log(`[MultiStep] ✅ Stage 2A complete: ${stage2AResults.length} results`);
  allResults.push(...stage2AResults);

  subtaskResults.push({
    subtask_id: 'stage2a',
    subtask_title: 'LinkedIn Profile Discovery',
    query: stage2AQuery,
    sources: stage2AResults,
  });

  // Extract LinkedIn URL
  const linkedInUrl = extractLinkedInUrl(stage2AResults);
  console.log(`[MultiStep] LinkedIn URL extracted:`, linkedInUrl || 'NOT FOUND');

  // ============ STAGE 2B: LinkedIn Activity Analysis (Perplexity) ============
  console.log(`[MultiStep] 📍 STAGE 2B: LinkedIn activity analysis (using Perplexity)`);

  let stage2BResults: RawSearchResult[] = [];
  let recentInterests: string[] = [];

  // Use Perplexity for LinkedIn search
  // NOTE: We search for PUBLIC mentions of LinkedIn activity, not direct post access
  const stage2BQuery = `CONTEXT: Researching ${prospectName}, ${prospectTitle} at ${prospectCompany} for meeting preparation.

Search for recent online mentions, interviews, or public statements by ${prospectName} related to ${prospectCompany}.
Look for:
1. Recent interviews, podcasts, or articles featuring ${prospectName}
2. Public statements about ${prospectCompany}'s direction, products, or strategy
3. Conference talks, webinars, or public appearances
4. Industry commentary or thought leadership content
5. Press releases or news mentions of ${prospectName}

Focus on content from the last 3-6 months that reveals:
- Current priorities and focus areas
- Strategic thinking and vision
- Challenges they're addressing
- Topics they're passionate about

IMPORTANT: Only include verifiable information from public sources. If no recent public activity is found, state that clearly.`;

  stage2BResults = await searchClient.searchWeb(stage2BQuery, 10);
  console.log(`[MultiStep] ✅ Stage 2B complete: ${stage2BResults.length} results`);
  allResults.push(...stage2BResults);

  subtaskResults.push({
    subtask_id: 'stage2b',
    subtask_title: 'LinkedIn Activity Analysis',
    query: stage2BQuery,
    sources: stage2BResults,
  });

  // Extract keywords from LinkedIn activity
  recentInterests = extractKeywordsFromLinkedIn(stage2BResults);
  console.log(`[MultiStep] Keywords extracted:`, recentInterests.join(', '));

  // ============ STAGE 3: Industry Context + Pain Points ============
  console.log(`[MultiStep] 📍 STAGE 3: Industry context & pain points`);

  const companySummary = summarizeResults(stage1Results, 200);
  const interestsText = recentInterests.length > 0 ? recentInterests.join(', ') : 'general business trends';

  const stage3Query = `CONTEXT: Preparing for sales/partnership meeting with ${prospectName}, ${prospectTitle} at ${prospectCompany}.

Company Background (from ${companyDomain}):
${companySummary}

Prospect's Recent Interests (from LinkedIn):
${interestsText}

Based on this context, research:

1. INDUSTRY TRENDS: How has the AI/tech industry (relevant to ${prospectCompany}'s space) changed in the last 2-3 months?
   - Major shifts or disruptions
   - New regulations or market dynamics
   - Competitive pressures

2. PAIN POINTS: Given ${prospectName}'s role as ${prospectTitle} and focus on [${interestsText}], what are likely operational challenges for ${prospectCompany}?
   - Scaling challenges
   - Market competition
   - Resource constraints (funding, talent, technology)

3. DISCOVERY QUESTIONS: Based on recent industry trends and his interests, what open-ended questions would help understand their needs and lead to a close?

All findings MUST be factual and based on verifiable sources.`;

  const stage3Results = await searchClient.searchWeb(stage3Query, 10);
  console.log(`[MultiStep] ✅ Stage 3 complete: ${stage3Results.length} results`);
  allResults.push(...stage3Results);

  subtaskResults.push({
    subtask_id: 'stage3',
    subtask_title: 'Industry Context & Pain Points',
    query: stage3Query,
    sources: stage3Results,
  });

  // ============ SYNTHESIZE ============
  console.log(`[MultiStep] 🎯 Total results collected: ${allResults.length}`);
  console.log(`[MultiStep] Starting O1 synthesis...`);

  const { report, recommended_pages } = await synthesizeReport(
    allResults,
    intent,
    userId,
    'meeting_prep',
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
 * Helper: Extract domain from email
 */
function extractDomain(email: string): string {
  return email.split('@')[1];
}

/**
 * Helper: Extract LinkedIn URL from search results
 */
function extractLinkedInUrl(results: RawSearchResult[]): string | null {
  for (const result of results) {
    // Check URL directly
    if (result.url.includes('linkedin.com/in/')) {
      return result.url;
    }
    // Check snippet for LinkedIn URL mentions
    const match = result.snippet.match(/linkedin\.com\/in\/[\w-]+/);
    if (match) {
      return `https://${match[0]}`;
    }
  }
  return null;
}

/**
 * Helper: Extract keywords from LinkedIn activity results
 */
function extractKeywordsFromLinkedIn(results: RawSearchResult[]): string[] {
  const text = results.map(r => r.snippet).join(' ').toLowerCase();

  // Simple keyword extraction: find common business/tech terms
  const keywords = new Set<string>();
  const commonWords = ['ai', 'machine learning', 'product', 'growth', 'strategy', 'innovation', 'customers', 'market', 'data', 'technology'];

  for (const word of commonWords) {
    if (text.includes(word)) {
      keywords.add(word);
    }
  }

  return Array.from(keywords).slice(0, 7);
}

/**
 * Helper: Summarize search results
 */
function summarizeResults(results: RawSearchResult[], maxLength: number): string {
  return results
    .slice(0, 3)
    .map(r => r.snippet)
    .join('\n')
    .slice(0, maxLength);
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
  // User profile functionality removed - not currently available
  const userProfile: UserProfile | null = null;

  // Prepare search results summary for LLM
  const resultsSummary = results
    .slice(0, RESEARCH_LIMITS.MAX_RESULTS_FOR_SYNTHESIS)
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

    // User context not available (userProfile is always null currently)
    const userContext = '';

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
      model: LLM_MODELS.REASONING,
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

/**
 * NEW: Intent-Based Multi-Turn Research Architecture
 *
 * Uses O1 to split questions into intents, generates longtail queries,
 * and progressively synthesizes research findings.
 */
export async function executeIntentBasedResearch(
  userId: string,
  intent: ResearchIntent,
  taskType: TaskType | undefined,
  meetingContext: MeetingContext
): Promise<ExecutionResult> {
  console.log(`[IntentBasedResearch] 🚀 Starting intent-based research for ${meetingContext.prospectCompany}`);

  const { prospectCompany, prospectEmail } = meetingContext;
  const companyDomain = extractDomain(prospectEmail || '');

  const client = getOpenAI();
  if (!client) {
    throw new Error('OpenAI client not initialized - check OPENAI_API_KEY');
  }

  // Get Perplexity client (must be PerplexitySearchClient for enhanced search)
  const searchClient = getWebSearchClient();
  if (!(searchClient instanceof PerplexitySearchClient)) {
    throw new Error('Perplexity search client required for intent-based research');
  }

  const allIntentResults: IntentResult[] = [];
  const subtaskResults: SubtaskResult[] = [];

  // ============ STAGE 1: Company Research ============
  console.log(`[IntentBasedResearch] 📍 STAGE 1: Company Research`);

  const stage1Prompt = `Research this company for meeting preparation:
1. What does this company do? (products, services, business model)
2. Recent news or product launches (last 3 months)
3. CEO messages or strategic direction statements
4. Any pivots, funding, or major changes`;

  const stage1IntentAnalysis = await analyzeIntentWithO1({
    companyName: prospectCompany || '',
    companyDomain: companyDomain,
    userResearchPrompt: stage1Prompt,
    meetingDate: new Date().toISOString().split('T')[0],
  });

  console.log(`[IntentBasedResearch] Stage 1: ${stage1IntentAnalysis.intents.length} intents identified`);

  // Process each Stage 1 intent
  for (const intent of stage1IntentAnalysis.intents) {
    console.log(`[IntentBasedResearch]   Processing intent: ${intent.id}`);

    // Execute 3 queries per intent
    // Each query returns Perplexity synthesis (~1500 chars) + citations
    const queryResults: PerplexityResponse[] = await Promise.all(
      intent.queries.map(query => searchClient.searchWebEnhanced(query, 5))
    );

    console.log(`[IntentBasedResearch]   Got ${queryResults.length} Perplexity syntheses for ${intent.id}`);

    // O1 synthesizes 3 Perplexity results into ~1000 word summary
    const intentResult = await synthesizeIntentWithO1(intent, queryResults);
    allIntentResults.push(intentResult);

    subtaskResults.push({
      subtask_id: intent.id,
      subtask_title: intent.description,
      query: intent.queries.join(' | '),
      sources: [], // URLs are tracked in intentResult.urlCount
    });
  }

  // ============ STAGE 2: Industry Context & Pain Points ============
  // TEMPORARILY DISABLED FOR TESTING - TESTING STAGE 1 ONLY
  console.log(`[IntentBasedResearch] ⏭️  STAGE 2: SKIPPED FOR TESTING`);

  // // Build context from Stage 1 results
  // const stage1Context = allIntentResults
  //   .map(r => `${r.description}: ${r.synthesis.slice(0, 300)}...`)
  //   .join('\n\n');

  // const stage2Prompt = `Based on what we know about ${prospectCompany}, research:
  // 1. Industry trends affecting their space (last 2-3 months)
  // 2. Competitive pressures or market shifts
  // 3. Common challenges for companies like this`;

  // const stage2IntentAnalysis = await analyzeIntentWithO1({
  //   companyName: prospectCompany || '',
  //   companyDomain: companyDomain,
  //   userResearchPrompt: `CONTEXT FROM STAGE 1:\n${stage1Context}\n\n${stage2Prompt}`,
  //   meetingDate: new Date().toISOString().split('T')[0],
  // });

  // console.log(`[IntentBasedResearch] Stage 2: ${stage2IntentAnalysis.intents.length} intents identified`);

  // // Process each Stage 2 intent
  // for (const intent of stage2IntentAnalysis.intents) {
  //   console.log(`[IntentBasedResearch]   Processing intent: ${intent.id}`);

  //   const queryResults: PerplexityResponse[] = await Promise.all(
  //     intent.queries.map(query => searchClient.searchWebEnhanced(query, 5))
  //   );

  //   console.log(`[IntentBasedResearch]   Got ${queryResults.length} Perplexity syntheses for ${intent.id}`);

  //   const intentResult = await synthesizeIntentWithO1(intent, queryResults);
  //   allIntentResults.push(intentResult);

  //   subtaskResults.push({
  //     subtask_id: intent.id,
  //     subtask_title: intent.description,
  //     query: intent.queries.join(' | '),
  //     sources: [], // URLs are tracked in intentResult.urlCount
  //   });
  // }

  // ============ FINAL STAGE: O1 Synthesis ============
  console.log(`[IntentBasedResearch] 📍 FINAL STAGE: Synthesizing all intents into meeting brief`);

  const allIntentsSummary = allIntentResults
    .map((result, idx) => {
      const stageNum = idx < stage1IntentAnalysis.intents.length ? 1 : 2;
      return `### Intent ${idx + 1} (Stage ${stageNum}): ${result.description}

${result.synthesis}

**Sources**: ${result.urlCount} URLs analyzed across ${result.queryCount} Perplexity queries`;
    })
    .join('\n\n---\n\n');

  // Use meeting prep prompt with all intent syntheses
  const finalPrompt = buildMeetingPrepPrompt(
    meetingContext,
    null, // userProfile
    allIntentsSummary
  );

  console.log('[IntentBasedResearch] Calling O1 for final meeting brief synthesis...');

  const finalResponse = await client.chat.completions.create({
    model: LLM_MODELS.REASONING,
    messages: [
      {
        role: 'user',
        content: finalPrompt,
      },
    ],
  });

  const finalContent = finalResponse.choices[0].message.content || '';
  console.log(`[IntentBasedResearch] Final synthesis: ${finalContent.length} characters`);

  // Parse JSON response
  const parsedResult = extractJSON<any>(finalContent, 'O1 final synthesis');

  // Calculate total sources
  const totalUrls = allIntentResults.reduce((sum, r) => sum + r.urlCount, 0);
  const totalQueries = allIntentResults.reduce((sum, r) => sum + r.queryCount, 0);

  console.log(`[IntentBasedResearch] ✅ Research complete:`);
  console.log(`   - ${allIntentResults.length} intents processed`);
  console.log(`   - ${totalQueries} Perplexity queries executed`);
  console.log(`   - ${totalUrls} total URLs cited`);

  return {
    report: parsedResult.report,
    recommended_pages: parsedResult.recommended_pages || [],
    subtask_results: subtaskResults,
    sourcesCount: totalUrls,
    pagesAnalyzed: totalUrls,
  };
}
