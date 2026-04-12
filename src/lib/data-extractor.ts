import { db } from './db';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeExtractedData } from './input-guard';

const SAVE_REGEX = /\[SAVE:(\w+):(\{[\s\S]*?\})\]/g;
const UPDATE_REGEX = /\[UPDATE:patient:(\{[\s\S]*?\})\]/g;
const DISEASE_REGEX = /\[DISEASE_PROFILE:(\{[\s\S]*?\})\]/g;

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

export function cleanResponseFromTags(responseText: string): string {
  return responseText
    .replace(SAVE_REGEX, '')
    .replace(UPDATE_REGEX, '')
    .replace(DISEASE_REGEX, '')
    .replace(/```json\s*\n?/g, '')
    .replace(/```\s*\n?/g, '')
    .trim();
}
