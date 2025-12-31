import { z } from 'zod';

// Task Management
export const TaskSchema = z.object({
  id: z.string(),
  userId: z.string(),
  projectId: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['active', 'completed', 'archived']).default('active'),
  tags: z.array(z.string()).default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const ProjectSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  color: z.string().optional(),
  createdAt: z.string().datetime(),
});

// Calendar
export const CalendarEventSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  location: z.string().optional(),
  attendees: z.array(z.string()).default([]),
  source: z.enum(['google', 'manual']),
  externalId: z.string().optional(),
  createdAt: z.string().datetime(),
});

// Browsing History
export const BrowsingHistoryRawSchema = z.object({
  id: z.string(),
  userId: z.string(),
  url: z.string(),
  title: z.string().optional(),
  visitTime: z.string().datetime(),
  visitCount: z.number().default(1),
  source: z.enum(['chrome', 'firefox', 'edge']),
  importedAt: z.string().datetime(),
});

// Trigger System
export const TriggerEventSchema = z.object({
  id: z.string(),
  type: z.enum([
    'task_created',
    'task_updated',
    'task_due_soon',
    'calendar_event_upcoming',
    'routine_window',
    'manual_trigger',
  ]),
  entityId: z.string(), // task_id, event_id, etc.
  entityType: z.enum(['task', 'calendar_event', 'routine']),
  payload: z.record(z.any()),
  createdAt: z.string().datetime(),
});

// Type exports
export type Task = z.infer<typeof TaskSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;
export type BrowsingHistoryRaw = z.infer<typeof BrowsingHistoryRawSchema>;
export type TriggerEvent = z.infer<typeof TriggerEventSchema>;

// User Profile exports
export * from './user-profile';
