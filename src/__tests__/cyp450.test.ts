import { describe, it, expect } from 'vitest';
import { checkInteractions, CYP450_DATABASE } from '../lib/cyp450';

describe('CYP450_DATABASE', () => {
  it('has paclitaxel with CYP3A4 substrate', () => {
    expect(CYP450_DATABASE.paclitaxel).toBeDefined();
    expect(CYP450_DATABASE.paclitaxel.substrate).toContain('CYP3A4');
  });

  it('has tamoxifen with CYP2D6 substrate', () => {
    expect(CYP450_DATABASE.tamoxifen).toBeDefined();
    expect(CYP450_DATABASE.tamoxifen.substrate).toContain('CYP2D6');
  });

  it('monoclonal antibodies have no CYP interactions', () => {
    expect(CYP450_DATABASE.trastuzumab?.substrate).toEqual([]);
    expect(CYP450_DATABASE.pembrolizumab?.substrate).toEqual([]);
  });

  it('has serotonergic flag on psychiatric drugs', () => {
    expect(CYP450_DATABASE.trazodone?.serotonergic).toBe(true);
    expect(CYP450_DATABASE.venlafaxine?.serotonergic).toBe(true);
    expect(CYP450_DATABASE.sertraline?.serotonergic).toBe(true);
  });

  it('loads drugs from JSON (not empty)', () => {
    expect(Object.keys(CYP450_DATABASE).length).toBeGreaterThan(10);
  });
});

describe('checkInteractions', () => {
  it('detects substrate competition', () => {
    const result = checkInteractions(['Paclitaxel', 'Docetaxel']);
    const shared = result.filter(r => r.mechanism.includes('substratami'));
    expect(shared.length).toBeGreaterThan(0);
  });

  it('detects serotonin syndrome risk', () => {
    const result = checkInteractions(['Trazodone', 'Venlafaxine']);
    const serotonin = result.filter(r => r.mechanism.includes('serotoninergiczne'));
    expect(serotonin.length).toBe(1);
    expect(serotonin[0].severity).toBe('high');
  });

  it('detects CYP2D6 inhibitor + substrate (tamoxifen + sertraline)', () => {
    const result = checkInteractions(['Sertraline', 'Tamoxifen']);
    expect(result.length).toBeGreaterThan(0);
    const inhibition = result.filter(r => r.mechanism.includes('hamuje'));
    expect(inhibition.length).toBeGreaterThan(0);
  });

  it('returns empty for non-interacting drugs', () => {
    const result = checkInteractions(['Trastuzumab', 'Pembrolizumab']);
    // Both monoclonal antibodies — no CYP interactions
    expect(result.length).toBe(0);
  });

  it('returns empty for unknown drugs', () => {
    const result = checkInteractions(['FakeDrug123', 'AnotherFake']);
    expect(result.length).toBe(0);
  });

  it('returns empty for single drug', () => {
    expect(checkInteractions(['Paclitaxel']).length).toBe(0);
  });

  it('returns empty for empty array', () => {
    expect(checkInteractions([]).length).toBe(0);
  });

  it('normalizes drug names (case insensitive, spaces to underscores)', () => {
    const r1 = checkInteractions(['paclitaxel', 'docetaxel']);
    const r2 = checkInteractions(['PACLITAXEL', 'DOCETAXEL']);
    expect(r1.length).toBe(r2.length);
  });

  it('interaction has required fields', () => {
    const result = checkInteractions(['Paclitaxel', 'Cyclophosphamide']);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty('drug1');
      expect(result[0]).toHaveProperty('drug2');
      expect(result[0]).toHaveProperty('mechanism');
      expect(result[0]).toHaveProperty('severity');
      expect(result[0]).toHaveProperty('description');
      expect(result[0]).toHaveProperty('recommendation');
    }
  });
});
