---
name: add-test
description: Add tests for a module or function. Use when new code was added without tests or when test coverage needs improvement.
argument-hint: [module-name or file-path]
allowed-tools: Bash(npx vitest *)
---

Add tests for $ARGUMENTS in the AlpacaLive test suite.

## Rules
1. Tests go in `src/__tests__/<module-name>.test.ts`
2. Use Vitest: `import { describe, it, expect } from 'vitest'`
3. Import from `@/lib/...` or `@/components/...` using path alias
4. Test both happy paths AND edge cases
5. For security-related code: test that attacks are blocked AND legitimate use is allowed

## Steps

1. **Read the source file** to understand what it exports and how it works

2. **Check existing tests** in `src/__tests__/` to match the project's testing style

3. **Write tests** covering:
   - All exported functions
   - Normal inputs (happy path)
   - Edge cases (empty, null, boundary values)
   - Error cases (invalid input, missing data)
   - For security code: injection attempts that should be blocked

4. **Run tests**: `npx vitest run` — all must pass (including new ones)

5. **Report**: How many tests were added and what they cover

## Existing test files (for style reference)
- `src/__tests__/input-guard.test.ts` — 53 tests (security, validation)
- `src/__tests__/treatment-cycle.test.ts` — 25 tests (phase calculation)
- `src/__tests__/disease-matcher.test.ts` — 18 tests (diagnosis matching)
- `src/__tests__/blood-norms.test.ts` — 20 tests (marker evaluation)
- `src/__tests__/pii-sanitizer.test.ts` — 17 tests (PII stripping)
- `src/__tests__/content-utils.test.ts` — 7 tests (localization)
- `src/__tests__/device-import.test.ts` — 17 tests (device data parsing)

## Do NOT
- Mock things unnecessarily — test real logic
- Test implementation details — test behavior
- Skip edge cases — they catch real bugs
