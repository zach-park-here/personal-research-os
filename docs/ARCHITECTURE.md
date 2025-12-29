# Architecture Overview

## Design Principles

1. **Backend Owns Orchestration**
   - Backend is the source of truth for triggers, queue, runs, and persistence
   - Agents package is a library imported by backend
   - No separate agent supervisor - orchestration lives in `backend/src/orchestrator`

2. **Repository Pattern for Database Abstraction**
   - ALL database access goes through repository classes
   - No direct SQL in API handlers or agents
   - Designed for easy migration from SQLite → Postgres/Supabase
   - See [REPOSITORY_PATTERN.md](./REPOSITORY_PATTERN.md)

3. **Task-Centric**
   - Tasks are the primary unit of context
   - All research is linked to tasks, calendar events, or routines

4. **Trigger-Based, Not Chat-Based**
   - Agents run on events (task created, due soon, etc.)
   - No conversational memory in v0

5. **Privacy-Aware**
   - Local data accessed via Desktop MCP (no indexing by default)
   - Structured outputs, no free-text logging

## Component Responsibilities

### Backend (`backend/`)
- Express API server
- Database management (SQLite in v0, Postgres-ready)
- Repository layer for all database access
- Trigger detection and queue management (Bull + Redis)
- Orchestrates agent execution
- Imports agents library for logic

### Agents (`agents/`)
- **Pure library** (not a standalone service)
- Exported functions for:
  - Chrome history profiling
  - Task/calendar planning
  - Research execution
- Typed schemas for all outputs

### Frontend (`frontend/`)
- React web UI
- Todoist-style task manager
- Research panel integration
- Real-time updates via API

### MCP Server (`mcp-server/`)
- Desktop MCP server for local file access
- Tools: search_files, read_file, extract_text, etc.
- Triggered on-demand (no full indexing)

### Shared (`shared/`)
- Common types and utilities
- Zod schemas for validation
- Shared across all packages

## Data Flow

```
User creates task in UI
  ↓
Frontend → Backend API
  ↓
Backend saves to DB
  ↓
Trigger detected (task_created)
  ↓
Orchestrator adds job to queue
  ↓
Worker calls agents library
  ↓
Agent executes (may call MCP for local files)
  ↓
Results saved to DB
  ↓
Frontend polls/websocket updates UI
```

## Agent Execution Flow

```
backend/src/orchestrator
  ↓
import { planResearch } from '@personal-research-os/agents'
  ↓
const researchTasks = await planResearch(taskData, browsingProfile)
  ↓
Save to DB → Trigger next agent
```

## Database Schema

See [DATABASE.md](./DATABASE.md) for full schema.

Key tables:
- `tasks` - User tasks
- `projects` - Task projects
- `calendar_events` - Google Calendar sync
- `browsing_history_raw` - Chrome history import
- `browsing_profile` - Agent A output
- `research_tasks` - Agent C output
- `research_results` - Agent D output
- `task_insights` - UI-ready insights

## Trigger System

Triggers are detected in `backend/src/orchestrator/triggers.ts`:

- **task_created** - New task added
- **task_updated** - Task modified
- **task_due_soon** - Due date within threshold (24h default)
- **calendar_event_upcoming** - Event starting soon
- **routine_window** - Time-based routine detected
- **manual_trigger** - User clicks "Run research"

## Queue System

Uses Bull (Redis-backed queue) for job processing:

```typescript
// In orchestrator
await researchQueue.add('run_planner', { taskId, userId });
await researchQueue.add('run_executor', { researchTaskId });
```

## MVP Scope (v0)

✅ Included:
- Task CRUD API
- Chrome history import
- Google Calendar sync
- Trigger-based research
- Desktop MCP integration
- Structured agent outputs

❌ Not in v0:
- Chat interface
- Conversational memory
- Full local indexing
- Multi-user auth (single user for now)
