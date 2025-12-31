/**
 * Frontend types matching backend contracts
 */

export type ResearchIntent =
  | 'background_brief'
  | 'decision_support'
  | 'competitive_scan'
  | 'update_since_last'
  | 'general_summary';

export type ResearchStatus =
  | 'not_started'
  | 'classifying'
  | 'planning'
  | 'executing'
  | 'completed'
  | 'failed';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'active' | 'completed' | 'archived';
  tags: string[];
  createdAt: string;
  updatedAt: string;

  // Frontend-only fields for demo
  isResearchEligible?: boolean;
  researchStatus?: ResearchStatus;
  taskType?: 'meeting_prep' | 'general_research'; // Type of research task
  assignedTo?: 'user' | 'ai'; // Who is responsible for this task
  isResearch?: boolean; // Whether this is a research task
  reasoning?: string; // AI reasoning for research tasks
  summarization?: string; // Brief summary of research findings
  sources?: Array<{
    title: string;
    url: string;
    description: string;
    favicon?: string;
  }>; // Sources found during research

  // Subtasks
  parentId?: string; // If this is a subtask
  subtasks?: Task[]; // Child tasks
}

export interface ResearchReport {
  overview: string;
  key_findings: string[];
  risks_or_unknowns: string[];
  recommendations: string[];
}

export interface RecommendedPage {
  title: string;
  url: string;
  why_read: string;
  highlights: string[];
}

export interface ResearchResult {
  task_id: string;
  intent: ResearchIntent;
  report: ResearchReport;
  recommended_pages: RecommendedPage[];
}

export interface ResearchStep {
  step: number;
  total: number;
  label: string;
  status: 'completed' | 'in_progress' | 'pending';
}
