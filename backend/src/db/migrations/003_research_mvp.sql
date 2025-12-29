-- Research MVP Schema
-- Adds research_plan and research_results storage

-- Drop old research_results table from 001_initial_schema
-- (We're replacing it with new MVP structure)
DROP TABLE IF EXISTS research_results CASCADE;

-- Research Intent enum type
CREATE TYPE research_intent AS ENUM (
  'background_brief',
  'decision_support',
  'competitive_scan',
  'update_since_last',
  'general_summary'
);

-- Research Plan (subtasks)
CREATE TABLE IF NOT EXISTS research_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  intent research_intent NOT NULL,
  subtasks JSONB NOT NULL, -- [{id, title, type, query}]
  status TEXT CHECK(status IN ('pending', 'in_progress', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id)
);

CREATE INDEX idx_research_plans_task ON research_plans(task_id);
CREATE INDEX idx_research_plans_user ON research_plans(user_id);
CREATE INDEX idx_research_plans_status ON research_plans(status);

-- Research Results (structured report) - NEW MVP VERSION
CREATE TABLE research_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES research_plans(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,

  -- Structured report
  report JSONB NOT NULL, -- {overview, key_findings, risks_or_unknowns, recommendations}

  -- Recommended pages
  recommended_pages JSONB NOT NULL, -- [{title, url, why_read, highlights}]

  -- Metadata
  sources_count INTEGER DEFAULT 0,
  pages_analyzed INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id)
);

CREATE INDEX idx_research_results_task ON research_results(task_id);
CREATE INDEX idx_research_results_plan ON research_results(plan_id);
CREATE INDEX idx_research_results_user ON research_results(user_id);

-- Add research tracking to research_tasks table
ALTER TABLE research_tasks
ADD COLUMN IF NOT EXISTS is_research_eligible BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS research_intent research_intent DEFAULT NULL,
ADD COLUMN IF NOT EXISTS research_status TEXT CHECK(research_status IN ('not_started', 'classifying', 'planning', 'executing', 'completed', 'failed')) DEFAULT 'not_started';

CREATE INDEX idx_research_tasks_status ON research_tasks(research_status);
