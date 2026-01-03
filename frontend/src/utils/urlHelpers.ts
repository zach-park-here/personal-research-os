/**
 * URL Helper Utilities
 *
 * Common utilities for generating external URLs
 */

/**
 * Create a Google search URL for a given query
 *
 * @param query - The search query
 * @param company - Optional company name to add to search
 * @returns Google search URL
 */
export function createGoogleSearchUrl(query: string, company?: string): string {
  const searchTerm = company ? `${query} ${company}` : query;
  return `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`;
}
