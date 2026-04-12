import { describe, it, expect } from 'vitest';
import {
  calculateCurrentPhase,
  calculateChemoPhase,
  calculateRadiotherapyPhase,
  findPhaseForDay,
  getPhaseColor,
  getPhaseLabel,
  dayToChemoPhase,
  CHEMO_PHASES,
  RADIOTHERAPY_PHASES,
  IMMUNOTHERAPY_PHASES,
  SURGERY_PHASES,
} from '../lib/treatment-cycle';
import type { ChemoSession, RadiotherapySession } from '@/types';

// ==================== PHASE DEFINITIONS ====================

describe('Phase definitions', () => {
  it('chemo has 3 phases: crisis, recovery, rebuild', () => {
    expect(CHEMO_PHASES).toHaveLength(3);
    expect(CHEMO_PHASES.map(p => p.id)).toEqual(['crisis', 'recovery', 'rebuild']);
  });

  it('radiotherapy has active_treatment phase', () => {
    expect(RADIOTHERAPY_PHASES.length).toBeGreaterThan(0);
    expect(RADIOTHERAPY_PHASES[0].id).toBe('active_treatment');
  });

  it('immunotherapy has post_infusion and monitoring', () => {
    expect(IMMUNOTHERAPY_PHASES).toHaveLength(2);
    expect(IMMUNOTHERAPY_PHASES.map(p => p.id)).toEqual(['post_infusion', 'monitoring']);
  });

  it('surgery has 3 recovery phases', () => {
    expect(SURGERY_PHASES).toHaveLength(3);
    expect(SURGERY_PHASES.map(p => p.id)).toEqual(['acute_recovery', 'rehabilitation', 'full_recovery']);
  });
});

// ==================== findPhaseForDay ====================

describe('findPhaseForDay', () => {
  it('day 0 = crisis', () => {
    expect(findPhaseForDay(0, CHEMO_PHASES)?.id).toBe('crisis');
  });

  it('day 3 = crisis', () => {
    expect(findPhaseForDay(3, CHEMO_PHASES)?.id).toBe('crisis');
  });

  it('day 4 = recovery', () => {
    expect(findPhaseForDay(4, CHEMO_PHASES)?.id).toBe('recovery');
  });

  it('day 7 = recovery', () => {
    expect(findPhaseForDay(7, CHEMO_PHASES)?.id).toBe('recovery');
  });

  it('day 8 = rebuild', () => {
    expect(findPhaseForDay(8, CHEMO_PHASES)?.id).toBe('rebuild');
  });

  it('day 21 = rebuild', () => {
    expect(findPhaseForDay(21, CHEMO_PHASES)?.id).toBe('rebuild');
  });

  it('returns null for empty phases', () => {
    expect(findPhaseForDay(5, [])).toBeNull();
  });
});

// ==================== dayToChemoPhase ====================

describe('dayToChemoPhase', () => {
  it('day 0-3 = A', () => {
    expect(dayToChemoPhase(0)).toBe('A');
    expect(dayToChemoPhase(3)).toBe('A');
  });

  it('day 4-7 = B', () => {
    expect(dayToChemoPhase(4)).toBe('B');
    expect(dayToChemoPhase(7)).toBe('B');
  });

  it('day 8+ = C', () => {
    expect(dayToChemoPhase(8)).toBe('C');
    expect(dayToChemoPhase(21)).toBe('C');
  });
});

// ==================== calculateCurrentPhase (backward compat) ====================

describe('calculateCurrentPhase — backward compatibility', () => {
  it('returns null phase with no sessions', () => {
    const result = calculateCurrentPhase([]);
    expect(result.phase).toBeNull();
    expect(result.dayInCycle).toBe(0);
  });

  it('returns C phase when waiting for first chemo', () => {
    const sessions: ChemoSession[] = [{
      id: '1', date: '2026-01-01', plannedDate: '2026-01-01',
      status: 'planned', drugs: [], cycle: 1, notes: '', sideEffects: [],
    }];
    const result = calculateCurrentPhase(sessions);
    expect(result.phase).toBe('C');
  });

  it('returns correct structure', () => {
    const result = calculateCurrentPhase([]);
    expect(result).toHaveProperty('phase');
    expect(result).toHaveProperty('dayInCycle');
    expect(result).toHaveProperty('description');
  });
});

// ==================== calculateChemoPhase ====================

describe('calculateChemoPhase', () => {
  it('has treatmentType chemotherapy', () => {
    const result = calculateChemoPhase([]);
    expect(result.treatmentType).toBe('chemotherapy');
  });

  it('returns chemoPhase for backward compat', () => {
    const result = calculateChemoPhase([]);
    expect(result).toHaveProperty('chemoPhase');
  });
});

// ==================== calculateRadiotherapyPhase ====================

describe('calculateRadiotherapyPhase', () => {
  it('returns RT treatmentType', () => {
    const result = calculateRadiotherapyPhase([], 25);
    expect(result.treatmentType).toBe('radiotherapy');
  });

  it('returns null phase with no sessions', () => {
    const result = calculateRadiotherapyPhase([], 25);
    expect(result.phase).toBeNull();
    expect(result.dayInCycle).toBe(0);
  });

  it('returns active_treatment when fractions remaining', () => {
    const sessions: RadiotherapySession[] = Array.from({ length: 10 }, (_, i) => ({
      id: String(i), date: `2026-04-${String(i + 1).padStart(2, '0')}`,
      fractionNumber: i + 1, completed: true, doseGy: 2, cumulativeDoseGy: (i + 1) * 2,
    }));
    const result = calculateRadiotherapyPhase(sessions, 25);
    expect(result.phase?.id).toBe('active_treatment');
    expect(result.dayInCycle).toBe(10); // completedFractions
  });

  it('returns null phase when all fractions done', () => {
    const sessions: RadiotherapySession[] = Array.from({ length: 25 }, (_, i) => ({
      id: String(i), date: `2026-04-${String(i + 1).padStart(2, '0')}`,
      fractionNumber: i + 1, completed: true, doseGy: 2, cumulativeDoseGy: (i + 1) * 2,
    }));
    const result = calculateRadiotherapyPhase(sessions, 25);
    expect(result.phase).toBeNull(); // Treatment completed
  });
});

// ==================== UI HELPERS ====================

describe('getPhaseColor', () => {
  it('A = red', () => expect(getPhaseColor('A')).toBe('#e74c3c'));
  it('B = orange', () => expect(getPhaseColor('B')).toBe('#f39c12'));
  it('C = green', () => expect(getPhaseColor('C')).toBe('#27ae60'));
  it('null = gray', () => expect(getPhaseColor(null)).toBe('#888888'));
});

describe('getPhaseLabel', () => {
  it('A = Kryzys', () => expect(getPhaseLabel('A')).toBe('Kryzys'));
  it('B = Regeneracja', () => expect(getPhaseLabel('B')).toBe('Regeneracja'));
  it('C = Odbudowa', () => expect(getPhaseLabel('C')).toBe('Odbudowa'));
  it('null = Nieznana', () => expect(getPhaseLabel(null)).toBe('Nieznana'));
});
