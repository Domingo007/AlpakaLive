import { describe, it, expect, vi, beforeEach } from 'vitest';

// Dexie mock MUST be declared before importing adapter
const mockDaily = vi.fn();
const mockBlood = vi.fn();
const mockChemo = vi.fn();
const mockWearable = vi.fn();

vi.mock('../lib/db', () => ({
  db: {
    daily: {
      where: () => ({ between: () => ({ toArray: mockDaily }) }),
    },
    blood: {
      orderBy: () => ({ reverse: () => ({ limit: () => ({ toArray: mockBlood }) }) }),
    },
    chemo: {
      where: () => ({ between: () => ({ toArray: mockChemo }) }),
    },
    wearable: {
      where: () => ({ between: () => ({ toArray: mockWearable }) }),
    },
  },
}));

import { collectHydrationInputs, _internal } from '../lib/hydration-adapter';

describe('_internal.normalizeBowel', () => {
  it('maps loose/diarrhea variants', () => {
    expect(_internal.normalizeBowel('biegunka')).toBe('loose');
    expect(_internal.normalizeBowel('diarrhea')).toBe('loose');
    expect(_internal.normalizeBowel('luźne')).toBe('loose');
    expect(_internal.normalizeBowel('loose')).toBe('loose');
  });

  it('maps very_loose when watery', () => {
    expect(_internal.normalizeBowel('wodniste')).toBe('very_loose');
    expect(_internal.normalizeBowel('watery')).toBe('very_loose');
    expect(_internal.normalizeBowel('very loose')).toBe('very_loose');
  });

  it('maps normal and constipated', () => {
    expect(_internal.normalizeBowel('normalne')).toBe('normal');
    expect(_internal.normalizeBowel('zaparcie')).toBe('constipated');
  });

  it('returns undefined for empty/null/unrecognized', () => {
    expect(_internal.normalizeBowel(undefined)).toBeUndefined();
    expect(_internal.normalizeBowel('xyzzy')).toBeUndefined();
  });
});

describe('_internal.isNephrotoxicDrugList', () => {
  it('flags nephrotoxic drugs', () => {
    expect(_internal.isNephrotoxicDrugList(['carboplatin'])).toBe(true);
    expect(_internal.isNephrotoxicDrugList(['Cisplatin'])).toBe(true);
    expect(_internal.isNephrotoxicDrugList(['paclitaxel', 'methotrexate'])).toBe(true);
  });

  it('does not flag safe drug combos', () => {
    expect(_internal.isNephrotoxicDrugList(['paclitaxel', 'gemcitabine'])).toBe(false);
    expect(_internal.isNephrotoxicDrugList([])).toBe(false);
    expect(_internal.isNephrotoxicDrugList(undefined)).toBe(false);
  });
});

describe('collectHydrationInputs', () => {
  beforeEach(() => {
    mockDaily.mockReset();
    mockBlood.mockReset();
    mockChemo.mockReset();
    mockWearable.mockReset();
  });

  it('builds inputs from all 4 tables', async () => {
    mockDaily.mockResolvedValue([
      {
        id: 'd1',
        date: '2026-04-24',
        time: '08:00',
        energy: 4,
        pain: 2,
        nausea: 3,
        mood: 5,
        neuropathy: 0,
        appetite: 5,
        notes: '',
        chemoPhase: null,
        dayInCycle: 2,
        bowel: 'normalne',
        weight: 54.5,
        heartRate: 72,
      },
    ]);
    mockWearable.mockResolvedValue([
      { id: 'w1', date: '2026-04-24', source: 'manual', rhr: 65, hrv: 50, spo2: 98, sleepHours: 7, deepSleep: 1.5, remSleep: 1.8, lightSleep: 3.7, steps: 5000, activeMinutes: 30, biocharge: 70, skinTemperature: 33.5 },
    ]);
    mockBlood.mockResolvedValue([
      { id: 'b1', date: '2026-04-24', source: 'manual', markers: { creatinine: 0.9, sodium: 140, hct: 38, urea: 25 }, notes: '' },
      { id: 'b0', date: '2026-04-17', source: 'manual', markers: { creatinine: 0.85 }, notes: '' },
    ]);
    mockChemo.mockResolvedValue([
      { id: 'c1', date: '2026-04-23', plannedDate: '2026-04-23', status: 'completed', drugs: ['carboplatin'], cycle: 3, notes: '', sideEffects: [] },
    ]);

    const inputs = await collectHydrationInputs(new Date('2026-04-24T12:00:00Z'));

    expect(inputs.dailyMeasurements).toHaveLength(1);
    expect(inputs.dailyMeasurements[0].restingHR).toBe(65); // wearable rhr, not daily heartRate
    expect(inputs.dailyMeasurements[0].skinTemp).toBe(33.5);
    expect(inputs.dailyMeasurements[0].bodyWaterMass).toBeUndefined();
    expect(inputs.latestBloodResults?.creatinine).toBe(0.9);
    expect(inputs.latestBloodResults?.hematocrit).toBe(38);
    expect(inputs.latestBloodResults?.bun).toBe(25);
    expect(inputs.previousBloodResults?.creatinine).toBe(0.85);
    expect(inputs.todayLog?.nausea).toBe(3);
    expect(inputs.todayLog?.bowel).toBe('normal');
    expect(inputs.chemoContext?.isNephrotoxicDay).toBe(true);
  });

  it('handles empty tables gracefully', async () => {
    mockDaily.mockResolvedValue([]);
    mockWearable.mockResolvedValue([]);
    mockBlood.mockResolvedValue([]);
    mockChemo.mockResolvedValue([]);

    const inputs = await collectHydrationInputs(new Date('2026-04-24'));

    expect(inputs.dailyMeasurements).toHaveLength(0);
    expect(inputs.latestBloodResults).toBeNull();
    expect(inputs.previousBloodResults).toBeNull();
    expect(inputs.todayLog).toBeNull();
    expect(inputs.chemoContext).toBeNull();
  });

  it('uses daily heartRate when wearable has no rhr for that date', async () => {
    mockDaily.mockResolvedValue([
      { id: 'd1', date: '2026-04-24', time: '08:00', energy: 5, pain: 0, nausea: 0, mood: 5, neuropathy: 0, appetite: 5, notes: '', chemoPhase: null, dayInCycle: 0, heartRate: 80 },
    ]);
    mockWearable.mockResolvedValue([]);
    mockBlood.mockResolvedValue([]);
    mockChemo.mockResolvedValue([]);

    const inputs = await collectHydrationInputs(new Date('2026-04-24'));
    expect(inputs.dailyMeasurements[0].restingHR).toBe(80);
  });

  it('ignores chemo sessions with status=planned/postponed', async () => {
    mockDaily.mockResolvedValue([]);
    mockWearable.mockResolvedValue([]);
    mockBlood.mockResolvedValue([]);
    mockChemo.mockResolvedValue([
      { id: 'c1', date: '2026-04-23', plannedDate: '2026-04-23', status: 'planned', drugs: ['carboplatin'], cycle: 3, notes: '', sideEffects: [] },
    ]);

    const inputs = await collectHydrationInputs(new Date('2026-04-24'));
    expect(inputs.chemoContext).toBeNull();
  });
});
