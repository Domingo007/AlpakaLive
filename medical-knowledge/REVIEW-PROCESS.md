# Medical Data Review Process

## Review Categories

### 1. Patient Experience Data (`patient-experience/`)
- **Reviewer:** Any maintainer
- **Check:** Anonymity (no personal data), reasonable values (energy 1-10, etc.)
- **Turnaround:** 1-3 days
- **Auto-merge eligible:** Yes, after basic check

### 2. Drug Data (`drugs/`)
- **Reviewer:** Medical reviewer (`medical-review` label)
- **Check:** Sources cited, correct CYP450 pathways, accurate side effect frequencies
- **Turnaround:** 3-7 days
- **Required:** At least 1 verifiable source (PubMed, DOI, SmPC)

### 3. Cancer Modules (`cancers/`)
- **Reviewer:** Medical reviewer
- **Check:** ICD-10 accuracy, treatment regimens match guidelines, staging correct
- **Turnaround:** 5-14 days
- **Required:** Guideline reference (ESMO, NCCN, or national guidelines)

### 4. Reference Ranges (`reference-ranges/`)
- **Reviewer:** Medical reviewer
- **Check:** Values match clinical laboratory standards
- **Turnaround:** 3-7 days

### 5. Translations (`medical-terms/`)
- **Reviewer:** Any bilingual contributor
- **Check:** Medical terminology accuracy
- **Turnaround:** 1-5 days

## Evidence Levels

| Level | Description | Icon |
|-------|-------------|------|
| established | Meta-analysis, multiple RCTs, guideline-recommended | Strong |
| moderate | Single RCT, large observational studies | Moderate |
| preclinical | In vitro, animal studies, case reports | Preclinical |
| patient_experience | Anonymous patient-reported data | Experience |

## Conflict Resolution

If reviewers disagree on medical data:
1. Both cite their sources
2. Preference given to: guidelines > RCTs > observational > case reports
3. If still unclear: add both perspectives with clear labeling
4. Regional differences (ESMO vs NCCN) are both valid — add with `region` tag
