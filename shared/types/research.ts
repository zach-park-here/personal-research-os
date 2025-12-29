import { z } from 'zod';

/**
 * Research MVP Types
 *
 * Strict contracts for Research Orchestrator
 */

// Research Intent
export const ResearchIntentSchema = z.enum([
  'background_brief',
  'decision_support',
  'competitive_scan',
  'update_since_last',
  'general_summary',
]);

export type ResearchIntent = z.infer<typeof ResearchIntentSchema>;

// Research Subtask
export const ResearchSubtaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.literal('web'),
  query: z.string(),
});

export type ResearchSubtask = z.infer<typeof ResearchSubtaskSchema>;

// Raw Search Result (from Search Layer)
export const RawSearchResultSchema = z.object({
  id: z.string(),
  source: z.literal('web'),
  title: z.string(),
  url: z.string(),
  snippet: z.string(),
});

export type RawSearchResult = z.infer<typeof RawSearchResultSchema>;

// Recommended Page (output)
export const RecommendedPageSchema = z.object({
  title: z.string(),
  url: z.string(),
  why_read: z.string(),
  highlights: z.array(z.string()),
});

export type RecommendedPage = z.infer<typeof RecommendedPageSchema>;

// Research Report (output)
export const ResearchReportSchema = z.object({
  overview: z.string(),
  key_findings: z.array(z.string()),
  risks_or_unknowns: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export type ResearchReport = z.infer<typeof ResearchReportSchema>;

// Research Result (final output)
export const ResearchResultSchema = z.object({
  task_id: z.string(),
  intent: ResearchIntentSchema,
  report: ResearchReportSchema,
  recommended_pages: z.array(RecommendedPageSchema),
});

export type ResearchResult = z.infer<typeof ResearchResultSchema>;

// Research Plan (stored in DB)
export const ResearchPlanSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  userId: z.string(),
  intent: ResearchIntentSchema,
  subtasks: z.array(ResearchSubtaskSchema),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ResearchPlan = z.infer<typeof ResearchPlanSchema>;

// Research Result (stored in DB)
export const ResearchResultDbSchema = z.object({
  id: z.string().uuid(),
  taskId: z.string().uuid(),
  planId: z.string().uuid(),
  userId: z.string(),
  report: ResearchReportSchema,
  recommended_pages: z.array(RecommendedPageSchema),
  sourcesCount: z.number().int(),
  pagesAnalyzed: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ResearchResultDb = z.infer<typeof ResearchResultDbSchema>;
