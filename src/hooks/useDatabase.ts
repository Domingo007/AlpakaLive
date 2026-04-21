import { useState, useEffect, useCallback } from 'react';
import { db, getPatient, savePatient, getSettings, saveSettings, getRecentDailyLogs, getRecentBloodWork, getRecentWearableData, getRecentMeals, getRecentChemo, getRecentImaging, getRecentPredictions } from '@/lib/db';
import type { PatientProfile, AppSettings, DailyLog, BloodWork, WearableData, MealLog, ChemoSession, ImagingStudy, Prediction } from '@/types';

export function usePatient() {
  const [patient, setPatient] = useState<PatientProfile | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPatient().then(p => { setPatient(p); setLoading(false); });
  }, []);

  const update = useCallback(async (data: PatientProfile) => {
    await savePatient(data);
    setPatient(data);
  }, []);

  return { patient, loading, update };
}

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSettings().then(s => { setSettingsState(s); setLoading(false); });
  }, []);

  const update = useCallback(async (data: Partial<AppSettings>) => {
    await saveSettings(data);
    const updated = await getSettings();
    setSettingsState(updated);
  }, []);

  return { settings, loading, update };
}

export function useDashboardData() {
  const [data, setData] = useState<{
    daily: DailyLog[];
    blood: BloodWork[];
    wearable: WearableData[];
    meals: MealLog[];
    chemo: ChemoSession[];
    imaging: ImagingStudy[];
    predictions: Prediction[];
    counts: Record<string, number>;
  }>({
    daily: [], blood: [], wearable: [], meals: [], chemo: [], imaging: [], predictions: [],
    counts: {},
  });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [daily, blood, wearable, meals, chemo, imaging, predictions] = await Promise.all([
      getRecentDailyLogs(14),
      getRecentBloodWork(5),
      getRecentWearableData(14),
      getRecentMeals(30),
      getRecentChemo(10),
      getRecentImaging(5),
      getRecentPredictions(5),
    ]);

    const [dailyCount, bloodCount, wearableCount, mealsCount, chemoCount, imagingCount] = await Promise.all([
      db.daily.count(),
      db.blood.count(),
      db.wearable.count(),
      db.meals.count(),
      db.chemo.count(),
      db.imaging.count(),
    ]);

    setData({
      daily, blood, wearable, meals, chemo, imaging, predictions,
      counts: {
        daily: dailyCount,
        blood: bloodCount,
        wearable: wearableCount,
        meals: mealsCount,
        chemo: chemoCount,
        imaging: imagingCount,
      },
    });
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { ...data, loading, refresh };
}
