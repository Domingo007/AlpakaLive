# Patient Experience Data

This folder contains **anonymized** patterns from real patients — how they felt during different treatment protocols.

## How to contribute your experience

1. Find your chemo protocol in `chemo-patterns/` (e.g., `ac-t.json`)
2. If your protocol doesn't exist — copy `_template.json` and rename it
3. Add your entry to the `contributions` array
4. Submit a Pull Request

## Template for your entry

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

## Privacy rules — MANDATORY

**NEVER include:** name, surname, city, hospital, doctor name, PESEL/ID, exact age

**You CAN include:** age range (30-39), cancer type, subtype, stage, treatment protocol, your feelings (energy/nausea/pain 1-10)

## How data is used

- Patterns are displayed in the app to help other patients know what to expect
- When 5+ patients contribute the same protocol, averages are calculated
- This is NOT medical advice — just shared experiences
