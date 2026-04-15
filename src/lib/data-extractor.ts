import { db } from './db';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeExtractedData } from './input-guard';

import { saveAIExtraction, type AIExtractedData } from './daily-profile';

const SAVE_REGEX = /\[SAVE:(\w+):(\{[\s\S]*?\})\]/g;
const UPDATE_REGEX = /\[UPDATE:patient:(\{[\s\S]*?\})\]/g;
const DISEASE_REGEX = /\[DISEASE_PROFILE:(\{[\s\S]*?\})\]/g;
// EXTRACT uses a function-based parser because nested JSON with arrays/objects
// breaks simple regex. The other tags have flat JSON so regex works fine.
const EXTRACT_TAG = '[EXTRACT:';


export interface ExtractedData {
  type: string;
  data: Record<string, unknown>;
}

export function extractDataFromResponse(responseText: string): ExtractedData[] {
  const extracted: ExtractedData[] = [];

  let match;
  SAVE_REGEX.lastIndex = 0;
  while ((match = SAVE_REGEX.exec(responseText)) !== null) {
    try {
      const type = match[1];
      const data = JSON.parse(match[2]);
      extracted.push({ type, data });
    } catch {
      // Skip malformed JSON
    }
  }

  UPDATE_REGEX.lastIndex = 0;
  while ((match = UPDATE_REGEX.exec(responseText)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      extracted.push({ type: 'patient_update', data });
    } catch {
      // Skip
    }
  }

  DISEASE_REGEX.lastIndex = 0;
  while ((match = DISEASE_REGEX.exec(responseText)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      extracted.push({ type: 'disease_profile', data });
    } catch {
      // Skip
    }
  }

  return extracted;
}

/**
 * Extract and save AI clinical data from [EXTRACT:{...}] blocks.
 * Returns the extracted data or null if none found.
 */
function extractBalancedJson(text: string, tag: string): string | null {
  const start = text.indexOf(tag);
  if (start === -1) return null;
  const jsonStart = start + tag.length;
  let depth = 0;
  for (let i = jsonStart; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') { depth--; if (depth === 0) return text.slice(jsonStart, i + 1); }
  }
  return null;
}

export function extractAIProfileData(responseText: string): AIExtractedData | null {
  const jsonStr = extractBalancedJson(responseText, EXTRACT_TAG);
  if (!jsonStr) return null;

  try {
    const raw = JSON.parse(jsonStr);

    // Validate required fields
    if (!raw.scores || typeof raw.scores !== 'object') return null;

    // Ensure every score has basis (transparency requirement)
    const validatedScores: AIExtractedData['scores'] = {};
    for (const [key, val] of Object.entries(raw.scores)) {
      const s = val as { value?: number; basis?: string; confidence?: number };
      if (typeof s?.value === 'number' && typeof s?.basis === 'string' && s.basis.length > 0) {
        validatedScores[key] = {
          value: s.value,
          basis: s.basis,
          confidence: typeof s.confidence === 'number' ? Math.min(1, Math.max(0, s.confidence)) : 0.5,
        };
      }
    }

    const data: AIExtractedData = {
      scores: validatedScores,
      clinicalFindings: Array.isArray(raw.clinicalFindings)
        ? raw.clinicalFindings.filter((f: { finding?: string; basis?: string }) => f?.finding && f?.basis)
        : [],
      ecogEstimate: raw.ecogEstimate?.value != null ? raw.ecogEstimate : undefined,
      flags: Array.isArray(raw.flags)
        ? raw.flags.filter((f: { message?: string }) => f?.message)
        : [],
      extractedAt: new Date().toISOString(),
    };

    // Save to localStorage for DailyProfile
    const date = raw.date || new Date().toISOString().split('T')[0];
    saveAIExtraction(date, data);

    return data;
  } catch {
    return null;
  }
}

export async function saveExtractedData(items: ExtractedData[]): Promise<void> {
  for (const item of items) {
    const id = uuidv4();
    const date = (item.data.date as string) || new Date().toISOString().split('T')[0];

    // Sanitize: only allow whitelisted fields per type
    const safe = sanitizeExtractedData(item.type, item.data);

    switch (item.type) {
      case 'daily':
        await db.daily.put({
          id,
          date,
          time: new Date().toTimeString().slice(0, 5),
          energy: 5,
          pain: 0,
          nausea: 0,
          mood: 5,
          neuropathy: 0,
          appetite: 5,
          notes: '',
          chemoPhase: null,
          dayInCycle: 0,
          ...safe,
        } as any);
        break;

      case 'blood':
        await db.blood.put({
          id,
          date,
          source: 'manual' as const,
          markers: {},
          notes: '',
          ...safe,
        } as any);
        break;

      case 'chemo':
        await db.chemo.put({
          id,
          date,
          plannedDate: date,
          status: 'completed' as const,
          drugs: [],
          cycle: 1,
          notes: '',
          sideEffects: [],
          ...safe,
        } as any);
        break;

      case 'wearable':
        await db.wearable.put({
          id,
          date,
          source: 'manual' as const,
          rhr: 0,
          hrv: 0,
          spo2: 0,
          sleepHours: 0,
          deepSleep: 0,
          remSleep: 0,
          lightSleep: 0,
          steps: 0,
          activeMinutes: 0,
          biocharge: 0,
          ...safe,
        } as any);
        break;

      case 'meals':
        await db.meals.put({
          id,
          date,
          mealType: 'lunch' as const,
          description: '',
          toleratedWell: true,
          ...safe,
        } as any);
        break;

      case 'supplements':
        await db.supplements.put({
          id,
          date,
          supplements: [],
          ...safe,
        } as any);
        break;

      case 'imaging':
        await db.imaging.put({
          id,
          date,
          type: 'other' as const,
          bodyRegion: '',
          images: [],
          findings: '',
          notes: '',
          ...safe,
        } as any);
        break;

      case 'prediction':
        await db.predictions.put({
          id,
          date,
          targetDate: date,
          type: 'wellbeing' as const,
          prediction: '',
          confidence: 0.5,
          basedOn: [],
          ...safe,
        } as any);
        break;
    }
  }
}

function removeExtractTag(text: string): string {
  const start = text.indexOf(EXTRACT_TAG);
  if (start === -1) return text;
  // Find the matching closing ]
  let depth = 0;
  for (let i = start + EXTRACT_TAG.length; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') depth--;
    if (depth === 0 && text[i] === ']') {
      return text.slice(0, start).trimEnd() + text.slice(i + 1);
    }
  }
  return text; // No matching close — return as-is
}

export function cleanResponseFromTags(responseText: string): string {
  return removeExtractTag(responseText
    .replace(SAVE_REGEX, '')
    .replace(UPDATE_REGEX, '')
    .replace(DISEASE_REGEX, '')
    .replace(/```json\s*\n?/g, '')
    .replace(/```\s*\n?/g, '')
    .trim());
}
