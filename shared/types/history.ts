import { z } from 'zod';

/**
 * Aggregated browsing history entry
 */
export const BrowsingHistoryAggregatedSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  domain: z.string(),
  url: z.string(),
  title: z.string().optional(),
  date: z.string(), // ISO date string (YYYY-MM-DD)
  visitCount: z.number().int().positive(),
  firstVisitTime: z.string().datetime(),
  lastVisitTime: z.string().datetime(),
  avgTimeSpent: z.number().int().optional(), // seconds
  source: z.enum(['chrome', 'firefox', 'edge', 'manual']),
  updatedAt: z.string().datetime(),
});

/**
 * Search flow tracking
 */
export const SearchFlowSchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  searchQuery: z.string(),
  searchDate: z.string(), // ISO date
  urlsClicked: z.array(z.object({
    url: z.string(),
    domain: z.string(),
    title: z.string().optional(),
    order: z.number().int().min(1).max(3), // Top 3 only
    timeSpent: z.number().int().optional(), // seconds
  })),
  totalTimeSpent: z.number().int().optional(),
  finalDestination: z.string().optional(),
  searchSource: z.string().optional(), // google, bing, etc.
  createdAt: z.string().datetime(),
});

/**
 * Domain statistics
 */
export const DomainStatsSchema = z.object({
  domain: z.string(),
  totalVisits: z.number().int(),
  daysVisited: z.number().int(),
  totalVisitCount: z.number().int(),
  avgTimeSpent: z.number().optional(),
  firstSeen: z.string().datetime(),
  lastSeen: z.string().datetime(),
  sampleTitles: z.array(z.string()),
  authorityScore: z.number().min(0).max(1),
});

/**
 * Enhanced browsing profile with search behavior
 */
export const EnhancedBrowsingProfileSchema = z.object({
  userId: z.string(),
  trustedDomains: z.array(z.object({
    domain: z.string(),
    authorityScore: z.number().min(0).max(1),
    totalVisits: z.number().int(),
    categories: z.array(z.string()),
    avgTimeSpent: z.number().optional(),
  })),
  queryPatterns: z.array(z.object({
    pattern: z.string(),
    frequency: z.number().int(),
    examples: z.array(z.string()),
    typicalFlow: z.array(z.string()), // [domain1, domain2, ...]
  })),
  searchBehavior: z.object({
    preferredKeywords: z.array(z.string()),
    typicalSearchFlows: z.record(z.array(z.string())), // category -> [domains]
    clickPatterns: z.object({
      firstClickDomains: z.array(z.string()),
      deepReadDomains: z.array(z.string()),
    }),
    timeInvestment: z.object({
      quickScan: z.number().int(), // seconds
      normalRead: z.number().int(),
      deepDive: z.number().int(),
    }),
  }),
  generatedAt: z.string().datetime(),
});

/**
 * Research task with user overrides
 */
export const UserOverridesSchema = z.object({
  customDomains: z.array(z.string()).optional(),
  customKeywords: z.array(z.string()).optional(),
  specificUrls: z.array(z.string()).optional(),
  forceLlmProvider: z.enum(['gpt4o-mini', 'grok', 'gemini']).optional(),
});

// Type exports
export type BrowsingHistoryAggregated = z.infer<typeof BrowsingHistoryAggregatedSchema>;
export type SearchFlow = z.infer<typeof SearchFlowSchema>;
export type DomainStats = z.infer<typeof DomainStatsSchema>;
export type EnhancedBrowsingProfile = z.infer<typeof EnhancedBrowsingProfileSchema>;
export type UserOverrides = z.infer<typeof UserOverridesSchema>;
