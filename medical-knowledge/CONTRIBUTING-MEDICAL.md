# How to Contribute Medical Knowledge to AlpacaLive

## Who Can Contribute

Everyone! But different types of data have different requirements:

| Who | What they can add | Review required? |
|-----|------------------|-----------------|
| Patient / caregiver | `patient-experience/` (well-being patterns) | No — but must be anonymous |
| Doctor / pharmacist | `drugs/`, `cancers/`, `reference-ranges/` | Yes — label `medical-review` |
| Researcher | New sources, evidence updates | Yes — with DOI or PMID |
| Developer | JSON schemas, loader, tests | Yes — label `code-review` |
| Translator | Translations in name/description fields | No — but terminology is checked |

---

## How to Add Your Patient Experience (Easiest!)

1. Open `medical-knowledge/patient-experience/chemo-patterns/`
2. Find the file for your chemo protocol (e.g., `ac-t.json`)
3. If it doesn't exist — copy `_template.json` and rename appropriately
4. Add your entry to the `contributions` array
5. Create a Pull Request

### Template:
```json
{
  "id": "exp_YYYYMMDD_XX",
  "contributor": "anonymous_patient",
  "cancerType": "breast",
  "subtype": "tnbc",
  "stage": "IV",
  "ageRange": "30-39",
  "pattern": {
    "day1_3": { "energy": 3, "nausea": 7, "pain": 4, "notes_pl": "Description" }
  },
  "date_added": "2025-03-15",
  "verified": false
}
```

**NEVER include:** name, surname, city, hospital, doctor name, PESEL/ID, exact age  
**You CAN include:** age range, cancer type, subtype, stage, treatment protocol, your feelings

---

## How to Add a New Drug or Interaction

1. Edit the appropriate file in `drugs/`
2. Every entry MUST have:
   - `sources` with at least 1 source (PubMed PMID, DOI, guideline name)
   - Evidence level when applicable
3. Create a PR with label `medical-knowledge`
4. A reviewer with `medical-review` tag will check it

---

## How to Add a New Cancer Type

1. Copy the folder `cancers/_template/`
2. Rename it with the cancer identifier (e.g., `lung/`, `colorectal/`)
3. Fill in at minimum: `cancer-info.json` + `treatments.json`
4. Create a PR — describe your sources

### Required files:
- `cancer-info.json`: id, name (min. EN), ICD-10 code
- `treatments.json`: at least 1 treatment regimen

### Optional (add when you have data):
- `subtypes.json`, `side-effects.json`, `biomarkers.json`, `monitoring.json`
- `education/` folder with glossary, phase guides, FAQ

---

## Rules

1. **Sources mandatory** — every medical fact must have a source
2. **Don't give advice** — data in JSONs are FACTS from studies, not recommendations
3. **Patient anonymity** — zero identifying data in patient-experience
4. **Languages** — minimum English, add Polish/German if you know them
5. **Don't touch code** — edit ONLY files in `medical-knowledge/`
6. **Use the template** — copy `_template/` for new cancer types

---

## File Structure

```
medical-knowledge/
├── cancers/           ← Cancer types (one folder per cancer)
├── drugs/             ← Drug database (chemo, immuno, targeted, hormonal, psychiatric)
├── supplements/       ← Supplements with evidence levels
├── radiotherapy/      ← RT protocols and side effects by region
├── surgery/           ← Surgical procedures and recovery patterns
├── reference-ranges/  ← Blood markers, tumor markers, vitals
├── medical-terms/     ← Medical terminology (PL/EN/DE)
└── patient-experience/ ← Anonymous patient patterns
```
