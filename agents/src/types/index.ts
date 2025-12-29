import { z } from 'zod';

// Agent A — Chrome History Profiler
export const BrowsingProfileSchema = z.object({
  userId: z.string(),
  trustedDomains: z.array(z.object({
    domain: z.string(),
    visitCount: z.number(),
    categories: z.array(z.string()),
  })),
  queryPatterns: z.array(z.object({
    pattern: z.string(),
    frequency: z.number(),
    examples: z.array(z.string()),
  })),
  generatedAt: z.string().datetime(),
});

export const RecurringPatternSchema = z.object({
  userId: z.string(),
  patterns: z.array(z.object({
    timeWindow: z.string(), // e.g., "weekday_morning"
    commonQueries: z.array(z.string()),
    commonDomains: z.array(z.string()),
  })),
  generatedAt: z.string().datetime(),
});

// Agent C — Planner
export const ResearchTaskSchema = z.object({
  id: z.string(),
  taskId: z.string().optional(),
  calendarEventId: z.string().optional(),
  type: z.enum(['task_prep', 'meeting_prep', 'routine']),
  query: z.string(),
  suggestedSources: z.array(z.string()),
  priority: z.enum(['low', 'medium', 'high']),
  createdAt: z.string().datetime(),
});

// Agent D — Research Executor
export const ResearchResultSchema = z.object({
  researchTaskId: z.string(),
  sources: z.array(z.object({
    url: z.string(),
    title: z.string(),
    snippet: z.string(),
    trustScore: z.number().min(0).max(1),
    sourceType: z.enum(['web', 'local_file', 'calendar']),
  })),
  executedAt: z.string().datetime(),
});

export const TaskInsightSchema = z.object({
  taskId: z.string(),
  problemStatement: z.string(),
  suggestedQueries: z.array(z.string()),
  trustedSources: z.array(z.string()),
  actionableSteps: z.array(z.string()),
  verificationQuestions: z.array(z.string()),
  generatedAt: z.string().datetime(),
});

// Type exports
export type BrowsingProfile = z.infer<typeof BrowsingProfileSchema>;
export type RecurringPattern = z.infer<typeof RecurringPatternSchema>;
export type ResearchTask = z.infer<typeof ResearchTaskSchema>;
export type ResearchResult = z.infer<typeof ResearchResultSchema>;
export type TaskInsight = z.infer<typeof TaskInsightSchema>;
