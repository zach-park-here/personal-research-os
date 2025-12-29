-- Personal Research OS - Initial Schema
-- Compatible with PostgreSQL (Supabase)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  project_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status TEXT CHECK(status IN ('active', 'completed', 'archived')) DEFAULT 'active',
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  attendees JSONB DEFAULT '[]'::jsonb,
  source TEXT CHECK(source IN ('google', 'manual')),
  external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);

-- Browsing history raw table
CREATE TABLE IF NOT EXISTS browsing_history_raw (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  visit_time TIMESTAMPTZ NOT NULL,
  visit_count INTEGER DEFAULT 1,
  source TEXT CHECK(source IN ('chrome', 'firefox', 'edge', 'manual')),
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_browsing_history_user_id ON browsing_history_raw(user_id);
CREATE INDEX idx_browsing_history_visit_time ON browsing_history_raw(visit_time);

-- Browsing profile table (Agent A output)
CREATE TABLE IF NOT EXISTS browsing_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  trusted_domains JSONB NOT NULL,
  query_patterns JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recurring patterns table (Agent A output)
CREATE TABLE IF NOT EXISTS recurring_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,
  patterns JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Research tasks table (Agent C output)
CREATE TABLE IF NOT EXISTS research_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID,
  calendar_event_id UUID,
  type TEXT CHECK(type IN ('task_prep', 'meeting_prep', 'routine')) NOT NULL,
  query TEXT NOT NULL,
  suggested_sources JSONB DEFAULT '[]'::jsonb,
  priority TEXT CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (calendar_event_id) REFERENCES calendar_events(id) ON DELETE CASCADE
);

CREATE INDEX idx_research_tasks_task_id ON research_tasks(task_id);
CREATE INDEX idx_research_tasks_calendar_event_id ON research_tasks(calendar_event_id);
CREATE INDEX idx_research_tasks_created_at ON research_tasks(created_at);

-- Research results table (Agent D output)
CREATE TABLE IF NOT EXISTS research_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  research_task_id UUID NOT NULL,
  sources JSONB NOT NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (research_task_id) REFERENCES research_tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_research_results_research_task_id ON research_results(research_task_id);

-- Task insights table (Agent D output - UI-ready)
CREATE TABLE IF NOT EXISTS task_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL,
  problem_statement TEXT NOT NULL,
  suggested_queries JSONB NOT NULL,
  trusted_sources JSONB NOT NULL,
  actionable_steps JSONB NOT NULL,
  verification_questions JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE INDEX idx_task_insights_task_id ON task_insights(task_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for tasks table
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
