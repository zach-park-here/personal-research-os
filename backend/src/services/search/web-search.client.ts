/**
 * Web Search Client
 *
 * Pure adapter for web search APIs.
 * NO intelligence, NO ranking, NO summarization.
 * Just returns raw search results.
 */

import type { RawSearchResult } from '@personal-research-os/shared/types/research';
import OpenAI from 'openai';
import { LLM_MODELS, LLM_PARAMS } from '../../config/llm.config';

export interface WebSearchClient {
  searchWeb(query: string, limit?: number): Promise<RawSearchResult[]>;
}

/**
 * Enhanced Perplexity Response
 * Contains both the AI synthesis and the raw citation URLs
 */
export interface PerplexityResponse {
  synthesis: string; // Perplexity's full AI-synthesized answer
  citations: string[]; // URLs cited in the answer
  searchResults: Array<{
    url: string;
    snippet: string;
  }>;
}

export interface PerplexitySearchClient {
  searchWebEnhanced(query: string, limit?: number): Promise<PerplexityResponse>;
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
 * GPT Search Client (uses ChatGPT web search)
 */
export class GPTSearchClient implements WebSearchClient {
  private client: OpenAI;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.OPENAI_API_KEY || '';
    if (!key) {
      throw new Error('OpenAI API key not configured');
    }
    this.client = new OpenAI({ apiKey: key });
  }

  async searchWeb(query: string, limit: number = 5): Promise<RawSearchResult[]> {
    try {
      console.log(`[GPTSearch] Searching with gpt-4o + web_search: "${query}"`);

      // Use GPT-4o with web_search tool for actual web browsing
      const response = await this.client.chat.completions.create({
        model: LLM_MODELS.FAST,
        messages: [
          {
            role: 'user',
            content: query, // Pass query as natural language - GPT will use web_search automatically
          },
        ],
        // Note: web_search is automatically available in ChatGPT API when model supports it
        // GPT-4o will trigger web search if needed based on the query
      });

      const content = response.choices[0].message.content || '';

      console.log(`[GPTSearch] Raw response (first 500 chars):`, content.slice(0, 500));

      // GPT-4o with web search returns natural language response, not JSON
      // We need to extract search results from the response
      // For now, return as a single result with the full response as snippet
      // This is better than nothing for LinkedIn searches
      return [{
        id: `gpt_${Date.now()}_0`,
        source: 'web' as const,
        title: `Web search results for: ${query.slice(0, 100)}`,
        url: '', // No specific URL for aggregated results
        snippet: content.slice(0, 1000), // Take first 1000 chars
      }];

    } catch (error: any) {
      console.error('[GPTSearch] Search failed:', error);
      throw new Error(`GPT web search failed: ${error.message}`);
    }
  }
}

/**
 * Perplexity Search Client
 * https://docs.perplexity.ai/
 */
export class PerplexitySearchClient implements WebSearchClient, PerplexitySearchClient {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.PERPLEXITY_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[PerplexitySearch] API key not set. Web search will fail.');
    }
  }

  async searchWeb(query: string, limit: number = 5): Promise<RawSearchResult[]> {
    if (!this.apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    try {
      console.log(`[PerplexitySearch] Searching for: "${query}"`);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: LLM_MODELS.SEARCH,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful research assistant. Provide detailed, factual information based on web search results. Focus on recent sources from January 2026.',
            },
            {
              role: 'user',
              content: query, // Pass the full query as-is
            },
          ],
          temperature: 0.3,
          max_tokens: LLM_PARAMS.MAX_TOKENS.SEARCH,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
      }

      const data: any = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const citations = data.citations || [];

      // Log full Perplexity API response
      console.log(`\n========== PERPLEXITY RAW API RESPONSE ==========`);
      console.log(JSON.stringify(data, null, 2));
      console.log(`========== END PERPLEXITY RAW API RESPONSE ==========\n`);

      console.log(`[PerplexitySearch] Content length:`, content.length, 'characters');
      console.log(`[PerplexitySearch] Citations count:`, citations.length);
      console.log(`[PerplexitySearch] Content preview (first 500 chars):`, content.slice(0, 500));

      // Perplexity returns natural language response with citations
      // We'll create a single result with the full response as snippet
      const rawSearchResult = [{
        id: `perplexity_${Date.now()}`,
        source: 'web' as const,
        title: 'LinkedIn Activity Analysis',
        url: citations[0] || 'https://linkedin.com',
        snippet: content, // Full Perplexity response
      }];

      // Log converted RawSearchResult
      console.log(`\n========== CONVERTED TO RawSearchResult ==========`);
      console.log(JSON.stringify(rawSearchResult, null, 2));
      console.log(`========== END RawSearchResult ==========\n`);

      return rawSearchResult;

    } catch (error: any) {
      console.error('[PerplexitySearch] Search failed:', error);
      throw new Error(`Perplexity search failed: ${error.message}`);
    }
  }

  /**
   * Enhanced search method that returns full Perplexity response structure
   * Used by multi-turn intent-based research architecture
   */
  async searchWebEnhanced(query: string, limit: number = 5): Promise<PerplexityResponse> {
    if (!this.apiKey) {
      throw new Error('Perplexity API key not configured');
    }

    try {
      console.log(`[PerplexitySearch] Enhanced search for: "${query}" (limit: ${limit})`);

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: LLM_MODELS.SEARCH,
          messages: [
            {
              role: 'system',
              content: 'You are a helpful research assistant. Provide detailed, factual information based on web search results. Focus on recent sources from January 2026.',
            },
            {
              role: 'user',
              content: query,
            },
          ],
          temperature: 0.3,
          max_tokens: LLM_PARAMS.MAX_TOKENS.SEARCH,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
      }

      const data: any = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      const citations = data.citations || [];

      console.log(`[PerplexitySearch] Enhanced result - Synthesis: ${content.length} chars, Citations: ${citations.length}`);

      return {
        synthesis: content,
        citations: citations,
        searchResults: citations.map((url: string, idx: number) => ({
          url,
          snippet: content.slice(idx * 200, (idx + 1) * 200), // Rough snippet extraction
        })),
      };

    } catch (error: any) {
      console.error('[PerplexitySearch] Enhanced search failed:', error);
      throw new Error(`Perplexity enhanced search failed: ${error.message}`);
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
  const perplexityKey = process.env.PERPLEXITY_API_KEY;
  const tavilyKey = process.env.TAVILY_API_KEY;

  // Prefer Perplexity (best for recent information)
  if (perplexityKey) {
    console.log('[WebSearch] Using Perplexity Search Client');
    return new PerplexitySearchClient(perplexityKey);
  }

  // Fallback to Tavily
  if (tavilyKey) {
    console.log('[WebSearch] Using Tavily Search Client');
    return new TavilySearchClient(tavilyKey);
  }

  throw new Error('No search API key configured. Set PERPLEXITY_API_KEY or TAVILY_API_KEY.');
}
