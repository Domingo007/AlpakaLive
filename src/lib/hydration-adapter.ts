/*
 * AlpacaLive — Hydration adapter
 * Bridges Dexie tables (daily/blood/chemo/wearable) to HydrationInputs
 * structure consumed by hydration-engine. Handles missing fields gracefully.
 *
 * Current Dexie schema names (v4):
 *   db.daily       → DailyLog[]    (symptoms, weight, heartRate, nausea, bowel)
 *   db.blood       → BloodWork[]   (markers: Record<string, number>)
 *   db.chemo       → ChemoSession[] (drugs[], cycle, date, status)
 *   db.wearable    → WearableData[] (rhr, hrv, skinTemperature)
 *
 * Body water mass is NOT in current schema — always undefined until Withings BIA
 * integration lands (placeholder in UI nudges toward that connection).
 */
import { db } from './db';
import type { HydrationInputs } from './hydration-engine';

// Drugs flagged nephrotoxic. Currently hardcoded; future iteration could read
// this from medical-knowledge/drugs/chemo-agents.json by scanning commonSideEffects.
const NEPHROTOXIC_DRUGS = new Set<string>([
  'carboplatin',
  'cisplatin',
  'cyclophosphamide',
  'ifosfamide',
  'methotrexate',
]);

function isNephrotoxicDrugList(drugs: string[] | undefined): boolean {
  if (!drugs || drugs.length === 0) return false;
  return drugs.some(d => NEPHROTOXIC_DRUGS.has(d.toLowerCase().trim()));
}

/**
 * Normalize free-text bowel description to engine enum.
 * DailyLog.bowel is free-text string; engine expects controlled enum.
 * Conservative mapping: only flag 'loose' / 'very_loose' when string clearly indicates diarrhea.
 */
function normalizeBowel(bowel: string | undefined): 'normal' | 'constipated' | 'loose' | 'very_loose' | undefined {
  if (!bowel) return undefined;
  const s = bowel.toLowerCase();
  if (s.includes('wodnist') || s.includes('watery') || s.includes('very loose') || s.includes('very_loose')) {
    return 'very_loose';
  }
  if (s.includes('biegunka') || s.includes('diarrhea') || s.includes('luźn') || s.includes('luzn') || s.includes('loose')) {
    return 'loose';
  }
  if (s.includes('zaparci') || s.includes('constipat')) {
    return 'constipated';
  }
  if (s.includes('normaln') || s.includes('normal') || s.trim() === '') {
    return 'normal';
  }
  return undefined;
}

function isoDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

/**
 * Collect hydration inputs for target date (defaults to today).
 * Returns HydrationInputs ready for computeHydrationFlag.
 * Partial data is expected and handled gracefully.
 */
export async function collectHydrationInputs(targetDate?: Date): Promise<HydrationInputs> {
  const today = targetDate ?? new Date();
  const todayStr = isoDate(today);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  const sevenDaysAgoStr = isoDate(sevenDaysAgo);

  // 1. Daily logs (last 7 days)
  const dailyLogs = await db.daily
    .where('date')
    .between(sevenDaysAgoStr, todayStr, true, true)
    .toArray();

  // 2. Wearable data (last 7 days) — merge with daily per date
  const wearableData = await db.wearable
    .where('date')
    .between(sevenDaysAgoStr, todayStr, true, true)
    .toArray();

  const wearableByDate = new Map(wearableData.map(w => [w.date, w]));
  const dailyByDate = new Map(dailyLogs.map(d => [d.date, d]));
  const allDates = new Set<string>([...wearableByDate.keys(), ...dailyByDate.keys()]);

  const dailyMeasurements: HydrationInputs['dailyMeasurements'] = Array.from(allDates)
    .sort()
    .map(date => {
      const daily = dailyByDate.get(date);
      const wearable = wearableByDate.get(date);
      return {
        date,
        weight: daily?.weight,
        // bodyWaterMass intentionally undefined — Withings BIA not wired yet
        bodyWaterMass: undefined,
        // Prefer wearable rhr over daily heartRate (wearable is resting-measured)
        restingHR: wearable?.rhr ?? daily?.heartRate,
        hrv: wearable?.hrv,
        skinTemp: wearable?.skinTemperature,
      };
    });

  // 3. Blood results (latest + previous for creatinine delta)
  const recentBlood = await db.blood
    .orderBy('date')
    .reverse()
    .limit(10)
    .toArray();

  const latestBloodResults = recentBlood[0]
    ? {
        date: recentBlood[0].date,
        creatinine: recentBlood[0].markers?.creatinine,
        sodium: recentBlood[0].markers?.sodium,
        hematocrit: recentBlood[0].markers?.hct ?? recentBlood[0].markers?.hematocrit,
        bun: recentBlood[0].markers?.urea ?? recentBlood[0].markers?.bun,
      }
    : null;

  const previousBloodResults = recentBlood[1]
    ? {
        date: recentBlood[1].date,
        creatinine: recentBlood[1].markers?.creatinine,
      }
    : null;

  // 4. Today's log (GI symptoms)
  const todayDaily = dailyByDate.get(todayStr);
  const todayLog = todayDaily
    ? {
        nausea: todayDaily.nausea,
        bowel: normalizeBowel(todayDaily.bowel),
        temperature: todayDaily.temperature,
        fatigue: todayDaily.energy !== undefined ? 10 - todayDaily.energy : undefined,
      }
    : null;

  // 5. Chemo context — most recent completed/modified chemo in last 3 days + dayInCycle from today's daily
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(today.getDate() - 3);
  const threeDaysAgoStr = isoDate(threeDaysAgo);

  const recentChemo = await db.chemo
    .where('date')
    .between(threeDaysAgoStr, todayStr, true, true)
    .toArray();

  const validStatuses = new Set(['completed', 'modified']);
  const completedChemo = recentChemo.filter(c => validStatuses.has(c.status));
  const latestChemo = completedChemo.length > 0
    ? completedChemo.reduce((latest, c) => ((c.actualDate ?? c.date) > (latest.actualDate ?? latest.date) ? c : latest))
    : null;

  const chemoContext = latestChemo
    ? {
        dayInCycle: todayDaily?.dayInCycle,
        drugs: latestChemo.drugs,
        isNephrotoxicDay: isNephrotoxicDrugList(latestChemo.drugs),
      }
    : null;

  return {
    dailyMeasurements,
    latestBloodResults,
    previousBloodResults,
    todayLog,
    chemoContext,
  };
}

// Export for testing
export const _internal = {
  normalizeBowel,
  isNephrotoxicDrugList,
};
