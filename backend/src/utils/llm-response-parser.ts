/**
 * LLM Response Parser Utilities
 *
 * Common utilities for parsing and validating LLM responses
 */

/**
 * Extract and parse JSON from LLM response content
 *
 * Handles cases where LLM returns JSON wrapped in markdown code blocks
 * or mixed with explanatory text
 *
 * @param content - Raw LLM response content
 * @param context - Context string for error messages (e.g., "O1 intent analysis")
 * @returns Parsed JSON object
 * @throws Error if JSON cannot be extracted or parsed
 */
export function extractJSON<T>(content: string, context: string): T {
  // Try to find JSON object in content
  const jsonMatch = content.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error(`Failed to extract JSON from ${context}. No JSON object found in response.`);
  }

  try {
    return JSON.parse(jsonMatch[0]) as T;
  } catch (error: any) {
    throw new Error(`Failed to parse JSON from ${context}: ${error.message}`);
  }
}

/**
 * Parse JSON with fallback for flexible response formats
 *
 * Handles both direct JSON and wrapped formats like {queries: [...]}
 *
 * @param content - Raw content to parse
 * @param fallbackValue - Default value if parsing fails
 * @returns Parsed object or fallback value
 */
export function parseJSONSafe<T>(content: string, fallbackValue: T): T {
  try {
    return JSON.parse(content) as T;
  } catch {
    return fallbackValue;
  }
}
