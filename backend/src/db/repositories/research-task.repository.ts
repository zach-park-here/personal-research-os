import { BaseRepository } from './base.repository';
import type { ResearchTask } from '@personal-research-os/agents';
import type { ResearchIntent } from '@personal-research-os/shared/types/research';

type ResearchStatus = 'not_started' | 'classifying' | 'planning' | 'executing' | 'completed' | 'failed';

/**
 * Research Task Repository
 *
 * Manages research tasks created by Agent C (Planner)
 * Also tracks research eligibility and status for MVP
 */
export class ResearchTaskRepository extends BaseRepository {
  // NOTE: Old SQLite-style methods commented out - not needed for MVP
  // For MVP, we only use research_tasks for tracking (see methods below)
  // Full CRUD operations can be added later if needed

  /**
   * Update research tracking fields for a task
   * Used by orchestrator to track research progress
   */
  async updateResearchTracking(
    taskId: string,
    updates: {
      isResearchEligible?: boolean;
      researchIntent?: ResearchIntent;
      researchStatus?: ResearchStatus;
    }
  ): Promise<void> {
    const { data, error } = await this.db
      .from('research_tasks')
      .update({
        is_research_eligible: updates.isResearchEligible,
        research_intent: updates.researchIntent,
        research_status: updates.researchStatus,
      })
      .eq('task_id', taskId);

    if (error) {
      throw new Error(`Failed to update research tracking: ${error.message}`);
    }
  }

  /**
   * Get research task by task ID
   * Returns research tracking info for a task
   */
  async getByTaskId(taskId: string): Promise<{
    id: string;
    taskId: string;
    isResearchEligible: boolean;
    researchIntent: ResearchIntent | null;
    researchStatus: ResearchStatus;
  } | null> {
    const { data, error } = await this.db
      .from('research_tasks')
      .select('id, task_id, is_research_eligible, research_intent, research_status')
      .eq('task_id', taskId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get research task: ${error.message}`);
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      taskId: data.task_id,
      isResearchEligible: data.is_research_eligible || false,
      researchIntent: data.research_intent,
      researchStatus: data.research_status || 'not_started',
    };
  }

  /**
   * Get or create research task entry for tracking
   * Creates minimal entry if doesn't exist
   */
  async getOrCreateForTracking(taskId: string): Promise<void> {
    // Check if exists
    const { data: existing } = await this.db
      .from('research_tasks')
      .select('id')
      .eq('task_id', taskId)
      .maybeSingle();

    if (!existing) {
      // Create minimal entry for tracking
      const { error } = await this.db
        .from('research_tasks')
        .insert({
          task_id: taskId,
          type: 'task_prep',
          query: '',
          suggested_sources: [],
          priority: 'medium',
        });

      if (error) {
        throw new Error(`Failed to create research task entry: ${error.message}`);
      }
    }
  }

  /**
   * Delete research task
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.db
      .from('research_tasks')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete research task: ${error.message}`);
    }
  }

}
