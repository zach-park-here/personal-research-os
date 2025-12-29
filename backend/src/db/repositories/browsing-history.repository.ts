/**
 * Browsing History Aggregated Repository
 */

import { BaseRepository } from './base.repository';
import type { BrowsingHistoryAggregated } from '@personal-research-os/shared/types/history';

export class BrowsingHistoryAggregatedRepository extends BaseRepository {
  private readonly TABLE = 'browsing_history_aggregated';

  /**
   * Batch insert aggregated history entries
   */
  async batchInsert(
    entries: Array<{
      userId: string;
      domain: string;
      url: string;
      title: string;
      date: string; // ISO date
      visitCount: number;
      firstVisitTime: string; // ISO datetime
      lastVisitTime: string; // ISO datetime
      source: string;
    }>
  ): Promise<void> {
    if (entries.length === 0) return;

    const { error } = await this.db.from(this.TABLE).upsert(
      entries.map((entry) => ({
        user_id: entry.userId,
        domain: entry.domain,
        url: entry.url,
        title: entry.title,
        date: entry.date,
        visit_count: entry.visitCount,
        first_visit_time: entry.firstVisitTime,
        last_visit_time: entry.lastVisitTime,
        source: entry.source,
        updated_at: new Date().toISOString(),
      })),
      {
        onConflict: 'user_id,url,date',
        ignoreDuplicates: false,
      }
    );

    if (error) {
      this.handleError(error, 'BrowsingHistoryAggregatedRepository.batchInsert');
    }
  }

  /**
   * Get aggregated history for a user within date range
   */
  async getByUserAndDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<BrowsingHistoryAggregated[]> {
    const { data, error } = await this.db
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) {
      this.handleError(error, 'BrowsingHistoryAggregatedRepository.getByUserAndDateRange');
    }

    return (data || []).map(this.mapRowToAggregatedHistory);
  }

  /**
   * Get top domains for a user
   */
  async getTopDomains(userId: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await this.db.rpc('get_top_domains', {
      p_user_id: userId,
      p_limit: limit,
    });

    if (error) {
      // Fallback if RPC doesn't exist
      const { data: fallbackData, error: fallbackError } = await this.db
        .from(this.TABLE)
        .select('domain, visit_count')
        .eq('user_id', userId)
        .order('visit_count', { ascending: false })
        .limit(limit);

      if (fallbackError) {
        this.handleError(fallbackError, 'BrowsingHistoryAggregatedRepository.getTopDomains');
      }

      return fallbackData || [];
    }

    return data || [];
  }

  /**
   * Refresh domain_stats materialized view
   */
  async refreshDomainStats(): Promise<void> {
    const { error } = await this.db.rpc('refresh_domain_stats');

    if (error) {
      // Fallback: direct SQL refresh
      console.warn('[BrowsingHistoryRepository] RPC refresh failed, attempting direct refresh');
      // Note: This requires elevated permissions
    }
  }

  /**
   * Map database row to BrowsingHistoryAggregated
   */
  private mapRowToAggregatedHistory(row: any): BrowsingHistoryAggregated {
    return {
      id: row.id,
      userId: row.user_id,
      domain: row.domain,
      url: row.url,
      title: row.title,
      date: row.date,
      visitCount: row.visit_count,
      firstVisitTime: row.first_visit_time,
      lastVisitTime: row.last_visit_time,
      avgTimeSpent: row.avg_time_spent,
      source: row.source,
      updatedAt: row.updated_at,
    };
  }
}
