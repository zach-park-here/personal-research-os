/**
 * Research Result Repository
 */

import { BaseRepository } from './base.repository';
import type { ResearchResultDb, ResearchReport, RecommendedPage } from '@personal-research-os/shared/types/research';

export class ResearchResultRepository extends BaseRepository {
  private readonly TABLE = 'research_results';

  /**
   * Create research result
   */
  async create(result: {
    taskId: string;
    planId: string;
    userId: string;
    report: ResearchReport;
    recommended_pages: RecommendedPage[];
    sourcesCount: number;
    pagesAnalyzed: number;
  }): Promise<ResearchResultDb> {
    const { data, error } = await this.db
      .from(this.TABLE)
      .insert({
        task_id: result.taskId,
        plan_id: result.planId,
        user_id: result.userId,
        report: result.report,
        recommended_pages: result.recommended_pages,
        sources_count: result.sourcesCount,
        pages_analyzed: result.pagesAnalyzed,
      })
      .select()
      .single();

    if (error) {
      this.handleError(error, 'ResearchResultRepository.create');
    }

    return this.mapRowToResult(data);
  }

  /**
   * Get result by task ID
   */
  async getByTaskId(taskId: string): Promise<ResearchResultDb | null> {
    const { data, error } = await this.db
      .from(this.TABLE)
      .select('*')
      .eq('task_id', taskId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      this.handleError(error, 'ResearchResultRepository.getByTaskId');
    }

    return this.mapRowToResult(data);
  }

  /**
   * Get result by plan ID
   */
  async getByPlanId(planId: string): Promise<ResearchResultDb | null> {
    const { data, error } = await this.db
      .from(this.TABLE)
      .select('*')
      .eq('plan_id', planId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      this.handleError(error, 'ResearchResultRepository.getByPlanId');
    }

    return this.mapRowToResult(data);
  }

  /**
   * Map database row to ResearchResultDb
   */
  private mapRowToResult(row: any): ResearchResultDb {
    return {
      id: row.id,
      taskId: row.task_id,
      planId: row.plan_id,
      userId: row.user_id,
      report: row.report,
      recommended_pages: row.recommended_pages,
      sourcesCount: row.sources_count,
      pagesAnalyzed: row.pages_analyzed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
