import type { ChemoSession, ChemoReadinessAssessment, PreChemoBlood } from '@/types';
import { db } from './db';

const CHEMO_POSTPONE_CRITERIA = {
  absolute: [
    { marker: 'neutrophils' as const, threshold: 1.0, unit: 'tys/ul', label: 'Neutropenia < 1.0' },
    { marker: 'plt' as const, threshold: 50, unit: 'tys/ul', label: 'Trombocytopenia < 50' },
  ],
  relative: [
    { marker: 'wbc' as const, threshold: 2.0, unit: 'tys/ul', label: 'WBC < 2.0' },
    { marker: 'neutrophils' as const, threshold: 1.5, unit: 'tys/ul', label: 'Neutrofile < 1.5' },
    { marker: 'plt' as const, threshold: 75, unit: 'tys/ul', label: 'PLT < 75' },
    { marker: 'hgb' as const, threshold: 8.0, unit: 'g/dl', label: 'Hemoglobina < 8.0' },
  ],
};

export function evaluatePreChemoBlood(results: PreChemoBlood): ChemoReadinessAssessment {
  const issues: string[] = [];
  let readiness: 'go' | 'caution' | 'postpone' = 'go';

  for (const criterion of CHEMO_POSTPONE_CRITERIA.absolute) {
    const value = results[criterion.marker];
    if (value !== undefined && value < criterion.threshold) {
      issues.push(`🔴 ${criterion.label}: ${value} ${criterion.unit}`);
      readiness = 'postpone';
    }
  }

  if (readiness !== 'postpone') {
    for (const criterion of CHEMO_POSTPONE_CRITERIA.relative) {
      const value = results[criterion.marker];
      if (value !== undefined && value < criterion.threshold) {
        issues.push(`🟡 ${criterion.label}: ${value} ${criterion.unit}`);
        if (readiness === 'go') readiness = 'caution';
      }
    }
  }

  return {
    readiness,
    issues,
    recommendation:
      readiness === 'postpone'
        ? 'Wyniki poniżej progu bezpieczeństwa. Onkolog prawdopodobnie odroczy chemię.'
        : readiness === 'caution'
        ? 'Wyniki na granicy. Decyzja onkologa — możliwe odroczenie lub redukcja dawki.'
        : 'Wyniki pozwalają na podanie chemii.',
    affectedPredictions: readiness !== 'go',
  };
}

export async function handlePostponement(
  originalDate: string,
  reason: string,
  preChemoBlood: PreChemoBlood,
  newDate?: string,
): Promise<void> {
  // Find the session for this date
  const sessions = await db.chemo.where('plannedDate').equals(originalDate).toArray();
  const session = sessions[0];

  if (session) {
    await db.chemo.update(session.id, {
      status: 'postponed',
      postponeReason: reason,
      preChemoBlood,
      postponedTo: newDate,
    });
  }

  // If new date given, shift future entries
  if (newDate) {
    const shiftDays = daysBetween(originalDate, newDate);
    const futureSessions = await db.chemo
      .where('plannedDate')
      .above(originalDate)
      .filter(s => s.status === 'planned')
      .toArray();

    for (const future of futureSessions) {
      const shifted = addDays(future.plannedDate, shiftDays);
      await db.chemo.update(future.id, { plannedDate: shifted });
    }
  }
}

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export async function getUpcomingChemo(count = 5): Promise<ChemoSession[]> {
  const today = new Date().toISOString().split('T')[0];
  return db.chemo
    .where('plannedDate')
    .aboveOrEqual(today)
    .filter(s => s.status === 'planned')
    .limit(count)
    .toArray();
}
