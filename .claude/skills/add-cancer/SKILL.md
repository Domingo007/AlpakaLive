---
name: add-cancer
description: Add a new cancer type to the medical knowledge database. Creates the folder structure, JSON files, and registers it in the app.
argument-hint: [cancer-type e.g. lung, colorectal, prostate]
---

Add cancer type "$ARGUMENTS" to AlpacaLive.

## Steps

1. **Copy template:**
   Copy `medical-knowledge/cancers/_template/` → `medical-knowledge/cancers/$ARGUMENTS/`

2. **Fill cancer-info.json** with:
   - `id`: "$ARGUMENTS"
   - `name`: { "en": "...", "pl": "..." }
   - `icd10Codes`: ICD-10 codes for this cancer
   - `aliases`: common names in multiple languages
   - `subtypes`: molecular/histological subtypes
   - `relevantBloodMarkers`: which markers to monitor
   - `tumorMarkers`: specific tumor markers
   - `typicalMetastasisSites`: common metastasis locations
   - `biomarkerConfig`: which biomarkers to collect at onboarding

3. **Fill treatments.json** with at least 2-3 standard regimens including:
   - Drug names, cycle length, number of cycles
   - Side effects, monitoring requirements
   - Phase profile (expected energy/nausea/pain per phase)

4. **Fill side-effects.json** with per-drug side effect profiles

5. **Create education/ folder** with at minimum:
   - `glossary.json` — key terms for this cancer
   - `faq.json` — common patient questions

6. **Register in knowledge-registry.ts:**
   - Add imports at top of `src/lib/medical-data/knowledge-registry.ts`
   - Add entry to `DISEASE_REGISTRY` object

7. **Update disease-matcher.ts** — the aliases in cancer-info.json are used automatically

8. **Run verification**: `npx tsc --noEmit && npm test && npm run build`

## Reference
Look at `medical-knowledge/cancers/breast/` as the reference implementation — match its structure and quality level.

## Sources
Every entry MUST cite sources (ESMO, NCCN, PubMed, DOI).
