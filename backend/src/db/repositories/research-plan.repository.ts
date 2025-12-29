/**
 * Research Plan Repository
 */

import { BaseRepository } from './base.repository';
import type { ResearchPlan, ResearchSubtask, ResearchIntent } from '@personal-research-os/shared/types/research';

export class ResearchPlanRepository extends BaseRepository {
  private readonly TABLE = 'research_plans';

  /**
   * Create research plan
   */
  async create(plan: {
    taskId: string;
    userId: string;
    intent: ResearchIntent;
    subtasks: ResearchSubtask[];
  }): Promise<ResearchPlan> {
    const { data, error } = await this.db
      .from(this.TABLE)
      .insert({
        task_id: plan.taskId,
        user_id: plan.userId,
        intent: plan.intent,
        subtasks: plan.subtasks,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      this.handleError(error, 'ResearchPlanRepository.create');
    }

    return this.mapRowToPlan(data);
  }

  /**
   * Get plan by task ID
   */
  async getByTaskId(taskId: string): Promise<ResearchPlan | null> {
    const { data, error } = await this.db
      .from(this.TABLE)
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      this.handleError(error, 'ResearchPlanRepository.getByTaskId');
    }

    return this.mapRowToPlan(data);
  }

  /**
   * Update plan status
   */
  async updateStatus(planId: string, status: 'pending' | 'in_progress' | 'completed' | 'failed'): Promise<void> {
    const { error } = await this.db
      .from(this.TABLE)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', planId);

    if (error) {
      this.handleError(error, 'ResearchPlanRepository.updateStatus');
    }
  }

  /**
   * Map database row to ResearchPlan
   */
  private mapRowToPlan(row: any): ResearchPlan {
    return {
      id: row.id,
      taskId: row.task_id,
      userId: row.user_id,
      intent: row.intent,
      subtasks: row.subtasks,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
