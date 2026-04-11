/*
 * AlpacaLive — CYP450 drug interaction checker
 * Now uses the medical-data loader system with CDN support.
 * Backward-compatible: CYP450_DATABASE and checkInteractions() work as before.
 */
import { getCYP450Database } from './medical-data/loader';
import { BUNDLED_CYP450 } from './medical-data/bundled-cyp450';
import type { CYP450Profile } from './medical-data/types';

// Re-export types for backward compatibility
export type { CYP450Profile };

/**
 * CYP450_DATABASE — backward compatible export.
 * After initMedicalData() is called, getCYP450Database() returns potentially updated data.
 */
export const CYP450_DATABASE: Record<string, CYP450Profile> = BUNDLED_CYP450;

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  mechanism: string;
  severity: 'high' | 'moderate' | 'low';
  description: string;
  recommendation: string;
}

/**
 * Check drug interactions using CYP450 metabolic pathways.
 * Uses dynamically loaded database if available, falls back to bundled.
 */
export function checkInteractions(drugNames: string[]): DrugInteraction[] {
  const database = getCYP450Database();
  const interactions: DrugInteraction[] = [];
  const normalizedDrugs = drugNames.map(d => d.toLowerCase().replace(/\s+/g, '_'));

  for (let i = 0; i < normalizedDrugs.length; i++) {
    for (let j = i + 1; j < normalizedDrugs.length; j++) {
      const d1 = normalizedDrugs[i];
      const d2 = normalizedDrugs[j];
      const p1 = database[d1];
      const p2 = database[d2];
      if (!p1 || !p2) continue;

      // Check substrate competition
      const sharedEnzymes = p1.substrate.filter(e => p2.substrate.includes(e));
      for (const enzyme of sharedEnzymes) {
        interactions.push({
          drug1: drugNames[i],
          drug2: drugNames[j],
          mechanism: `Oba leki są substratami ${enzyme}`,
          severity: enzyme.includes('3A4') ? 'moderate' : 'low',
          description: `Konkurencja o metabolizm przez ${enzyme} — możliwe wyższe stężenie obu leków`,
          recommendation: 'Monitorować efekty uboczne obu leków',
        });
      }

      // Check inhibitor + substrate
      for (const inhEnzyme of p1.inhibitor) {
        const baseEnzyme = inhEnzyme.replace(/_weak|_moderate|_strong/, '');
        if (p2.substrate.includes(baseEnzyme)) {
          const severity = inhEnzyme.includes('strong') ? 'high' : inhEnzyme.includes('moderate') ? 'moderate' : 'low';
          interactions.push({
            drug1: drugNames[i],
            drug2: drugNames[j],
            mechanism: `${drugNames[i]} hamuje ${baseEnzyme}, ${drugNames[j]} jest jego substratem`,
            severity,
            description: `Możliwe podwyższenie stężenia ${drugNames[j]} we krwi`,
            recommendation: severity === 'high' ? 'Skonsultować z lekarzem — możliwa zmiana dawki' : 'Monitorować',
          });
        }
      }
      // Reverse direction
      for (const inhEnzyme of p2.inhibitor) {
        const baseEnzyme = inhEnzyme.replace(/_weak|_moderate|_strong/, '');
        if (p1.substrate.includes(baseEnzyme)) {
          const severity = inhEnzyme.includes('strong') ? 'high' : inhEnzyme.includes('moderate') ? 'moderate' : 'low';
          interactions.push({
            drug1: drugNames[j],
            drug2: drugNames[i],
            mechanism: `${drugNames[j]} hamuje ${baseEnzyme}, ${drugNames[i]} jest jego substratem`,
            severity,
            description: `Możliwe podwyższenie stężenia ${drugNames[i]} we krwi`,
            recommendation: severity === 'high' ? 'Skonsultować z lekarzem — możliwa zmiana dawki' : 'Monitorować',
          });
        }
      }

      // Inducer + substrate
      for (const indEnzyme of p1.inducer) {
        const baseEnzyme = indEnzyme.replace(/_weak|_moderate|_strong/, '');
        if (p2.substrate.includes(baseEnzyme)) {
          interactions.push({
            drug1: drugNames[i],
            drug2: drugNames[j],
            mechanism: `${drugNames[i]} indukuje ${baseEnzyme}, ${drugNames[j]} jest jego substratem`,
            severity: indEnzyme.includes('strong') ? 'high' : 'moderate',
            description: `Możliwe obniżenie stężenia ${drugNames[j]} — zmniejszona skuteczność`,
            recommendation: 'Skonsultować z lekarzem',
          });
        }
      }

      // Serotonin syndrome risk
      if (p1.serotonergic && p2.serotonergic) {
        interactions.push({
          drug1: drugNames[i],
          drug2: drugNames[j],
          mechanism: 'Oba leki mają działanie serotoninergiczne',
          severity: 'high',
          description: 'Ryzyko zespołu serotoninowego — gorączka, pobudzenie, drżenia, biegunka',
          recommendation: 'Konieczna kontrola psychiatry. Monitorować objawy zespołu serotoninowego.',
        });
      }
    }
  }

  return interactions;
}
