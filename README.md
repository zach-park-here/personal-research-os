# Personal Research OS

A task-first, trigger-based AI system that proactively gathers information.

## 1. Problem

Knowledge workers spend a significant amount of time every day on repetitive information searching:

- Re-searching similar topics
- Visiting the same trusted websites
- Looking for context right before tasks or meetings
- Manually recalling local files or past references

This overhead fragments focus and scales poorly.

## 2. Solution

A Todoist-like task manager augmented with trigger-based AI agents that:

- Understand how the user searches and which sources they trust
- Detect when information is needed (tasks, calendar events, routines)
- Proactively gather relevant information
- Surface results directly inside the task context

The system is task-centric, on-demand, and privacy-aware.

## 3. Core Principles

- Tasks are the center of context
- Agents run on triggers, not chat
- Local data stays local (via Desktop MCP)
- Rule-based first, LLM later
- Structured outputs, UI-ready

## 4. System Overview

### High-level Architecture

```
Todo UI (Web)
   ↓
Backend (Tasks + State + Orchestration)
   ↓
Agent Runtime (Supervisor + Workers)
   ↓
Desktop MCP (Local tools)
```

## 5. Agents (v0 Scope)

### Agent A — Chrome History Profiler

**Purpose**: Analyze Chrome search & browsing history

**Responsibilities**:
- Extract frequent query patterns (e.g. how-to, best, docs)
- Identify trusted domains
- Detect recurring search routines

**Outputs**:
- `browsing_profile`
- `recurring_patterns`

### Agent B — Local Search (Desktop MCP)

**Purpose**: Search and read local files on demand

**Implementation**: Desktop MCP server (not indexed by default)

**Exposed Tools**:
- `search_files`
- `read_file`
- `extract_text`
- `list_recent_files`
- `get_metadata`

No full indexing in v0. Only triggered reads.

### Agent C — Planner (Task + Calendar)

**Purpose**: Decide what needs research

**Inputs**:
- App tasks
- Google Calendar events
- User routines (from Agent A)

**Outputs**:
- `research_tasks` (atomic, actionable research units)

### Agent D — Research Executor

**Purpose**: Execute research tasks and return structured results

**Capabilities**:
- Web search
- Local file search via MCP
- Source ranking using trust profile

**Outputs**:
- `research_results`
- `task_insights` (UI-ready)

## 6. Triggers

Agents run based on events, not chat prompts.

**Examples**:
- Task created or updated
- Due date approaching
- Calendar event upcoming
- Daily routine window (e.g. morning work start)
- Manual "Run research" button

## 7. Data Model (Key Tables)

- `tasks`
- `projects`
- `calendar_events`
- `browsing_history_raw`
- `browsing_profile`
- `recurring_patterns`
- `research_tasks`
- `research_results`
- `task_insights`

All agent outputs are structured JSON, not free text.

## 8. UI Concept

### Todoist-style Layout

- **Left**: Today / Upcoming / Projects / Calendar
- **Center**: Task list
- **Right**: Task Detail + Research Panel

### Research Panel Shows

- Problem statement
- Suggested search queries
- Trusted sources
- Actionable steps
- Verification questions

## 9. MVP Scope (v0)

- ✅ Todoist-style task manager
- ✅ Chrome history ingestion & profiling
- ✅ Google Calendar integration
- ✅ Desktop MCP for local file access
- ✅ Trigger-based research agent
- ❌ No chat memory injection
- ❌ No long-term conversational agent

## 10. Future Extensions

- Prompt & workflow memory agent
- Partial local indexing + embeddings
- Cross-tool MCP expansion (Notion, Drive, Slack)
- Confidence scoring & research evals
- Personal knowledge graph

## 11. Positioning (One Line)

A task-first AI system that brings the right information to you before you ask for it.

---

## Project Structure

```
personal-research-os/
├── backend/              # API, orchestration, database
├── frontend/             # React web UI
├── agents/               # Agent runtime and logic
├── mcp-server/           # Desktop MCP server for local tools
├── shared/               # Shared types and utilities
└── docs/                 # Documentation
```

## Getting Started

(Setup instructions will be added as we build the project)
