/*
 * AlpacaLive — Blood reference norms
 * Now uses the medical-data loader system with CDN support.
 * Backward-compatible: BLOOD_NORMS and evaluateMarker() work as before.
 */
import { getBloodNorms } from './medical-data/loader';
import { BUNDLED_BLOOD_NORMS } from './medical-data/bundled-blood-norms';
import type { BloodMarkerNorm } from './medical-data/types';

// Re-export the type for backward compatibility
export type { BloodMarkerNorm };

/**
 * BLOOD_NORMS — backward compatible export.
 * After initMedicalData() is called, getBloodNorms() returns potentially updated data.
 * This static export uses bundled defaults for code that imports it directly.
 */
export const BLOOD_NORMS: Record<string, BloodMarkerNorm> = BUNDLED_BLOOD_NORMS;

export type MarkerStatus = 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high';

/**
 * Evaluate a blood marker against reference norms.
 * Uses dynamically loaded norms if available, falls back to bundled.
 */
export function evaluateMarker(markerKey: string, value: number): MarkerStatus {
  const norms = getBloodNorms();
  const norm = norms[markerKey];
  if (!norm) return 'normal';

  if (norm.criticalLow !== undefined && value < norm.criticalLow) return 'critical_low';
  if (norm.criticalHigh !== undefined && value > norm.criticalHigh) return 'critical_high';
  if (value < norm.normalMin) return 'low';
  if (value > norm.normalMax) return 'high';
  return 'normal';
}

export function getStatusIcon(status: MarkerStatus): string {
  switch (status) {
    case 'critical_low': return '🔴↓';
    case 'critical_high': return '🔴↑';
    case 'low': return '🟡↓';
    case 'high': return '🟡↑';
    case 'normal': return '✅';
  }
}

export function getStatusColor(status: MarkerStatus): string {
  switch (status) {
    case 'critical_low':
    case 'critical_high':
      return '#e74c3c';
    case 'low':
    case 'high':
      return '#f39c12';
    case 'normal':
      return '#27ae60';
  }
}
