import { describe, it, expect } from 'vitest';
import { evaluatePreChemoBlood } from '../lib/chemo-scheduler';

describe('evaluatePreChemoBlood', () => {
  it('GO: all values normal', () => {
    const result = evaluatePreChemoBlood({ wbc: 6.0, neutrophils: 3.0, plt: 200, hgb: 12.0 });
    expect(result.readiness).toBe('go');
    expect(result.issues).toHaveLength(0);
    expect(result.affectedPredictions).toBe(false);
  });

  it('POSTPONE: neutrophils critical low (<1.0)', () => {
    const result = evaluatePreChemoBlood({ neutrophils: 0.8, plt: 200, hgb: 12.0 });
    expect(result.readiness).toBe('postpone');
    expect(result.issues.some(i => i.includes('Neutropenia'))).toBe(true);
    expect(result.affectedPredictions).toBe(true);
  });

  it('POSTPONE: platelets critical low (<50)', () => {
    const result = evaluatePreChemoBlood({ neutrophils: 2.0, plt: 40, hgb: 12.0 });
    expect(result.readiness).toBe('postpone');
    expect(result.issues.some(i => i.includes('Trombocytopenia'))).toBe(true);
  });

  it('CAUTION: WBC below 2.0', () => {
    const result = evaluatePreChemoBlood({ wbc: 1.8, neutrophils: 1.5, plt: 100, hgb: 10.0 });
    expect(result.readiness).toBe('caution');
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it('CAUTION: hemoglobin below 8.0', () => {
    const result = evaluatePreChemoBlood({ wbc: 4.0, neutrophils: 2.0, plt: 150, hgb: 7.5 });
    expect(result.readiness).toBe('caution');
  });

  it('CAUTION: PLT below 75 (relative)', () => {
    const result = evaluatePreChemoBlood({ neutrophils: 2.0, plt: 60, hgb: 12.0 });
    // PLT 60 is above absolute (50) but below relative (75)
    expect(result.readiness).toBe('caution');
  });

  it('POSTPONE overrides CAUTION', () => {
    const result = evaluatePreChemoBlood({ neutrophils: 0.5, plt: 60, hgb: 7.0 });
    // Neutrophils <1.0 = POSTPONE, even though PLT and HGB are also bad
    expect(result.readiness).toBe('postpone');
  });

  it('handles partial data (only neutrophils)', () => {
    const result = evaluatePreChemoBlood({ neutrophils: 2.0 });
    expect(result.readiness).toBe('go');
  });

  it('handles empty data', () => {
    const result = evaluatePreChemoBlood({});
    expect(result.readiness).toBe('go');
    expect(result.issues).toHaveLength(0);
  });

  it('recommendation text is not empty', () => {
    const go = evaluatePreChemoBlood({ neutrophils: 3.0, plt: 200 });
    const postpone = evaluatePreChemoBlood({ neutrophils: 0.5 });
    expect(go.recommendation.length).toBeGreaterThan(10);
    expect(postpone.recommendation.length).toBeGreaterThan(10);
  });
});
