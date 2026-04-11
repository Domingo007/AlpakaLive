/*
 * AlpacaLive — Your Companion Through Cancer Treatment
 * Copyright (C) 2025 AlpacaLive Contributors
 * Licensed under AGPL-3.0 — see LICENSE file
 *
 * Medical reference data loader — loads from CDN with IndexedDB cache and bundled fallback.
 *
 * Strategy:
 * 1. Check IndexedDB cache first
 * 2. If stale (>7 days), fetch from configured CDN URL
 * 3. If fetch fails (offline), use cached data
 * 4. If no cache exists, use bundled defaults (current hardcoded data)
 */
import { db, type ReferenceDataRecord } from '../db';
import type { MedicalReferencePackage, BloodMarkerNorm, CYP450Profile } from './types';
import { BUNDLED_BLOOD_NORMS } from './bundled-blood-norms';
import { BUNDLED_CYP450 } from './bundled-cyp450';

const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// ==================== DEFAULT CONFIG ====================

let referenceDataUrl: string | null = null;

export function setReferenceDataUrl(url: string): void {
  referenceDataUrl = url;
}

// ==================== CACHED STATE ====================

let _bloodNorms: Record<string, BloodMarkerNorm> | null = null;
let _cyp450: Record<string, CYP450Profile> | null = null;
let _initialized = false;

// ==================== INITIALIZATION ====================

/**
 * Initialize medical reference data. Call once at app startup.
 * After this, getBloodNorms() and getCYP450() return synchronously.
 */
export async function initMedicalData(): Promise<void> {
  if (_initialized) return;

  // Try loading blood norms
  _bloodNorms = await loadData<Record<string, BloodMarkerNorm>>('blood_norms', BUNDLED_BLOOD_NORMS);

  // Try loading CYP450
  _cyp450 = await loadData<Record<string, CYP450Profile>>('cyp450', BUNDLED_CYP450);

  _initialized = true;
}

/**
 * Generic data loader: cache → remote → bundled fallback
 */
async function loadData<T>(type: ReferenceDataRecord['type'], bundledDefault: T): Promise<T> {
  // 1. Check cache
  try {
    const cached = await db.referenceData.get(type);
    if (cached) {
      const isStale = Date.now() - new Date(cached.lastUpdated).getTime() > STALE_THRESHOLD_MS;

      if (!isStale) {
        return cached.data as T;
      }

      // Stale — try remote update
      const remote = await fetchRemoteData<T>(type);
      if (remote) return remote;

      // Remote failed, use stale cache
      return cached.data as T;
    }
  } catch {
    // IndexedDB error — fall through
  }

  // 2. No cache — try remote
  const remote = await fetchRemoteData<T>(type);
  if (remote) return remote;

  // 3. Fall back to bundled
  return bundledDefault;
}

/**
 * Fetch data from remote CDN and cache it.
 */
async function fetchRemoteData<T>(type: ReferenceDataRecord['type']): Promise<T | null> {
  if (!referenceDataUrl) return null;

  try {
    const url = `${referenceDataUrl}/${type}.json`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) return null;

    const data = await response.json();

    // Cache in IndexedDB
    try {
      await db.referenceData.put({
        id: type,
        type,
        version: data._version || '1.0.0',
        lastUpdated: new Date().toISOString(),
        sourceUrl: url,
        data: data.data || data,
      });
    } catch {
      // Cache write failed — non-fatal
    }

    return (data.data || data) as T;
  } catch {
    // Network error — offline
    return null;
  }
}

// ==================== SYNCHRONOUS GETTERS (after init) ====================

/**
 * Get blood norms. Must call initMedicalData() first.
 * Returns bundled defaults if not initialized.
 */
export function getBloodNorms(): Record<string, BloodMarkerNorm> {
  return _bloodNorms || BUNDLED_BLOOD_NORMS;
}

/**
 * Get CYP450 database. Must call initMedicalData() first.
 * Returns bundled defaults if not initialized.
 */
export function getCYP450Database(): Record<string, CYP450Profile> {
  return _cyp450 || BUNDLED_CYP450;
}

/**
 * Force refresh all reference data from remote.
 */
export async function refreshMedicalData(): Promise<void> {
  _initialized = false;
  _bloodNorms = null;
  _cyp450 = null;
  await initMedicalData();
}

/**
 * Get metadata about loaded reference data.
 */
export async function getReferenceDataMeta(): Promise<ReferenceDataRecord[]> {
  try {
    return await db.referenceData.toArray();
  } catch {
    return [];
  }
}
