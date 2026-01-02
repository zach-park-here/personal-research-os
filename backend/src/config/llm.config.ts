/**
 * LLM Model Configuration
 *
 * Centralized configuration for all LLM models used in the research pipeline
 */

export const LLM_MODELS = {
  /** OpenAI o1 - Used for reasoning-intensive tasks (intent analysis, synthesis) */
  REASONING: 'o1',

  /** OpenAI GPT-4o - Fast model for quick searches and queries */
  FAST: 'gpt-4o',

  /** Perplexity Sonar - Search-optimized model for web searches */
  SEARCH: 'sonar',
} as const;

export const LLM_PARAMS = {
  MAX_TOKENS: {
    /** Maximum tokens for synthesis tasks */
    SYNTHESIS: 3000,

    /** Maximum tokens for search queries */
    SEARCH: 3000,
  },
} as const;
