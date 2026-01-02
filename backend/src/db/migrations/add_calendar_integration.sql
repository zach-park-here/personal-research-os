-- Google Calendar Integration Migration
-- Creates tables for calendar events, OAuth tokens, and webhook subscriptions

-- 1. Calendar Events Table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  calendar_id TEXT NOT NULL,
  event_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  location TEXT,
  attendees JSONB DEFAULT '[]'::jsonb,
  organizer JSONB,
  conference_data JSONB,
  hangout_link TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  is_meeting BOOLEAN NOT NULL DEFAULT false,
  prep_task_created BOOLEAN NOT NULL DEFAULT false,
  prep_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  recurring_event_id TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT calendar_events_unique_event UNIQUE (user_id, calendar_id, event_id)
);

-- Index for querying user's events
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);

-- Index for querying meetings needing prep
CREATE INDEX IF NOT EXISTS idx_calendar_events_prep_needed
  ON calendar_events(user_id, is_meeting, prep_task_created, start_time)
  WHERE is_meeting = true AND prep_task_created = false;

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_calendar_events_status ON calendar_events(status);

-- 2. OAuth Tokens Table
CREATE TABLE IF NOT EXISTS user_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  scope TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT user_oauth_tokens_unique_user_provider UNIQUE (user_id, provider)
);

-- Index for querying user tokens by provider
CREATE INDEX IF NOT EXISTS idx_user_oauth_tokens_user_id ON user_oauth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_oauth_tokens_provider ON user_oauth_tokens(provider);

-- 3. Calendar Webhooks Table
CREATE TABLE IF NOT EXISTS calendar_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  calendar_id TEXT NOT NULL,
  channel_id TEXT NOT NULL UNIQUE,
  resource_id TEXT NOT NULL,
  expiration TIMESTAMPTZ NOT NULL,
  sync_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT calendar_webhooks_unique_user_calendar UNIQUE (user_id, calendar_id)
);

-- Index for webhook lookup by channelId
CREATE INDEX IF NOT EXISTS idx_calendar_webhooks_channel_id ON calendar_webhooks(channel_id);

-- Index for finding expiring webhooks
CREATE INDEX IF NOT EXISTS idx_calendar_webhooks_expiration ON calendar_webhooks(expiration);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_calendar_webhooks_user_id ON calendar_webhooks(user_id);

-- Comments for documentation
COMMENT ON TABLE calendar_events IS 'Stores synced Google Calendar events with meeting detection flags';
COMMENT ON TABLE user_oauth_tokens IS 'Stores encrypted OAuth tokens for calendar access';
COMMENT ON TABLE calendar_webhooks IS 'Tracks Google Calendar webhook subscriptions for real-time sync';

COMMENT ON COLUMN calendar_events.conference_data IS 'Contains conferenceData from Google Calendar API (Zoom, Meet, Teams links)';
COMMENT ON COLUMN calendar_events.is_meeting IS 'Computed flag: true if has conferenceData, hangoutLink, or external attendees';
COMMENT ON COLUMN calendar_events.prep_task_created IS 'Flag to prevent duplicate task creation for same event';
COMMENT ON COLUMN user_oauth_tokens.access_token IS 'Encrypted OAuth access token';
COMMENT ON COLUMN user_oauth_tokens.refresh_token IS 'Encrypted OAuth refresh token';
COMMENT ON COLUMN calendar_webhooks.sync_token IS 'Last syncToken for incremental sync';
COMMENT ON COLUMN calendar_webhooks.channel_id IS 'UUID for this webhook channel, used by Google to identify subscription';
