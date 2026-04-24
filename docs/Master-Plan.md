# AlpacaLive — Master Plan & Development Guidelines

## Author: Dominik Gaweł | Gravity Design
## Document version: 2.0 | Date: 2026-04-12
## Wersja polska poniżej | Polish version below

---

# GOVERNING PRINCIPLE

One repo. Clear structure. Two types of contributors (code vs medical data) with separate processes. No change reaches `main` without review. No medical data is hardcoded in application code — everything from JSON files in `medical-knowledge/`.

---

# 1. REPO STRUCTURE — WHAT GOES WHERE

```
alpacalive/
│
├── .github/                          ← GitHub config
│   ├── ISSUE_TEMPLATE/
│   │   └── medical_data.md           ← Template for medical data issues
│   └── CODEOWNERS                    ← Separate reviewers: code vs medical
│
├── src/                              ← APPLICATION CODE (developers only)
│   ├── components/                   ← React components (UI)
│   │   ├── chat/                     ← AI chat interface
│   │   ├── notebook/                 ← Manual entry forms (daily, blood, chemo, RT, immuno, hormonal)
│   │   ├── calendar/                 ← Calendar view
│   │   ├── data/                     ← Analytics dashboard
│   │   ├── imaging/                  ← Medical imaging
│   │   ├── education/                ← Patient education (from JSON)
│   │   ├── settings/                 ← Settings, devices, backup, feedback
│   │   ├── onboarding/               ← First-time setup
│   │   └── shared/                   ← Reusable UI components
│   ├── lib/                          ← Business logic
│   │   ├── medical-data/             ← JSON loader bridge (code ↔ JSON)
│   │   │   ├── knowledge-registry.ts ← Imports all JSONs from medical-knowledge/
│   │   │   ├── knowledge-types.ts    ← TypeScript types for JSON schemas
│   │   │   ├── disease-matcher.ts    ← Matches diagnosis text → disease profile
│   │   │   ├── content-utils.ts      ← localized() helper for bilingual content
│   │   │   ├── bundled-blood-norms.ts← Re-exports blood norms from JSON
│   │   │   ├── bundled-cyp450.ts     ← Merges CYP450 from all drug JSONs
│   │   │   ├── loader.ts            ← CDN cache layer (future)
│   │   │   └── types.ts             ← BloodMarkerNorm, CYP450Profile types
│   │   ├── devices/                  ← Device data import (Apple Health, Android, CSV)
│   │   ├── ai.ts                     ← AI message handling + PII sanitization
│   │   ├── ai-provider.ts           ← Multi-model (Claude/GPT/Gemini)
│   │   ├── auto-backup.ts           ← File System Access backup
│   │   ├── blood-norms.ts           ← evaluateMarker() using JSON data
│   │   ├── calendar-events.ts       ← Calendar event builder
│   │   ├── cyp450.ts                ← checkInteractions() using JSON data
│   │   ├── db.ts                    ← Dexie.js IndexedDB (dual DB for demo)
│   │   ├── demo-data.ts            ← Demo mode data generator
│   │   ├── input-guard.ts          ← Prompt injection detection + rate limiting
│   │   ├── pii-sanitizer.ts        ← PII removal before AI calls
│   │   ├── pattern-engine.ts       ← 5-day wellbeing pattern summary
│   │   ├── system-prompt.ts        ← AI system prompt (reads from JSON)
│   │   └── treatment-cycle.ts      ← Generic treatment phase system
│   ├── hooks/                       ← React hooks
│   ├── types/                       ← TypeScript type definitions
│   └── __tests__/                   ← Test suite (Vitest, 327 tests)
│
├── medical-knowledge/               ← MEDICAL DATA (doctors, pharmacists, patients)
│   ├── cancers/                     ← Cancer types (one folder per cancer)
│   │   ├── _template/               ← Template for new cancer type
│   │   └── breast/                  ← Breast cancer (reference implementation)
│   ├── drugs/                       ← Drug database (chemo, immuno, targeted, hormonal, psychiatric)
│   │   └── interactions/            ← CYP450 matrix, serotonin risk
│   ├── supplements/                 ← Supplements with evidence levels
│   ├── radiotherapy/               ← RT protocols + side effects by region
│   ├── surgery/                    ← Procedures + recovery timelines
│   ├── reference-ranges/           ← Blood markers, tumor markers, vitals
│   ├── medical-terms/              ← Medical terminology (PL/EN/DE)
│   ├── patient-experience/         ← Anonymous patient patterns
│   ├── CONTRIBUTING-MEDICAL.md     ← How to add medical data
│   ├── REVIEW-PROCESS.md          ← Medical review process
│   └── README.md
│
├── docs/                           ← Project documentation
├── public/                         ← Static assets (logo, icons)
├── LICENSE                         ← AGPL-3.0
├── DISCLAIMER.md
├── TERMS.md
└── SECURITY.md
```

### RULE: Where to add what

| You want to add... | Folder | Format | Review |
|---|---|---|---|
| New UI component | `src/components/` | .tsx | code-review |
| New business logic | `src/lib/` | .ts | code-review |
| New drug / interaction | `medical-knowledge/drugs/` | .json | medical-review |
| New cancer type | `medical-knowledge/cancers/new/` | .json | medical-review |
| Patient experience | `medical-knowledge/patient-experience/` | .json | anonymity-check |
| Lab reference ranges | `medical-knowledge/reference-ranges/` | .json | medical-review |
| Medical terminology | `medical-knowledge/medical-terms/` | .json | translation-review |
| Supplement data | `medical-knowledge/supplements/` | .json | medical-review |
| Documentation | `docs/` | .md | any-review |

**VIOLATION = PR rejected.** Medical data in `src/` → rejected. App code in `medical-knowledge/` → rejected.

---

# 2. BRANCHING — GIT WORKFLOW

```
main                          ← Production. Always stable. Vercel deploy.
  │
  ├── develop                 ← Development branch. All PRs merge here.
  │     │
  │     ├── feature/calendar-improvements
  │     ├── feature/withings-integration
  │     ├── fix/dark-mode-toggle
  │     ├── medical/add-lung-cancer
  │     ├── medical/update-drug-interactions
  │     ├── docs/translate-terms-de
  │     └── chore/update-dependencies
  │
  └── release/v2.1.0          ← Release branch (develop → main)
```

### Branch naming

| Prefix | Who | What |
|---|---|---|
| `feature/` | Developer | New app feature |
| `fix/` | Developer | Bug fix |
| `medical/` | Doctor / patient / pharmacist | Medical data change |
| `docs/` | Anyone | Documentation, translations |
| `chore/` | Developer | Maintenance, deps, CI |
| `release/` | Maintainer (Dominik) | New version preparation |

### Flow

```
1. Create branch from develop:
   git checkout develop && git pull
   git checkout -b feature/feature-name

2. Work, commit:
   git add relevant-files
   git commit -m "Type: description (#issue)"

3. Push and PR to develop:
   git push origin feature/feature-name
   → Open PR to develop (NOT to main!)

4. Review + merge to develop

5. When develop is stable → release:
   git checkout -b release/v2.1.0 develop
   → Final tests → Merge to main + tag → Production deploy
```

### Who merges

| Branch | Who can merge |
|---|---|
| `feature/*`, `fix/*`, `chore/*` → develop | Maintainer after code-review |
| `medical/*` → develop | Maintainer after medical-review |
| `develop` → `main` (release) | ONLY maintainer (Dominik) |

---

# 3. COMMIT MESSAGES

```
Type: short description (#issue-number)
```

| Type | Meaning |
|---|---|
| `Feat:` | New feature |
| `Fix:` | Bug fix |
| `Medical:` | Medical data change |
| `Docs:` | Documentation |
| `Style:` | Visual changes (CSS, UI) |
| `Refactor:` | Code refactoring (no behavior change) |
| `Test:` | Add/fix tests |
| `Chore:` | Maintenance (deps, CI, config) |
| `Security:` | Security fixes (prompt injection, PII, input guard) |
| `Legal:` | Legal changes (disclaimer, license) |

---

# 4. VERSIONING — SEMVER

Format: `MAJOR.MINOR.PATCH`

| Change | Example | Version |
|---|---|---|
| New cancer type (major medical addition) | Add lung cancer | 2.1.0 → 2.2.0 |
| New UI feature | Calendar improvements | 2.0.0 → 2.1.0 |
| Bug fix | Fix alert threshold | 2.1.0 → 2.1.1 |
| Medical data update | New drug, interaction | 2.1.0 → 2.1.1 |
| Breaking change (DB schema, API) | New database version | 2.x.x → 3.0.0 |

---

# 5. WHAT'S BUILT — CURRENT STATUS (v2.0)

| Feature | Status | Version |
|---|---|---|
| Core app (React 19 + Vite + Dexie) | ✅ Done | 1.0 |
| Legal protection (disclaimers, AI constraints) | ✅ Done | 1.0 |
| AGPL-3.0 license | ✅ Done | 1.0 |
| Multi-model AI (Claude/GPT/Gemini) | ✅ Done | 1.0 |
| PII Sanitizer | ✅ Done | 1.0 |
| Multilingual (PL/EN) | ✅ Done | 1.0 |
| Breast cancer subtypes + biomarkers | ✅ Done | 1.0 |
| Radiotherapy tracking (forms + phases) | ✅ Done | 2.0 |
| Immunotherapy tracking (irAE) | ✅ Done | 2.0 |
| Hormonal therapy tracking | ✅ Done | 2.0 |
| Calendar (month/year picker, today) | ✅ Done | 1.0 |
| Medical data separation (JSON) | ✅ Done | 2.0 |
| Drug database (7 chemo, 3 immuno, 3 targeted, 3 hormonal, 5 psychiatric) | ✅ Done | 2.0 |
| CYP450 interactions matrix | ✅ Done | 2.0 |
| Supplements with evidence levels | ✅ Done | 2.0 |
| Surgery procedures + recovery | ✅ Done | 2.0 |
| Reference ranges (blood, tumor markers, vitals) | ✅ Done | 2.0 |
| Medical terminology (PL/EN/DE) | ✅ Done | 2.0 |
| Patient education (glossary, phase guides, FAQ, when-to-call, side effect tips) | ✅ Done | 2.0 |
| Notebook mode (free, no AI) | ✅ Done | 1.0 |
| Lavender UI redesign + dark mode | ✅ Done | 1.0 |
| Landing page (PL/EN) | ✅ Done | 1.0 |
| PWA (offline, installable) | ✅ Done | 1.0 |
| Demo mode (separate DB) | ✅ Done | 2.0 |
| Auto-backup to phone folder | ✅ Done | 2.0 |
| AI security (prompt injection guard, input validation) | ✅ Done | 2.0 |
| Feedback / bug report (GitHub Issues) | ✅ Done | 2.0 |
| Device import (Apple Health, Android, CSV) | ✅ Done | 2.0 |
| Test suite (Vitest, 327 tests) | ✅ Done | 2.0 |
| CODEOWNERS + Issue templates | ✅ Done | 2.0 |
| Community docs (CONTRIBUTING-MEDICAL, REVIEW-PROCESS) | ✅ Done | 2.0 |

---

# 6. ROADMAP — WHAT'S NEXT

| Phase | Feature | Priority | Effort |
|---|---|---|---|
| 3.0 | Withings API integration (OAuth2 + Vercel Edge Functions) | High | Large |
| 3.0 | PDF report with RT/immuno metrics | Medium | Medium |
| 3.1 | Lung cancer module (community) | Medium | Medium |
| 3.1 | Colorectal cancer module (community) | Medium | Medium |
| 3.2 | FHIR/HL7 export for doctor EHR | Low | Large |
| 3.2 | Garmin API integration | Medium | Medium |
| Future | TWA (Android native wrapper for Health Connect) | Low | Large |
| Future | Multi-user support (family/caregiver access) | Low | Large |
| Future | Doctor dashboard (read-only view of patient data) | Low | Large |

---

# 7. REVIEW PROCESS

### Code review (PR to src/)

```
[ ] Code compiles without errors (npm run build)
[ ] No API keys, passwords, personal data in code
[ ] PII Sanitizer intact
[ ] Tests pass (npm test — 327 tests)
[ ] Responsive on mobile (tested on phone)
[ ] No regressions — existing features still work
[ ] Commits follow convention (Feat:/Fix:/etc.)
[ ] Input guard patterns not weakened
```

### Medical data review (PR to medical-knowledge/)

```
[ ] Every entry has "sources" field with ≥1 source
[ ] Source is verifiable (PubMed PMID, DOI, guideline name)
[ ] Evidence level marked (strong/moderate/preclinical/patient_experience)
[ ] No patient-identifying information
[ ] JSON format valid
[ ] Translations consistent in terminology
[ ] Information is not prescriptive ("studied in..." not "you should take...")
```

### Patient experience review (PR to patient-experience/)

```
[ ] Zero identifying data (name, city, hospital, doctor)
[ ] Age range instead of exact age
[ ] Cancer type and protocol specified (needed for aggregation)
[ ] Entry has date_added field
[ ] "verified" field set to false
```

---

# 8. DEPLOYMENT

```
ENVIRONMENTS:
─────────────
localhost:5173         ← Development (npm run dev)
preview-xxx.vercel.app ← Preview (automatic on PR)
alpacalive.com         ← Production (merge to main)
```

### Deploy checklist (before merge to main)

```
[ ] TypeScript compiles (npx tsc --noEmit)
[ ] Build succeeds (npm run build)
[ ] All tests pass (npm test)
[ ] No console.log in production code
[ ] Disclaimers visible (chat, imaging, supplements)
[ ] Landing page works (/ → landing, /app → app)
[ ] PWA install works (iOS Safari + Android Chrome)
[ ] Notebook mode works without API key
[ ] AI mode works with API key
[ ] Dark mode doesn't break readability
[ ] Mobile responsive (iPhone SE → iPad)
[ ] Demo mode enters/exits cleanly (user data preserved)
[ ] package.json version updated
[ ] Git tag: git tag vX.Y.Z && git push --tags
```

---

# 9. COMMUNITY RULES

### Allowed

- Add medical data (with sources) via PR
- Add patient experiences (anonymously) via PR
- Report bugs via Issues
- Suggest features via Issues
- Translate to new languages
- Fork and modify (under AGPL-3.0)

### NOT allowed

- Add code sending personal data to external servers
- Add tracking, analytics, ads, tracking cookies
- Write prescriptive medical recommendations ("you must take", "you should")
- Add patient-identifying data in patient-experience
- Violate PII Sanitizer
- Remove or weaken disclaimers
- Remove or weaken AI security (input-guard.ts, system prompt protections)
- Merge without review

### GitHub Labels

| Label | Meaning |
|---|---|
| `medical-knowledge` | Medical data changes |
| `bug` | Bug report |
| `enhancement` | New feature request |
| `improvement` | Improvement to existing feature |
| `medical-data` | Missing drug, norm, disease |
| `security` | Security/privacy issue |
| `good-first-issue` | Good for new contributors |

---

# 10. SECURITY ARCHITECTURE

```
Layer 1: INPUT GUARD (src/lib/input-guard.ts)
  → 20+ regex patterns detect prompt injection (EN/PL)
  → Message length limit (3000 chars)
  → File validation (10MB max, MIME whitelist)
  → Rate limiting (2s between messages)
  → Data extraction whitelist (per-type allowed fields)

Layer 2: SYSTEM PROMPT (src/lib/system-prompt.ts)
  → Anti-manipulation section (highest priority)
  → Scope enforcement (oncology topics ONLY)
  → Off-topic refusal message
  → Image injection defense

Layer 3: PII SANITIZER (src/lib/pii-sanitizer.ts)
  → Names, PESEL, phone, email, address stripped before API calls
  → Bidirectional (sanitize outgoing, restore incoming)
  → Image-specific PII + injection instructions

Layer 4: DATA EXTRACTION GUARD
  → Whitelist of allowed fields per data type
  → Prevents AI from injecting arbitrary DB fields

Layer 5: DUAL DATABASE (demo mode)
  → User data in AlpacaLiveDB (never touched)
  → Demo data in AlpacaLiveDemoDB (separate IndexedDB)
```

---

# 11. TECH STACK

| Component | Technology |
|---|---|
| Framework | React 19 + TypeScript 6 |
| Build | Vite 8 |
| Styling | Tailwind CSS 4 |
| Database | Dexie.js (IndexedDB) |
| AI | Anthropic Claude / OpenAI / Google Gemini |
| Charts | Recharts |
| PDF | jsPDF |
| PWA | vite-plugin-pwa (Workbox) |
| Testing | Vitest (327 tests) |
| Hosting | Vercel |
| License | AGPL-3.0 |

---

*This document is the single source of truth for the project. When in doubt, refer here.*

---
---

# WERSJA POLSKA

---

# AlpacaLive — Master Plan i wytyczne rozwoju

## Autor: Dominik Gaweł | Gravity Design
## Wersja dokumentu: 2.0 | Data: 2026-04-12

---

# ZASADA NADRZĘDNA

Jedno repo. Jasna struktura. Dwa typy kontrybutorów (kod vs dane medyczne) z osobnymi procesami. Żadna zmiana nie trafia na `main` bez review. Żadne dane medyczne nie są hardkodowane w kodzie — wszystko z JSON-ów w `medical-knowledge/`.

---

# 1. STRUKTURA REPO — CO GDZIE JEST

Patrz sekcja angielska powyżej — struktura jest identyczna.

### ZASADA: Gdzie co dodajesz

| Chcesz dodać... | Folder | Format | Review |
|---|---|---|---|
| Nowy komponent UI | `src/components/` | .tsx | code-review |
| Nową logikę | `src/lib/` | .ts | code-review |
| Nowy lek / interakcję | `medical-knowledge/drugs/` | .json | medical-review |
| Nowy typ raka | `medical-knowledge/cancers/nowy/` | .json | medical-review |
| Doświadczenie pacjenta | `medical-knowledge/patient-experience/` | .json | anonymity-check |
| Normy laboratoryjne | `medical-knowledge/reference-ranges/` | .json | medical-review |
| Tłumaczenie terminów | `medical-knowledge/medical-terms/` | .json | translation-review |
| Suplementy | `medical-knowledge/supplements/` | .json | medical-review |

**ZŁAMANIE ZASADY = PR odrzucony.**

---

# 2. BRANCHING — JAK PRACUJEMY Z GIT

```
main     ← Produkcja. Zawsze stabilna. Deploy na Vercel.
  │
  ├── develop  ← Branch rozwojowy. Wszystkie PR tu merge'ują.
  │     ├── feature/nowa-funkcja
  │     ├── fix/poprawka-bledu
  │     ├── medical/nowy-lek
  │     └── docs/tlumaczenie
  │
  └── release/v2.1.0  ← Branch releasu (develop → main)
```

### Prefiksy branchy

| Prefiks | Kto | Co |
|---|---|---|
| `feature/` | Programista | Nowa funkcja |
| `fix/` | Programista | Poprawka błędu |
| `medical/` | Lekarz / pacjent | Dane medyczne |
| `docs/` | Każdy | Dokumentacja |
| `chore/` | Programista | Maintenance |
| `release/` | Maintainer | Nowa wersja |

### Kto merge'uje

| Branch | Kto |
|---|---|
| feature/fix/chore → develop | Maintainer po review |
| medical → develop | Maintainer po medical-review |
| develop → main | TYLKO maintainer (Dominik) |

---

# 3. COMMIT MESSAGES — FORMAT

```
Typ: krótki opis (#numer-issue)
```

| Typ | Znaczenie |
|---|---|
| `Feat:` | Nowa funkcja |
| `Fix:` | Poprawka błędu |
| `Medical:` | Zmiana danych medycznych |
| `Docs:` | Dokumentacja |
| `Security:` | Bezpieczeństwo |
| `Legal:` | Kwestie prawne |
| `Test:` | Testy |
| `Chore:` | Maintenance |

---

# 4. CO JEST GOTOWE — STATUS (v2.0)

| Element | Status |
|---|---|
| Rdzeń aplikacji (React 19 + Vite + Dexie) | ✅ |
| Ochrona prawna (disclaimery, ograniczenia AI) | ✅ |
| AGPL-3.0 | ✅ |
| Multi-model AI (Claude/GPT/Gemini) | ✅ |
| PII Sanitizer | ✅ |
| Wielojęzyczność PL/EN | ✅ |
| Rak piersi — podtypy + biomarkery | ✅ |
| Radioterapia — formularze + fazy | ✅ |
| Immunoterapia — tracking irAE | ✅ |
| Hormonoterapia — adherence | ✅ |
| Kalendarz z wyborem miesiąca/roku | ✅ |
| Separacja danych medycznych (JSON) | ✅ |
| Baza leków (21 leków w 6 kategoriach) | ✅ |
| Macierz interakcji CYP450 | ✅ |
| Suplementy z dowodami | ✅ |
| Zabiegi chirurgiczne + rekonwalescencja | ✅ |
| Normy referencyjne (krew, markery, vitals) | ✅ |
| Terminologia medyczna PL/EN/DE | ✅ |
| Edukacja pacjenta (słownik, fazy, FAQ, tips) | ✅ |
| Tryb notatnika (darmowy, bez AI) | ✅ |
| UI lawendowy + dark mode | ✅ |
| Landing page PL/EN | ✅ |
| PWA (offline, installable) | ✅ |
| Demo mode (osobna baza) | ✅ |
| Auto-backup na telefon | ✅ |
| Zabezpieczenia AI (prompt injection, walidacja) | ✅ |
| Feedback / zgłoszenia (GitHub Issues) | ✅ |
| Import z urządzeń (Apple Health, Android, CSV) | ✅ |
| Testy (Vitest, 327 testów) | ✅ |
| CODEOWNERS + szablony Issue | ✅ |
| Dokumentacja community | ✅ |

---

# 5. CO DALEJ — ROADMAP

| Faza | Funkcja | Priorytet |
|---|---|---|
| 3.0 | Integracja Withings (OAuth2 + Vercel Edge) | Wysoki |
| 3.0 | Raport PDF z metrykami RT/immuno | Średni |
| 3.1 | Moduł raka płuca (community) | Średni |
| 3.2 | Export FHIR/HL7 dla systemu szpitalnego | Niski |
| Przyszłość | TWA wrapper Android (Health Connect) | Niski |

---

# 6. ZASADY SPOŁECZNOŚCI

### Co wolno
- Dodawać dane medyczne (ze źródłami) przez PR
- Dodawać doświadczenia pacjentów (anonimowo)
- Zgłaszać błędy i propozycje przez Issues
- Tłumaczyć na nowe języki
- Forkować (pod AGPL-3.0)

### Czego NIE wolno
- Kod wysyłający dane osobowe na zewnątrz
- Tracking, reklamy, cookies śledzące
- Nakazowe rekomendacje medyczne
- Dane identyfikujące pacjenta
- Osłabianie PII Sanitizera, disclaimerów lub input guarda
- Merge bez review

---

# 7. DEPLOY — CHECKLIST

```
[ ] TypeScript kompiluje się (npx tsc --noEmit)
[ ] Build przechodzi (npm run build)
[ ] Testy przechodzą (npm test)
[ ] Disclaimery widoczne
[ ] PWA działa (iOS + Android)
[ ] Demo wchodzi/wychodzi czysto
[ ] Mobile responsywny
[ ] Dark mode OK
```

---

*Ten dokument to jedyne źródło prawdy dla projektu. W razie wątpliwości — wracaj tu.*
