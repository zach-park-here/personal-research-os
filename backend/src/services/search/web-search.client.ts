/**
 * Web Search Client
 *
 * Pure adapter for web search APIs.
 * NO intelligence, NO ranking, NO summarization.
 * Just returns raw search results.
 */

import type { RawSearchResult } from '@personal-research-os/shared/types/research';
import OpenAI from 'openai';

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
      console.log(`[GPTSearch] Searching for: "${query}"`);

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: `Search the web for: "${query}"\n\nReturn ${limit} relevant search results in this EXACT JSON format:\n[\n  {\n    "title": "Page title",\n    "url": "https://example.com",\n    "snippet": "Relevant excerpt or summary"\n  }\n]\n\nReturn ONLY valid JSON array, no other text.`,
          },
        ],
      });

      const content = response.choices[0].message.content || '[]';
      const results = JSON.parse(content);

      if (!Array.isArray(results)) {
        throw new Error('Invalid response format from GPT');
      }

      return results.slice(0, limit).map((result: any, index: number) => ({
        id: `gpt_${Date.now()}_${index}`,
        source: 'web' as const,
        title: result.title || '',
        url: result.url || '',
        snippet: result.snippet || '',
      }));

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
export class PerplexitySearchClient implements WebSearchClient {
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
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'You are a search engine that returns search results in JSON format. Return ONLY valid JSON, no other text.',
            },
            {
              role: 'user',
              content: `Search the web for: "${query}"\n\nReturn ${limit} relevant search results in this EXACT JSON format:\n[\n  {\n    "title": "Page title",\n    "url": "https://example.com",\n    "snippet": "Relevant excerpt or summary"\n  }\n]\n\nReturn ONLY the JSON array, no other text. Focus on recent sources from December 2025.`,
            },
          ],
          temperature: 0.2,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
      }

      const data: any = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';

      // Parse JSON response
      const results = JSON.parse(content);

      if (!Array.isArray(results)) {
        throw new Error('Invalid response format from Perplexity');
      }

      return results.slice(0, limit).map((result: any, index: number) => ({
        id: `perplexity_${Date.now()}_${index}`,
        source: 'web' as const,
        title: result.title || '',
        url: result.url || '',
        snippet: result.snippet || '',
      }));

    } catch (error: any) {
      console.error('[PerplexitySearch] Search failed:', error);
      throw new Error(`Perplexity search failed: ${error.message}`);
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
