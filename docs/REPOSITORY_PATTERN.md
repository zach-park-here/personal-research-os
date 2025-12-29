# Repository Pattern

## Overview

The backend uses the **Repository Pattern** to abstract all database access. This design ensures that migrating from SQLite to Postgres (e.g., Supabase) requires changing only the repository implementations, not the API layer, agents, or business logic.

## Key Principles

1. **No Direct Database Access**
   - API handlers NEVER access the database directly
   - Agents NEVER access the database directly
   - ALL database operations go through repositories

2. **Domain-Level Methods Only**
   - Repositories expose clean, domain-level methods
   - Examples: `createTask()`, `listTasksForToday()`, `saveResearchResult()`
   - NOT: `query()`, `execute()`, raw SQL strings

3. **Postgres-Compatible Design**
   - UTC timestamps everywhere
   - JSON fields (will become jsonb in Postgres)
   - Avoid SQLite-specific features
   - Use standard SQL where possible

4. **Easy Migration Path**
   - Change database connection in `repositories/index.ts`
   - Update repository base class
   - API layer remains unchanged

## Architecture

```
API Handler
    ↓
Repository (abstraction layer)
    ↓
Database (SQLite now, Postgres later)
```

## Example: Task Repository

```typescript
// ✅ GOOD: Domain-level method
const task = await taskRepo.create({
  userId: 'user_123',
  title: 'Implement feature X',
  dueDate: '2025-01-15T10:00:00Z',
});

// ❌ BAD: Raw SQL in API handler
db.exec('INSERT INTO tasks ...');
```

## Repository Structure

### Base Repository

All repositories extend `BaseRepository`:

```typescript
// backend/src/db/repositories/base.repository.ts
export abstract class BaseRepository {
  protected db: Database.Database; // SQLite now

  // When migrating to Postgres:
  // protected db: SupabaseClient;

  protected execute(sql: string, params: any[]): any;
  protected get<T>(sql: string, params: any[]): T | undefined;
  protected all<T>(sql: string, params: any[]): T[];
}
```

### Concrete Repositories

Each domain entity has its own repository:

```typescript
// backend/src/db/repositories/task.repository.ts
export class TaskRepository extends BaseRepository {
  async create(task: CreateTaskDTO): Promise<Task>;
  async findById(id: string): Promise<Task | null>;
  async listByUser(userId: string): Promise<Task[]>;
  async listDueSoon(userId: string, hours: number): Promise<Task[]>;
  async update(id: string, updates: UpdateTaskDTO): Promise<Task>;
  async delete(id: string): Promise<void>;
}
```

## Using Repositories in API Handlers

```typescript
// backend/src/api/tasks.routes.ts
import { getRepositories } from '../db/repositories';

tasksRouter.post('/', async (req, res) => {
  const { tasks } = getRepositories(); // Get repository
  const newTask = await tasks.create(req.body); // Use domain method
  res.json(newTask);
});
```

## Using Repositories in Orchestrator

```typescript
// backend/src/orchestrator/triggers.ts
import { getRepositories } from '../db/repositories';

async function onTaskCreated(taskId: string) {
  const { tasks, researchTasks } = getRepositories();

  const task = await tasks.findById(taskId);
  // ... call agent library
  // ... save research tasks
  await researchTasks.create(researchTask);
}
```

## Migration Path: SQLite → Postgres

### Step 1: Update Database Connection

```typescript
// backend/src/db/repositories/index.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export function getRepositories() {
  return {
    tasks: new TaskRepository(supabase),
    researchTasks: new ResearchTaskRepository(supabase),
  };
}
```

### Step 2: Update Base Repository

```typescript
// backend/src/db/repositories/base.repository.ts
export abstract class BaseRepository {
  protected db: SupabaseClient; // Changed from Database.Database

  protected async execute(sql: string, params: any[]) {
    // Use Supabase client instead of SQLite
    return this.db.rpc('exec_sql', { sql, params });
  }
}
```

### Step 3: Update Repository Implementations

```typescript
// backend/src/db/repositories/task.repository.ts
async create(task: CreateTaskDTO): Promise<Task> {
  // Before (SQLite):
  // const sql = 'INSERT INTO tasks ...';
  // this.execute(sql, [...]);

  // After (Postgres/Supabase):
  const { data, error } = await this.db
    .from('tasks')
    .insert(task)
    .select()
    .single();

  if (error) throw error;
  return this.mapRowToTask(data);
}
```

### Step 4: No Changes Needed

API handlers, agents, orchestrator - all remain unchanged!

## Benefits

1. **Testability**: Mock repositories easily in tests
2. **Type Safety**: TypeScript interfaces for all operations
3. **Maintainability**: Database logic in one place
4. **Flexibility**: Swap databases without touching business logic
5. **Domain-Driven**: API works with domain objects, not SQL

## Rules

❌ **NEVER do this:**
```typescript
// In API handler
db.exec('SELECT * FROM tasks WHERE id = ?', [id]);
```

✅ **ALWAYS do this:**
```typescript
// In API handler
const task = await taskRepo.findById(id);
```

❌ **NEVER expose raw SQL:**
```typescript
// In repository
async query(sql: string): Promise<any>;
```

✅ **ALWAYS expose domain methods:**
```typescript
// In repository
async listActiveTasksByUser(userId: string): Promise<Task[]>;
```

## Repository Checklist

When creating a new repository:

- [ ] Extends `BaseRepository`
- [ ] All methods return domain objects (not raw rows)
- [ ] No SQL exposed outside the repository
- [ ] Uses UTC timestamps
- [ ] Uses JSON for complex fields
- [ ] Compatible with Postgres
- [ ] Has TypeScript types for all inputs/outputs
- [ ] Includes error handling

## Example Repositories

See:
- [task.repository.ts](../backend/src/db/repositories/task.repository.ts)
- [research-task.repository.ts](../backend/src/db/repositories/research-task.repository.ts)

Create similar patterns for:
- `project.repository.ts`
- `calendar-event.repository.ts`
- `browsing-profile.repository.ts`
- `research-result.repository.ts`
- `task-insight.repository.ts`
