/**
 * Migration 006: Add user profiles table
 *
 * Stores user context information to personalize research
 */

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL UNIQUE,

  -- Basic Info
  name TEXT NOT NULL,
  email TEXT,

  -- Professional Context
  job_title TEXT,
  company TEXT,
  company_description TEXT,
  industry TEXT,

  -- Additional Context
  location TEXT,
  interests TEXT[], -- Array of interest strings
  goals TEXT[], -- Array of goal strings

  -- Research Preferences
  preferred_sources TEXT[], -- Array of source preferences
  research_style TEXT DEFAULT 'balanced', -- 'brief', 'detailed', 'balanced'

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();
