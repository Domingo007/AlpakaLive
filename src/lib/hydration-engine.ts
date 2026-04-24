/*
 * AlpacaLive — Hydration Trend rule engine
 * Pure functions, no DB / React coupling. Takes HydrationInputs,
 * returns HydrationFlag. Baseline is 7-day rolling window with graceful
 * degradation when a stream is missing.
 *
 * NOT a medical device. NOT a diagnosis. Pattern-based comparison only.
 */

export interface HydrationBaseline {
  windowDays: 7;
  startDate: string;
  endDate: string;

  bodyWaterMass?: number;
  restingHeartRate?: number;
  heartRateVariability?: number;
  skinTemperature?: number;

  dataPoints: {
    bodyWater: number;
    hr: number;
    hrv: number;
    temp: number;
  };
  hasMinimumData: boolean;
}

export interface HydrationInputs {
  dailyMeasurements: Array<{
    date: string;
    weight?: number;
    bodyWaterMass?: number;
    restingHR?: number;
    hrv?: number;
    skinTemp?: number;
  }>;

  latestBloodResults: {
    date: string;
    creatinine?: number;
    sodium?: number;
    hematocrit?: number;
    bun?: number;
  } | null;

  previousBloodResults: {
    date: string;
    creatinine?: number;
  } | null;

  todayLog: {
    nausea?: number;
    bowel?: 'normal' | 'constipated' | 'loose' | 'very_loose';
    temperature?: number;
    fatigue?: number;
  } | null;

  chemoContext: {
    dayInCycle?: number;
    drugs?: string[];
    isNephrotoxicDay?: boolean;
  } | null;
}

export type FlagColor = 'gray' | 'green' | 'yellow' | 'red';

export type ReasonType =
  | 'body_water_drop'
  | 'hr_elevation'
  | 'gi_symptoms'
  | 'creatinine_rise'
  | 'insufficient_data';

export interface HydrationFlag {
  color: FlagColor;
  reasons: Array<{
    type: ReasonType;
    severity: 'weak' | 'moderate' | 'strong';
    description: string;
    value?: number;
    reference?: number;
  }>;
  dataAvailability: {
    hasBodyWater: boolean;
    hasBloodResults: boolean;
    hasTodayLog: boolean;
    hasWatchData: boolean;
  };
  baselineAvailable: boolean;
  daysUntilBaseline?: number;
}

export function buildHydrationBaseline(
  measurements: HydrationInputs['dailyMeasurements'],
): HydrationBaseline {
  const sorted = [...measurements].sort((a, b) => a.date.localeCompare(b.date));
  const window = sorted.slice(-7);

  const bodyWaterValues = window.map(d => d.bodyWaterMass).filter((v): v is number => typeof v === 'number');
  const hrValues = window.map(d => d.restingHR).filter((v): v is number => typeof v === 'number');
  const hrvValues = window.map(d => d.hrv).filter((v): v is number => typeof v === 'number');
  const tempValues = window.map(d => d.skinTemp).filter((v): v is number => typeof v === 'number');

  const avg = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : undefined);

  const maxStreamDays = Math.max(bodyWaterValues.length, hrValues.length, hrvValues.length, tempValues.length);

  return {
    windowDays: 7,
    startDate: window[0]?.date ?? '',
    endDate: window[window.length - 1]?.date ?? '',
    bodyWaterMass: avg(bodyWaterValues),
    restingHeartRate: avg(hrValues),
    heartRateVariability: avg(hrvValues),
    skinTemperature: avg(tempValues),
    dataPoints: {
      bodyWater: bodyWaterValues.length,
      hr: hrValues.length,
      hrv: hrvValues.length,
      temp: tempValues.length,
    },
    hasMinimumData: maxStreamDays >= 5,
  };
}

export function computeHydrationFlag(
  inputs: HydrationInputs,
  baseline: HydrationBaseline,
): HydrationFlag {
  const dataAvailability = {
    hasBodyWater: inputs.dailyMeasurements.some(d => d.bodyWaterMass !== undefined),
    hasBloodResults: inputs.latestBloodResults !== null,
    hasTodayLog: inputs.todayLog !== null,
    hasWatchData: inputs.dailyMeasurements.some(d => d.restingHR !== undefined),
  };

  if (!baseline.hasMinimumData) {
    const daysWithAnyData = new Set(
      inputs.dailyMeasurements
        .filter(d => d.weight !== undefined || d.bodyWaterMass !== undefined || d.restingHR !== undefined)
        .map(d => d.date),
    ).size;
    return {
      color: 'gray',
      reasons: [{ type: 'insufficient_data', severity: 'weak', description: 'insufficient_baseline' }],
      dataAvailability,
      baselineAvailable: false,
      daysUntilBaseline: Math.max(0, 5 - daysWithAnyData),
    };
  }

  const isNephrotoxicDay = inputs.chemoContext?.isNephrotoxicDay ?? false;
  const modifier = isNephrotoxicDay ? 0.75 : 1.0;

  const reasons: HydrationFlag['reasons'] = [];

  const today = inputs.dailyMeasurements[inputs.dailyMeasurements.length - 1];

  // Rule 1: body water drop
  if (baseline.bodyWaterMass !== undefined && today?.bodyWaterMass !== undefined) {
    const dropPct = ((baseline.bodyWaterMass - today.bodyWaterMass) / baseline.bodyWaterMass) * 100;
    const threshold2 = 2 * modifier;
    const threshold3 = 3 * modifier;
    if (dropPct >= threshold3) {
      reasons.push({
        type: 'body_water_drop',
        severity: 'strong',
        description: 'body_water_drop_severe',
        value: dropPct,
        reference: threshold3,
      });
    } else if (dropPct >= threshold2) {
      reasons.push({
        type: 'body_water_drop',
        severity: 'moderate',
        description: 'body_water_drop_moderate',
        value: dropPct,
        reference: threshold2,
      });
    }
  }

  // Rule 2: resting HR elevation
  if (baseline.restingHeartRate !== undefined && today?.restingHR !== undefined) {
    const elevationPct = ((today.restingHR - baseline.restingHeartRate) / baseline.restingHeartRate) * 100;
    const threshold = 10 * modifier;
    if (elevationPct >= threshold) {
      reasons.push({
        type: 'hr_elevation',
        severity: 'moderate',
        description: 'hr_elevation',
        value: elevationPct,
        reference: threshold,
      });
    }
  }

  // Rule 3: GI symptoms — CONSERVATIVE: nausea ≥ 8 AND bowel = loose|very_loose
  if (inputs.todayLog?.nausea !== undefined && inputs.todayLog?.bowel !== undefined) {
    const isLooseBowel = inputs.todayLog.bowel === 'loose' || inputs.todayLog.bowel === 'very_loose';
    if (inputs.todayLog.nausea >= 8 && isLooseBowel) {
      reasons.push({
        type: 'gi_symptoms',
        severity: inputs.todayLog.bowel === 'very_loose' ? 'strong' : 'moderate',
        description: 'gi_symptoms_combined',
        value: inputs.todayLog.nausea,
      });
    }
  }

  // Rule 4: creatinine rise
  if (
    inputs.latestBloodResults?.creatinine !== undefined &&
    inputs.previousBloodResults?.creatinine !== undefined
  ) {
    const risePct =
      ((inputs.latestBloodResults.creatinine - inputs.previousBloodResults.creatinine) /
        inputs.previousBloodResults.creatinine) *
      100;
    const threshold15 = 15 * modifier;
    const threshold25 = 25 * modifier;
    if (risePct >= threshold25) {
      reasons.push({
        type: 'creatinine_rise',
        severity: 'strong',
        description: 'creatinine_rise_severe',
        value: risePct,
        reference: threshold25,
      });
    } else if (risePct >= threshold15) {
      reasons.push({
        type: 'creatinine_rise',
        severity: 'moderate',
        description: 'creatinine_rise_moderate',
        value: risePct,
        reference: threshold15,
      });
    }
  }

  const strongCount = reasons.filter(r => r.severity === 'strong').length;
  const yellowCount = reasons.length;

  let color: FlagColor = 'green';
  if (strongCount >= 1 || yellowCount >= 2) {
    color = 'red';
  } else if (yellowCount === 1) {
    color = 'yellow';
  }

  return {
    color,
    reasons,
    dataAvailability,
    baselineAvailable: true,
  };
}
