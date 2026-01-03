/**
 * OpenAI Client Factory
 *
 * Centralized singleton factory for OpenAI client initialization
 * Ensures single client instance across the application
 */

import OpenAI from 'openai';

// Singleton instance
let openaiClient: OpenAI | null = null;
let clientInitialized = false;

/**
 * Get or create OpenAI client instance
 *
 * Lazy initialization pattern - creates client on first call
 * and reuses the same instance for subsequent calls
 *
 * @returns OpenAI client instance
 * @throws Error if OPENAI_API_KEY is not configured
 */
export function getOpenAIClient(): OpenAI {
  if (!clientInitialized) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not configured in environment variables');
    }

    console.log('[OpenAI Factory] Initializing OpenAI client');
    openaiClient = new OpenAI({ apiKey });
    clientInitialized = true;
  }

  if (!openaiClient) {
    throw new Error('OpenAI client initialization failed');
  }

  return openaiClient;
}

/**
 * Reset client instance (useful for testing)
 */
export function resetOpenAIClient(): void {
  openaiClient = null;
  clientInitialized = false;
}
