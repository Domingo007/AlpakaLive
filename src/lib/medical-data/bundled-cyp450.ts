/*
 * AlpacaLive — Bundled CYP450 drug interaction database (default fallback).
 * These are shipped with the app and used when no external data is available.
 * Community: update via PRs to the reference-data repository.
 */
import type { CYP450Profile } from './types';

export const BUNDLED_CYP450: Record<string, CYP450Profile> = {
  // Chemotherapy
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
  // Monoclonal antibodies (no CYP interactions)
  trastuzumab: { substrate: [], inhibitor: [], inducer: [] },
  pembrolizumab: { substrate: [], inhibitor: [], inducer: [] },
  nivolumab: { substrate: [], inhibitor: [], inducer: [] },
  atezolizumab: { substrate: [], inhibitor: [], inducer: [] },
  durvalumab: { substrate: [], inhibitor: [], inducer: [] },
  ipilimumab: { substrate: [], inhibitor: [], inducer: [] },
  // Targeted therapy
  palbociclib: { substrate: ['CYP3A4'], inhibitor: [], inducer: [] },
  ribociclib: { substrate: ['CYP3A4'], inhibitor: ['CYP3A4_moderate'], inducer: [] },
  abemaciclib: { substrate: ['CYP3A4'], inhibitor: [], inducer: [] },
  olaparib: { substrate: ['CYP3A4'], inhibitor: [], inducer: [] },
  lapatinib: { substrate: ['CYP3A4', 'CYP2C8'], inhibitor: ['CYP3A4_weak'], inducer: [] },
  // Hormonal therapy
  anastrozole: { substrate: ['CYP3A4'], inhibitor: [], inducer: [] },
  exemestane: { substrate: ['CYP3A4'], inhibitor: [], inducer: [] },
  fulvestrant: { substrate: ['CYP3A4'], inhibitor: [], inducer: [] },
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
