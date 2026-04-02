import { v4 as uuidv4 } from 'uuid';
import { db } from './db';
import { calculateCurrentPhase, getPhaseLabel } from './phase-calculator';
import { evaluateMarker } from './blood-norms';
import type { DailyLog, ChemoSession, BloodWork, Prediction, ChemoPhase } from '@/types';

// ==================== TYPES ====================

export interface DayPrediction {
  date: string;
  dayOfWeek: string;
  dayInCycle: number;
  phase: ChemoPhase;
  phaseLabel: string;
  energy: { predicted: number; min: number; max: number };
  pain: { predicted: number; min: number; max: number };
  nausea: { predicted: number; min: number; max: number };
  mood: { predicted: number; min: number; max: number };
  recommendations: string[];
  confidence: number;
  dataPoints: number;
}

export interface PredictionResult {
  days: DayPrediction[];
  patterns: Pattern[];
  risks: string[];
  overallConfidence: number;
  basedOn: string[];
  insufficientData: boolean;
  message?: string;
}

interface Pattern {
  description: string;
  strength: number; // 0-1
}

interface CycleDayStats {
  dayInCycle: number;
  energy: number[];
  pain: number[];
  nausea: number[];
  mood: number[];
  count: number;
}

const POLISH_DAYS = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota'];

// ==================== MAIN ENGINE ====================

export async function generatePrediction(): Promise<PredictionResult> {
  // 1. Load all needed data
  const [allDaily, allChemo, recentBlood] = await Promise.all([
    db.daily.orderBy('date').toArray(),
    db.chemo.filter(c => c.status === 'completed' || c.status === 'modified').toArray(),
    db.blood.orderBy('date').reverse().limit(3).toArray(),
  ]);

  // 2. Check if we have enough data
  if (allChemo.length < 2) {
    return {
      days: [],
      patterns: [],
      risks: [],
      overallConfidence: 0,
      basedOn: [],
      insufficientData: true,
      message: `Potrzebuję minimum 2 sesji chemii do predykcji. Masz: ${allChemo.length}. Dodaj historyczne daty w Ustawieniach → Import danych historycznych.`,
    };
  }

  if (allDaily.length < 5) {
    return {
      days: [],
      patterns: [],
      risks: [],
      overallConfidence: 0,
      basedOn: [],
      insufficientData: true,
      message: `Potrzebuję minimum 5 wpisów dziennika do predykcji. Masz: ${allDaily.length}. Zacznij codziennie raportować samopoczucie.`,
    };
  }

  // 3. Get current cycle position
  const sortedChemo = [...allChemo].sort((a, b) =>
    (a.actualDate || a.date).localeCompare(b.actualDate || b.date),
  );
  const phaseInfo = calculateCurrentPhase(sortedChemo);
  const cycleLength = estimateCycleLength(sortedChemo);

  // 4. Build day-in-cycle statistics from historical data
  const cycleDayMap = buildCycleDayStats(allDaily, sortedChemo);

  // 5. Analyze blood work impact
  const bloodImpact = analyzeBloodImpact(recentBlood);

  // 6. Analyze weight trend
  const weightTrend = analyzeWeightTrend(allDaily);

  // 7. Generate 5-day forecast
  const today = new Date();
  const days: DayPrediction[] = [];

  for (let i = 0; i < 5; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);
    const dateStr = targetDate.toISOString().split('T')[0];
    const futureDay = phaseInfo.dayInCycle + i;
    const dayInCycle = futureDay % cycleLength;

    const phase = dayToPhase(dayInCycle);
    const stats = cycleDayMap.get(dayInCycle) || cycleDayMap.get(closestDay(dayInCycle, cycleDayMap));

    const prediction = predictDay(dayInCycle, phase, stats, bloodImpact, weightTrend);

    days.push({
      date: dateStr,
      dayOfWeek: POLISH_DAYS[targetDate.getDay()],
      dayInCycle,
      phase,
      phaseLabel: getPhaseLabel(phase),
      ...prediction,
    });
  }

  // 8. Detect patterns
  const patterns = detectPatterns(cycleDayMap, allDaily, sortedChemo);

  // 9. Identify risks
  const risks = identifyRisks(bloodImpact, weightTrend, phaseInfo);

  // 10. Calculate overall confidence
  const avgDataPoints = days.reduce((s, d) => s + d.dataPoints, 0) / days.length;
  const overallConfidence = Math.min(0.95, Math.max(0.1,
    (Math.min(avgDataPoints, 5) / 5) * 0.4 +
    (Math.min(allChemo.length, 6) / 6) * 0.3 +
    (Math.min(allDaily.length, 30) / 30) * 0.3,
  ));

  const basedOn: string[] = [];
  basedOn.push(`${allDaily.length} wpisów dziennika`);
  basedOn.push(`${allChemo.length} sesji chemii`);
  if (recentBlood.length > 0) basedOn.push(`${recentBlood.length} badań krwi`);
  if (weightTrend.trend !== 'stable') basedOn.push('trend wagi');

  return {
    days,
    patterns,
    risks,
    overallConfidence,
    basedOn,
    insufficientData: false,
  };
}

// ==================== SAVE TO DB ====================

export async function savePrediction(result: PredictionResult): Promise<void> {
  if (result.insufficientData || result.days.length === 0) return;

  const predictions: (Prediction & { id: string })[] = result.days.map(day => ({
    id: uuidv4(),
    date: new Date().toISOString().split('T')[0],
    targetDate: day.date,
    type: 'wellbeing' as const,
    prediction: `Dzień ${day.dayInCycle} cyklu (${day.phaseLabel}): energia ~${day.energy.predicted}/10, ból ~${day.pain.predicted}/10, nudności ~${day.nausea.predicted}/10`,
    confidence: day.confidence,
    basedOn: result.basedOn,
  }));

  await db.predictions.bulkPut(predictions);
}

// ==================== CHECK ACCURACY ====================

export async function checkPredictionAccuracy(): Promise<{
  predictions: (Prediction & { actualEnergy?: number; match: boolean })[];
  overallAccuracy: number;
} | null> {
  const today = new Date().toISOString().split('T')[0];

  // Get predictions for dates that have passed
  const pastPredictions = await db.predictions
    .where('targetDate')
    .below(today)
    .filter(p => !p.actual && p.type === 'wellbeing')
    .toArray();

  if (pastPredictions.length === 0) return null;

  const results: (Prediction & { actualEnergy?: number; match: boolean })[] = [];
  let totalAccuracy = 0;
  let checked = 0;

  for (const pred of pastPredictions) {
    // Find actual daily log for that date
    const dailyLogs = await db.daily.where('date').equals(pred.targetDate).toArray();
    const actual = dailyLogs[0];

    if (actual) {
      // Extract predicted energy from prediction text
      const energyMatch = pred.prediction.match(/energia ~(\d+)/);
      const predictedEnergy = energyMatch ? parseInt(energyMatch[1]) : null;

      if (predictedEnergy !== null) {
        const diff = Math.abs(predictedEnergy - actual.energy);
        const accuracy = Math.max(0, 1 - diff / 10);

        await db.predictions.update(pred.id, {
          actual: `energia: ${actual.energy}, ból: ${actual.pain}, nudności: ${actual.nausea}`,
          accuracy: Math.round(accuracy * 100),
        });

        results.push({ ...pred, actualEnergy: actual.energy, accuracy: Math.round(accuracy * 100), match: diff <= 2 });
        totalAccuracy += accuracy;
        checked++;
      }
    }
  }

  if (checked === 0) return null;

  return {
    predictions: results,
    overallAccuracy: Math.round((totalAccuracy / checked) * 100),
  };
}

// ==================== INTERNAL HELPERS ====================

function buildCycleDayStats(dailyLogs: DailyLog[], chemoSessions: ChemoSession[]): Map<number, CycleDayStats> {
  const map = new Map<number, CycleDayStats>();

  for (const log of dailyLogs) {
    let dayInCycle = log.dayInCycle;

    // If dayInCycle not set, calculate it
    if (!dayInCycle && dayInCycle !== 0) {
      dayInCycle = calculateDayInCycle(log.date, chemoSessions);
    }
    if (dayInCycle < 0) continue;

    let stats = map.get(dayInCycle);
    if (!stats) {
      stats = { dayInCycle, energy: [], pain: [], nausea: [], mood: [], count: 0 };
      map.set(dayInCycle, stats);
    }

    stats.energy.push(log.energy);
    stats.pain.push(log.pain);
    stats.nausea.push(log.nausea);
    stats.mood.push(log.mood);
    stats.count++;
  }

  return map;
}

function calculateDayInCycle(dateStr: string, chemoSessions: ChemoSession[]): number {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);

  // Find the most recent chemo before this date
  let lastChemo: Date | null = null;
  for (const session of chemoSessions) {
    const chemoDate = new Date(session.actualDate || session.date);
    chemoDate.setHours(0, 0, 0, 0);
    if (chemoDate <= date) {
      if (!lastChemo || chemoDate > lastChemo) {
        lastChemo = chemoDate;
      }
    }
  }

  if (!lastChemo) return -1;
  return Math.floor((date.getTime() - lastChemo.getTime()) / (1000 * 60 * 60 * 24));
}

function estimateCycleLength(chemoSessions: ChemoSession[]): number {
  if (chemoSessions.length < 2) return 21;

  const gaps: number[] = [];
  for (let i = 1; i < chemoSessions.length; i++) {
    const d1 = new Date(chemoSessions[i - 1].actualDate || chemoSessions[i - 1].date);
    const d2 = new Date(chemoSessions[i].actualDate || chemoSessions[i].date);
    const days = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    if (days > 0 && days < 60) gaps.push(days);
  }

  if (gaps.length === 0) return 21;
  return Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length);
}

function dayToPhase(dayInCycle: number): ChemoPhase {
  if (dayInCycle <= 3) return 'A';
  if (dayInCycle <= 7) return 'B';
  return 'C';
}

function closestDay(target: number, map: Map<number, CycleDayStats>): number {
  let best = 0;
  let bestDist = Infinity;
  for (const key of map.keys()) {
    const dist = Math.abs(key - target);
    if (dist < bestDist) {
      bestDist = dist;
      best = key;
    }
  }
  return best;
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 5;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}

function stdDev(arr: number[]): number {
  if (arr.length < 2) return 1.5;
  const mean = avg(arr);
  const variance = arr.reduce((sum, v) => sum + (v - mean) ** 2, 0) / arr.length;
  return Math.round(Math.sqrt(variance) * 10) / 10;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function predictDay(
  dayInCycle: number,
  phase: ChemoPhase,
  stats: CycleDayStats | undefined,
  bloodImpact: BloodImpact,
  weightTrend: WeightTrend,
): Omit<DayPrediction, 'date' | 'dayOfWeek' | 'dayInCycle' | 'phase' | 'phaseLabel'> {
  let baseEnergy = stats ? avg(stats.energy) : phaseDefault(phase, 'energy');
  let basePain = stats ? avg(stats.pain) : phaseDefault(phase, 'pain');
  let baseNausea = stats ? avg(stats.nausea) : phaseDefault(phase, 'nausea');
  let baseMood = stats ? avg(stats.mood) : phaseDefault(phase, 'mood');
  const dataPoints = stats?.count || 0;

  // Blood impact adjustments
  baseEnergy = clamp(baseEnergy + bloodImpact.energyModifier, 1, 10);
  basePain = clamp(basePain + bloodImpact.painModifier, 0, 10);

  // Weight trend adjustments
  if (weightTrend.trend === 'falling') {
    baseEnergy = clamp(baseEnergy - 0.5, 1, 10);
    baseMood = clamp(baseMood - 0.5, 1, 10);
  }

  const spread = stats ? stdDev(stats.energy) : 2;
  const energy = {
    predicted: Math.round(baseEnergy),
    min: Math.round(clamp(baseEnergy - spread, 1, 10)),
    max: Math.round(clamp(baseEnergy + spread, 1, 10)),
  };
  const pain = {
    predicted: Math.round(basePain),
    min: Math.round(clamp(basePain - (stats ? stdDev(stats.pain) : 1.5), 0, 10)),
    max: Math.round(clamp(basePain + (stats ? stdDev(stats.pain) : 1.5), 0, 10)),
  };
  const nausea = {
    predicted: Math.round(baseNausea),
    min: Math.round(clamp(baseNausea - (stats ? stdDev(stats.nausea) : 1.5), 0, 10)),
    max: Math.round(clamp(baseNausea + (stats ? stdDev(stats.nausea) : 1.5), 0, 10)),
  };
  const mood = {
    predicted: Math.round(baseMood),
    min: Math.round(clamp(baseMood - (stats ? stdDev(stats.mood) : 1.5), 1, 10)),
    max: Math.round(clamp(baseMood + (stats ? stdDev(stats.mood) : 1.5), 1, 10)),
  };

  const recommendations = generateRecommendations(phase, energy.predicted, pain.predicted, nausea.predicted, bloodImpact, weightTrend);

  const confidence = Math.min(0.95, Math.max(0.1,
    dataPoints >= 3 ? 0.7 + (Math.min(dataPoints, 8) - 3) * 0.05 : dataPoints * 0.15 + 0.1,
  ));

  return { energy, pain, nausea, mood, recommendations, confidence, dataPoints };
}

function phaseDefault(phase: ChemoPhase, metric: string): number {
  const defaults: Record<string, Record<string, number>> = {
    A: { energy: 3, pain: 5, nausea: 6, mood: 4 },
    B: { energy: 5, pain: 3, nausea: 3, mood: 5 },
    C: { energy: 7, pain: 1, nausea: 1, mood: 7 },
  };
  return defaults[phase || 'C']?.[metric] ?? 5;
}

// ==================== BLOOD IMPACT ====================

interface BloodImpact {
  energyModifier: number;
  painModifier: number;
  alerts: string[];
}

function analyzeBloodImpact(bloodWork: BloodWork[]): BloodImpact {
  if (bloodWork.length === 0) return { energyModifier: 0, painModifier: 0, alerts: [] };

  const latest = bloodWork[0];
  let energyMod = 0;
  let painMod = 0;
  const alerts: string[] = [];

  const wbc = latest.markers.wbc;
  const hgb = latest.markers.hgb;
  const plt = latest.markers.plt;

  if (wbc !== undefined) {
    if (wbc < 2.0) { energyMod -= 2; alerts.push('WBC krytycznie niskie — ryzyko infekcji'); }
    else if (wbc < 4.0) { energyMod -= 1; alerts.push('WBC poniżej normy — osłabiona odporność'); }
  }

  if (hgb !== undefined) {
    if (hgb < 8.0) { energyMod -= 2; alerts.push('Hemoglobina krytyczna — silne zmęczenie'); }
    else if (hgb < 10.0) { energyMod -= 1; alerts.push('Hemoglobina niska — możliwe zmęczenie'); }
  }

  if (plt !== undefined) {
    if (plt < 50) { painMod += 1; alerts.push('Płytki krytycznie niskie — ryzyko krwawień'); }
    else if (plt < 100) { alerts.push('Płytki poniżej normy'); }
  }

  return { energyModifier: energyMod, painModifier: painMod, alerts };
}

// ==================== WEIGHT TREND ====================

interface WeightTrend {
  trend: 'rising' | 'falling' | 'stable';
  weeklyChange: number;
  alert?: string;
}

function analyzeWeightTrend(dailyLogs: DailyLog[]): WeightTrend {
  const withWeight = dailyLogs.filter(d => d.weight).sort((a, b) => a.date.localeCompare(b.date));
  if (withWeight.length < 2) return { trend: 'stable', weeklyChange: 0 };

  const recent = withWeight.slice(-7);
  const first = recent[0].weight!;
  const last = recent[recent.length - 1].weight!;
  const days = Math.max(1, Math.round(
    (new Date(recent[recent.length - 1].date).getTime() - new Date(recent[0].date).getTime()) / (1000 * 60 * 60 * 24),
  ));

  const weeklyChange = Math.round(((last - first) / days) * 7 * 10) / 10;

  let trend: 'rising' | 'falling' | 'stable' = 'stable';
  let alert: string | undefined;

  if (weeklyChange < -1) {
    trend = 'falling';
    alert = `Spadek wagi ${Math.abs(weeklyChange).toFixed(1)} kg/tydzień — poinformuj onkologa`;
  } else if (weeklyChange < -0.5) {
    trend = 'falling';
  } else if (weeklyChange > 0.5) {
    trend = 'rising';
  }

  return { trend, weeklyChange, alert };
}

// ==================== RECOMMENDATIONS ====================

function generateRecommendations(
  phase: ChemoPhase,
  energy: number,
  pain: number,
  nausea: number,
  blood: BloodImpact,
  weight: WeightTrend,
): string[] {
  const recs: string[] = [];

  if (phase === 'A') {
    recs.push('Nawadniaj się — minimum 2l płynów');
    if (nausea >= 5) recs.push('Małe, częste posiłki. Unikaj ciężkich potraw');
    recs.push('Odpoczynek priorytetem — nie zmuszaj się do aktywności');
  } else if (phase === 'B') {
    recs.push('Delikatne spacery 15-20 min jeśli energia pozwala');
    if (energy >= 5) recs.push('Możesz spróbować pełniejszych posiłków');
    recs.push('Białko 60-80g/dzień — wspieraj regenerację');
  } else {
    recs.push('Najlepszy czas na aktywność — spacery 30-40 min');
    recs.push('Białko 80g+/dzień — buduj rezerwy przed chemią');
    recs.push('Dobry czas na badania kontrolne krwi');
  }

  if (blood.energyModifier < -1) {
    recs.push('Niskie parametry krwi — unikaj kontaktu z chorymi');
  }
  if (weight.trend === 'falling') {
    recs.push('Spadek wagi — zwiększ kaloryczność posiłków');
  }

  return recs.slice(0, 4);
}

// ==================== PATTERNS ====================

function detectPatterns(
  cycleDayMap: Map<number, CycleDayStats>,
  dailyLogs: DailyLog[],
  chemoSessions: ChemoSession[],
): Pattern[] {
  const patterns: Pattern[] = [];

  // Find worst day
  let worstDay = 0;
  let worstEnergy = 10;
  for (const [day, stats] of cycleDayMap) {
    const e = avg(stats.energy);
    if (e < worstEnergy && stats.count >= 2) {
      worstEnergy = e;
      worstDay = day;
    }
  }
  if (worstDay > 0) {
    patterns.push({
      description: `Dzień ${worstDay} po chemii jest zwykle najgorszy (energia ${worstEnergy.toFixed(1)}/10)`,
      strength: Math.min(1, cycleDayMap.get(worstDay)!.count / 4),
    });
  }

  // Find best day
  let bestDay = 0;
  let bestEnergy = 0;
  for (const [day, stats] of cycleDayMap) {
    const e = avg(stats.energy);
    if (e > bestEnergy && stats.count >= 2 && day > 3) {
      bestEnergy = e;
      bestDay = day;
    }
  }
  if (bestDay > 0) {
    patterns.push({
      description: `Dzień ${bestDay} cyklu — najlepsza energia (${bestEnergy.toFixed(1)}/10)`,
      strength: Math.min(1, cycleDayMap.get(bestDay)!.count / 4),
    });
  }

  // Recovery speed
  const day3 = cycleDayMap.get(3);
  const day7 = cycleDayMap.get(7);
  if (day3 && day7 && day3.count >= 2 && day7.count >= 2) {
    const recovery = avg(day7.energy) - avg(day3.energy);
    if (recovery > 2) {
      patterns.push({ description: `Szybka regeneracja — energia wzrasta o ${recovery.toFixed(1)} pkt między dniem 3 a 7`, strength: 0.7 });
    } else if (recovery < 1) {
      patterns.push({ description: 'Powolna regeneracja — rozważ wsparcie dietetyczne w Fazie B', strength: 0.6 });
    }
  }

  return patterns;
}

// ==================== RISKS ====================

function identifyRisks(blood: BloodImpact, weight: WeightTrend, phase: ReturnType<typeof calculateCurrentPhase>): string[] {
  const risks: string[] = [];
  risks.push(...blood.alerts);
  if (weight.alert) risks.push(weight.alert);
  if (phase.phase === 'A') {
    risks.push('Faza A — unikaj miejsc z dużą ilością ludzi (ryzyko infekcji)');
  }
  return risks;
}

// ==================== FORMAT FOR CHAT ====================

export function formatPredictionForChat(result: PredictionResult): string {
  if (result.insufficientData) {
    return `📊 **Predykcja niedostępna**\n\n${result.message}`;
  }

  let text = `📊 **Predykcja na najbliższe 5 dni**\n`;
  text += `Pewność: ${Math.round(result.overallConfidence * 100)}% (na podstawie: ${result.basedOn.join(', ')})\n\n`;

  for (const day of result.days) {
    const phaseEmoji = day.phase === 'A' ? '🔴' : day.phase === 'B' ? '🟡' : '🟢';
    text += `**${day.dayOfWeek} ${day.date.slice(5)}** — dzień ${day.dayInCycle} cyklu ${phaseEmoji} ${day.phaseLabel}\n`;
    text += `  Energia: ~${day.energy.predicted}/10 (${day.energy.min}-${day.energy.max})\n`;
    text += `  Ból: ~${day.pain.predicted}/10 | Nudności: ~${day.nausea.predicted}/10\n`;
    if (day.recommendations.length > 0) {
      text += `  💡 ${day.recommendations[0]}\n`;
    }
    text += '\n';
  }

  if (result.patterns.length > 0) {
    text += '**Wykryte wzorce:**\n';
    for (const p of result.patterns) {
      text += `• ${p.description}\n`;
    }
    text += '\n';
  }

  if (result.risks.length > 0) {
    text += '**⚠️ Ryzyka:**\n';
    for (const r of result.risks) {
      text += `• ${r}\n`;
    }
  }

  return text;
}
