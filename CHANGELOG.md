# Changelog — AlpacaLive

All notable changes to this project will be documented in this file.
Format based on [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased]

### Added
- (next changes go here)

## [1.0.0] — 2026-04-21

### Added
- **Core application:** conversational health diary with AI agent (Claude/GPT/Gemini)
- **Blood test analysis:** photo upload → automatic marker extraction via Vision API
- **Treatment calendar:** chemo cycle phases (A/B/C), RT sessions, immunotherapy, surgery events with month/year picker
- **Drug interaction checker:** CYP450 database with serotonin syndrome detection
- **Medical imaging:** CT/MRI/PET report analysis with RECIST criteria
- **Daily Profile view:** neutral data mirror — device data + patient feelings + historical cycle comparison
- **AI clinical extraction layer:** [EXTRACT:{...}] blocks translate natural language to CTCAE-graded findings, ECOG scores, flagged symptoms — every extracted value requires a cited basis (patient quote)
- **Supplement tracker:** autocomplete from evidence database, numeric dose + unit selector, evidence levels from published research
- **PII Sanitizer:** personal data (name, PESEL, phone, email, address) stripped before every AI API call
- **PWA support:** installable on iOS Safari and Android Chrome, fully offline-capable
- **Dual database:** separate `AlpacaLiveDB` (user) and `AlpacaLiveDemoDB` (demo) — user data never touched by demo mode
- **Auto-backup:** File System Access API writes JSON backups to phone folder (Android) or Downloads (iOS fallback)
- **Device data import:** iOS Shortcuts (HealthKit), Android Tasker (Health Connect), universal CSV/JSON (Garmin, Withings, Samsung Health)
- **Landing page:** `/` with PL/EN language switcher, globe dropdown selector
- **Feedback system:** Settings → "Feedback & Ideas" generates pre-filled GitHub Issues

### Medical Knowledge Base
- **medical-knowledge/** folder — all medical data in JSON, editable by doctors/patients without touching code
- **Breast cancer:** 5 molecular subtypes (Luminal A/B, HER2+, TNBC, HER2-low), 7 treatment regimens, ESMO/NCCN protocols, education content (glossary, phase guides, FAQ, when-to-call, side effect tips)
- **Drug database:** 21 drugs across 6 categories (chemo, immunotherapy, targeted, hormonal, psychiatric, supportive)
- **CYP450 interaction matrix:** drug-drug interactions with severity, evidence level, recommendations
- **Supplements:** 7 substances with evidence levels from published studies (Vitamin D3, Omega-3, L-glutamine, probiotics, curcumin, magnesium, St. John's wort marked CONTRAINDICATED)
- **Reference ranges:** blood markers, tumor markers (CA15-3, CEA, CA125, PSA, AFP), vitals with oncology context
- **Medical terminology:** DE/PL/EN + standard abbreviations (RECIST, CTCAE, ECOG, TNM)
- **Radiotherapy:** protocols (whole breast, hypofractionated, chest wall) + side effects by body region
- **Surgery:** 5 procedures with recovery timelines, restrictions, lymphedema risk
- **Patient experience:** anonymous patterns template (chemo-patterns, RT patterns, surgery recovery)
- **_metadata header** on every JSON file: last_verified, source_version, verified_by, language

### Security
- **5 security layers:** input guard (prompt injection detection), PII sanitizer, system prompt hardening, data extraction whitelist, dual database
- **53 injection patterns** detected (EN/PL): "ignore instructions", "forget your rules", "you are now admin", token smuggling, role override
- **File validation:** 10MB max, MIME whitelist (JPEG/PNG/WebP/PDF only), rejects SVG (XSS vector)
- **Rate limiting:** 2s between messages
- **Data extraction whitelist:** per-type allowed fields prevent AI from injecting arbitrary DB fields

### Testing
- **297 tests** across 13 files (Vitest):
  - Input guard: 53 tests (injection + false positives + limits + files)
  - PII sanitization: 39 tests (data leak prevention + medical data preservation)
  - System prompt security: 26 tests (absolute bans, disclaimers, scope enforcement)
  - Data extraction: 31 tests (tag extraction, [EXTRACT:] parser, injection prevention)
  - Knowledge registry: 25 tests (disease/drug/reference data loading)
  - Treatment cycles: 25 tests (chemo/RT/immuno/surgery phases)
  - Drug interactions: 12 tests (CYP450, serotonin, substrate competition)
  - Chemo readiness: 11 tests (GO/CAUTION/POSTPONE)
  - Disease matching: 18 tests (PL/EN/ICD-10)
  - Blood norms: 20 tests
  - Device import: 17 tests
  - Content localization: 7 tests
  - AI profile extraction: 11 tests

### Open Source Documentation
- AGPL-3.0 license
- CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md, DISCLAIMER.md, TERMS.md
- medical-knowledge/README.md and CONTRIBUTING-MEDICAL.md
- docs/Master-Plan.md (project bible, PL+EN)
- docs/TESTING.md (security audit transparency)
- docs/DAILY-PROFILE.md
- AGENTS.md, CLAUDE.md, .cursorrules, .github/copilot-instructions.md (AI coding assistant rules)
- .github/CODEOWNERS (separate reviewers for code vs medical data)
- .github/ISSUE_TEMPLATE/medical_data.md

### Architecture
- Monorepo with `medical-knowledge/` separated from `src/`
- React 19 + TypeScript 6 + Vite 8 + Tailwind CSS 4
- Dexie.js for IndexedDB (local-only storage)
- vite-plugin-pwa with Workbox for offline support
- Vercel deployment

### Privacy
- 100% local storage — no cloud, no backend, no analytics, no tracking
- Only external communication: user's own Claude/GPT/Gemini API
- PII sanitized before every API call
- Demo mode uses separate IndexedDB — zero risk to user data
