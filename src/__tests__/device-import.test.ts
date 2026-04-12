import { describe, it, expect } from 'vitest';
import { parseHealthDataFromText, parseHealthDataFromUrl } from '../lib/devices/apple-health-import';
import { detectFormat, parseCsvHeaders, applyMapping, parseGarminCsv } from '../lib/devices/csv-import';

// ==================== APPLE HEALTH / ANDROID IMPORT ====================

describe('parseHealthDataFromText', () => {
  it('parses single-day JSON', () => {
    const json = JSON.stringify({
      source: 'apple_health', date: '2026-04-11',
      rhr: 68, hrv: 42, spo2: 97, sleepHours: 7.2, steps: 5420, weight: 64.5,
    });
    const result = parseHealthDataFromText(json);
    expect(result).toHaveLength(1);
    expect(result![0].rhr).toBe(68);
    expect(result![0].steps).toBe(5420);
    expect(result![0].source).toBe('apple_health');
  });

  it('parses multi-day JSON array', () => {
    const json = JSON.stringify([
      { source: 'apple_health', date: '2026-04-10', rhr: 70, steps: 4000 },
      { source: 'apple_health', date: '2026-04-11', rhr: 68, steps: 5420 },
    ]);
    const result = parseHealthDataFromText(json);
    expect(result).toHaveLength(2);
    expect(result![0].date).toBe('2026-04-10');
    expect(result![1].date).toBe('2026-04-11');
  });

  it('validates numeric ranges (rejects impossible values)', () => {
    const json = JSON.stringify({
      source: 'apple_health', date: '2026-04-11',
      rhr: 500, spo2: 150, weight: -10, steps: -100,
    });
    const result = parseHealthDataFromText(json);
    // All values out of range → no valid fields → no rows
    expect(result).toHaveLength(0);
  });

  it('accepts health_connect source', () => {
    const json = JSON.stringify({
      source: 'health_connect', date: '2026-04-11', rhr: 72,
    });
    const result = parseHealthDataFromText(json);
    expect(result![0].source).toBe('health_connect');
  });

  it('returns null for empty text', () => {
    expect(parseHealthDataFromText('')).toBeNull();
  });

  it('returns null for invalid JSON', () => {
    expect(parseHealthDataFromText('not json')).toBeNull();
  });
});

describe('parseHealthDataFromUrl', () => {
  it('parses base64-encoded URL params', () => {
    const json = JSON.stringify({ date: '2026-04-11', rhr: 68, steps: 5000 });
    const params = new URLSearchParams({
      source: 'apple_health',
      data: btoa(json),
    });
    const result = parseHealthDataFromUrl(params);
    expect(result).toHaveLength(1);
    expect(result![0].rhr).toBe(68);
  });

  it('returns null for missing params', () => {
    expect(parseHealthDataFromUrl(new URLSearchParams())).toBeNull();
    expect(parseHealthDataFromUrl(new URLSearchParams({ source: 'apple_health' }))).toBeNull();
  });

  it('returns null for invalid source', () => {
    const params = new URLSearchParams({ source: 'malicious', data: btoa('{}') });
    expect(parseHealthDataFromUrl(params)).toBeNull();
  });
});

// ==================== CSV IMPORT ====================

describe('detectFormat', () => {
  it('detects JSON by extension', () => {
    expect(detectFormat('{}', 'data.json')).toBe('json');
  });

  it('detects JSON by content', () => {
    expect(detectFormat('[{"date":"2026-01-01"}]', 'data.txt')).toBe('json');
  });

  it('detects CSV', () => {
    expect(detectFormat('date,steps,hr\n2026-01-01,5000,72', 'export.csv')).toBe('generic_csv');
  });

  it('returns unknown for unsupported', () => {
    expect(detectFormat('random content', 'file.xyz')).toBe('unknown');
  });
});

describe('parseCsvHeaders', () => {
  it('parses CSV with header matching', () => {
    const csv = 'Date,Steps,Resting Heart Rate,SpO2\n2026-04-11,5000,68,97';
    const result = parseCsvHeaders(csv);
    expect(result.headers).toEqual(['Date', 'Steps', 'Resting Heart Rate', 'SpO2']);
    expect(result.rows).toHaveLength(1);
    expect(result.suggestedMapping['0']).toBe('date');
    expect(result.suggestedMapping['1']).toBe('steps');
    expect(result.suggestedMapping['2']).toBe('rhr');
    expect(result.suggestedMapping['3']).toBe('spo2');
  });

  it('handles semicolon-separated CSV', () => {
    const csv = 'Date;Weight;Temperature\n2026-04-11;64.5;36.6';
    const result = parseCsvHeaders(csv);
    expect(result.headers).toEqual(['Date', 'Weight', 'Temperature']);
    expect(result.rows[0]).toEqual(['2026-04-11', '64.5', '36.6']);
  });
});

describe('applyMapping', () => {
  it('maps columns to NormalizedDeviceData', () => {
    const rows = [['2026-04-11', '5000', '68']];
    const mapping = { '0': 'date', '1': 'steps', '2': 'rhr' };
    const result = applyMapping(rows, mapping);
    expect(result).toHaveLength(1);
    expect(result[0].date).toBe('2026-04-11');
    expect(result[0].steps).toBe(5000);
    expect(result[0].rhr).toBe(68);
  });

  it('skips rows without date', () => {
    const rows = [['', '5000']];
    const mapping = { '0': 'date', '1': 'steps' };
    expect(applyMapping(rows, mapping)).toHaveLength(0);
  });
});
