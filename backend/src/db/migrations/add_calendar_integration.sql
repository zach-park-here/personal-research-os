-- Calendar Integration Migration
-- Adds Google Calendar integration to existing schema

-- 1. Modify existing calendar_events table to add new columns
-- First, drop existing table and recreate with new schema
DROP TABLE IF EXISTS research_tasks CASCADE; -- Has foreign key to calendar_events
DROP TABLE IF EXISTS calendar_events CASCADE;

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  calendar_id TEXT NOT NULL DEFAULT 'primary',
  event_id TEXT NOT NULL, -- Google Calendar event ID

  -- Original columns (from 001_initial_schema.sql)
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  attendees JSONB DEFAULT '[]'::jsonb,
  source TEXT CHECK(source IN ('google', 'manual')),
  external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- New columns for Google Calendar integration
  summary TEXT, -- Google Calendar uses 'summary' instead of 'title'
  organizer JSONB,
  conference_data JSONB,
  hangout_link TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed, tentative, cancelled
  is_meeting BOOLEAN NOT NULL DEFAULT false,
  prep_task_created BOOLEAN NOT NULL DEFAULT false,
  prep_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  recurring_event_id TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one event per user/calendar combination
  CONSTRAINT calendar_events_unique_event UNIQUE (user_id, calendar_id, event_id)
);

-- Recreate research_tasks table (was dropped due to CASCADE)
-- IMPORTANT: Must include columns from 003_research_mvp.sql
CREATE TABLE research_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID,
  calendar_event_id UUID,
  type TEXT CHECK(type IN ('task_prep', 'meeting_prep', 'routine')) NOT NULL,
  query TEXT NOT NULL,
  suggested_sources JSONB DEFAULT '[]'::jsonb,
  priority TEXT CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Research tracking columns (from 003_research_mvp.sql)
  is_research_eligible BOOLEAN DEFAULT NULL,
  research_intent research_intent DEFAULT NULL,
  research_status TEXT CHECK(research_status IN ('not_started', 'classifying', 'planning', 'executing', 'completed', 'failed')) DEFAULT 'not_started',

  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (calendar_event_id) REFERENCES calendar_events(id) ON DELETE CASCADE
);

-- Indexes for calendar_events
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_events_user_time ON calendar_events(user_id, start_time);
CREATE INDEX idx_calendar_events_meeting_prep
  ON calendar_events(user_id, is_meeting, prep_task_created, start_time)
  WHERE is_meeting = true AND prep_task_created = false;

-- Indexes for research_tasks
CREATE INDEX idx_research_tasks_task_id ON research_tasks(task_id);
CREATE INDEX idx_research_tasks_calendar_event_id ON research_tasks(calendar_event_id);
CREATE INDEX idx_research_tasks_created_at ON research_tasks(created_at);
CREATE INDEX idx_research_tasks_status ON research_tasks(research_status);

-- 2. OAuth Tokens Table
CREATE TABLE IF NOT EXISTS user_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL, -- 'google', 'microsoft', etc.
  access_token TEXT NOT NULL, -- Encrypted
  refresh_token TEXT NOT NULL, -- Encrypted
  token_expiry TIMESTAMPTZ NOT NULL,
  scope TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One token per user/provider
  CONSTRAINT user_oauth_tokens_unique_user_provider UNIQUE (user_id, provider)
);

-- Index for token expiry checks
CREATE INDEX IF NOT EXISTS idx_oauth_tokens_expiry
  ON user_oauth_tokens(provider, token_expiry);

-- 3. Calendar Webhooks Table
CREATE TABLE IF NOT EXISTS calendar_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  calendar_id TEXT NOT NULL DEFAULT 'primary',
  channel_id TEXT NOT NULL, -- Google webhook channel ID
  resource_id TEXT NOT NULL, -- Google resource ID
  expiration TIMESTAMPTZ NOT NULL, -- Webhooks expire after ~24 hours
  sync_token TEXT, -- For incremental sync
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One webhook per user/calendar
  CONSTRAINT calendar_webhooks_unique_user_calendar UNIQUE (user_id, calendar_id)
);

-- Index for webhook expiry checks
CREATE INDEX IF NOT EXISTS idx_calendar_webhooks_expiry
  ON calendar_webhooks(expiration);
CREATE INDEX IF NOT EXISTS idx_calendar_webhooks_channel
  ON calendar_webhooks(channel_id);

-- Add updated_at trigger for all tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS update_calendar_events_updated_at ON calendar_events;
CREATE TRIGGER update_calendar_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_oauth_tokens_updated_at ON user_oauth_tokens;
CREATE TRIGGER update_user_oauth_tokens_updated_at
  BEFORE UPDATE ON user_oauth_tokens
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_webhooks_updated_at ON calendar_webhooks;
CREATE TRIGGER update_calendar_webhooks_updated_at
  BEFORE UPDATE ON calendar_webhooks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
