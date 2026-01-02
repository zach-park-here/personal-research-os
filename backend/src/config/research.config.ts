/**
 * Research Configuration
 *
 * Centralized configuration for research pipeline limits and thresholds
 */

export const RESEARCH_LIMITS = {
  /** Maximum number of URLs to pass to final synthesis (top N by citation frequency) */
  MAX_RESULTS_FOR_SYNTHESIS: 15,

  /** Number of characters to show in log previews for intent analysis responses */
  PREVIEW_CHARS: 500,

  /** Maximum number of intents to generate per research stage */
  MAX_INTENTS_PER_STAGE: 5,

  /** Number of longtail queries to generate per intent */
  QUERIES_PER_INTENT: 3,

  /** Number of characters to show in synthesis previews */
  LOG_PREVIEW_LENGTH: 300,
} as const;
