# Project Status

## Initial Setup Complete ✅

The Personal Research OS project structure has been initialized with all core components.

## Created Structure

```
personal-research-os/
├── README.md                    # Project overview and vision
├── PROJECT_STATUS.md            # This file
├── package.json                 # Root workspace config
├── tsconfig.json                # Base TypeScript config
├── .gitignore                   # Git ignore rules
│
├── backend/                     # API, orchestration, database
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── src/
│       ├── index.ts            # Server entry point
│       ├── api/                # REST API routes
│       ├── db/                 # Database & migrations
│       ├── orchestrator/       # Trigger system & queue
│       ├── services/           # Business logic
│       └── types/              # Backend types
│
├── frontend/                    # React web UI
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── public/
│   └── src/
│       ├── components/         # UI components
│       ├── pages/              # Page components
│       ├── hooks/              # React hooks
│       ├── services/           # API client
│       ├── styles/             # CSS/Tailwind
│       └── types/              # Frontend types
│
├── agents/                      # Agent library (pure functions)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts            # Library exports
│       ├── workers/            # Agent implementations
│       │   ├── chrome-profiler.ts
│       │   ├── planner.ts
│       │   └── research-executor.ts
│       ├── utils/              # Helper functions
│       └── types/              # Agent schemas
│           └── index.ts        # Zod schemas
│
├── mcp-server/                  # Desktop MCP for local files
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts            # MCP server
│       └── tools/              # Tool implementations
│           ├── search-files.ts
│           ├── read-file.ts
│           ├── extract-text.ts
│           ├── list-recent-files.ts
│           └── get-metadata.ts
│
├── shared/                      # Shared types & utilities
│   ├── package.json
│   ├── tsconfig.json
│   ├── types/
│   │   └── index.ts            # Core schemas
│   └── utils/
│       └── date.ts             # Date helpers
│
└── docs/                        # Documentation
    ├── ARCHITECTURE.md          # System design
    ├── DATABASE.md              # Schema reference
    └── GETTING_STARTED.md       # Setup guide
```

## Key Design Decisions

1. **Monorepo with npm workspaces**
   - All packages in one repo
   - Shared dependencies
   - Cross-package imports via `@personal-research-os/*`

2. **Backend owns orchestration**
   - Single source of truth
   - Agents are a library, not a service
   - Orchestrator calls agent functions directly

3. **Repository pattern for database abstraction**
   - ALL database access through repositories
   - No direct SQL in API/agents
   - SQLite in v0, Postgres-ready design
   - Easy migration to Supabase later
   - See [docs/REPOSITORY_PATTERN.md](docs/REPOSITORY_PATTERN.md)

4. **Type safety with Zod**
   - Runtime validation
   - Type inference from schemas
   - Consistent data contracts

5. **Task-centric architecture**
   - Tasks are the primary context
   - Triggers drive agent execution
   - No chat interface in v0

## Next Steps

1. **Implement Core Backend** (Priority 1)
   - [ ] Database initialization script
   - [ ] Task CRUD API endpoints
   - [ ] Trigger detection system
   - [ ] Queue setup with Bull

2. **Implement Agents** (Priority 2)
   - [ ] Chrome history profiler (Agent A)
   - [ ] Task planner (Agent C)
   - [ ] Research executor (Agent D)
   - [ ] MCP tool implementations

3. **Implement Frontend** (Priority 3)
   - [ ] Task list view
   - [ ] Task detail view
   - [ ] Research panel
   - [ ] Calendar integration

4. **External Integrations** (Priority 4)
   - [ ] Google Calendar OAuth
   - [ ] Chrome history import script
   - [ ] OpenAI API integration

## Development Workflow

```bash
# Install dependencies
npm install

# Start all services
npm run dev

# Or individually
npm run dev:backend
npm run dev:frontend
npm run dev:mcp
```

## Technology Stack

- **Backend**: Node.js, Express, SQLite, Bull (Redis queue)
- **Frontend**: React, Vite, Tailwind CSS, Zustand
- **Agents**: OpenAI API, Zod schemas
- **MCP**: Model Context Protocol (Desktop server)
- **Language**: TypeScript throughout

## Current Status

### Completed ✅
- Project structure created
- Configuration files in place
- Type definitions established
- Documentation written
- Supabase client installed and configured
- Database migration SQL script created
- Migration runner script implemented

### In Progress 🔄
- Setting up Supabase database (need credentials)
- Updating Repository pattern for Postgres
- Task API implementation

### Next Steps ⏳
- Get Supabase credentials
- Run migrations
- Complete Task Repository
- Implement Task CRUD endpoints
- Test with Postman

---

## Implementation Log (2025-12-16)

### Session 1: Initial Setup
- Created full project structure (35 files)
- Repository pattern design for SQLite → Postgres migration
- Documentation complete

### Session 2: Database & API Foundation
**Decisions Made:**
1. **MVP Priority**: Task Manager API first, UI later
2. **Chrome History**: Manual import (CSV/JSON)
3. **Calendar**: Skip for v0, focus on tasks
4. **Search API**: Tavily (research) + Brave (general)
5. **UI Library**: shadcn/ui
6. **Use Case**: Research automation (e.g., "X 바이럴 포스트 분석")

**Key Changes:**
- Removed `better-sqlite3` (requires Visual Studio C++ tools on Windows)
- Using Supabase/Postgres from start (no migration needed later)
- Added `@supabase/supabase-js` package

**Files Updated/Created:**
```
backend/src/db/
├── supabase.ts                        # ✅ Supabase client setup
├── init.ts                            # ✅ Updated for Supabase
├── migrations/
│   └── 001_initial_schema.sql         # ✅ Full Postgres schema (9 tables)
├── migrate.ts                         # ✅ Migration runner
└── repositories/
    ├── base.repository.ts             # ✅ Updated for Supabase
    ├── task.repository.ts             # ✅ Full Supabase implementation
    ├── research-task.repository.ts    # (needs update)
    └── index.ts                       # ✅ Updated exports

docs/
└── API_SETUP.md                       # ✅ Step-by-step setup guide
```

**Current Status:**
✅ Supabase integration complete
✅ Task Repository fully implemented
✅ Migration SQL ready
⏳ **BLOCKER: Need Supabase credentials to test**

**Next Immediate Steps:**
1. ✅ Create Supabase project → Get credentials
2. ✅ Add to `backend/.env` file
3. **[NOW]** Run migrations via Supabase Dashboard SQL Editor
4. Start backend: `npm run dev`
5. Test API with curl/Postman
6. Verify task CRUD works

---

### Session 3: Async Updates & Architecture Decisions

**Key Decisions:**

1. **Projects Naming**: User creates + LLM suggests (hybrid approach)
   - User has full control
   - Agent can suggest grouping based on patterns

2. **Chrome History Format**: Extension exports with fields:
   - `order, id, date, time, title, url, visitCount, typedCount, transition`
   - Will add `typed_count` and `transition` to DB schema

3. **LLM Selection Strategy**: Agent D selects LLM based on task type
   - **Grok**: X/Twitter trends, viral posts, real-time data
   - **GPT-4**: Deep analysis, strategy, high-priority tasks
   - **Gemini**: Fast queries, multiple sources, comparisons
   - Rule-based selection in Agent C

4. **History Updates**: Asynchronous background job
   - **Automatic**: Daily at 3 AM (node-cron)
   - **Manual**: User can trigger anytime via API
   - Prevents blocking main app flow

**Files Added:**
```
backend/src/services/
├── history-update.service.ts    # Main update logic
├── scheduler.service.ts         # Cron job manager
└── chrome-import.service.ts     # CSV/JSON parser

backend/src/api/
└── history.routes.ts            # Manual trigger endpoint
```

**Architecture Pattern:**
```
User Activity → Chrome Extension Export
                     ↓
Daily 3AM (or manual trigger)
                     ↓
Import Service → browsing_history_raw
                     ↓
Agent A (Profiler) → browsing_profile
                   → recurring_patterns
                     ↓
Used by Agent D for research
```
