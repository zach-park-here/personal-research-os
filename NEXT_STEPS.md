# 🎯 Next Steps - Ready to Run!

## Current Status

✅ **Backend완성**
- Supabase 연동 코드 완료
- Task Repository 구현 완료
- Task API 엔드포인트 준비 완료
- Database schema (9 tables) 준비 완료

⏳ **필요한 것: Supabase 계정 & credentials만 있으면 바로 실행 가능**

---

## 🚀 시작하기 (10분)

### 1. Supabase 프로젝트 생성

1. https://supabase.com 접속
2. Sign up (GitHub 계정으로 빠르게 가능)
3. "New Project" 클릭
4. 입력:
   - Name: `personal-research-os`
   - Database Password: 강력한 비밀번호 생성 (저장해두기!)
   - Region: `Northeast Asia (Seoul)` 또는 가까운 곳
5. "Create new project" 클릭 (2분 소요)

### 2. Credentials 복사

프로젝트 생성 완료 후:

1. Settings (⚙️ 아이콘) → API
2. 다음 값들 복사:

```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGc...
service_role key: eyJhbGc... (⚠️ 이걸 사용! 비밀로 유지)
```

### 3. .env 파일 설정

```bash
# 터미널에서
cd C:\Users\mario\personal-research-os\backend
copy .env.example .env
notepad .env  # 또는 VSCode로 열기
```

`backend/.env` 파일에 붙여넣기:
```bash
PORT=3000
NODE_ENV=development

# Supabase (여기에 복사한 값 붙여넣기)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # ← 이걸 사용!

# OpenAI (나중에)
OPENAI_API_KEY=

# MCP Server (나중에)
MCP_SERVER_URL=http://localhost:3001
```

### 4. Database Migration

**Supabase Dashboard에서 실행 (권장):**

1. Supabase Dashboard → **SQL Editor**
2. "New Query" 클릭
3. `backend/src/db/migrations/001_initial_schema.sql` 파일 내용 **전체 복사**
4. 붙여넣기
5. "Run" 클릭 ▶️
6. "Success. No rows returned" 보이면 완료!

**확인:**
- Table Editor → 9개 테이블 보여야 함 (tasks, projects, calendar_events, 등)

### 5. 백엔드 실행

```bash
cd C:\Users\mario\personal-research-os\backend
npm run dev
```

**성공 메시지:**
```
✓ Supabase connection initialized
✓ Database initialized
✓ Orchestrator started
✓ Server running on http://localhost:3000
```

### 6. API 테스트

**Health Check:**
```bash
curl http://localhost:3000/health
```

**Task 생성:**
```bash
curl -X POST http://localhost:3000/api/tasks ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"user_123\",\"title\":\"X 바이럴 포스트 분석\",\"description\":\"최근 productivity SaaS 데모 영상 포스트 찾기\",\"priority\":\"high\",\"tags\":[\"research\",\"viral\"]}"
```

**Task 목록 조회:**
```bash
curl http://localhost:3000/api/tasks?userId=user_123
```

---

## 📝 작동 확인 체크리스트

- [ ] Supabase 프로젝트 생성
- [ ] .env 파일에 credentials 추가
- [ ] SQL migration 실행 (9개 테이블 생성)
- [ ] 백엔드 실행 성공
- [ ] Health check 응답 확인
- [ ] Task 생성 성공
- [ ] Task 조회 성공

**모두 ✅ 이면 백엔드 완료!**

---

## 🎯 백엔드 완료 후 다음 단계

### Phase 2A: Frontend (우선순위 높음)
1. Frontend 패키지 dependencies 설치
2. shadcn/ui 설정
3. Task List 컴포넌트
4. Task Detail 컴포넌트
5. API 연동

### Phase 2B: Chrome History Import
1. CSV/JSON export 스크립트
2. Import endpoint 구현
3. Agent A (Profiler) 구현

### Phase 2C: Research Agents
1. Agent C (Planner) 구현
2. Tavily API 연동
3. Agent D (Research Executor) 구현
4. Research Panel UI

---

## 🐛 문제 해결

### "Missing Supabase credentials"
→ `.env` 파일이 `backend/` 폴더에 있는지 확인
→ `SUPABASE_SERVICE_ROLE_KEY` 설정했는지 확인

### "relation does not exist"
→ Migration을 실행했는지 확인
→ Supabase Dashboard → Table Editor에서 테이블 확인

### npm run dev 실행 안됨
→ `backend/` 폴더에서 실행하는지 확인
→ `npm install` 먼저 실행

---

## 📚 참고 문서

- [docs/API_SETUP.md](docs/API_SETUP.md) - 상세 setup 가이드
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - 시스템 설계
- [docs/REPOSITORY_PATTERN.md](docs/REPOSITORY_PATTERN.md) - DB 패턴
- [PROJECT_STATUS.md](PROJECT_STATUS.md) - 현재 상태 & 히스토리

---

**질문이나 문제가 있으면 말씀해주세요!** 🚀
