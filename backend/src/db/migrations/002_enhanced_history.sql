-- Enhanced History Schema with Search Flow Tracking

-- Aggregated history (main storage)
CREATE TABLE IF NOT EXISTS browsing_history_aggregated (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  date DATE NOT NULL,
  visit_count INTEGER DEFAULT 1,
  first_visit_time TIMESTAMPTZ,
  last_visit_time TIMESTAMPTZ,
  avg_time_spent INTEGER, -- seconds, estimated
  source TEXT CHECK(source IN ('chrome', 'firefox', 'edge', 'manual')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, url, date)
);

CREATE INDEX idx_history_agg_user_date ON browsing_history_aggregated(user_id, date);
CREATE INDEX idx_history_agg_domain ON browsing_history_aggregated(domain);
CREATE INDEX idx_history_agg_title ON browsing_history_aggregated USING gin(to_tsvector('english', title));

-- Search flow tracking
CREATE TABLE IF NOT EXISTS search_flows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  search_query TEXT NOT NULL,
  search_date DATE NOT NULL,

  -- Top 3 URLs clicked (simplified storage)
  urls_clicked JSONB NOT NULL, -- [{url, domain, title, order, time_spent}]

  -- Flow metadata
  total_time_spent INTEGER, -- seconds
  final_destination TEXT,
  search_source TEXT, -- google, bing, etc.

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_search_flows_user ON search_flows(user_id);
CREATE INDEX idx_search_flows_query ON search_flows USING gin(to_tsvector('english', search_query));
CREATE INDEX idx_search_flows_date ON search_flows(search_date);

-- Domain statistics (materialized view for performance)
CREATE MATERIALIZED VIEW domain_stats AS
SELECT
  user_id,
  domain,
  COUNT(*) as total_visits,
  COUNT(DISTINCT date) as days_visited,
  SUM(visit_count) as total_visit_count,
  AVG(avg_time_spent) as avg_time_spent,
  MIN(first_visit_time) as first_seen,
  MAX(last_visit_time) as last_seen,
  ARRAY_AGG(DISTINCT title ORDER BY title) FILTER (WHERE title IS NOT NULL) as sample_titles,
  -- Simple authority score
  (COUNT(*)::float / (SELECT COUNT(*) FROM browsing_history_aggregated WHERE user_id = bha.user_id)) as authority_score
FROM browsing_history_aggregated bha
GROUP BY user_id, domain;

CREATE UNIQUE INDEX idx_domain_stats_user_domain ON domain_stats(user_id, domain);

-- Update browsing_profile schema
ALTER TABLE browsing_profile
ADD COLUMN IF NOT EXISTS search_behavior JSONB;

-- Update research_tasks schema
ALTER TABLE research_tasks
ADD COLUMN IF NOT EXISTS user_overrides JSONB;

-- Function to refresh domain stats
CREATE OR REPLACE FUNCTION refresh_domain_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY domain_stats;
END;
$$ LANGUAGE plpgsql;
