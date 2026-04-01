import type { ChemoSession, ChemoPhase } from '@/types';

interface PhaseInfo {
  phase: ChemoPhase;
  dayInCycle: number;
  daysUntilNextChemo?: number;
  description: string;
}

export function calculateCurrentPhase(
  chemoSessions: ChemoSession[],
  chemoCyclePattern?: string,
): PhaseInfo {
  if (chemoSessions.length === 0) {
    return { phase: null, dayInCycle: 0, description: 'Brak danych o chemioterapii' };
  }

  const completed = chemoSessions
    .filter(s => s.status === 'completed' || s.status === 'modified')
    .sort((a, b) => new Date(b.actualDate || b.date).getTime() - new Date(a.actualDate || a.date).getTime());

  if (completed.length === 0) {
    return { phase: 'C', dayInCycle: 0, description: 'Oczekiwanie na pierwsza chemie' };
  }

  const lastChemoDate = new Date(completed[0].actualDate || completed[0].date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastChemoDate.setHours(0, 0, 0, 0);

  const daysSinceChemo = Math.floor((today.getTime() - lastChemoDate.getTime()) / (1000 * 60 * 60 * 24));

  // Default cycle: 21 days (3 weeks)
  const cycleLength = parseCycleLength(chemoCyclePattern) || 21;

  let phase: ChemoPhase;
  let description: string;

  if (daysSinceChemo <= 3) {
    phase = 'A';
    description = `Faza A — Kryzys (dzien ${daysSinceChemo} po chemii). Nawodnienie, sen, zero wysilku, dieta lekkostrawna.`;
  } else if (daysSinceChemo <= 7) {
    phase = 'B';
    description = `Faza B — Regeneracja (dzien ${daysSinceChemo} po chemii). Delikatny ruch, pelniejsze posilki.`;
  } else {
    phase = 'C';
    description = `Faza C — Odbudowa (dzien ${daysSinceChemo} po chemii). Maks odzywienie, aktywnosc, wlewy, badania krwi.`;
  }

  const daysUntilNextChemo = Math.max(0, cycleLength - daysSinceChemo);

  return {
    phase,
    dayInCycle: daysSinceChemo,
    daysUntilNextChemo,
    description,
  };
}

function parseCycleLength(pattern?: string): number | null {
  if (!pattern) return null;
  // Try to parse common patterns like "21 dni", "co 3 tygodnie", "pon-pon-tydzien wolny"
  const daysMatch = pattern.match(/(\d+)\s*dn/i);
  if (daysMatch) return parseInt(daysMatch[1]);

  const weeksMatch = pattern.match(/(\d+)\s*tydz/i);
  if (weeksMatch) return parseInt(weeksMatch[1]) * 7;

  if (pattern.toLowerCase().includes('co tydzien')) return 7;
  if (pattern.toLowerCase().includes('co 2 tygodnie')) return 14;
  if (pattern.toLowerCase().includes('co 3 tygodnie')) return 21;

  return null;
}

export function getPhaseColor(phase: ChemoPhase): string {
  switch (phase) {
    case 'A': return '#e74c3c';
    case 'B': return '#f39c12';
    case 'C': return '#27ae60';
    default: return '#888888';
  }
}

export function getPhaseLabel(phase: ChemoPhase): string {
  switch (phase) {
    case 'A': return 'Kryzys';
    case 'B': return 'Regeneracja';
    case 'C': return 'Odbudowa';
    default: return 'Nieznana';
  }
}
