# Project Status – Current Implementation State

**Last Updated:** December 31, 2024

> **For Claude Code:** Read this file FIRST before starting any work to understand current system state and avoid context loss.

---

## Current Working State

**Status:** Working prototype for demo video
**Branch:** master
**Environment:** Development

---

## What's Working

### Frontend ✅
- **Task UI**: Todoist-style clean interface
- **Inline Task Creation**: Type + Enter to create tasks (no modals)
- **Meeting Prep View**: Full-screen intelligence dashboard (grayscale, Nick Fury-inspired)
- **Task Detail Modal**: Shows research results for general tasks
- **Dark Mode**: Full dark mode support throughout UI
- **Research Status Badges**: "Researching" (animated) and "Completed" badges

### Backend ✅
- **Task Classification**: Automatically detects meeting_prep vs general research tasks
- **Research Orchestrator**: Classifier → Planner → Executor pipeline
- **Meeting Prep Engine**:
  - Researches person + company
  - Extracts LinkedIn activity with URLs
  - Generates structured briefing (company intel, persona analysis, meeting strategy)
- **General Research Engine**: Plans queries, executes searches, synthesizes findings
- **Perplexity Integration**: Web search via Perplexity API
- **OpenAI Integration**: o1 model for research synthesis
- **Database**: Supabase PostgreSQL with repository pattern

### Data Model ✅
- `tasks` table with task type classification
- `research_results` table with structured JSON reports
- `research_plans` table for planned queries
- `user_profiles` table for personalization (in progress)

---

## Known Issues

### Critical
- **Real-time Status Updates**: Frontend doesn't poll for research status changes
  - Research completes successfully in backend
  - "Researching" badge doesn't appear during execution
  - Page refresh required to see "Completed" badge
  - **Fix needed:** Implement frontend polling or WebSocket updates

### Non-Critical
- Backend port conflicts when tsx watch restarts multiple times (manual kill required)
- Debug console.log statements still active in TaskList.tsx (lines 316-322)

---

## Recent Changes (Dec 31)

### Cleanup
- ✅ Deleted 5 orphaned frontend components (IntentModal, PipelineGraphView, TaskCreationChat, ChatPanel, BottomPanel)
- ✅ Deleted 2 orphaned utilities (mockData.ts, generateSubtasks.ts)
- ✅ Deleted 6 temporary test/junk files
- ✅ Deleted 7 temporary documentation files (kept ZACH_CLAUDE_PAIRING.md and README.md)
- ✅ Deleted migration runner scripts
- ✅ Deleted tecto-landing-page directory (orphaned project)

### UI Updates
- ✅ Removed toggle from "Upcoming Meeting" section
- ✅ Fixed text alignment in "Add task" button → input transition
- ✅ Simplified modal routing (removed duplicate conditions)

### README
- ✅ Completely rewritten to reflect "AI Chief-of-Staff OS" direction
- ✅ Emphasizes meeting prep automation as primary focus
- ✅ Positions as trigger-based, not chat-based system

---

## Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite 5
- Tailwind CSS
- Lucide React (icons)

**Backend:**
- Node.js + Express + TypeScript
- tsx watch for development
- Repository pattern for data access

**Database:**
- Supabase (PostgreSQL)
- Hosted remotely

**AI/APIs:**
- OpenAI API (o1 model) - research synthesis
- Perplexity Search API - web search

**Development:**
- TypeScript throughout
- Zod for schema validation
- Shared types in `shared/types/`

---

## Active Development Focus

**For Demo Video:**
1. Meeting prep automation (primary showcase)
2. Clean, minimal UI (Todoist-style)
3. Automatic intelligence generation
4. LinkedIn activity integration

**Next Priorities:**
1. Fix real-time status updates (frontend polling)
2. Remove debug logging
3. Test full meeting prep flow end-to-end
4. Record demo video

---

## File Structure (Active Components Only)

```
personal-research-os/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── routes.ts                    # Main router
│   │   │   ├── tasks.routes.ts              # Task CRUD + trigger research
│   │   │   ├── research.routes.ts           # Research planning + results
│   │   │   └── history.routes.ts            # History import
│   │   ├── services/
│   │   │   ├── research/
│   │   │   │   ├── orchestrator.service.ts  # Main orchestration
│   │   │   │   ├── classifier.service.ts    # Task type detection
│   │   │   │   ├── planner.service.ts       # Query generation
│   │   │   │   ├── executor.service.ts      # Search + synthesis
│   │   │   │   └── prompts/
│   │   │   │       └── meeting-prep.ts      # Meeting prep prompt
│   │   │   └── search/
│   │   │       └── web-search.client.ts     # Perplexity API client
│   │   ├── db/
│   │   │   ├── supabase.ts                  # Supabase client
│   │   │   ├── init.ts                      # DB initialization
│   │   │   └── repositories/
│   │   │       ├── index.ts                 # Repository factory
│   │   │       ├── task.repository.ts
│   │   │       ├── research-result.repository.ts
│   │   │       └── user-profile.repository.ts
│   │   └── index.ts                         # Server entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx                  # Left sidebar
│   │   │   ├── TaskList.tsx                 # Task list with badges
│   │   │   ├── TaskDetailModal.tsx          # General research modal
│   │   │   ├── MeetingPrepView.tsx          # Meeting intelligence dashboard
│   │   │   └── TasksPanel.tsx               # (legacy, partially used)
│   │   ├── pages/
│   │   │   └── Dashboard.tsx                # Main app page
│   │   ├── hooks/
│   │   │   ├── useTasks.ts                  # Task management
│   │   │   ├── useResearch.ts               # Research fetching
│   │   │   └── useConversation.ts           # Chat functionality
│   │   ├── contexts/
│   │   │   └── DarkModeContext.tsx          # Dark mode state
│   │   ├── lib/
│   │   │   └── api.ts                       # API client
│   │   ├── main.tsx                         # App entry point
│   │   └── index.css                        # Tailwind + custom styles
│   └── package.json
├── shared/
│   └── types/
│       ├── index.ts                         # Core types (Task, Project, etc.)
│       ├── research.ts                      # Research types
│       └── user-profile.ts                  # User profile types
└── docs/                                    # Additional documentation
```

---

## Environment Variables Required

```bash
# Backend (.env)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
PERPLEXITY_API_KEY=your_perplexity_key
PORT=3000
```

---

## Running the System

```bash
# From root directory
npm install

# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

Backend: `http://localhost:3000`
Frontend: `http://localhost:5173`

---

## Git Status

**Branch:** master
**Last Commit:** Initial commit: Personal Research OS

**Modified Files (21):** Active development changes
**Deleted Files (17):** Cleanup complete
**Untracked Files (13):** New features ready to commit

Ready for initial commit and GitHub push.

---

## Important Notes for Claude Code

1. **Always read README.md first** to understand project direction
2. **Always read this file (UPDATED_STATUS.md)** to understand current state
3. **Check ZACH_CLAUDE_PAIRING.md** for working preferences and anti-patterns
4. **Don't suggest large refactors** - system is working, focus on incremental improvements
5. **Preserve the minimal UI aesthetic** - Todoist-style, clean, no clutter
6. **Meeting prep is the star feature** - optimize for demo video quality

---

## Demo Video Requirements

**Target:** 15-25 second demo showing meeting prep automation

**Flow:**
1. User types: "Preparing for the next meeting with Daniel Park at Pickle AI"
2. Press Enter → Task created
3. System automatically detects meeting prep task
4. Research executes in background (show "Researching" badge)
5. Click on task → Full-screen intelligence dashboard appears
6. Show: Company intel, LinkedIn activity, persona analysis, meeting strategy

**Current Blocker:** Real-time status updates not working (badge doesn't appear during research)

---

## Context Loss Prevention

**If context is lost, read these files in order:**
1. `README.md` - Project vision and architecture
2. `UPDATED_STATUS.md` - Current implementation state (this file)
3. `ZACH_CLAUDE_PAIRING.md` - Working preferences and constraints
4. `docs/ARCHITECTURE.md` - Technical details (if needed)

**Key Context:**
- This is NOT a chat-based system
- This is NOT a general research tool
- This IS an AI Chief-of-Staff for meeting prep automation
- UI is intentionally minimal (Todoist-inspired)
- Backend does the heavy lifting (agentic research pipeline)
