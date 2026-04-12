/*
 * AlpacaLive — Apple Health / Android Health Connect import
 * Parses JSON data from iOS Shortcuts or Android Tasker/Automate.
 * Both platforms produce the SAME JSON format.
 */
import type { NormalizedDeviceData, DeviceSource } from './types';

const VALID_SOURCES: DeviceSource[] = ['apple_health', 'health_connect'];

/**
 * Expected JSON format from iOS Shortcut / Android Tasker:
 * Single day: { source, date, rhr, hrv, spo2, sleepHours, ... }
 * Multi-day: [ { source, date, ... }, { source, date, ... } ]
 */
interface RawHealthData {
  source?: string;
  date?: string;
  rhr?: number;
  hrv?: number;
  spo2?: number;
  sleepHours?: number;
  deepSleep?: number;
  remSleep?: number;
  lightSleep?: number;
  steps?: number;
  activeMinutes?: number;
  weight?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  temperature?: number;
  heartRate?: number;
  bodyFatPercent?: number;
  skinTemperature?: number;
  stressLevel?: number;
}

/**
 * Parse health data from URL query params (opened by Shortcut/Tasker).
 * URL: alpacalive.app/app/import?source=apple_health&data=<base64json>
 */
export function parseHealthDataFromUrl(searchParams: URLSearchParams): NormalizedDeviceData[] | null {
  const source = searchParams.get('source');
  const dataParam = searchParams.get('data');

  if (!source || !dataParam) return null;
  if (!VALID_SOURCES.includes(source as DeviceSource)) return null;

  try {
    const json = atob(dataParam);
    return parseHealthJson(json, source as DeviceSource);
  } catch {
    return null;
  }
}

/**
 * Parse health data from pasted/clipboard JSON text.
 */
export function parseHealthDataFromText(text: string): NormalizedDeviceData[] | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  try {
    return parseHealthJson(trimmed, 'apple_health');
  } catch {
    return null;
  }
}

/**
 * Parse JSON string into NormalizedDeviceData array.
 */
function parseHealthJson(json: string, defaultSource: DeviceSource): NormalizedDeviceData[] {
  const parsed = JSON.parse(json);

  const rawItems: RawHealthData[] = Array.isArray(parsed) ? parsed : [parsed];
  const results: NormalizedDeviceData[] = [];

  for (const raw of rawItems) {
    const date = raw.date || new Date().toISOString().split('T')[0];
    const source = (VALID_SOURCES.includes(raw.source as DeviceSource) ? raw.source : defaultSource) as DeviceSource;

    const normalized: NormalizedDeviceData = {
      date,
      source,
    };

    // Map numeric fields with validation
    if (isValidNumber(raw.rhr, 30, 220)) normalized.rhr = raw.rhr;
    if (isValidNumber(raw.hrv, 0, 300)) normalized.hrv = raw.hrv;
    if (isValidNumber(raw.spo2, 50, 100)) normalized.spo2 = raw.spo2;
    if (isValidNumber(raw.sleepHours, 0, 24)) normalized.sleepHours = raw.sleepHours;
    if (isValidNumber(raw.deepSleep, 0, 12)) normalized.deepSleep = raw.deepSleep;
    if (isValidNumber(raw.remSleep, 0, 12)) normalized.remSleep = raw.remSleep;
    if (isValidNumber(raw.lightSleep, 0, 12)) normalized.lightSleep = raw.lightSleep;
    if (isValidNumber(raw.steps, 0, 100000)) normalized.steps = raw.steps;
    if (isValidNumber(raw.activeMinutes, 0, 1440)) normalized.activeMinutes = raw.activeMinutes;
    if (isValidNumber(raw.weight, 20, 300)) normalized.weight = raw.weight;
    if (isValidNumber(raw.bpSystolic, 60, 260)) normalized.bpSystolic = raw.bpSystolic;
    if (isValidNumber(raw.bpDiastolic, 30, 160)) normalized.bpDiastolic = raw.bpDiastolic;
    if (isValidNumber(raw.temperature, 34, 42)) normalized.temperature = raw.temperature;
    if (isValidNumber(raw.heartRate, 30, 220)) normalized.heartRate = raw.heartRate;
    if (isValidNumber(raw.bodyFatPercent, 1, 70)) normalized.bodyFatPercent = raw.bodyFatPercent;
    if (isValidNumber(raw.skinTemperature, 30, 42)) normalized.skinTemperature = raw.skinTemperature;
    if (isValidNumber(raw.stressLevel, 0, 100)) normalized.stressLevel = raw.stressLevel;

    // Only add if at least one data field was valid
    const hasData = Object.keys(normalized).length > 2; // more than just date+source
    if (hasData) {
      results.push(normalized);
    }
  }

  return results;
}

function isValidNumber(val: unknown, min: number, max: number): val is number {
  return typeof val === 'number' && !isNaN(val) && val >= min && val <= max;
}
