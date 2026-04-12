---
name: medical-review
description: Review medical knowledge JSON files for correctness, completeness, and safety. Use when reviewing a PR that changes medical-knowledge/ files.
argument-hint: [file-path or folder]
---

Review the medical data in $ARGUMENTS for correctness and safety.

## Checklist — check each item:

### Data Quality
- [ ] Every entry has `sources` field with ≥1 verifiable source
- [ ] Sources are real (PubMed PMID, DOI, named guideline — not made up)
- [ ] Side effect frequencies are realistic (0.0-1.0 range)
- [ ] Drug names are spelled correctly (match WHO INN)
- [ ] ICD-10 codes are valid
- [ ] Normal ranges for blood markers match clinical standards

### Language & Safety
- [ ] Information is DESCRIPTIVE, not PRESCRIPTIVE
  - ✅ "In published studies, X was used..."
  - ❌ "You should take X" / "Recommended dose is X"
- [ ] No patient-identifying information
- [ ] Bilingual content (at minimum `en`, ideally `pl` too)
- [ ] Medical terminology is correct and consistent

### Structure
- [ ] JSON is valid (no syntax errors)
- [ ] Follows the same structure as existing entries in the same file
- [ ] All required fields present
- [ ] `version` field present
- [ ] No fields with empty strings where data should exist

### Interactions (if drugs/ files changed)
- [ ] CYP450 substrate/inhibitor/inducer data is correct
- [ ] Known major interactions are listed in cyp450-matrix.json
- [ ] Serotonergic flag set correctly for psychiatric drugs

## Report
List each issue found with severity:
- 🔴 **Critical**: Wrong medical information, missing sources, prescriptive language
- 🟡 **Warning**: Missing translations, incomplete data, formatting issues
- 🟢 **OK**: No issues found

Do NOT modify files — only report findings.
