-- Aggregated History Table (for efficient storage and analysis)

CREATE TABLE IF NOT EXISTS browsing_history_aggregated (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  domain TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  date DATE NOT NULL,  -- Aggregate by day
  visit_count INTEGER DEFAULT 1,
  first_visit_time TIMESTAMPTZ,
  last_visit_time TIMESTAMPTZ,
  source TEXT CHECK(source IN ('chrome', 'firefox', 'edge', 'manual')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint: one row per URL per day
  UNIQUE(user_id, url, date)
);

CREATE INDEX idx_history_agg_user_date ON browsing_history_aggregated(user_id, date);
CREATE INDEX idx_history_agg_domain ON browsing_history_aggregated(domain);

-- Domain statistics view (pre-computed)
CREATE MATERIALIZED VIEW domain_stats AS
SELECT
  user_id,
  domain,
  COUNT(*) as total_visits,
  COUNT(DISTINCT date) as days_visited,
  MIN(first_visit_time) as first_seen,
  MAX(last_visit_time) as last_seen,
  ARRAY_AGG(DISTINCT title) FILTER (WHERE title IS NOT NULL) as sample_titles
FROM browsing_history_aggregated
GROUP BY user_id, domain;

CREATE UNIQUE INDEX idx_domain_stats ON domain_stats(user_id, domain);
