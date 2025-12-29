/**
 * Web Search Client
 *
 * Pure adapter for web search APIs.
 * NO intelligence, NO ranking, NO summarization.
 * Just returns raw search results.
 */

import type { RawSearchResult } from '@personal-research-os/shared/types/research';

export interface WebSearchClient {
  searchWeb(query: string, limit?: number): Promise<RawSearchResult[]>;
}

/**
 * Tavily Search Client
 * https://tavily.com/
 */
export class TavilySearchClient implements WebSearchClient {
  private apiKey: string;
  private baseUrl = 'https://api.tavily.com';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.TAVILY_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[TavilySearch] API key not set. Web search will fail.');
    }
  }

  async searchWeb(query: string, limit: number = 5): Promise<RawSearchResult[]> {
    if (!this.apiKey) {
      throw new Error('Tavily API key not configured');
    }

    try {
      const response = await fetch(`${this.baseUrl}/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          query,
          max_results: limit,
          search_depth: 'basic',
          include_answer: false,
          include_raw_content: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.status}`);
      }

      const data: any = await response.json();

      // Convert Tavily format to our RawSearchResult
      return (data.results || []).map((result: any, index: number) => ({
        id: `tavily_${Date.now()}_${index}`,
        source: 'web' as const,
        title: result.title || '',
        url: result.url || '',
        snippet: result.content || '',
      }));

    } catch (error: any) {
      console.error('[TavilySearch] Search failed:', error);
      throw new Error(`Web search failed: ${error.message}`);
    }
  }
}

/**
 * Mock Search Client (for development/testing)
 */
export class MockSearchClient implements WebSearchClient {
  async searchWeb(query: string, limit: number = 5): Promise<RawSearchResult[]> {
    console.log(`[MockSearch] Searching for: "${query}" (limit: ${limit})`);

    // Return mock results
    return Array.from({ length: Math.min(limit, 3) }, (_, i) => ({
      id: `mock_${Date.now()}_${i}`,
      source: 'web' as const,
      title: `Mock Result ${i + 1} for "${query}"`,
      url: `https://example.com/result-${i + 1}`,
      snippet: `This is a mock search result snippet for query: ${query}. It contains relevant information about the topic.`,
    }));
  }
}

/**
 * Factory function to get the appropriate search client
 */
export function getWebSearchClient(): WebSearchClient {
  const apiKey = process.env.TAVILY_API_KEY;

  if (apiKey) {
    return new TavilySearchClient(apiKey);
  }

  console.warn('[WebSearch] No API key configured. Using MockSearchClient for development.');
  return new MockSearchClient();
}
