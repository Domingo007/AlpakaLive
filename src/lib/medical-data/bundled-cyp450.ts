/*
 * AlpacaLive — Bundled CYP450 drug interaction database (re-exported from JSON).
 * Source: medical-knowledge/drugs/ (all drug categories merged)
 */
import type { CYP450Profile } from './types';
import chemoAgents from '../../../medical-knowledge/drugs/chemo-agents.json';
import immunotherapyDrugs from '../../../medical-knowledge/drugs/immunotherapy.json';
import targetedDrugs from '../../../medical-knowledge/drugs/targeted-therapy.json';
import hormonalDrugs from '../../../medical-knowledge/drugs/hormonal-therapy.json';
import psychiatricDrugs from '../../../medical-knowledge/drugs/psychiatric.json';

// Merge all drugs' CYP450 profiles into a single Record
function buildCYP450Map(): Record<string, CYP450Profile> {
  const map: Record<string, CYP450Profile> = {};
  const allDrugs = [
    ...chemoAgents.drugs,
    ...immunotherapyDrugs.drugs,
    ...targetedDrugs.drugs,
    ...hormonalDrugs.drugs,
    ...psychiatricDrugs.drugs,
  ];

  for (const drug of allDrugs) {
    const cyp = (drug as { id: string; cyp450?: { substrate: string[]; inhibitor: string[]; inducer: string[]; serotonergic?: boolean } }).cyp450;
    if (cyp) {
      map[drug.id] = {
        substrate: cyp.substrate,
        inhibitor: cyp.inhibitor,
        inducer: cyp.inducer,
        serotonergic: cyp.serotonergic,
      };
    }
  }

  return map;
}

export const BUNDLED_CYP450: Record<string, CYP450Profile> = buildCYP450Map();
