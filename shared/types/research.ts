import { z } from 'zod';

/**
 * Research MVP Types
 *
 * Strict contracts for Research Orchestrator
 */

// Task Type (for routing to specialized agents)
export const TaskTypeSchema = z.enum([
  'meeting_prep',
  'general_research',
]);

export type TaskType = z.infer<typeof TaskTypeSchema>;

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

// Subtask Result (tracks sources per subtask)
export const SubtaskResultSchema = z.object({
  subtask_id: z.string(),
  subtask_title: z.string(),
  query: z.string(),
  sources: z.array(RawSearchResultSchema),
});

export type SubtaskResult = z.infer<typeof SubtaskResultSchema>;

// Recommended Page (output)
export const RecommendedPageSchema = z.object({
  title: z.string(),
  url: z.string(),
  why_read: z.string(),
  highlights: z.array(z.string()),
});

export type RecommendedPage = z.infer<typeof RecommendedPageSchema>;

// Research Report (output) - Generic
export const ResearchReportSchema = z.object({
  overview: z.string(),
  key_findings: z.array(z.string()),
  risks_or_unknowns: z.array(z.string()),
  recommendations: z.array(z.string()),
});

// Meeting Prep Report (output) - Specialized for meeting preparation
export const MeetingPrepReportSchema = z.object({
  overview: z.string(),
  industry_trends: z.object({
    summary: z.string(),
    key_changes: z.array(z.string()),
    implications_for_meeting: z.string(),
  }).optional(),
  company_intelligence: z.object({
    recent_news: z.array(z.string()),
    product_launches: z.array(z.string()),
    growth_signals: z.string().optional(),
    strategic_direction: z.string().optional(),
  }).optional(),
  persona_analysis: z.object({
    persona_name: z.string().optional(),
    persona_title: z.string().optional(),
    persona_company: z.string().optional(),
    role_description: z.string().optional(),
    key_responsibilities: z.array(z.string()).optional(),
    decision_authority: z.string().optional(),
    likely_pain_points: z.array(z.string()).optional(),
    kpis_and_metrics: z.array(z.string()).optional(),
    recent_activity: z.object({
      linkedin_posts: z.array(z.object({
        summary: z.string(),
        url: z.string().optional(),
        date: z.string().optional(),
        verification: z.string().optional(),
      })).optional(),
      topics_of_interest: z.array(z.string()).optional(),
      personal_insights: z.string().optional(),
    }).optional(),
  }).optional(),
  meeting_strategy: z.object({
    opening_approach: z.string().optional(),
    value_propositions: z.array(z.string()).optional(),
    discovery_questions: z.array(z.string()).optional(),
    potential_objections: z.array(z.string()).optional(),
    potential_challenges: z.array(z.string()).optional(),
    closing_strategy: z.string().optional(),
  }).optional(),
});

// Union type for all report types
export type ResearchReport = z.infer<typeof ResearchReportSchema> | z.infer<typeof MeetingPrepReportSchema>;

// Research Result (final output)
export const ResearchResultSchema = z.object({
  task_id: z.string(),
  intent: ResearchIntentSchema,
  report: z.union([ResearchReportSchema, MeetingPrepReportSchema]),
  recommended_pages: z.array(RecommendedPageSchema),
  subtask_results: z.array(SubtaskResultSchema).optional(),
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
  report: z.union([ResearchReportSchema, MeetingPrepReportSchema]),
  recommended_pages: z.array(RecommendedPageSchema),
  subtask_results: z.array(SubtaskResultSchema),
  sourcesCount: z.number().int(),
  pagesAnalyzed: z.number().int(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ResearchResultDb = z.infer<typeof ResearchResultDbSchema>;
