/**
 * Research Planner Service
 *
 * Generates 3-5 web research subtasks for a given task + intent.
 * Uses LLM to decompose the research goal into specific queries.
 */

import OpenAI from 'openai';
import type { Task, UserProfile } from '@personal-research-os/shared/types';
import type { ResearchIntent, ResearchSubtask, TaskType } from '@personal-research-os/shared/types/research';
import { v4 as uuidv4 } from 'uuid';
import { getUserProfile } from '../../db/repositories/user-profile.repository';
import type { MeetingContext } from './classifier.service';
import { LLM_MODELS } from '../../config/llm.config';

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
  intent: ResearchIntent,
  taskType?: TaskType,
  meetingContext?: MeetingContext
): Promise<ResearchSubtask[]> {
  console.log(`[Planner] Planning research for task: "${task.title}" (intent: ${intent}, type: ${taskType || 'general'})`);

  // Use LLM if available, otherwise use rule-based fallback
  const client = getOpenAI();
  if (client) {
    return await planWithLLM(task, intent, client, taskType, meetingContext);
  }

  console.warn('[Planner] No LLM available, using rule-based planner');
  return planWithRules(task, intent, taskType, meetingContext);
}

/**
 * LLM-based planner
 */
async function planWithLLM(
  task: Task,
  intent: ResearchIntent,
  client: OpenAI,
  taskType?: TaskType,
  meetingContext?: MeetingContext
): Promise<ResearchSubtask[]> {
  const intentDescriptions = {
    background_brief: 'Get a high-level background overview',
    decision_support: 'Help make a decision by comparing options',
    competitive_scan: 'Analyze competitors and market landscape',
    update_since_last: 'Find recent updates and changes',
    general_summary: 'Create a general comprehensive summary',
  };

  // Get user profile for context
  let userProfile: UserProfile | null = null;
  try {
    userProfile = await getUserProfile(task.userId);
  } catch (error) {
    console.warn('[Planner] Could not load user profile, proceeding without user context');
  }

  // Build user context string
  let userContext = '';
  if (userProfile) {
    const contextParts: string[] = [];

    if (userProfile.name) {
      contextParts.push(`Name: ${userProfile.name}`);
    }
    if (userProfile.jobTitle) {
      contextParts.push(`Role: ${userProfile.jobTitle}`);
    }
    if (userProfile.company) {
      contextParts.push(`Company: ${userProfile.company}`);
    }
    if (userProfile.companyDescription) {
      contextParts.push(`Company Description: ${userProfile.companyDescription}`);
    }
    if (userProfile.industry) {
      contextParts.push(`Industry: ${userProfile.industry}`);
    }
    if (userProfile.goals && userProfile.goals.length > 0) {
      contextParts.push(`Goals: ${userProfile.goals.join(', ')}`);
    }

    if (contextParts.length > 0) {
      userContext = `\n\nUser Context:\n${contextParts.join('\n')}`;
    }
  }

  // Meeting prep: specialized prompt
  if (taskType === 'meeting_prep') {
    // DEMO MODE: Default to Sam Altman if no context provided
    const prospectName = meetingContext?.prospectName || 'Sam Altman';
    const prospectCompany = meetingContext?.prospectCompany || 'OpenAI';
    const prospectTitle = meetingContext?.prospectTitle || 'CEO';

    const prompt = `You are a B2B sales research planner. Generate 4-5 web search queries to prepare for an upcoming meeting.
${userContext}

**MEETING CONTEXT:**
- Prospect: ${prospectName}
- Title: ${prospectTitle}
- Company: ${prospectCompany}
- Meeting Time: ${meetingContext?.meetingDate || 'Soon'}

**REQUIRED SEARCH CATEGORIES:**
Your queries MUST cover these 5 areas:

1. **Industry Trends** - How has the prospect's industry changed recently?
2. **Company News** - Recent product launches, announcements, CEO messages, annual reports
3. **Prospect's LinkedIn Activity** - Their recent posts, articles, shares to understand their priorities and interests (MUST verify: same person at same company with same title)
4. **Prospect's Role** - What does their job title do? What are their KPIs and pain points?
5. **Strategic Intelligence** - Buying signals, urgency, decision-making authority

Generate 5-6 search queries (at least 1 per category) in this EXACT JSON format:
[
  {"title": "Industry trends for [industry]", "query": "specific search query"},
  {"title": "Recent news about [company]", "query": "specific search query"},
  {"title": "[Name] LinkedIn posts and activity", "query": "specific search query to find their LinkedIn profile and recent posts"},
  {"title": "Role and responsibilities of [title]", "query": "specific search query"},
  {"title": "Decision-making process for [title]", "query": "specific search query"}
]

Make queries specific and actionable. Use actual names, companies, and titles.
IMPORTANT: For LinkedIn queries, include both name AND company to verify correct person.`;

    try {
      const completion = await client.chat.completions.create({
        model: LLM_MODELS.REASONING,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = completion.choices[0].message.content || '{}';
      const parsed = JSON.parse(content);
      const queries = parsed.queries || parsed;

      if (!Array.isArray(queries)) {
        throw new Error('LLM returned invalid format');
      }

      return queries.slice(0, 6).map((q: any) => ({
        id: uuidv4(),
        title: q.title || 'Research query',
        type: 'web' as const,
        query: q.query || q.title || '',
      }));

    } catch (error: any) {
      console.error('[Planner] Meeting prep planning failed:', error);
      console.warn('[Planner] Falling back to rule-based meeting planner');
      // Use demo defaults if no context
      const fallbackContext: MeetingContext = {
        prospectName: prospectName,
        prospectCompany: prospectCompany,
        prospectTitle: prospectTitle,
      };
      return planMeetingPrepWithRules(fallbackContext);
    }
  }

  // General research: existing prompt
  const prompt = `You are a research planner. Given a task, user context, and research intent, generate 3-5 specific web search queries.
${userContext}

Task: "${task.title}"
Description: "${task.description || 'No description provided'}"
Intent: ${intentDescriptions[intent]}

Generate 3-5 search queries that will help complete this research for this specific user.
Consider their role, company, and goals when crafting queries.
Return ONLY a JSON array of objects with this format:
[
  {"title": "Query 1 purpose", "query": "specific search query"},
  {"title": "Query 2 purpose", "query": "specific search query"},
  ...
]

Make queries specific, actionable, and diverse. Cover different aspects of the research goal.
Tailor the queries to be most relevant for the user's context and needs.`;

  try {
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
    return planWithRules(task, intent, taskType, meetingContext);
  }
}

/**
 * Rule-based planner (fallback)
 */
function planWithRules(
  task: Task,
  intent: ResearchIntent,
  taskType?: TaskType,
  meetingContext?: MeetingContext
): ResearchSubtask[] {
  // Meeting prep: specialized rule-based queries
  if (taskType === 'meeting_prep') {
    // DEMO MODE: Default to Sam Altman
    const fallbackContext: MeetingContext = {
      prospectName: meetingContext?.prospectName || 'Sam Altman',
      prospectCompany: meetingContext?.prospectCompany || 'OpenAI',
      prospectTitle: meetingContext?.prospectTitle || 'CEO',
    };
    return planMeetingPrepWithRules(fallbackContext);
  }

  // General research
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

/**
 * Rule-based meeting prep planner
 */
function planMeetingPrepWithRules(meetingContext: MeetingContext): ResearchSubtask[] {
  const prospectName = meetingContext.prospectName || 'prospect';
  const prospectCompany = meetingContext.prospectCompany || 'company';
  const prospectTitle = meetingContext.prospectTitle || 'executive';

  const queries: Array<{ title: string; query: string }> = [
    {
      title: 'Industry trends',
      query: `${prospectCompany} industry trends 2024 2025`,
    },
    {
      title: 'Company news',
      query: `${prospectCompany} news product launch announcements 2024`,
    },
    {
      title: 'Prospect role and KPIs',
      query: `${prospectTitle} role responsibilities KPIs metrics`,
    },
    {
      title: 'Company strategic direction',
      query: `${prospectCompany} CEO message annual report strategy`,
    },
  ];

  // Add prospect-specific queries if we have their name
  if (prospectName !== 'prospect') {
    queries.push({
      title: 'Prospect LinkedIn profile',
      query: `${prospectName} ${prospectTitle} ${prospectCompany} LinkedIn`,
    });
    queries.push({
      title: 'Prospect recent activity',
      query: `${prospectName} ${prospectCompany} LinkedIn posts articles`,
    });
  }

  return queries.map(q => ({
    id: uuidv4(),
    title: q.title,
    type: 'web' as const,
    query: q.query,
  }));
}
