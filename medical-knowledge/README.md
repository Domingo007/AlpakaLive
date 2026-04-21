# Medical Knowledge Base — AlpacaLive

This folder contains **all medical data** used by AlpacaLive, separated from application code.

> **For doctors, pharmacists, patients, researchers:** edit JSON files here, never in `src/`.
> **For developers:** don't hardcode medical data in `src/` — import from here via `src/lib/medical-data/knowledge-registry.ts`.

## Structure

```
medical-knowledge/
├── cancers/              ← Cancer types (one folder per type)
│   ├── _template/        ← Copy this to add a new cancer type
│   └── breast/           ← Breast cancer (current focus)
├── drugs/                ← Medications and interactions
├── supplements/          ← Supplements with evidence levels
├── radiotherapy/         ← Radiotherapy protocols
├── surgery/              ← Surgical procedures and recovery
├── reference-ranges/     ← Lab reference ranges
├── medical-terms/        ← Medical terminology (DE/PL/EN)
└── patient-experience/   ← Anonymous patient patterns
```

| Folder | Contents | Who edits |
|--------|----------|-----------|
| `cancers/` | Cancer types with subtypes, treatments, side effects, education | Doctors |
| `drugs/` | Drug database: chemo, immuno, targeted, hormonal, psychiatric, interactions | Doctors, pharmacists |
| `supplements/` | Supplements with evidence levels and sources | Doctors, researchers |
| `radiotherapy/` | RT protocols and side effects by body region | Radiation oncologists |
| `surgery/` | Surgical procedures and recovery patterns | Surgeons |
| `reference-ranges/` | Blood markers, tumor markers, vitals | Lab specialists |
| `medical-terms/` | Medical terminology in PL/EN/DE | Translators |
| `patient-experience/` | Anonymous patient well-being patterns | Patients |

## How to contribute

See [CONTRIBUTING-MEDICAL.md](CONTRIBUTING-MEDICAL.md) for detailed instructions.

**Quick summary:**
1. Find the right file (or create one from a template)
2. Edit the JSON — every entry MUST have a `sources` field
3. Open a Pull Request with label `medical-knowledge`
4. A medical reviewer will check your changes

## Rules

- Every medical fact must have a source (PubMed PMID, DOI, or guideline name)
- Use informational language ("studies report...") not prescriptive ("patients should...")
- Patient experience data must be anonymous (age range, not exact age; cancer type, not hospital name)
- When in doubt, mark evidence level as lower rather than higher

## File format — `_metadata` header

Every JSON file in this folder should include a metadata header:

```json
{
  "_metadata": {
    "last_verified": "2025-01",
    "source_version": "ESMO Guidelines 2024",
    "verified_by": "community",
    "language": "en"
  },
  ...existing content...
}
```

## How data is used

1. JSON files are imported at **build time** by Vite
2. The app's `src/lib/medical-data/knowledge-registry.ts` loads them
3. Data is injected into the AI system prompt and displayed in the UI
4. Patient data (stored locally on device) is **never** in this folder

## Adding a new cancer type

1. Copy `cancers/_template/` → rename (e.g., `cancers/lung/`)
2. Fill in JSON files (start with `cancer-info.json` and `treatments.json`)
3. Register in `src/lib/medical-data/knowledge-registry.ts`
4. Submit PR with label `medical-knowledge`
