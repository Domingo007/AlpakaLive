# AlpacaLive — AI Agent Guidelines / Wytyczne dla agentów AI

> This document defines rules for ALL AI coding assistants (Claude Code, Cursor, Copilot, GPT, Cline, etc.) working on this project. Violating these rules will break the application or compromise patient safety.

> Ten dokument definiuje zasady dla WSZYSTKICH asystentów AI (Claude Code, Cursor, Copilot, GPT, Cline, itp.) pracujących z tym projektem. Złamanie tych zasad zepsuje aplikację lub zagrozi bezpieczeństwu pacjentów.

---

## Agent-specific config files

| Tool | Config file | Auto-loaded? |
|------|-------------|-------------|
| Claude Code | `CLAUDE.md` | Yes |
| Cursor | `.cursorrules` | Yes |
| GitHub Copilot | `.github/copilot-instructions.md` | Yes |
| Other (GPT, Cline) | Paste this `AGENTS.md` as context | Manual |

---

## 5 UNBREAKABLE RULES

### 1. MEDICAL DATA = JSON FILES ONLY

```
✅ medical-knowledge/drugs/chemo-agents.json     ← Medical facts here
❌ src/lib/some-file.ts: const drugs = [...]      ← NEVER here
```

All medical knowledge lives in `medical-knowledge/` as `.json` files.
The app loads them via `src/lib/medical-data/knowledge-registry.ts`.

**To add a drug:** edit `medical-knowledge/drugs/<category>.json`
**To add a cancer:** copy `medical-knowledge/cancers/_template/` → fill JSONs
**To add norms:** edit `medical-knowledge/reference-ranges/<file>.json`

NEVER hardcode drug names, dosages, interactions, side effects, or reference ranges in TypeScript files.

### 2. PATIENT DATA = DEVICE ONLY

```
✅ IndexedDB (Dexie.js) on patient's phone
❌ Any external server, API, cloud storage
```

- All patient data stays in browser's IndexedDB — managed by `src/lib/db.ts`
- Before AI API calls: `src/lib/pii-sanitizer.ts` strips names, PESEL, phone, email, addresses
- NEVER add code that sends patient data externally
- NEVER add analytics, tracking pixels, third-party cookies

### 3. AI = ANALYZE ONLY, NEVER PRESCRIBE

The AI agent in this app has **absolute bans** defined in `src/lib/system-prompt.ts`:

```
❌ "You should take [drug]"
❌ "I recommend [treatment]"
❌ "Stop taking [medication]"
❌ "Your results are fine"

✅ "Value X is below reference range (source: ...)"
✅ "In published studies, [substance] was used for..."
✅ "Consider asking your doctor about..."
```

- Every medical analysis must end with a disclaimer
- NEVER weaken, remove, or bypass these constraints
- NEVER modify the ZABEZPIECZENIA (security) section of system-prompt.ts
- NEVER use the words **"predykcja" / "prognoza" / "przewidywanie" / "prediction" / "forecast"** — regulatory: triggers MDR/FDA medical-device definitions. Use "analiza wzorców" / "pattern analysis" / "wzorzec" / "porównanie z baseline" instead.

### 4. SECURITY LAYERS — DO NOT WEAKEN

```
Layer 1: src/lib/input-guard.ts
  → 20+ prompt injection patterns (EN + PL)
  → Message length limit (3000 chars)
  → File validation (10MB, MIME whitelist)
  → Rate limiting (2s between messages)
  → Data extraction field whitelist

Layer 2: src/lib/system-prompt.ts
  → Anti-manipulation section (top priority)
  → Topic scope enforcement (oncology only)
  → Image injection defense

Layer 3: src/lib/pii-sanitizer.ts
  → Bidirectional PII stripping

Layer 4: Data extraction whitelist in input-guard.ts
  → Only whitelisted fields can be written to DB from AI response
```

NEVER remove patterns from input-guard.ts.
NEVER weaken system prompt protections.
NEVER bypass PII sanitizer.
If adding new DB fields → add to `ALLOWED_FIELDS` in input-guard.ts.

### 5. DEMO = SEPARATE DATABASE

```
AlpacaLiveDB      ← Real user data (NEVER touched by demo)
AlpacaLiveDemoDB   ← Demo data (separate IndexedDB)
```

Demo mode uses a completely separate IndexedDB database.
The `db` export in `src/lib/db.ts` switches between them.
NEVER modify user's database when entering/exiting demo.

---

## Project Structure

```
src/
├── components/          ← React UI components
│   ├── chat/            ← AI conversation
│   ├── notebook/        ← Manual entry forms (daily, blood, chemo, RT, immuno, hormonal)
│   ├── calendar/        ← Calendar view
│   ├── data/            ← Analytics dashboard
│   ├── imaging/         ← Medical imaging
│   ├── education/       ← Patient education (loaded from JSON)
│   ├── settings/        ← Settings, devices, backup, feedback
│   ├── onboarding/      ← First-time setup
│   └── shared/          ← Reusable components (Card, Icon, Header, TabBar)
├── lib/                 ← Business logic
│   ├── medical-data/    ← Bridge between code and JSON medical data
│   ├── devices/         ← Device data import (Apple Health, Android, CSV)
│   └── *.ts             ← Core modules (db, ai, system-prompt, etc.)
├── hooks/               ← React hooks (useChat, useDatabase, useOnboarding)
├── types/               ← TypeScript types (index.ts)
├── __tests__/           ← Vitest tests (327)
└── lib/translations/    ← i18n (pl.ts, en.ts)

medical-knowledge/       ← MEDICAL DATA (JSON only, doctors edit this)
├── cancers/             ← Cancer types (breast/, _template/)
├── drugs/               ← Drug database (6 categories + interactions)
├── supplements/         ← Evidence-based supplements
├── radiotherapy/        ← RT protocols + side effects
├── surgery/             ← Procedures + recovery
├── reference-ranges/    ← Blood markers, tumor markers, vitals
├── medical-terms/       ← Terminology PL/EN/DE
└── patient-experience/  ← Anonymous patient patterns
```

---

## Tech Stack

| What | Technology |
|------|-----------|
| Framework | React 19 + TypeScript 6 |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| Database | Dexie.js (IndexedDB) |
| AI | Anthropic Claude / OpenAI / Gemini |
| Tests | Vitest (327 tests) |
| PWA | vite-plugin-pwa |
| Hosting | Vercel |

---

## Before Every Change

```bash
npx tsc --noEmit    # TypeScript — 0 errors required
npm test            # Vitest — all 327 tests must pass
npm run build       # Vite build — must succeed
```

---

## Code Conventions

| Convention | Rule |
|-----------|------|
| Components | Functional, with hooks. `src/components/<feature>/<Name>.tsx` |
| UI text | Always via `useI18n()` hook, never hardcoded strings |
| Icons | `<Icon name="..." />` from `@/components/shared/Icon` (Material Symbols) |
| Sections | `<Card title="...">` from `@/components/shared/Card` |
| DB access | Via `db` from `@/lib/db` |
| Medical data | Via `@/lib/medical-data/knowledge-registry` |
| Path alias | `@/` → `./src/` |
| Translations | `src/lib/translations/pl.ts` (source of truth), `en.ts` (must match shape) |

---

## Commit Convention

```
Type: short description (#issue-number)
```

| Type | When |
|------|------|
| `Feat:` | New feature |
| `Fix:` | Bug fix |
| `Medical:` | Medical data change (JSON) |
| `Docs:` | Documentation |
| `Test:` | Tests |
| `Security:` | Security fix |
| `Chore:` | Maintenance |
| `Legal:` | Legal/disclaimer change |

---

## Common Mistakes to Avoid

| Mistake | Why it's wrong | Correct approach |
|---------|---------------|-----------------|
| Hardcoding drug info in .ts | Doctors can't edit TypeScript | Put in medical-knowledge/*.json |
| `fetch()` sending patient data | Privacy violation | Use PII sanitizer first |
| Removing input-guard patterns | Opens prompt injection attacks | Only ADD patterns, never remove |
| Using `h-screen` for layout | Breaks on iOS PWA (dynamic viewport) | Use `100dvh` |
| Spreading AI response into DB | Injection risk | Use `sanitizeExtractedData()` whitelist |
| Modifying user DB in demo mode | Data loss risk | Use separate AlpacaLiveDemoDB |
| Adding `console.log` | Leaks to production | Remove before commit |
| Ignoring test failures | Regressions ship | Fix tests before committing |
| Editing Dexie schema without version bump | Breaks existing installations | Bump `this.version(N+1)` + add `.upgrade()` migrating records; keep historic version blocks; test in DevTools |
| Mixing rule logic, Dexie reads, and React in one file | Untestable, coupled | Split into 3 files: `<feature>-engine.ts` (pure), `<feature>-adapter.ts` (Dexie bridge), `<Feature>Tile.tsx` (UI). See hydration-engine.ts as reference. |
| Throwing when a data source is missing | Crashes tile for real patients | Engine must handle `undefined` fields gracefully; UI shows nudge ("Connect Withings") instead of error |
| Adding `@testing-library/react` to test a tile | Unapproved dep | Test logic in engine + adapter (pure + mockable Dexie); verify UI manually via `npm run dev` |
