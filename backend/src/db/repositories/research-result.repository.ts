/**
 * Research Result Repository
 */

import { BaseRepository } from './base.repository';
import type { ResearchResultDb, ResearchReport, RecommendedPage, SubtaskResult } from '@personal-research-os/shared/types/research';

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
    subtask_results: SubtaskResult[];
    sourcesCount: number;
    pagesAnalyzed: number;
  }): Promise<ResearchResultDb> {
    console.log('[ResearchResultRepository] 💾 SAVING TO DATABASE:');
    console.log(JSON.stringify({
      taskId: result.taskId,
      reportKeys: Object.keys(result.report),
      fullReport: result.report,
      recommendedPagesCount: result.recommended_pages.length,
      subtaskResultsCount: result.subtask_results.length,
    }, null, 2));

    const { data, error } = await this.db
      .from(this.TABLE)
      .insert({
        task_id: result.taskId,
        plan_id: result.planId,
        user_id: result.userId,
        report: result.report,
        recommended_pages: result.recommended_pages,
        subtask_results: result.subtask_results,
        sources_count: result.sourcesCount,
        pages_analyzed: result.pagesAnalyzed,
      })
      .select()
      .single();

    if (error) {
      this.handleError(error, 'ResearchResultRepository.create');
    }

    console.log('[ResearchResultRepository] ✅ Saved successfully, reading back:');
    console.log(JSON.stringify({
      savedReportKeys: Object.keys(data.report || {}),
      savedReport: data.report,
    }, null, 2));

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
   * Delete research result
   */
  async delete(id: string): Promise<void> {
    const { error } = await this.db
      .from(this.TABLE)
      .delete()
      .eq('id', id);

    if (error) {
      this.handleError(error, 'ResearchResultRepository.delete');
    }
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
      subtask_results: row.subtask_results || [],
      sourcesCount: row.sources_count,
      pagesAnalyzed: row.pages_analyzed,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
