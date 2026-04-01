interface CYP450Profile {
  substrate: string[];
  inhibitor: string[];
  inducer: string[];
  serotonergic?: boolean;
}

export const CYP450_DATABASE: Record<string, CYP450Profile> = {
  paclitaxel: { substrate: ['CYP3A4', 'CYP2C8'], inhibitor: [], inducer: [] },
  docetaxel: { substrate: ['CYP3A4'], inhibitor: [], inducer: [] },
  gemcitabine: { substrate: [], inhibitor: [], inducer: [] },
  carboplatin: { substrate: [], inhibitor: [], inducer: [] },
  cisplatin: { substrate: [], inhibitor: [], inducer: [] },
  etoposide: { substrate: ['CYP3A4'], inhibitor: [], inducer: [] },
  cyclophosphamide: { substrate: ['CYP2B6', 'CYP3A4'], inhibitor: [], inducer: [] },
  doxorubicin: { substrate: ['CYP3A4', 'CYP2D6'], inhibitor: [], inducer: [] },
  tamoxifen: { substrate: ['CYP2D6', 'CYP3A4'], inhibitor: [], inducer: [] },
  letrozole: { substrate: ['CYP2A6', 'CYP3A4'], inhibitor: [], inducer: [] },
  trastuzumab: { substrate: [], inhibitor: [], inducer: [] },
  pembrolizumab: { substrate: [], inhibitor: [], inducer: [] },
  // Psychiatric
  trazodone: { substrate: ['CYP3A4', 'CYP2D6'], inhibitor: [], inducer: [], serotonergic: true },
  venlafaxine: { substrate: ['CYP2D6', 'CYP3A4'], inhibitor: ['CYP2D6_weak'], inducer: [], serotonergic: true },
  sertraline: { substrate: ['CYP2C19', 'CYP2D6'], inhibitor: ['CYP2D6_moderate'], inducer: [], serotonergic: true },
  escitalopram: { substrate: ['CYP2C19', 'CYP3A4'], inhibitor: [], inducer: [], serotonergic: true },
  mirtazapine: { substrate: ['CYP1A2', 'CYP2D6', 'CYP3A4'], inhibitor: [], inducer: [], serotonergic: true },
  // Experimental
  fenbendazole: { substrate: ['CYP3A4', 'CYP2C19', 'CYP2J2'], inhibitor: [], inducer: [] },
  ivermectin: { substrate: ['CYP3A4'], inhibitor: ['CYP3A4_weak', 'CYP2D6_weak'], inducer: [] },
  // Supplements with interactions
  st_johns_wort: { substrate: [], inhibitor: [], inducer: ['CYP3A4_strong', 'CYP2C9', 'CYP1A2'] },
  curcumin: { substrate: [], inhibitor: ['CYP3A4_weak', 'CYP2C9_weak'], inducer: [] },
  grapefruit: { substrate: [], inhibitor: ['CYP3A4_strong'], inducer: [] },
};

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  mechanism: string;
  severity: 'high' | 'moderate' | 'low';
  description: string;
  recommendation: string;
}

export function checkInteractions(drugNames: string[]): DrugInteraction[] {
  const interactions: DrugInteraction[] = [];
  const normalizedDrugs = drugNames.map(d => d.toLowerCase().replace(/\s+/g, '_'));

  for (let i = 0; i < normalizedDrugs.length; i++) {
    for (let j = i + 1; j < normalizedDrugs.length; j++) {
      const d1 = normalizedDrugs[i];
      const d2 = normalizedDrugs[j];
      const p1 = CYP450_DATABASE[d1];
      const p2 = CYP450_DATABASE[d2];
      if (!p1 || !p2) continue;

      // Check substrate competition
      const sharedEnzymes = p1.substrate.filter(e => p2.substrate.includes(e));
      for (const enzyme of sharedEnzymes) {
        interactions.push({
          drug1: drugNames[i],
          drug2: drugNames[j],
          mechanism: `Oba leki sa substratami ${enzyme}`,
          severity: enzyme.includes('3A4') ? 'moderate' : 'low',
          description: `Konkurencja o metabolizm przez ${enzyme} — mozliwe wyzsze stezenie obu lekow`,
          recommendation: 'Monitorowac efekty uboczne obu lekow',
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
            description: `Mozliwe podwyzszenie stezenia ${drugNames[j]} we krwi`,
            recommendation: severity === 'high' ? 'Skonsultowac z lekarzem — mozliwa zmiana dawki' : 'Monitorowac',
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
            description: `Mozliwe podwyzszenie stezenia ${drugNames[i]} we krwi`,
            recommendation: severity === 'high' ? 'Skonsultowac z lekarzem — mozliwa zmiana dawki' : 'Monitorowac',
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
            description: `Mozliwe obnizenie stezenia ${drugNames[j]} — zmniejszona skutecznosc`,
            recommendation: 'Skonsultowac z lekarzem',
          });
        }
      }

      // Serotonin syndrome risk
      if (p1.serotonergic && p2.serotonergic) {
        interactions.push({
          drug1: drugNames[i],
          drug2: drugNames[j],
          mechanism: 'Oba leki maja dzialanie serotoninergiczne',
          severity: 'high',
          description: 'Ryzyko zespolu serotoninowego — goraczka, pobudzenie, drżenia, biegunka',
          recommendation: 'Konieczna kontrola psychiatry. Monitorowac objawy zespolu serotoninowego.',
        });
      }
    }
  }

  return interactions;
}
