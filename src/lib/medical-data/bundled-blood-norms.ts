/*
 * AlpacaLive — Bundled blood reference norms (re-exported from JSON).
 * Source: medical-knowledge/reference-ranges/blood-markers.json
 */
import bloodNormsJson from '../../../medical-knowledge/reference-ranges/blood-markers.json';
import type { BloodMarkerNorm } from './types';

export const BUNDLED_BLOOD_NORMS: Record<string, BloodMarkerNorm> =
  bloodNormsJson.markers as unknown as Record<string, BloodMarkerNorm>;
