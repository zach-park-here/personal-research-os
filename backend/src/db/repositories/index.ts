/**
 * Repository Index
 *
 * Central export for all repositories using Supabase.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabase } from '../supabase';
import { TaskRepository } from './task.repository';
import { ResearchTaskRepository } from './research-task.repository';
import { BrowsingHistoryAggregatedRepository } from './browsing-history.repository';
import { SearchFlowRepository } from './search-flow.repository';
import { ResearchPlanRepository } from './research-plan.repository';
import { ResearchResultRepository } from './research-result.repository';

/**
 * Get repository instances
 *
 * All repositories use the same Supabase client.
 */
export function getRepositories() {
  const db: SupabaseClient = getSupabase();

  return {
    tasks: new TaskRepository(db),
    researchTasks: new ResearchTaskRepository(db),
    browsingHistory: new BrowsingHistoryAggregatedRepository(db),
    searchFlows: new SearchFlowRepository(db),
    researchPlans: new ResearchPlanRepository(db),
    researchResults: new ResearchResultRepository(db),
    // Add more repositories as needed:
    // projects: new ProjectRepository(db),
    // calendarEvents: new CalendarEventRepository(db),
    // browsingProfile: new BrowsingProfileRepository(db),
    // etc.
  };
}
