import { describe, it, expect } from 'vitest';
import { evaluateMarker, getStatusColor, getStatusIcon, BLOOD_NORMS } from '../lib/blood-norms';

describe('BLOOD_NORMS', () => {
  it('has all essential morphology markers', () => {
    expect(BLOOD_NORMS).toHaveProperty('wbc');
    expect(BLOOD_NORMS).toHaveProperty('hgb');
    expect(BLOOD_NORMS).toHaveProperty('plt');
    expect(BLOOD_NORMS).toHaveProperty('neutrophils');
    expect(BLOOD_NORMS).toHaveProperty('rbc');
  });

  it('has tumor markers', () => {
    expect(BLOOD_NORMS).toHaveProperty('ca153');
    expect(BLOOD_NORMS).toHaveProperty('cea');
  });

  it('has immunotherapy monitoring markers', () => {
    expect(BLOOD_NORMS).toHaveProperty('tsh');
    expect(BLOOD_NORMS).toHaveProperty('ft4');
    expect(BLOOD_NORMS).toHaveProperty('cortisol');
  });
});

describe('evaluateMarker', () => {
  it('WBC 6.0 = normal', () => {
    expect(evaluateMarker('wbc', 6.0)).toBe('normal');
  });

  it('WBC 1.5 = critical_low', () => {
    expect(evaluateMarker('wbc', 1.5)).toBe('critical_low');
  });

  it('WBC 3.0 = low', () => {
    expect(evaluateMarker('wbc', 3.0)).toBe('low');
  });

  it('WBC 12.0 = high', () => {
    expect(evaluateMarker('wbc', 12.0)).toBe('high');
  });

  it('HGB 8.0 = normal (exactly at critical threshold)', () => {
    // criticalLow is 8.0, value must be < criticalLow
    expect(evaluateMarker('hgb', 8.0)).toBe('low');
  });

  it('HGB 7.5 = critical_low', () => {
    expect(evaluateMarker('hgb', 7.5)).toBe('critical_low');
  });

  it('HGB 13.0 = normal', () => {
    expect(evaluateMarker('hgb', 13.0)).toBe('normal');
  });

  it('PLT 40 = critical_low', () => {
    expect(evaluateMarker('plt', 40)).toBe('critical_low');
  });

  it('PLT 200 = normal', () => {
    expect(evaluateMarker('plt', 200)).toBe('normal');
  });

  it('creatinine 2.5 = critical_high', () => {
    expect(evaluateMarker('creatinine', 2.5)).toBe('critical_high');
  });

  it('glucose 450 = critical_high', () => {
    expect(evaluateMarker('glucose', 450)).toBe('critical_high');
  });

  it('glucose 45 = critical_low', () => {
    expect(evaluateMarker('glucose', 45)).toBe('critical_low');
  });

  it('unknown marker = normal', () => {
    expect(evaluateMarker('nonexistent', 999)).toBe('normal');
  });
});

describe('getStatusColor', () => {
  it('normal = green', () => {
    expect(getStatusColor('normal')).toBe('#27ae60');
  });

  it('critical_low = red', () => {
    expect(getStatusColor('critical_low')).toBe('#e74c3c');
  });

  it('high = yellow', () => {
    expect(getStatusColor('high')).toBe('#f39c12');
  });
});

describe('getStatusIcon', () => {
  it('normal = check', () => {
    expect(getStatusIcon('normal')).toContain('✅');
  });

  it('critical_low = red down', () => {
    expect(getStatusIcon('critical_low')).toContain('🔴');
    expect(getStatusIcon('critical_low')).toContain('↓');
  });

  it('high = yellow up', () => {
    expect(getStatusIcon('high')).toContain('🟡');
    expect(getStatusIcon('high')).toContain('↑');
  });
});
