/**
 * Agent C - Planner
 *
 * Decides what research tasks need to be created
 * based on user tasks, calendar events, and browsing profile
 */

import type { ResearchTask } from '../types';

export interface PlannerInput {
  taskId?: string;
  calendarEventId?: string;
  userId: string;
}

export interface PlannerOutput {
  researchTasks: Omit<ResearchTask, 'id' | 'createdAt'>[];
}

/**
 * Run Planner Agent
 *
 * TODO: Implement planning logic
 */
export async function runPlanner(input: PlannerInput): Promise<PlannerOutput> {
  console.log(`[Agent C] Running Planner for user: ${input.userId}`);

  // TODO: Implement
  // 1. Fetch task/calendar event details
  // 2. Fetch browsing_profile for trusted sources
  // 3. Use LLM to analyze what research is needed
  // 4. Generate specific research queries
  // 5. Select appropriate LLM provider (gpt4o-mini, grok, gemini)

  return {
    researchTasks: [],
  };
}

/**
 * Select LLM provider based on query content
 */
export function selectLLMProvider(query: string): 'gpt4o-mini' | 'grok' | 'gemini' {
  const lowerQuery = query.toLowerCase();

  // X/Twitter content → Grok
  if (lowerQuery.includes('x') || lowerQuery.includes('twitter')) {
    return 'grok';
  }

  // YouTube/Video content → Gemini
  if (lowerQuery.includes('youtube') || lowerQuery.includes('video')) {
    return 'gemini';
  }

  // Default → GPT-4o-mini
  return 'gpt4o-mini';
}
