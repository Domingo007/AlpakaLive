# AlpacaLive — Claude Code Instructions

## Project
Open-source PWA oncology diary for cancer patients. React 19 + TypeScript + Vite + Dexie (IndexedDB). Bilingual PL/EN.

## Architecture Rules — NEVER VIOLATE

### 1. Medical data lives ONLY in `medical-knowledge/` as JSON
- NEVER hardcode medical facts (drugs, norms, interactions, side effects) in TypeScript
- Application code imports from `src/lib/medical-data/knowledge-registry.ts` which loads JSONs
- To add a drug → edit `medical-knowledge/drugs/*.json`
- To add a cancer type → copy `medical-knowledge/cancers/_template/`

### 2. Patient data is LOCAL ONLY
- All patient data in IndexedDB (Dexie) — NEVER sent to any server
- PII sanitizer (`src/lib/pii-sanitizer.ts`) strips personal data before AI API calls
- NEVER add analytics, tracking, cookies, or external data collection

### 3. AI NEVER suggests — only explains
- System prompt in `src/lib/system-prompt.ts` has ABSOLUTE BANS
- AI must NEVER say "you should take", "I recommend", "stop taking"
- AI CAN: analyze data, compare with published norms, show trends, suggest questions for doctor
- Every medical analysis MUST end with disclaimer
- NEVER weaken these constraints

### 4. Security layers — NEVER weaken
- `src/lib/input-guard.ts` — prompt injection detection, file validation, rate limiting
- System prompt anti-jailbreak section — must remain at top priority
- Data extraction whitelist — only whitelisted fields can be written to DB from AI response
- NEVER bypass input-guard, NEVER remove injection patterns

### 5. Dual database for demo
- `AlpacaLiveDB` = real user data (NEVER touched by demo)
- `AlpacaLiveDemoDB` = demo data (separate IndexedDB, created/deleted on demand)
- Demo switch via `localStorage` flag + `db` pointer in `src/lib/db.ts`

## Tech Stack
- React 19, TypeScript 6, Vite 8, Tailwind CSS 4
- Dexie.js (IndexedDB wrapper)
- Vitest (297 tests in `src/__tests__/`)
- PWA via vite-plugin-pwa

## File Conventions
- Components: `src/components/<feature>/<Name>.tsx`
- Business logic: `src/lib/<module>.ts`
- Types: `src/types/index.ts`
- Tests: `src/__tests__/<module>.test.ts`
- Medical data: `medical-knowledge/<category>/<file>.json`
- Translations: `src/lib/translations/pl.ts`, `en.ts`

## Before Making Changes
1. Run `npx tsc --noEmit` — must pass with 0 errors
2. Run `npm test` — all 297 tests must pass
3. Run `npm run build` — must succeed
4. If adding medical data → put in `medical-knowledge/` JSON, not in TypeScript
5. If modifying AI behavior → check `system-prompt.ts` constraints are preserved
6. If adding new DB fields → add to `input-guard.ts` ALLOWED_FIELDS whitelist

## Commit Messages
```
Type: description (#issue)
Types: Feat, Fix, Medical, Docs, Style, Refactor, Test, Chore, Security, Legal
```

## Key Files
| Purpose | File |
|---------|------|
| Database | `src/lib/db.ts` (Dexie, dual DB) |
| AI messages | `src/lib/ai.ts` |
| System prompt | `src/lib/system-prompt.ts` |
| PII filter | `src/lib/pii-sanitizer.ts` |
| Security | `src/lib/input-guard.ts` |
| Treatment phases | `src/lib/treatment-cycle.ts` |
| Pattern analysis | `src/lib/pattern-engine.ts` |
| Medical data loader | `src/lib/medical-data/knowledge-registry.ts` |
| Disease matcher | `src/lib/medical-data/disease-matcher.ts` |
| Types | `src/types/index.ts` |
| Tests | `src/__tests__/*.test.ts` |

## Do NOT
- Add `console.log` to production code
- Add new npm dependencies without justification
- Modify `medical-knowledge/` structure without updating `knowledge-registry.ts`
- Create files outside established directory structure
- Add features beyond what was asked — no scope creep
- Add comments/docstrings to code you didn't change
- Change Dexie schema without bumping `this.version(N)` and adding `.upgrade()` — always preserve historic version stores so existing installations can migrate forward. Test migration manually in DevTools before merge. Note: IndexedDB shows `version * 10` (Dexie quirk — `this.version(4)` appears as `40` in DevTools)
