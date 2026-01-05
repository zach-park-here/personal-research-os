---
command: plan-pr
description: Create a PR-level execution plan before coding
---

You are in a monorepo.

Task:
$ARGUMENTS

IMPORTANT RULES:
- Do NOT edit any files yet.
- First determine which package(s) are involved (frontend/backend/agents/mcp-server/shared).
- List exact files you plan to touch.
- Keep scope minimal and execution-oriented.

Output format:
1) Scope
   - What will change
   - What will NOT change

2) Packages involved

3) Files to read first

4) Implementation plan
   - Step-by-step
   - Each step must be small and concrete

5) Verification plan
   - Exact commands to run per package

6) Risks / rollback plan

Constraints:
- Do not propose refactors or architecture changes unless strictly required.
- No strategy discussion. Focus on this task only.

Ask for approval before coding.
