---
name: verify
description: Run full project verification — TypeScript, tests, and build. Use before committing or when checking if changes broke anything.
allowed-tools: Bash(npx tsc *) Bash(npm test) Bash(npm run build)
argument-hint: 
---

Run the full AlpacaLive verification pipeline:

1. **TypeScript check**: `npx tsc --noEmit` — must have 0 errors
2. **Tests**: `npm test` — all 297 tests must pass
3. **Build**: `npm run build` — must succeed

Report results clearly:
- ✅ if all 3 pass
- ❌ with the specific error if any fail

If tests fail, show which test file and assertion failed.
If TypeScript fails, show the file and error.
Do NOT attempt to fix anything — just report.
