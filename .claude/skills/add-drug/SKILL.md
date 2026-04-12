---
name: add-drug
description: Add a new drug to the medical knowledge database. Use when someone wants to add a chemotherapy agent, immunotherapy, targeted therapy, hormonal therapy, or psychiatric medication.
argument-hint: [drug-name]
---

Add the drug "$ARGUMENTS" to the AlpacaLive medical knowledge database.

## Rules
1. ALL drug data goes in `medical-knowledge/drugs/` as JSON — NEVER in TypeScript
2. Every drug entry MUST have a `sources` field with at least one verifiable source
3. CYP450 data (substrate, inhibitor, inducer) is required for interaction checking
4. Side effects need frequency (0.0-1.0) and severity

## Steps

1. **Determine drug category:**
   - Chemotherapy → `medical-knowledge/drugs/chemo-agents.json`
   - Immunotherapy → `medical-knowledge/drugs/immunotherapy.json`
   - Targeted therapy → `medical-knowledge/drugs/targeted-therapy.json`
   - Hormonal therapy → `medical-knowledge/drugs/hormonal-therapy.json`
   - Psychiatric → `medical-knowledge/drugs/psychiatric.json`
   - Supportive care → `medical-knowledge/drugs/supportive-care.json`

2. **Read the target JSON file** to see the existing format

3. **Add the new drug** following the exact same structure as existing entries. Include:
   - `id` (lowercase, underscores)
   - `name` with `en`, `pl` (and `de` if known)
   - `class` (drug class)
   - `cyp450` object (substrate, inhibitor, inducer arrays)
   - `commonSideEffects` array
   - `monitoringRequired` array
   - `sources` array

4. **Check for interactions** — if this drug has known CYP450 interactions with existing drugs, add entries to `medical-knowledge/drugs/interactions/cyp450-matrix.json`

5. **Run verification**: `npx tsc --noEmit && npm test && npm run build`

6. **Report what was added** and where

## Do NOT
- Add the drug to any TypeScript file
- Modify `knowledge-registry.ts` (it imports the entire JSON file)
- Invent side effect frequencies — use "unknown" if not available
- Skip the sources field
