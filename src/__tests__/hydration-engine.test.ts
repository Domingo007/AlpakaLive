import { describe, it, expect } from 'vitest';
import {
  buildHydrationBaseline,
  computeHydrationFlag,
  type HydrationInputs,
  type HydrationBaseline,
} from '../lib/hydration-engine';

describe('buildHydrationBaseline', () => {
  it('returns hasMinimumData=false when no measurements', () => {
    const baseline = buildHydrationBaseline([]);
    expect(baseline.hasMinimumData).toBe(false);
  });

  it('computes average body water over last 7 days', () => {
    const measurements = Array.from({ length: 7 }, (_, i) => ({
      date: `2026-04-${String(17 + i).padStart(2, '0')}`,
      bodyWaterMass: 30 + i * 0.1,
    }));
    const baseline = buildHydrationBaseline(measurements);
    expect(baseline.hasMinimumData).toBe(true);
    expect(baseline.bodyWaterMass).toBeCloseTo(30.3, 1);
  });

  it('takes only last 7 days if more provided', () => {
    const measurements = Array.from({ length: 14 }, (_, i) => ({
      date: `2026-04-${String(10 + i).padStart(2, '0')}`,
      restingHR: 60 + i,
    }));
    const baseline = buildHydrationBaseline(measurements);
    // Last 7 days (indices 7..13): HR 67..73, avg = 70
    expect(baseline.restingHeartRate).toBe(70);
  });

  it('hasMinimumData=true with 5+ days of any single stream', () => {
    const measurements = Array.from({ length: 5 }, (_, i) => ({
      date: `2026-04-${String(17 + i).padStart(2, '0')}`,
      restingHR: 65,
    }));
    const baseline = buildHydrationBaseline(measurements);
    expect(baseline.hasMinimumData).toBe(true);
    expect(baseline.bodyWaterMass).toBeUndefined();
    expect(baseline.restingHeartRate).toBe(65);
  });

  it('hasMinimumData=false with only 4 days', () => {
    const measurements = Array.from({ length: 4 }, (_, i) => ({
      date: `2026-04-${String(17 + i).padStart(2, '0')}`,
      restingHR: 65,
    }));
    const baseline = buildHydrationBaseline(measurements);
    expect(baseline.hasMinimumData).toBe(false);
  });
});

describe('computeHydrationFlag', () => {
  const baseBaseline: HydrationBaseline = {
    windowDays: 7,
    startDate: '2026-04-17',
    endDate: '2026-04-23',
    bodyWaterMass: 30,
    restingHeartRate: 65,
    heartRateVariability: 50,
    skinTemperature: 33.5,
    dataPoints: { bodyWater: 7, hr: 7, hrv: 7, temp: 7 },
    hasMinimumData: true,
  };

  const baseInputs: HydrationInputs = {
    dailyMeasurements: [{ date: '2026-04-24', bodyWaterMass: 30, restingHR: 65 }],
    latestBloodResults: null,
    previousBloodResults: null,
    todayLog: null,
    chemoContext: null,
  };

  it('returns gray when baseline not available', () => {
    const noBaseline: HydrationBaseline = {
      ...baseBaseline,
      hasMinimumData: false,
      dataPoints: { bodyWater: 2, hr: 2, hrv: 2, temp: 2 },
    };
    const flag = computeHydrationFlag(baseInputs, noBaseline);
    expect(flag.color).toBe('gray');
    expect(flag.baselineAvailable).toBe(false);
    expect(flag.daysUntilBaseline).toBeDefined();
  });

  it('returns green with no anomalies', () => {
    const flag = computeHydrationFlag(baseInputs, baseBaseline);
    expect(flag.color).toBe('green');
    expect(flag.reasons).toHaveLength(0);
  });

  it('flags yellow on body water drop ≥2%', () => {
    const inputs: HydrationInputs = {
      ...baseInputs,
      dailyMeasurements: [{ date: '2026-04-24', bodyWaterMass: 29.3 }],
    };
    const flag = computeHydrationFlag(inputs, baseBaseline);
    expect(flag.color).toBe('yellow');
    expect(flag.reasons[0].type).toBe('body_water_drop');
    expect(flag.reasons[0].severity).toBe('moderate');
  });

  it('flags red on body water drop ≥3%', () => {
    const inputs: HydrationInputs = {
      ...baseInputs,
      dailyMeasurements: [{ date: '2026-04-24', bodyWaterMass: 29 }],
    };
    const flag = computeHydrationFlag(inputs, baseBaseline);
    expect(flag.color).toBe('red');
    expect(flag.reasons[0].severity).toBe('strong');
  });

  it('flags yellow on HR elevation ≥10%', () => {
    const inputs: HydrationInputs = {
      ...baseInputs,
      dailyMeasurements: [{ date: '2026-04-24', restingHR: 72 }],
    };
    const flag = computeHydrationFlag(inputs, baseBaseline);
    expect(flag.color).toBe('yellow');
    expect(flag.reasons[0].type).toBe('hr_elevation');
  });

  it('flags yellow on GI symptoms: nausea≥8 AND bowel=loose', () => {
    const inputs: HydrationInputs = {
      ...baseInputs,
      todayLog: { nausea: 8, bowel: 'loose' },
    };
    const flag = computeHydrationFlag(inputs, baseBaseline);
    expect(flag.color).toBe('yellow');
    expect(flag.reasons[0].type).toBe('gi_symptoms');
  });

  it('does NOT flag on nausea≥8 alone (conservative mapping)', () => {
    const inputs: HydrationInputs = {
      ...baseInputs,
      todayLog: { nausea: 9, bowel: 'normal' },
    };
    const flag = computeHydrationFlag(inputs, baseBaseline);
    expect(flag.color).toBe('green');
  });

  it('does NOT flag on bowel=loose alone (conservative mapping)', () => {
    const inputs: HydrationInputs = {
      ...baseInputs,
      todayLog: { nausea: 5, bowel: 'loose' },
    };
    const flag = computeHydrationFlag(inputs, baseBaseline);
    expect(flag.color).toBe('green');
  });

  it('flags yellow on creatinine rise ≥15%', () => {
    const inputs: HydrationInputs = {
      ...baseInputs,
      latestBloodResults: { date: '2026-04-24', creatinine: 1.0 },
      previousBloodResults: { date: '2026-04-17', creatinine: 0.85 },
    };
    const flag = computeHydrationFlag(inputs, baseBaseline);
    expect(flag.color).toBe('yellow');
    expect(flag.reasons[0].type).toBe('creatinine_rise');
  });

  it('flags red on creatinine rise ≥25%', () => {
    const inputs: HydrationInputs = {
      ...baseInputs,
      latestBloodResults: { date: '2026-04-24', creatinine: 1.1 },
      previousBloodResults: { date: '2026-04-17', creatinine: 0.85 },
    };
    const flag = computeHydrationFlag(inputs, baseBaseline);
    expect(flag.color).toBe('red');
  });

  it('flags red on ≥2 yellow conditions (body water + HR)', () => {
    const inputs: HydrationInputs = {
      ...baseInputs,
      dailyMeasurements: [{ date: '2026-04-24', bodyWaterMass: 29.3, restingHR: 72 }],
    };
    const flag = computeHydrationFlag(inputs, baseBaseline);
    expect(flag.color).toBe('red');
    expect(flag.reasons.length).toBeGreaterThanOrEqual(2);
  });

  it('applies nephrotoxic modifier (25% more sensitive)', () => {
    // 1.7% drop: above modified threshold (1.5%) but below normal (2%)
    const inputs: HydrationInputs = {
      ...baseInputs,
      dailyMeasurements: [{ date: '2026-04-24', bodyWaterMass: 29.49 }],
      chemoContext: { dayInCycle: 2, drugs: ['carboplatin'], isNephrotoxicDay: true },
    };
    const flag = computeHydrationFlag(inputs, baseBaseline);
    expect(flag.color).toBe('yellow');
    expect(flag.reasons[0].type).toBe('body_water_drop');
  });

  it('does NOT flag the same drop (1.7%) without nephrotoxic modifier', () => {
    const inputs: HydrationInputs = {
      ...baseInputs,
      dailyMeasurements: [{ date: '2026-04-24', bodyWaterMass: 29.49 }],
      chemoContext: null,
    };
    const flag = computeHydrationFlag(inputs, baseBaseline);
    expect(flag.color).toBe('green');
  });

  it('dataAvailability correctly reflects partial data', () => {
    const inputs: HydrationInputs = {
      ...baseInputs,
      dailyMeasurements: [{ date: '2026-04-24', restingHR: 65 }],
      latestBloodResults: { date: '2026-04-24', creatinine: 0.9 },
    };
    const flag = computeHydrationFlag(inputs, baseBaseline);
    expect(flag.dataAvailability.hasBodyWater).toBe(false);
    expect(flag.dataAvailability.hasBloodResults).toBe(true);
    expect(flag.dataAvailability.hasWatchData).toBe(true);
  });

  it('does not flag when body water data absent (graceful degradation)', () => {
    const inputs: HydrationInputs = {
      ...baseInputs,
      dailyMeasurements: [{ date: '2026-04-24', restingHR: 65 }],
    };
    const flag = computeHydrationFlag(inputs, baseBaseline);
    expect(flag.color).toBe('green');
    expect(flag.reasons.find(r => r.type === 'body_water_drop')).toBeUndefined();
  });
});
