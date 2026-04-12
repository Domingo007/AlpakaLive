/*
 * AlpacaLive — Bundled blood reference norms (re-exported from JSON).
 * Source: medical-knowledge/common/blood-norms.json
 */
import bloodNormsJson from '../../../medical-knowledge/common/blood-norms.json';
import type { BloodMarkerNorm } from './types';

export const BUNDLED_BLOOD_NORMS: Record<string, BloodMarkerNorm> =
  bloodNormsJson.markers as unknown as Record<string, BloodMarkerNorm>;
