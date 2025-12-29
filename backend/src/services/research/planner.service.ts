/**
 * Research Planner Service
 *
 * Generates 3-5 web research subtasks for a given task + intent.
 * Uses LLM to decompose the research goal into specific queries.
 */

import OpenAI from 'openai';
import type { Task } from '@personal-research-os/shared/types';
import type { ResearchIntent, ResearchSubtask } from '@personal-research-os/shared/types/research';
import { v4 as uuidv4 } from 'uuid';

// Lazy initialize OpenAI (to ensure .env is loaded first)
let openai: OpenAI | null = null;
let openaiInitialized = false;

function getOpenAI(): OpenAI | null {
  if (!openaiInitialized) {
    if (process.env.OPENAI_API_KEY) {
      console.log('[Planner] OpenAI API key found, initializing client');
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } else {
      console.warn('[Planner] OPENAI_API_KEY not found in environment');
    }
    openaiInitialized = true;
  }
  return openai;
}

/**
 * Plan web research for a task
 */
export async function planWebResearch(
  task: Task,
  intent: ResearchIntent
): Promise<ResearchSubtask[]> {
  console.log(`[Planner] Planning research for task: "${task.title}" (intent: ${intent})`);

  // Use LLM if available, otherwise use rule-based fallback
  const client = getOpenAI();
  if (client) {
    return await planWithLLM(task, intent, client);
  }

  console.warn('[Planner] No LLM available, using rule-based planner');
  return planWithRules(task, intent);
}

/**
 * LLM-based planner
 */
async function planWithLLM(task: Task, intent: ResearchIntent, client: OpenAI): Promise<ResearchSubtask[]> {
  const intentDescriptions = {
    background_brief: 'Get a high-level background overview',
    decision_support: 'Help make a decision by comparing options',
    competitive_scan: 'Analyze competitors and market landscape',
    update_since_last: 'Find recent updates and changes',
    general_summary: 'Create a general comprehensive summary',
  };

  const prompt = `You are a research planner. Given a task and research intent, generate 3-5 specific web search queries.

Task: "${task.title}"
Description: "${task.description || 'No description provided'}"
Intent: ${intentDescriptions[intent]}

Generate 3-5 search queries that will help complete this research.
Return ONLY a JSON array of objects with this format:
[
  {"title": "Query 1 purpose", "query": "specific search query"},
  {"title": "Query 2 purpose", "query": "specific search query"},
  ...
]

Make queries specific, actionable, and diverse. Cover different aspects of the research goal.`;

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a research planning expert. Generate specific, high-quality search queries.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0].message.content || '{}';
    const parsed = JSON.parse(content);

    // Handle both {queries: [...]} and [...] formats
    const queries = parsed.queries || parsed;

    if (!Array.isArray(queries)) {
      throw new Error('LLM returned invalid format');
    }

    // Convert to ResearchSubtask format
    return queries.slice(0, 5).map((q: any) => ({
      id: uuidv4(),
      title: q.title || 'Research query',
      type: 'web' as const,
      query: q.query || q.title || '',
    }));

  } catch (error: any) {
    console.error('[Planner] LLM planning failed:', error);
    console.warn('[Planner] Falling back to rule-based planner');
    return planWithRules(task, intent);
  }
}

/**
 * Rule-based planner (fallback)
 */
function planWithRules(task: Task, intent: ResearchIntent): ResearchSubtask[] {
  const baseQuery = task.title;

  const queries: Array<{ title: string; query: string }> = [];

  switch (intent) {
    case 'background_brief':
      queries.push(
        { title: 'Overview', query: `${baseQuery} overview` },
        { title: 'Key concepts', query: `${baseQuery} explained` },
        { title: 'Recent developments', query: `${baseQuery} 2024 2025` }
      );
      break;

    case 'decision_support':
      queries.push(
        { title: 'Options comparison', query: `${baseQuery} comparison` },
        { title: 'Pros and cons', query: `${baseQuery} advantages disadvantages` },
        { title: 'Best practices', query: `${baseQuery} best practices` },
        { title: 'User reviews', query: `${baseQuery} reviews` }
      );
      break;

    case 'competitive_scan':
      queries.push(
        { title: 'Market leaders', query: `${baseQuery} market leaders` },
        { title: 'Competitors', query: `${baseQuery} competitors` },
        { title: 'Market analysis', query: `${baseQuery} market analysis 2024` },
        { title: 'Trends', query: `${baseQuery} trends` }
      );
      break;

    case 'update_since_last':
      queries.push(
        { title: 'Recent news', query: `${baseQuery} news 2024 2025` },
        { title: 'Latest updates', query: `${baseQuery} updates recent` },
        { title: 'What changed', query: `${baseQuery} changes 2024` }
      );
      break;

    case 'general_summary':
    default:
      queries.push(
        { title: 'General overview', query: baseQuery },
        { title: 'Detailed information', query: `${baseQuery} guide` },
        { title: 'Expert insights', query: `${baseQuery} expert analysis` }
      );
      break;
  }

  return queries.map(q => ({
    id: uuidv4(),
    title: q.title,
    type: 'web' as const,
    query: q.query,
  }));
}
