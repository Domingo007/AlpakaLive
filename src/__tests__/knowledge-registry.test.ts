import { describe, it, expect } from 'vitest';
import {
  getDiseaseKnowledge,
  getAllDiseaseIds,
  getDiseaseNames,
  findDrugById,
  getInteractionsForDrugs,
  getMedicalTerms,
  ALL_DRUGS,
  SUPPLEMENTS,
  TUMOR_MARKERS,
  VITALS,
  RT_PROTOCOLS,
  SURGERY_PROCEDURES,
  ABBREVIATIONS,
} from '../lib/medical-data/knowledge-registry';

describe('DISEASE_REGISTRY', () => {
  it('has breast-cancer', () => {
    const bc = getDiseaseKnowledge('breast-cancer');
    expect(bc).not.toBeNull();
    expect(bc!.profile.id).toBe('breast-cancer');
  });

  it('breast-cancer has all required sections', () => {
    const bc = getDiseaseKnowledge('breast-cancer')!;
    expect(bc.profile).toBeDefined();
    expect(bc.regimens).toBeDefined();
    expect(bc.sideEffects).toBeDefined();
    expect(bc.monitoring).toBeDefined();
    expect(bc.education).toBeDefined();
    expect(bc.education.glossary).toBeDefined();
    expect(bc.education.phaseGuides).toBeDefined();
    expect(bc.education.whenToCall).toBeDefined();
    expect(bc.education.faq).toBeDefined();
    expect(bc.education.sideEffectTips).toBeDefined();
  });

  it('returns null for unknown disease', () => {
    expect(getDiseaseKnowledge('unknown')).toBeNull();
  });

  it('getAllDiseaseIds returns array with breast-cancer', () => {
    const ids = getAllDiseaseIds();
    expect(ids).toContain('breast-cancer');
    expect(ids.length).toBeGreaterThan(0);
  });

  it('getDiseaseNames returns localized names', () => {
    const names = getDiseaseNames('pl');
    expect(names.some(n => n.name.includes('Rak piersi'))).toBe(true);
    const namesEn = getDiseaseNames('en');
    expect(namesEn.some(n => n.name.includes('Breast cancer'))).toBe(true);
  });
});

describe('ALL_DRUGS', () => {
  it('has chemo drugs', () => {
    expect(ALL_DRUGS.chemo.length).toBeGreaterThan(0);
    expect(ALL_DRUGS.chemo.some((d: { id: string }) => d.id === 'paclitaxel')).toBe(true);
  });

  it('has immunotherapy drugs', () => {
    expect(ALL_DRUGS.immunotherapy.length).toBeGreaterThan(0);
    expect(ALL_DRUGS.immunotherapy.some((d: { id: string }) => d.id === 'pembrolizumab')).toBe(true);
  });

  it('has targeted drugs', () => {
    expect(ALL_DRUGS.targeted.length).toBeGreaterThan(0);
  });

  it('has hormonal drugs', () => {
    expect(ALL_DRUGS.hormonal.length).toBeGreaterThan(0);
  });

  it('has psychiatric drugs', () => {
    expect(ALL_DRUGS.psychiatric.length).toBeGreaterThan(0);
  });
});

describe('findDrugById', () => {
  it('finds paclitaxel', () => {
    const drug = findDrugById('paclitaxel');
    expect(drug).not.toBeNull();
  });

  it('finds with different casing', () => {
    expect(findDrugById('PACLITAXEL')).not.toBeNull();
    expect(findDrugById('Paclitaxel')).not.toBeNull();
  });

  it('returns null for unknown drug', () => {
    expect(findDrugById('nonexistent_drug')).toBeNull();
  });
});

describe('getInteractionsForDrugs', () => {
  it('finds interactions for tamoxifen', () => {
    const interactions = getInteractionsForDrugs(['tamoxifen']);
    expect(interactions.length).toBeGreaterThan(0);
  });

  it('returns empty for drugs without interactions', () => {
    expect(getInteractionsForDrugs(['unknown_drug']).length).toBe(0);
  });
});

describe('getMedicalTerms', () => {
  it('returns Polish terms', () => {
    const terms = getMedicalTerms('pl');
    expect(terms.language).toBe('pl');
    expect(terms.terms).toBeDefined();
  });

  it('returns German terms', () => {
    const terms = getMedicalTerms('de');
    expect(terms.language).toBe('de');
  });

  it('defaults to English', () => {
    const terms = getMedicalTerms('xx');
    expect(terms.language).toBe('en');
  });
});

describe('Shared medical data loads correctly', () => {
  it('SUPPLEMENTS has entries with evidence levels', () => {
    expect(SUPPLEMENTS.supplements.length).toBeGreaterThan(3);
    expect(SUPPLEMENTS.supplements.some((s: { id: string }) => s.id === 'vitamin_d3')).toBe(true);
    expect(SUPPLEMENTS.supplements.some((s: { id: string }) => s.id === 'st_johns_wort')).toBe(true);
  });

  it('TUMOR_MARKERS has CA 15-3 and CEA', () => {
    expect(TUMOR_MARKERS.markers.some((m: { id: string }) => m.id === 'ca153')).toBe(true);
    expect(TUMOR_MARKERS.markers.some((m: { id: string }) => m.id === 'cea')).toBe(true);
  });

  it('VITALS has heart rate, temperature, SpO2', () => {
    expect(VITALS.vitals.some((v: { id: string }) => v.id === 'heart_rate')).toBe(true);
    expect(VITALS.vitals.some((v: { id: string }) => v.id === 'temperature')).toBe(true);
    expect(VITALS.vitals.some((v: { id: string }) => v.id === 'spo2')).toBe(true);
  });

  it('RT_PROTOCOLS has breast protocols', () => {
    expect(RT_PROTOCOLS.protocols.length).toBeGreaterThan(0);
  });

  it('SURGERY_PROCEDURES has mastectomy', () => {
    expect(SURGERY_PROCEDURES.procedures.some((p: { id: string }) => p.id === 'mastectomy_total')).toBe(true);
  });

  it('ABBREVIATIONS has RECIST and CTCAE', () => {
    expect(ABBREVIATIONS.abbreviations.some((a: { abbr: string }) => a.abbr === 'RECIST')).toBe(true);
    expect(ABBREVIATIONS.abbreviations.some((a: { abbr: string }) => a.abbr === 'CTCAE')).toBe(true);
  });
});
