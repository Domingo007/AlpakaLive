import { describe, it, expect } from 'vitest';
import { matchDiagnosis, getRelevantBloodMarkers, getAllRegimens, getRegimensForSubtype } from '../lib/medical-data/disease-matcher';

describe('matchDiagnosis', () => {
  // Polish
  it('matches "rak piersi"', () => {
    expect(matchDiagnosis('rak piersi')).toBe('breast-cancer');
  });

  it('matches "Rak piersi lewej inwazyjny"', () => {
    expect(matchDiagnosis('Rak piersi lewej inwazyjny')).toBe('breast-cancer');
  });

  it('matches "nowotwór piersi"', () => {
    expect(matchDiagnosis('nowotwór piersi')).toBe('breast-cancer');
  });

  it('matches "guz piersi"', () => {
    expect(matchDiagnosis('guz piersi')).toBe('breast-cancer');
  });

  it('matches "carcinoma mammae"', () => {
    expect(matchDiagnosis('carcinoma mammae')).toBe('breast-cancer');
  });

  // English
  it('matches "breast cancer"', () => {
    expect(matchDiagnosis('breast cancer')).toBe('breast-cancer');
  });

  it('matches "Breast Carcinoma"', () => {
    expect(matchDiagnosis('Breast Carcinoma')).toBe('breast-cancer');
  });

  // ICD-10
  it('matches ICD-10 code C50', () => {
    expect(matchDiagnosis('C50')).toBe('breast-cancer');
  });

  it('matches ICD-10 code C50.4', () => {
    expect(matchDiagnosis('C50.4')).toBe('breast-cancer');
  });

  // Case insensitive
  it('is case insensitive', () => {
    expect(matchDiagnosis('RAK PIERSI')).toBe('breast-cancer');
    expect(matchDiagnosis('BREAST CANCER')).toBe('breast-cancer');
  });

  // No match
  it('returns null for unknown disease', () => {
    expect(matchDiagnosis('cukrzyca')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(matchDiagnosis('')).toBeNull();
  });

  it('returns null for random text', () => {
    expect(matchDiagnosis('lorem ipsum dolor sit amet')).toBeNull();
  });
});

describe('getRelevantBloodMarkers', () => {
  it('returns markers for breast cancer', () => {
    const markers = getRelevantBloodMarkers('breast-cancer');
    expect(markers).toContain('wbc');
    expect(markers).toContain('hgb');
    expect(markers).toContain('ca153');
    expect(markers).toContain('cea');
    expect(markers.length).toBeGreaterThan(10);
  });

  it('returns empty array for unknown disease', () => {
    expect(getRelevantBloodMarkers('unknown')).toEqual([]);
  });
});

describe('getAllRegimens', () => {
  it('returns regimens for breast cancer', () => {
    const regimens = getAllRegimens('breast-cancer');
    expect(regimens.length).toBeGreaterThanOrEqual(5);
    expect(regimens.map(r => r.id)).toContain('ec');
    expect(regimens.map(r => r.id)).toContain('ac');
    expect(regimens.map(r => r.id)).toContain('tc');
  });

  it('returns empty for unknown disease', () => {
    expect(getAllRegimens('unknown')).toEqual([]);
  });
});

describe('getRegimensForSubtype', () => {
  it('returns EC for luminal_b', () => {
    const regimens = getRegimensForSubtype('breast-cancer', 'luminal_b');
    expect(regimens.map(r => r.id)).toContain('ec');
  });

  it('returns pembrolizumab for TNBC', () => {
    const regimens = getRegimensForSubtype('breast-cancer', 'tnbc');
    expect(regimens.map(r => r.id)).toContain('pembrolizumab_chemo');
  });

  it('returns TCH for HER2+', () => {
    const regimens = getRegimensForSubtype('breast-cancer', 'her2_positive');
    expect(regimens.map(r => r.id)).toContain('tch');
  });

  it('returns empty for unknown subtype', () => {
    const regimens = getRegimensForSubtype('breast-cancer', 'nonexistent');
    expect(regimens).toEqual([]);
  });
});
