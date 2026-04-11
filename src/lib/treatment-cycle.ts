/*
 * AlpacaLive — Your Companion Through Cancer Treatment
 * Copyright (C) 2025 AlpacaLive Contributors
 * Licensed under AGPL-3.0 — see LICENSE file
 *
 * Generic treatment cycle system — replaces chemo-specific phase-calculator.ts
 * Each treatment type defines its own phases. Chemo A/B/C is one implementation.
 */
import type { TreatmentType, ChemoSession, TreatmentProtocol, RadiotherapySession } from '@/types';

// ==================== PHASE DEFINITIONS ====================

export interface PhaseDefinition {
  id: string;
  label: string;
  labelEn: string;
  color: string;
  dayRange: [number, number]; // [start, end] inclusive, relative to anchor event
  description: string;
  descriptionEn: string;
}

export interface TreatmentPhaseConfig {
  treatmentType: TreatmentType;
  phases: PhaseDefinition[];
  cycleLength: number | null; // null = non-cyclic (surgery, hormonal)
  anchorField: string; // what date to anchor phases from
}

export interface TreatmentPhaseInfo {
  treatmentType: TreatmentType;
  phase: PhaseDefinition | null;
  phaseId: string | null;
  dayInCycle: number;
  daysUntilNext?: number;
  description: string;
  // Backward compat for chemo
  chemoPhase: 'A' | 'B' | 'C' | null;
}

// ==================== BUILT-IN PHASE CONFIGS ====================

export const CHEMO_PHASES: PhaseDefinition[] = [
  {
    id: 'crisis',
    label: 'Kryzys',
    labelEn: 'Crisis',
    color: '#e74c3c',
    dayRange: [0, 3],
    description: 'Nawodnienie, sen, zero wysiłku, dieta lekkostrawna.',
    descriptionEn: 'Hydration, rest, no exercise, easily digestible diet.',
  },
  {
    id: 'recovery',
    label: 'Regeneracja',
    labelEn: 'Recovery',
    color: '#f39c12',
    dayRange: [4, 7],
    description: 'Delikatny ruch, pełniejsze posiłki.',
    descriptionEn: 'Gentle exercise, fuller meals.',
  },
  {
    id: 'rebuild',
    label: 'Odbudowa',
    labelEn: 'Rebuild',
    color: '#27ae60',
    dayRange: [8, Infinity],
    description: 'Maks odżywienie, aktywność, wlewy, badania krwi.',
    descriptionEn: 'Max nutrition, activity, infusions, blood tests.',
  },
];

export const RADIOTHERAPY_PHASES: PhaseDefinition[] = [
  {
    id: 'active_treatment',
    label: 'Aktywne leczenie',
    labelEn: 'Active treatment',
    color: '#f59e0b',
    dayRange: [0, Infinity], // lasts for duration of fractions
    description: 'Codzienne sesje RT. Zmęczenie narastające. Monitoruj skórę.',
    descriptionEn: 'Daily RT sessions. Cumulative fatigue. Monitor skin.',
  },
];

export const IMMUNOTHERAPY_PHASES: PhaseDefinition[] = [
  {
    id: 'post_infusion',
    label: 'Po infuzji',
    labelEn: 'Post infusion',
    color: '#06b6d4',
    dayRange: [0, 3],
    description: 'Pierwsze dni po wlewie. Monitoruj objawy irAE.',
    descriptionEn: 'First days post-infusion. Monitor for irAE symptoms.',
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    labelEn: 'Monitoring',
    color: '#0ea5e9',
    dayRange: [4, Infinity],
    description: 'Okres monitorowania irAE. Mogą pojawić się tygodnie po infuzji.',
    descriptionEn: 'irAE monitoring period. Can appear weeks after infusion.',
  },
];

export const SURGERY_PHASES: PhaseDefinition[] = [
  {
    id: 'acute_recovery',
    label: 'Rekonwalescencja ostra',
    labelEn: 'Acute recovery',
    color: '#7c3aed',
    dayRange: [0, 14],
    description: 'Gojenie rany, ograniczenie aktywności, dreny.',
    descriptionEn: 'Wound healing, limited activity, drains.',
  },
  {
    id: 'rehabilitation',
    label: 'Rehabilitacja',
    labelEn: 'Rehabilitation',
    color: '#a78bfa',
    dayRange: [15, 42],
    description: 'Stopniowy powrót aktywności, fizjoterapia.',
    descriptionEn: 'Gradual return to activity, physiotherapy.',
  },
  {
    id: 'full_recovery',
    label: 'Pełna rekonwalescencja',
    labelEn: 'Full recovery',
    color: '#27ae60',
    dayRange: [43, Infinity],
    description: 'Powrót do normalnej aktywności.',
    descriptionEn: 'Return to normal activity.',
  },
];

export const TREATMENT_PHASE_CONFIGS: Record<string, TreatmentPhaseConfig> = {
  chemotherapy: {
    treatmentType: 'chemotherapy',
    phases: CHEMO_PHASES,
    cycleLength: 21,
    anchorField: 'lastSessionDate',
  },
  radiotherapy: {
    treatmentType: 'radiotherapy',
    phases: RADIOTHERAPY_PHASES,
    cycleLength: null,
    anchorField: 'lastSessionDate',
  },
  immunotherapy: {
    treatmentType: 'immunotherapy',
    phases: IMMUNOTHERAPY_PHASES,
    cycleLength: null,
    anchorField: 'lastInfusionDate',
  },
  targeted_therapy: {
    treatmentType: 'targeted_therapy',
    phases: [], // daily pills, no cyclic phases
    cycleLength: null,
    anchorField: 'startDate',
  },
  hormonal_therapy: {
    treatmentType: 'hormonal_therapy',
    phases: [], // daily pills, no cyclic phases
    cycleLength: null,
    anchorField: 'startDate',
  },
};

// ==================== PHASE CALCULATION ====================

/**
 * Find which phase a given day falls into.
 */
export function findPhaseForDay(daysSinceAnchor: number, phases: PhaseDefinition[]): PhaseDefinition | null {
  for (const phase of phases) {
    if (daysSinceAnchor >= phase.dayRange[0] && daysSinceAnchor <= phase.dayRange[1]) {
      return phase;
    }
  }
  return null;
}

/**
 * Map phase ID to legacy ChemoPhase (A/B/C) for backward compatibility.
 */
function phaseIdToChemoPhase(phaseId: string | null): 'A' | 'B' | 'C' | null {
  switch (phaseId) {
    case 'crisis': return 'A';
    case 'recovery': return 'B';
    case 'rebuild': return 'C';
    default: return null;
  }
}

/**
 * Map legacy ChemoPhase to phase ID.
 */
export function chemoPhaseToPhaseId(chemoPhase: 'A' | 'B' | 'C' | null): string | null {
  switch (chemoPhase) {
    case 'A': return 'crisis';
    case 'B': return 'recovery';
    case 'C': return 'rebuild';
    default: return null;
  }
}

/**
 * Calculate current treatment phase for chemotherapy sessions.
 * This is the primary entry point — backward compatible with old calculateCurrentPhase.
 */
export function calculateChemoPhase(
  chemoSessions: ChemoSession[],
  chemoCyclePattern?: string,
): TreatmentPhaseInfo {
  if (chemoSessions.length === 0) {
    return {
      treatmentType: 'chemotherapy',
      phase: null,
      phaseId: null,
      dayInCycle: 0,
      description: 'Brak danych o chemioterapii',
      chemoPhase: null,
    };
  }

  const completed = chemoSessions
    .filter(s => s.status === 'completed' || s.status === 'modified')
    .sort((a, b) => new Date(b.actualDate || b.date).getTime() - new Date(a.actualDate || a.date).getTime());

  if (completed.length === 0) {
    return {
      treatmentType: 'chemotherapy',
      phase: CHEMO_PHASES[2], // rebuild
      phaseId: 'rebuild',
      dayInCycle: 0,
      description: 'Oczekiwanie na pierwszą chemię',
      chemoPhase: 'C',
    };
  }

  const lastChemoDate = new Date(completed[0].actualDate || completed[0].date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastChemoDate.setHours(0, 0, 0, 0);

  const daysSinceChemo = Math.floor((today.getTime() - lastChemoDate.getTime()) / (1000 * 60 * 60 * 24));
  const cycleLength = parseCycleLength(chemoCyclePattern) || 21;

  const phase = findPhaseForDay(daysSinceChemo, CHEMO_PHASES);
  const phaseId = phase?.id || null;
  const chemoPhase = phaseIdToChemoPhase(phaseId);

  let description: string;
  if (chemoPhase === 'A') {
    description = `Faza A — Kryzys (dzień ${daysSinceChemo} po chemii). ${phase?.description || ''}`;
  } else if (chemoPhase === 'B') {
    description = `Faza B — Regeneracja (dzień ${daysSinceChemo} po chemii). ${phase?.description || ''}`;
  } else {
    description = `Faza C — Odbudowa (dzień ${daysSinceChemo} po chemii). ${phase?.description || ''}`;
  }

  const daysUntilNextChemo = Math.max(0, cycleLength - daysSinceChemo);

  return {
    treatmentType: 'chemotherapy',
    phase,
    phaseId,
    dayInCycle: daysSinceChemo,
    daysUntilNext: daysUntilNextChemo,
    description,
    chemoPhase,
  };
}

/**
 * Calculate current phase for radiotherapy.
 */
export function calculateRadiotherapyPhase(
  sessions: RadiotherapySession[],
  totalFractions: number,
): TreatmentPhaseInfo {
  const completedSessions = sessions.filter(s => s.completed);

  if (completedSessions.length === 0) {
    return {
      treatmentType: 'radiotherapy',
      phase: null,
      phaseId: null,
      dayInCycle: 0,
      description: 'Oczekiwanie na pierwszą sesję radioterapii',
      chemoPhase: null,
    };
  }

  const lastSession = completedSessions.sort((a, b) => b.date.localeCompare(a.date))[0];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const lastDate = new Date(lastSession.date);
  lastDate.setHours(0, 0, 0, 0);

  const daysSinceLast = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
  const completedFractions = completedSessions.length;
  const isOngoing = completedFractions < totalFractions;

  const phase = isOngoing
    ? RADIOTHERAPY_PHASES[0] // active_treatment
    : null;

  // Cumulative fatigue estimate (0-10 scale, peaks at end + 2 weeks after)
  const fatigueProgress = completedFractions / Math.max(1, totalFractions);

  const description = isOngoing
    ? `Radioterapia: frakcja ${completedFractions}/${totalFractions} (${Math.round(fatigueProgress * 100)}%). Zmęczenie kumulacyjne.`
    : `Radioterapia zakończona (${completedFractions}/${totalFractions}). Dzień ${daysSinceLast} po zakończeniu.`;

  return {
    treatmentType: 'radiotherapy',
    phase,
    phaseId: phase?.id || null,
    dayInCycle: completedFractions,
    description,
    chemoPhase: null,
  };
}

/**
 * Calculate treatment phase for any treatment type.
 * Returns phase info based on patient's active treatments.
 */
export function calculateTreatmentPhases(
  chemoSessions: ChemoSession[],
  chemoCyclePattern: string | undefined,
  treatments: TreatmentProtocol[],
): TreatmentPhaseInfo[] {
  const phases: TreatmentPhaseInfo[] = [];

  // Always calculate chemo phase if there are sessions
  if (chemoSessions.length > 0) {
    phases.push(calculateChemoPhase(chemoSessions, chemoCyclePattern));
  }

  // Calculate phases for other active treatments
  for (const treatment of treatments) {
    if (treatment.status !== 'active') continue;

    if (treatment.type === 'radiotherapy' && treatment.radiotherapy) {
      phases.push(calculateRadiotherapyPhase(
        treatment.radiotherapy.sessions,
        treatment.radiotherapy.fractions,
      ));
    }

    if (treatment.type === 'immunotherapy') {
      // Simple: days since treatment start
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(treatment.startDate);
      startDate.setHours(0, 0, 0, 0);
      const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      phases.push({
        treatmentType: 'immunotherapy',
        phase: IMMUNOTHERAPY_PHASES[1], // monitoring by default
        phaseId: 'monitoring',
        dayInCycle: daysSinceStart,
        description: `Immunoterapia: dzień ${daysSinceStart} od rozpoczęcia. Monitoruj irAE.`,
        chemoPhase: null,
      });
    }

    if (treatment.type === 'hormonal_therapy') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(treatment.startDate);
      startDate.setHours(0, 0, 0, 0);
      const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      phases.push({
        treatmentType: 'hormonal_therapy',
        phase: null,
        phaseId: null,
        dayInCycle: daysSinceStart,
        description: `Hormonoterapia: dzień ${daysSinceStart} (${Math.round(daysSinceStart / 30)} mies.) od rozpoczęcia.`,
        chemoPhase: null,
      });
    }

    if (treatment.type === 'targeted_therapy') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startDate = new Date(treatment.startDate);
      startDate.setHours(0, 0, 0, 0);
      const daysSinceStart = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      phases.push({
        treatmentType: 'targeted_therapy',
        phase: null,
        phaseId: null,
        dayInCycle: daysSinceStart,
        description: `Terapia celowana: dzień ${daysSinceStart} od rozpoczęcia.`,
        chemoPhase: null,
      });
    }
  }

  return phases;
}

// ==================== BACKWARD COMPAT (drop-in replacements) ====================

/**
 * Drop-in replacement for old calculateCurrentPhase from phase-calculator.ts
 * Returns the same shape for backward compatibility.
 */
export function calculateCurrentPhase(
  chemoSessions: ChemoSession[],
  chemoCyclePattern?: string,
): { phase: 'A' | 'B' | 'C' | null; dayInCycle: number; daysUntilNextChemo?: number; description: string } {
  const info = calculateChemoPhase(chemoSessions, chemoCyclePattern);
  return {
    phase: info.chemoPhase,
    dayInCycle: info.dayInCycle,
    daysUntilNextChemo: info.daysUntilNext,
    description: info.description,
  };
}

/**
 * Drop-in replacement for old getPhaseColor.
 */
export function getPhaseColor(phase: 'A' | 'B' | 'C' | null): string {
  switch (phase) {
    case 'A': return '#e74c3c';
    case 'B': return '#f39c12';
    case 'C': return '#27ae60';
    default: return '#888888';
  }
}

/**
 * Get color for any treatment phase (generic).
 */
export function getTreatmentPhaseColor(phase: PhaseDefinition | null): string {
  return phase?.color || '#888888';
}

/**
 * Drop-in replacement for old getPhaseLabel.
 */
export function getPhaseLabel(phase: 'A' | 'B' | 'C' | null): string {
  switch (phase) {
    case 'A': return 'Kryzys';
    case 'B': return 'Regeneracja';
    case 'C': return 'Odbudowa';
    default: return 'Nieznana';
  }
}

/**
 * Map dayInCycle to legacy ChemoPhase — backward compat for prediction engine.
 */
export function dayToChemoPhase(dayInCycle: number): 'A' | 'B' | 'C' {
  if (dayInCycle <= 3) return 'A';
  if (dayInCycle <= 7) return 'B';
  return 'C';
}

// ==================== HELPERS ====================

function parseCycleLength(pattern?: string): number | null {
  if (!pattern) return null;
  const daysMatch = pattern.match(/(\d+)\s*dn/i);
  if (daysMatch) return parseInt(daysMatch[1]);

  const weeksMatch = pattern.match(/(\d+)\s*tydz/i);
  if (weeksMatch) return parseInt(weeksMatch[1]) * 7;

  if (pattern.toLowerCase().includes('co tydzien')) return 7;
  if (pattern.toLowerCase().includes('co 2 tygodnie')) return 14;
  if (pattern.toLowerCase().includes('co 3 tygodnie')) return 21;

  return null;
}
