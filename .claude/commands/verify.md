---
command: verify
description: Verify current work in the monorepo
---

Verify the current work in this monorepo.

Rules:
- Detect which package(s) were modified (frontend/backend/agents/mcp-server/shared).
- For each modified package, run the most relevant verification commands (tests, typecheck/build).
- If a shared package changed, verify at least one downstream consumer package.

Output:
- Commands run + pass/fail
- If something fails: fix, then re-run until passing (unless blocked)
- Final summary of what is now verified

Constraints:
- Do not propose new features or refactors unrelated to verification.
- Focus only on making the current state pass.
