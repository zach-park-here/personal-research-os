# Database Schema

Using SQLite for simplicity in v0. Can migrate to PostgreSQL later.

## Core Tables

### tasks
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT, -- ISO 8601
  priority TEXT CHECK(priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status TEXT CHECK(status IN ('active', 'completed', 'archived')) DEFAULT 'active',
  tags TEXT, -- JSON array
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### projects
```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  color TEXT,
  created_at TEXT NOT NULL
);
```

### calendar_events
```sql
CREATE TABLE calendar_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  location TEXT,
  attendees TEXT, -- JSON array
  source TEXT CHECK(source IN ('google', 'manual')),
  external_id TEXT, -- Google Calendar event ID
  created_at TEXT NOT NULL
);
```

## Agent Output Tables

### browsing_history_raw
```sql
CREATE TABLE browsing_history_raw (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  visit_time TEXT NOT NULL,
  visit_count INTEGER DEFAULT 1,
  source TEXT CHECK(source IN ('chrome', 'firefox', 'edge')),
  imported_at TEXT NOT NULL
);

CREATE INDEX idx_browsing_history_user ON browsing_history_raw(user_id);
CREATE INDEX idx_browsing_history_time ON browsing_history_raw(visit_time);
```

### browsing_profile
```sql
CREATE TABLE browsing_profile (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  trusted_domains TEXT NOT NULL, -- JSON
  query_patterns TEXT NOT NULL, -- JSON
  generated_at TEXT NOT NULL
);
```

### recurring_patterns
```sql
CREATE TABLE recurring_patterns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  patterns TEXT NOT NULL, -- JSON
  generated_at TEXT NOT NULL
);
```

### research_tasks
```sql
CREATE TABLE research_tasks (
  id TEXT PRIMARY KEY,
  task_id TEXT, -- NULL if from calendar/routine
  calendar_event_id TEXT,
  type TEXT CHECK(type IN ('task_prep', 'meeting_prep', 'routine')),
  query TEXT NOT NULL,
  suggested_sources TEXT, -- JSON array
  priority TEXT CHECK(priority IN ('low', 'medium', 'high')),
  created_at TEXT NOT NULL
);

CREATE INDEX idx_research_tasks_task ON research_tasks(task_id);
CREATE INDEX idx_research_tasks_event ON research_tasks(calendar_event_id);
```

### research_results
```sql
CREATE TABLE research_results (
  id TEXT PRIMARY KEY,
  research_task_id TEXT NOT NULL,
  sources TEXT NOT NULL, -- JSON array
  executed_at TEXT NOT NULL,
  FOREIGN KEY (research_task_id) REFERENCES research_tasks(id)
);
```

### task_insights
```sql
CREATE TABLE task_insights (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  problem_statement TEXT NOT NULL,
  suggested_queries TEXT NOT NULL, -- JSON array
  trusted_sources TEXT NOT NULL, -- JSON array
  actionable_steps TEXT NOT NULL, -- JSON array
  verification_questions TEXT NOT NULL, -- JSON array
  generated_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);
```

## Queue Tables (Bull metadata)

Bull stores job metadata in Redis, not SQLite.

## Migration Strategy

Migrations in `backend/src/db/migrations/`:
- `001_initial.sql` - Core tables
- `002_agent_tables.sql` - Agent output tables
- etc.

Run with: `npm run db:migrate`
