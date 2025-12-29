# API Setup Guide

## 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click "New Project"
4. Fill in:
   - Name: `personal-research-os`
   - Database Password: (generate strong password)
   - Region: Choose closest to you
5. Click "Create new project" (takes ~2 minutes)

## 2. Get Credentials

Once project is created:

1. Go to Project Settings (gear icon)
2. Click "API" in sidebar
3. Copy these values:

```
Project URL: https://xxxxx.supabase.co
anon key: eyJhbGc...
service_role key: eyJhbGc... (⚠️ Keep secret!)
```

## 3. Setup Environment

1. Create `.env` file in backend folder:
```bash
cd backend
cp .env.example .env
```

2. Edit `backend/.env`:
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # Use this for backend
```

## 4. Run Migrations

### Option A: Via Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard → SQL Editor
2. Copy entire content from `backend/src/db/migrations/001_initial_schema.sql`
3. Paste and click "Run"
4. Should see "Success. No rows returned"

### Option B: Via Script (If exec_sql RPC is enabled)

```bash
npm run db:migrate
```

## 5. Verify Tables Created

1. Go to Supabase Dashboard → Table Editor
2. Should see 9 tables:
   - tasks
   - projects
   - calendar_events
   - browsing_history_raw
   - browsing_profile
   - recurring_patterns
   - research_tasks
   - research_results
   - task_insights

## 6. Start Backend

```bash
npm run dev
```

Should see:
```
✓ Supabase connection initialized
✓ Database initialized
✓ Orchestrator started
✓ Server running on http://localhost:3000
```

## 7. Test API

### Health Check
```bash
curl http://localhost:3000/health
```

### Create Task
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "title": "X 바이럴 포스트 분석",
    "description": "최근 productivity SaaS 데모 영상 포스트 찾기",
    "priority": "high",
    "dueDate": "2025-12-20T10:00:00Z",
    "tags": ["research", "viral", "saas"]
  }'
```

### List Tasks
```bash
curl http://localhost:3000/api/tasks?userId=user_123
```

## Troubleshooting

### "Missing Supabase credentials"
- Check `.env` file exists in `backend/` folder
- Verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
- Restart backend server

### "relation does not exist"
- Tables not created yet
- Run migrations via Supabase SQL Editor

### "Could not connect to database"
- Check internet connection
- Verify Supabase URL is correct
- Check Supabase project is active (not paused)

## Next Steps

Once API is working:
1. Test all CRUD operations
2. Implement frontend
3. Add Chrome history import
4. Connect agents
