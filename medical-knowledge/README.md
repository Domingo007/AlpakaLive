# Medical Knowledge Database

This folder contains **all medical data** used by AlpacaLive.

> **For doctors, pharmacists, patients:** edit JSON files here, create a Pull Request.  
> **For developers:** don't hardcode medical data in `src/` — import from here.

## Structure

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

See [CONTRIBUTING-MEDICAL.md](CONTRIBUTING-MEDICAL.md)

## How data is used

1. JSON files are imported at **build time** by Vite
2. The app's `src/lib/medical-data/knowledge-registry.ts` loads them
3. Data is injected into the AI system prompt and displayed in the UI
4. Patient data (stored locally on device) is **never** in this folder

## Adding a new cancer type

1. Copy `cancers/_template/` → rename (e.g., `cancers/lung/`)
2. Fill in JSON files
3. Register in `src/lib/medical-data/knowledge-registry.ts`
4. Submit PR with label `medical-knowledge`
