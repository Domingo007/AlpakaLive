# Adding a New Cancer Type

To add support for a new cancer type in AlpakLive:

1. Copy this `_template/` folder and rename it (e.g., `lung-cancer/`)
2. Fill in each JSON file with disease-specific data
3. All text fields use `{ "pl": "...", "en": "..." }` format for bilingual content
4. Register your new disease in `src/lib/medical-data/knowledge-registry.ts`
5. Submit a Pull Request

## Required files

| File | Description |
|------|-------------|
| `disease-profile.json` | ICD-10 codes, name aliases, subtypes, biomarkers, metastasis sites |
| `regimens.json` | Standard treatment regimens with drugs, cycles, side effects |
| `side-effects.json` | Per-drug side effect profiles with frequency and timing |
| `monitoring.json` | Blood test and imaging schedules |
| `education/glossary.json` | Patient-friendly glossary of medical terms |
| `education/phase-guides.json` | What to expect in each treatment phase |
| `education/when-to-call.json` | Emergency/urgent/monitor symptom checklists |
| `education/faq.json` | Frequently asked questions |
| `education/side-effect-tips.json` | Practical management tips |

## Review process

Changes to `medical-knowledge/` require review from a medical reviewer.
See `.github/CODEOWNERS` for details.

## Data sources

Always cite sources for medical information. Use established guidelines:
- **Europe**: ESMO Clinical Practice Guidelines
- **USA**: NCCN Guidelines
- **Drug info**: EMA SmPC / FDA prescribing information
