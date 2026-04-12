/*
 * AlpacaLive — Universal CSV/JSON file import
 * Parses exports from Garmin Connect, Withings, Apple Health, and generic CSV.
 */
import type { NormalizedDeviceData } from './types';

// ==================== FORMAT DETECTION ====================

export type DetectedFormat = 'garmin_csv' | 'withings_csv' | 'generic_csv' | 'json' | 'unknown';

export function detectFormat(content: string, filename: string): DetectedFormat {
  const lower = filename.toLowerCase();

  // JSON
  if (lower.endsWith('.json') || content.trim().startsWith('{') || content.trim().startsWith('[')) {
    return 'json';
  }

  // CSV detection by content
  const firstLines = content.split('\n').slice(0, 3).join('\n').toLowerCase();

  if (firstLines.includes('garmin') || firstLines.includes('activity type') && firstLines.includes('calories')) {
    return 'garmin_csv';
  }
  if (firstLines.includes('withings') || firstLines.includes('grp_id') || (firstLines.includes('date') && firstLines.includes('weight') && firstLines.includes('fat'))) {
    return 'withings_csv';
  }
  if (lower.endsWith('.csv')) {
    return 'generic_csv';
  }

  return 'unknown';
}

// ==================== HEADER ALIASES ====================

const HEADER_ALIASES: Record<string, string[]> = {
  date: ['date', 'data', 'datum', 'day', 'dzień', 'timestamp', 'time'],
  rhr: ['resting heart rate', 'rhr', 'resting hr', 'rest hr', 'spoczynkowe tętno'],
  hrv: ['hrv', 'heart rate variability', 'rmssd', 'zmienność hr'],
  spo2: ['spo2', 'blood oxygen', 'oxygen saturation', 'pulse ox', 'saturacja'],
  steps: ['steps', 'step count', 'daily steps', 'kroki', 'total steps'],
  sleepHours: ['sleep', 'sleep hours', 'sleep duration', 'total sleep', 'sen', 'czas snu'],
  deepSleep: ['deep sleep', 'deep', 'sen głęboki'],
  remSleep: ['rem sleep', 'rem', 'sen rem'],
  weight: ['weight', 'body weight', 'mass', 'waga', 'kg'],
  bpSystolic: ['systolic', 'bp systolic', 'sys', 'skurczowe'],
  bpDiastolic: ['diastolic', 'bp diastolic', 'dia', 'rozkurczowe'],
  temperature: ['temperature', 'temp', 'body temp', 'temperatura'],
  heartRate: ['heart rate', 'hr', 'avg hr', 'average heart rate', 'tętno'],
  activeMinutes: ['active minutes', 'active time', 'aktywne minuty', 'active duration'],
  bodyFatPercent: ['body fat', 'fat %', 'fat ratio', 'fat percentage', 'tkanka tłuszczowa'],
};

// ==================== CSV PARSER ====================

export interface CsvParseResult {
  headers: string[];
  rows: string[][];
  suggestedMapping: Record<string, string>;
}

export function parseCsvHeaders(content: string): CsvParseResult {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return { headers: [], rows: [], suggestedMapping: {} };

  const separator = detectSeparator(lines[0]);
  const headers = parseCsvLine(lines[0], separator);
  const rows = lines.slice(1).map(line => parseCsvLine(line, separator));

  const suggestedMapping: Record<string, string> = {};
  for (let i = 0; i < headers.length; i++) {
    const headerLower = headers[i].toLowerCase().trim();
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.some(a => headerLower.includes(a))) {
        suggestedMapping[String(i)] = field;
        break;
      }
    }
  }

  return { headers, rows, suggestedMapping };
}

export function applyMapping(rows: string[][], mapping: Record<string, string>): NormalizedDeviceData[] {
  const results: NormalizedDeviceData[] = [];

  for (const row of rows) {
    const data: Record<string, unknown> = { source: 'csv_import' as const };

    for (const [colIndex, field] of Object.entries(mapping)) {
      const value = row[parseInt(colIndex)]?.trim();
      if (!value) continue;

      if (field === 'date') {
        data[field] = normalizeDate(value);
      } else {
        const num = parseFloat(value.replace(',', '.'));
        if (!isNaN(num)) {
          data[field] = num;
        }
      }
    }

    if (data.date) {
      results.push(data as unknown as NormalizedDeviceData);
    }
  }

  return results;
}

// ==================== GARMIN CSV ====================

export function parseGarminCsv(content: string): NormalizedDeviceData[] {
  const { headers, rows } = parseCsvHeaders(content);
  if (rows.length === 0) return [];

  const colMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    const lower = h.toLowerCase().trim();
    if (lower.includes('date') || lower.includes('start')) colMap.date = i;
    if (lower.includes('avg hr') || lower.includes('average heart rate')) colMap.heartRate = i;
    if (lower.includes('steps')) colMap.steps = i;
    if (lower.includes('calories')) colMap.calories = i;
    if (lower.includes('distance')) colMap.distance = i;
    if (lower.includes('duration') || lower.includes('time')) colMap.duration = i;
  });

  return rows.map(row => {
    const data: NormalizedDeviceData = {
      date: normalizeDate(row[colMap.date] || ''),
      source: 'garmin',
    };
    if (colMap.heartRate !== undefined) data.heartRate = parseFloat(row[colMap.heartRate]) || undefined;
    if (colMap.steps !== undefined) data.steps = parseInt(row[colMap.steps]) || undefined;
    return data;
  }).filter(d => d.date);
}

// ==================== WITHINGS CSV ====================

export function parseWithingsCsv(content: string): NormalizedDeviceData[] {
  const { headers, rows } = parseCsvHeaders(content);
  if (rows.length === 0) return [];

  const colMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    const lower = h.toLowerCase().trim();
    if (lower.includes('date')) colMap.date = i;
    if (lower.includes('weight')) colMap.weight = i;
    if (lower.includes('fat')) colMap.bodyFat = i;
    if (lower.includes('systolic') || lower === 'sys') colMap.bpSystolic = i;
    if (lower.includes('diastolic') || lower === 'dia') colMap.bpDiastolic = i;
    if (lower.includes('heart rate') || lower === 'hr') colMap.heartRate = i;
    if (lower.includes('spo2')) colMap.spo2 = i;
    if (lower.includes('temperature') || lower.includes('temp')) colMap.temperature = i;
  });

  return rows.map(row => {
    const data: NormalizedDeviceData = {
      date: normalizeDate(row[colMap.date] || ''),
      source: 'withings',
    };
    if (colMap.weight !== undefined) data.weight = parseFloat(row[colMap.weight]) || undefined;
    if (colMap.bodyFat !== undefined) data.bodyFatPercent = parseFloat(row[colMap.bodyFat]) || undefined;
    if (colMap.bpSystolic !== undefined) data.bpSystolic = parseInt(row[colMap.bpSystolic]) || undefined;
    if (colMap.bpDiastolic !== undefined) data.bpDiastolic = parseInt(row[colMap.bpDiastolic]) || undefined;
    if (colMap.heartRate !== undefined) data.heartRate = parseInt(row[colMap.heartRate]) || undefined;
    if (colMap.spo2 !== undefined) data.spo2 = parseInt(row[colMap.spo2]) || undefined;
    if (colMap.temperature !== undefined) data.temperature = parseFloat(row[colMap.temperature]) || undefined;
    return data;
  }).filter(d => d.date);
}

// ==================== JSON IMPORT ====================

export function parseJsonImport(content: string): NormalizedDeviceData[] {
  const parsed = JSON.parse(content);
  const items = Array.isArray(parsed) ? parsed : [parsed];

  return items.map(item => ({
    date: item.date || new Date().toISOString().split('T')[0],
    source: item.source || 'csv_import',
    ...pickNumericFields(item),
  } as NormalizedDeviceData)).filter(d => d.date);
}

// ==================== HELPERS ====================

function detectSeparator(line: string): string {
  const commas = (line.match(/,/g) || []).length;
  const semicolons = (line.match(/;/g) || []).length;
  const tabs = (line.match(/\t/g) || []).length;
  if (tabs >= commas && tabs >= semicolons) return '\t';
  if (semicolons > commas) return ';';
  return ',';
}

function parseCsvLine(line: string, separator: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === separator && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function normalizeDate(raw: string): string {
  if (!raw) return '';
  // Try ISO format first
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  // DD/MM/YYYY or DD.MM.YYYY
  const dmyMatch = raw.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})/);
  if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
  // MM/DD/YYYY
  const mdyMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (mdyMatch) return `${mdyMatch[3]}-${mdyMatch[1].padStart(2, '0')}-${mdyMatch[2].padStart(2, '0')}`;
  // Try Date constructor
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return '';
}

const NUMERIC_FIELDS = ['rhr', 'hrv', 'spo2', 'sleepHours', 'deepSleep', 'remSleep', 'lightSleep', 'steps', 'activeMinutes', 'weight', 'bpSystolic', 'bpDiastolic', 'temperature', 'heartRate', 'bodyFatPercent', 'musclePercent', 'skinTemperature', 'stressLevel', 'biocharge'];

function pickNumericFields(obj: Record<string, unknown>): Record<string, number> {
  const result: Record<string, number> = {};
  for (const key of NUMERIC_FIELDS) {
    if (typeof obj[key] === 'number' && !isNaN(obj[key] as number)) {
      result[key] = obj[key] as number;
    }
  }
  return result;
}
