# AlpacaLive — GitHub Copilot Instructions

## Project Context
Open-source PWA oncology diary for cancer patients. React 19 + TypeScript + Vite + Tailwind CSS + Dexie.js (IndexedDB). Bilingual PL/EN.

## Architecture Constraints

### Medical data is JSON, not TypeScript
All medical knowledge (drugs, interactions, norms, side effects, cancer profiles) lives in `medical-knowledge/` folder as `.json` files. The app loads them via `src/lib/medical-data/knowledge-registry.ts`. Never hardcode medical facts in TypeScript.

### Patient data is local-only
All patient data stays in IndexedDB on the device. Never suggest code that sends patient data to external servers. PII sanitizer (`src/lib/pii-sanitizer.ts`) must strip personal data before AI API calls.

### AI explains, never suggests
The AI agent analyzes data and compares with published norms. It must NEVER recommend treatments, drugs, or dosages. System prompt in `src/lib/system-prompt.ts` has explicit bans. Never weaken these.

### Security is layered
- `src/lib/input-guard.ts` — prompt injection detection, file validation, rate limiting
- System prompt has anti-jailbreak section
- Data extraction uses field whitelists per data type
- Never bypass or weaken any security layer

### Demo uses separate database
Two IndexedDB databases: AlpacaLiveDB (user) and AlpacaLiveDemoDB (demo). User data is never touched during demo mode.

## Code Style
- Functional React components with hooks
- TypeScript strict mode
- Tailwind CSS for styling (no CSS modules)
- Path alias: `@/` → `./src/`
- Tests in `src/__tests/` using Vitest

## When Generating Code
- Check `src/types/index.ts` for existing types before creating new ones
- Use `useI18n()` hook for all user-facing text
- Use `Icon` component from `@/components/shared/Icon` for Material Symbols
- Use `Card` component from `@/components/shared/Card` for sections
- Medical data → import from `@/lib/medical-data/knowledge-registry`
- Database operations → use `db` from `@/lib/db`
