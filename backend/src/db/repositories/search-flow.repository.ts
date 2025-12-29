/**
 * Search Flow Repository
 */

import { BaseRepository } from './base.repository';
import type { SearchFlow } from '@personal-research-os/shared/types/history';

export class SearchFlowRepository extends BaseRepository {
  private readonly TABLE = 'search_flows';

  /**
   * Batch insert search flows
   */
  async batchInsert(
    flows: Array<{
      userId: string;
      searchQuery: string;
      searchDate: string; // ISO date
      urlsClicked: Array<{
        url: string;
        domain: string;
        title?: string;
        order: number;
        timeSpent?: number;
      }>;
      totalTimeSpent?: number;
      finalDestination?: string;
      searchSource?: string;
    }>
  ): Promise<void> {
    if (flows.length === 0) return;

    const { error } = await this.db.from(this.TABLE).insert(
      flows.map((flow) => ({
        user_id: flow.userId,
        search_query: flow.searchQuery,
        search_date: flow.searchDate,
        urls_clicked: flow.urlsClicked,
        total_time_spent: flow.totalTimeSpent,
        final_destination: flow.finalDestination,
        search_source: flow.searchSource,
        created_at: new Date().toISOString(),
      }))
    );

    if (error) {
      this.handleError(error, 'SearchFlowRepository.batchInsert');
    }
  }

  /**
   * Get search flows for a user within date range
   */
  async getByUserAndDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<SearchFlow[]> {
    const { data, error } = await this.db
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .gte('search_date', startDate)
      .lte('search_date', endDate)
      .order('search_date', { ascending: false });

    if (error) {
      this.handleError(error, 'SearchFlowRepository.getByUserAndDateRange');
    }

    return (data || []).map(this.mapRowToSearchFlow);
  }

  /**
   * Get recent search flows for a user
   */
  async getRecentByUser(userId: string, limit: number = 100): Promise<SearchFlow[]> {
    const { data, error } = await this.db
      .from(this.TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      this.handleError(error, 'SearchFlowRepository.getRecentByUser');
    }

    return (data || []).map(this.mapRowToSearchFlow);
  }

  /**
   * Get search patterns for a user (for profiling)
   */
  async getSearchPatterns(userId: string): Promise<{
    topQueries: Array<{ query: string; count: number }>;
    topDomains: Array<{ domain: string; count: number }>;
    avgUrlsPerFlow: number;
  }> {
    // Get all flows for user
    const { data, error } = await this.db
      .from(this.TABLE)
      .select('search_query, urls_clicked')
      .eq('user_id', userId);

    if (error) {
      this.handleError(error, 'SearchFlowRepository.getSearchPatterns');
    }

    if (!data || data.length === 0) {
      return {
        topQueries: [],
        topDomains: [],
        avgUrlsPerFlow: 0,
      };
    }

    // Count queries
    const queryCounts = new Map<string, number>();
    const domainCounts = new Map<string, number>();
    let totalUrls = 0;

    for (const flow of data) {
      // Count query
      const count = queryCounts.get(flow.search_query) || 0;
      queryCounts.set(flow.search_query, count + 1);

      // Count domains
      const urls = flow.urls_clicked as any[];
      totalUrls += urls.length;
      for (const urlInfo of urls) {
        const domainCount = domainCounts.get(urlInfo.domain) || 0;
        domainCounts.set(urlInfo.domain, domainCount + 1);
      }
    }

    // Sort and limit
    const topQueries = Array.from(queryCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const topDomains = Array.from(domainCounts.entries())
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      topQueries,
      topDomains,
      avgUrlsPerFlow: totalUrls / data.length,
    };
  }

  /**
   * Map database row to SearchFlow
   */
  private mapRowToSearchFlow(row: any): SearchFlow {
    return {
      id: row.id,
      userId: row.user_id,
      searchQuery: row.search_query,
      searchDate: row.search_date,
      urlsClicked: row.urls_clicked,
      totalTimeSpent: row.total_time_spent,
      finalDestination: row.final_destination,
      searchSource: row.search_source,
      createdAt: row.created_at,
    };
  }
}
