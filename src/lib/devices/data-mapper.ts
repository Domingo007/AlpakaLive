/*
 * AlpacaLive — Device data mapper
 * Normalizes data from any device source and saves to IndexedDB.
 * Handles deduplication, DailyLog updates, and alert generation.
 */
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import type { NormalizedDeviceData, ImportResult, ImportPreviewData, DeviceSource } from './types';

/**
 * Save normalized device data to the database.
 * Deduplicates by date+source, updates existing records.
 */
export async function saveNormalizedData(rows: NormalizedDeviceData[]): Promise<ImportResult> {
  const result: ImportResult = { inserted: 0, updated: 0, skipped: 0, errors: [] };

  for (const row of rows) {
    try {
      if (!row.date || !row.source) {
        result.skipped++;
        continue;
      }

      // Check for existing wearable entry for this date+source
      const existing = await db.wearable
        .where('date')
        .equals(row.date)
        .filter(w => w.source === row.source)
        .first();

      const wearableData = {
        id: existing?.id || uuidv4(),
        date: row.date,
        source: row.source as 'amazfit_helio' | 'apple_health' | 'withings' | 'garmin' | 'manual',
        rhr: row.rhr ?? existing?.rhr ?? 0,
        hrv: row.hrv ?? existing?.hrv ?? 0,
        spo2: row.spo2 ?? existing?.spo2 ?? 0,
        sleepHours: row.sleepHours ?? existing?.sleepHours ?? 0,
        deepSleep: row.deepSleep ?? existing?.deepSleep ?? 0,
        remSleep: row.remSleep ?? existing?.remSleep ?? 0,
        lightSleep: row.lightSleep ?? existing?.lightSleep ?? 0,
        steps: row.steps ?? existing?.steps ?? 0,
        activeMinutes: row.activeMinutes ?? existing?.activeMinutes ?? 0,
        biocharge: row.biocharge ?? existing?.biocharge ?? 0,
        skinTemperature: row.skinTemperature ?? existing?.skinTemperature,
        respiratoryRate: row.respiratoryRate ?? existing?.respiratoryRate,
        stressLevel: row.stressLevel ?? existing?.stressLevel,
      };

      await db.wearable.put(wearableData);

      if (existing) {
        result.updated++;
      } else {
        result.inserted++;
      }

      // Update DailyLog with weight/temp/BP if available
      if (row.weight || row.temperature || row.bpSystolic || row.heartRate) {
        await updateDailyLog(row);
      }
    } catch (err) {
      result.errors.push(`${row.date}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      result.skipped++;
    }
  }

  return result;
}

/**
 * Update or create a DailyLog entry with device data.
 * Only updates fields that have device values (doesn't overwrite manual entries).
 */
async function updateDailyLog(row: NormalizedDeviceData): Promise<void> {
  const existing = await db.daily
    .where('date')
    .equals(row.date)
    .first();

  if (existing) {
    // Only update fields that aren't already set manually
    const updates: Record<string, unknown> = {};
    if (row.weight && !existing.weight) updates.weight = row.weight;
    if (row.temperature && !existing.temperature) updates.temperature = row.temperature;
    if (row.bpSystolic && !existing.bpSystolic) updates.bpSystolic = row.bpSystolic;
    if (row.bpDiastolic && !existing.bpDiastolic) updates.bpDiastolic = row.bpDiastolic;
    if (row.heartRate && !existing.heartRate) updates.heartRate = row.heartRate;
    if (row.sleepHours && !existing.sleep) {
      updates.sleep = { hours: row.sleepHours, quality: 0, deepSleep: row.deepSleep, remSleep: row.remSleep };
    }

    if (Object.keys(updates).length > 0) {
      await db.daily.update(existing.id, updates as Partial<typeof existing>);
    }
  }
  // Don't create a new DailyLog from device data alone — user should use the journal form
}

/**
 * Generate an import preview without saving anything.
 */
export async function generateImportPreview(rows: NormalizedDeviceData[], source: DeviceSource): Promise<ImportPreviewData> {
  let duplicateCount = 0;
  let newCount = 0;

  const dates = rows.map(r => r.date).filter(Boolean);
  const minDate = dates.length > 0 ? dates.reduce((a, b) => a < b ? a : b) : '';
  const maxDate = dates.length > 0 ? dates.reduce((a, b) => a > b ? a : b) : '';

  for (const row of rows) {
    if (!row.date) continue;
    const existing = await db.wearable
      .where('date')
      .equals(row.date)
      .filter(w => w.source === row.source)
      .first();

    if (existing) duplicateCount++;
    else newCount++;
  }

  return {
    rows,
    source,
    dateRange: { from: minDate, to: maxDate },
    duplicateCount,
    newCount,
  };
}
