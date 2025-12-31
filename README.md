# AI Chief-of-Staff OS

A Todoist-style workspace with trigger-based automation engines that prepare meetings and research tasks for you.

---

## The Problem

Knowledge workers face cognitive overhead before every meeting and task:

- Manually researching prospects before sales calls
- Re-reading context before important meetings
- Searching for background information when starting tasks
- Juggling multiple sources to build a complete picture

This prep work fragments focus, creates friction, and doesn't scale.

---

## The Solution

An AI Chief-of-Staff that works underneath your task list:

**Task-First Interface**
- Clean, Todoist-style workspace
- Type a task, press Enter
- AI determines what needs preparation

**Two Automation Engines**

1. **Meeting Prep Engine**
   - Detects meeting-related tasks
   - Researches the person and company
   - Generates briefing: company intelligence, persona analysis, LinkedIn activity, meeting strategy
   - Surfaces as a full-screen intelligence dashboard

2. **Research Engine**
   - Detects research-eligible tasks
   - Plans and executes web research
   - Synthesizes findings into actionable insights
   - Returns brief, key findings, recommendations

**Trigger-Based, Not Chat-Based**
- No prompting required
- Automation runs in the background
- Results appear when ready
- Clean UI, minimal interruption

---

## Core Principles

**Reduce Cognitive Load**
- Automate pre-meeting research
- Automate task preparation
- Surface insights directly in context
- Minimize manual prep work

**Task-Centric Design**
- Tasks are the center of the system
- Research attaches to tasks
- UI stays minimal and focused
- Automation happens underneath

**Trigger-Based Execution**
- AI detects intent from task text
- Classifies task type (meeting prep, research, general)
- Automatically triggers appropriate engine
- No chat interface needed for core workflows

**Structured, UI-Ready Outputs**
- All research returns as structured JSON
- Frontend renders formatted intelligence
- No raw text dumps
- Actionable, scannable information

---

## How It Works

### User Flow

1. **Create a task** (e.g., "Preparing for the next meeting with Daniel Park at Pickle AI")
2. **AI classifies** → Meeting prep task detected
3. **Research executes** → Searches web for Daniel Park, Pickle AI, recent LinkedIn activity
4. **Synthesis runs** → OpenAI o1 generates structured briefing
5. **Intelligence surfaces** → Full-screen dashboard with company intel, persona analysis, meeting strategy

### System Architecture

```
Frontend (React)
   ↓
Backend API (Express + TypeScript)
   ↓
Research Orchestrator
   ├── Classifier (detects task type)
   ├── Planner (determines research queries)
   └── Executor (runs search + synthesis)
   ↓
External Services
   ├── Perplexity Search API (web search)
   └── OpenAI API (o1 model for synthesis)
   ↓
Supabase (PostgreSQL database)
```

### Tech Stack

**Frontend**
- React + TypeScript
- Vite
- Tailwind CSS
- Todoist-inspired minimal UI

**Backend**
- Node.js + Express + TypeScript
- Supabase (PostgreSQL)
- Repository pattern for data access
- Background orchestration system

**AI/Research**
- OpenAI o1 model (research synthesis)
- Perplexity Search API (web search)
- Structured prompt engineering
- JSON schema validation

---

## Current Status

**Working Prototype** (for product demo video)

**Implemented:**
- ✅ Todoist-style task UI with inline creation
- ✅ Automatic task type classification
- ✅ Meeting prep automation (full pipeline)
- ✅ General research automation
- ✅ Structured intelligence dashboards
- ✅ LinkedIn activity integration
- ✅ Dark mode support
- ✅ Real-time research status badges

**In Progress:**
- Research status real-time updates (frontend polling)
- Calendar integration for auto-scheduling
- User profile system for personalization

---

## Key Features

### 1. Meeting Prep Intelligence

When you create a meeting prep task, the system automatically:

- Researches the prospect (LinkedIn, company website, news)
- Analyzes company intelligence (recent launches, products, stage)
- Builds persona profile (role, responsibilities, decision authority)
- Surfaces LinkedIn activity with clickable post links
- Generates meeting strategy (opening approach, discovery questions, potential challenges)

Presents as a grayscale intelligence dashboard (inspired by Nick Fury briefing screens).

### 2. Task Research Automation

For general research tasks:

- Automatically plans research queries
- Executes web searches
- Synthesizes findings
- Returns structured insights: overview, key findings, recommendations, recommended pages

### 3. Minimal, Accessible UI

- Clean task list (Todoist-style)
- Inline task creation (type + Enter)
- No complex modals or chat interfaces
- Research appears when ready
- Dark mode throughout

---

## Architecture Highlights

### Backend Services

**Classifier Service**
- Detects task intent from text
- Classifies: meeting_prep, research, or general
- Extracts meeting context (person, company, role)

**Planner Service**
- Generates research queries based on task type
- For meeting prep: person research, company research, industry context
- For general research: breaks down into searchable queries

**Executor Service**
- Executes web searches via Perplexity
- Calls OpenAI o1 for synthesis
- Returns structured JSON (schema-validated)

**Orchestrator Service**
- Coordinates classifier → planner → executor
- Manages research lifecycle
- Stores results in database

### Data Model

**Core Tables:**
- `tasks` - User tasks with classification metadata
- `research_results` - Structured research outputs
- `research_plans` - Planned research queries
- `user_profiles` - User context for personalization

All research outputs are typed with Zod schemas for frontend type safety.

---

## Future Vision

**Post-Meeting Intelligence**
- Capture meeting notes
- Track follow-ups
- Surface relevant context for next interaction

**Context Aggregation**
- Aggregate signals from calendar, tasks, browsing history
- Build temporal context graph
- Surface relevant information proactively

**Workflow Memory**
- Learn user preferences for research depth
- Optimize query generation
- Personalize intelligence format

**Extended Triggers**
- Calendar event detection
- Recurring task patterns
- Scheduled daily briefings

---

## Project Structure

```
personal-research-os/
├── backend/
│   ├── src/
│   │   ├── api/              # Express routes
│   │   ├── services/         # Business logic
│   │   │   └── research/     # Research orchestration
│   │   └── db/               # Database + repositories
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── pages/            # Dashboard
│   │   ├── hooks/            # Custom hooks
│   │   └── lib/              # API client
│   └── package.json
├── shared/
│   └── types/                # Shared TypeScript types
└── docs/                     # Additional documentation
```

---

## Setup

**Prerequisites:**
- Node.js 18+
- Supabase project
- Perplexity Search API key
- OpenAI API key

**Environment Variables:**

```bash
# Backend (.env)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
PERPLEXITY_API_KEY=your_perplexity_key
PORT=3000
```

**Installation:**

```bash
# Install dependencies (from root)
npm install

# Run backend
npm run dev:backend

# Run frontend (separate terminal)
npm run dev:frontend
```

Backend runs on `http://localhost:3000`
Frontend runs on `http://localhost:5173`

---

## One-Line Positioning

**A task-first AI workspace that prepares meetings and research automatically, so you can focus on the work that matters.**

---

## For Claude Code / AI Assistants

**IMPORTANT: Read these files BEFORE starting any work:**

1. **README.md** (this file) - Project vision, architecture, current direction
2. **UPDATED_STATUS.md** - Current implementation state, known issues, recent changes
3. **ZACH_CLAUDE_PAIRING.md** - Working preferences, constraints, anti-patterns to avoid

These files prevent context loss and ensure you understand the system's current state.

### Working Guidelines (Zach's Preferences)

**Execution Mode, Not Strategy:**
- Keep me shipping code, not discussing architecture
- Break tasks into ≤2 hour chunks
- Suggest concrete next steps, not abstract options

**Anti-Patterns to Block:**
- "Let's redesign the whole architecture"
- "Let's switch framework/stack right now"
- "Maybe this isn't the right product, what if we built X instead?"
- Infinite refactors without shipping

**When I Ask for Big Changes:**
- Propose a smaller, safer slice that ships value
- Ask: "What's the next 2-hour chunk that moves the demo forward?"
- Redirect strategy discussions to small coding tasks

**Code Style:**
- Simple, readable, boring code over clever abstractions
- Avoid heavy refactors unless blocking progress
- Keep explanations brief, action-oriented

**Communication:**
- Direct, friendly, concise
- "Do X, then Y" format
- Avoid long strategic essays

**Current Focus:**
- Demo video preparation (meeting prep showcase)
- Fix real-time status updates
- Maintain minimal, clean UI
- No new features until demo is ready

---

## License

MIT
