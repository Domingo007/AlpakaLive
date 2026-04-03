import Dexie, { type Table } from 'dexie';
import {
  DEFAULT_NOTIFICATIONS,
} from '@/types';
import type {
  PatientProfile,
  ChemoSession,
  BloodWork,
  DailyLog,
  WearableData,
  MealLog,
  SupplementLog,
  ImagingStudy,
  Prediction,
  ChatMessage,
  AppSettings,
  CalendarNote,
} from '@/types';

class AlpakaLiveDB extends Dexie {
  patient!: Table<PatientProfile>;
  chemo!: Table<ChemoSession>;
  blood!: Table<BloodWork>;
  daily!: Table<DailyLog>;
  wearable!: Table<WearableData>;
  meals!: Table<MealLog>;
  supplements!: Table<SupplementLog>;
  imaging!: Table<ImagingStudy>;
  predictions!: Table<Prediction>;
  chat!: Table<ChatMessage>;
  settings!: Table<AppSettings>;
  calendarNotes!: Table<CalendarNote>;

  constructor() {
    super('AlpakaLiveDB');
    this.version(1).stores({
      patient: 'id',
      chemo: 'id, date, plannedDate, status',
      blood: 'id, date',
      daily: 'id, date',
      wearable: 'id, date',
      meals: 'id, date',
      supplements: 'id, date',
      imaging: 'id, date, type',
      predictions: 'id, date, targetDate, type',
      chat: 'id, timestamp',
      settings: 'id',
      calendarNotes: 'id, date, type',
    });
  }
}

export const db = new AlpakaLiveDB();

export async function getSettings(): Promise<AppSettings | undefined> {
  return db.settings.get('main');
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const existing = await getSettings();
  if (existing) {
    await db.settings.update('main', settings);
  } else {
    await db.settings.put({ id: 'main', apiKey: '', aiProvider: 'anthropic', appMode: 'notebook', onboardingCompleted: false, notifications: DEFAULT_NOTIFICATIONS, ...settings } as AppSettings & { id: string });
  }
}

export async function getPatient(): Promise<PatientProfile | undefined> {
  const patients = await db.patient.toArray();
  return patients[0];
}

export async function savePatient(patient: PatientProfile): Promise<void> {
  await db.patient.put(patient);
}

export async function getRecentDailyLogs(count = 5): Promise<DailyLog[]> {
  return db.daily.orderBy('date').reverse().limit(count).toArray();
}

export async function getRecentBloodWork(count = 2): Promise<BloodWork[]> {
  return db.blood.orderBy('date').reverse().limit(count).toArray();
}

export async function getRecentWearableData(count = 5): Promise<WearableData[]> {
  return db.wearable.orderBy('date').reverse().limit(count).toArray();
}

export async function getRecentMeals(count = 15): Promise<MealLog[]> {
  return db.meals.orderBy('date').reverse().limit(count).toArray();
}

export async function getRecentChemo(count = 6): Promise<ChemoSession[]> {
  return db.chemo.orderBy('date').reverse().limit(count).toArray();
}

export async function getRecentImaging(count = 2): Promise<ImagingStudy[]> {
  return db.imaging.orderBy('date').reverse().limit(count).toArray();
}

export async function getRecentPredictions(count = 3): Promise<Prediction[]> {
  return db.predictions.orderBy('date').reverse().limit(count).toArray();
}

export async function getChatMessages(count = 50): Promise<ChatMessage[]> {
  return db.chat.orderBy('timestamp').reverse().limit(count).toArray().then(msgs => msgs.reverse());
}

export async function addChatMessage(message: ChatMessage): Promise<void> {
  await db.chat.add(message);
}

export async function clearAllData(): Promise<void> {
  await Promise.all([
    db.patient.clear(),
    db.chemo.clear(),
    db.blood.clear(),
    db.daily.clear(),
    db.wearable.clear(),
    db.meals.clear(),
    db.supplements.clear(),
    db.imaging.clear(),
    db.predictions.clear(),
    db.chat.clear(),
    db.settings.clear(),
  ]);
}

export async function exportAllData(): Promise<string> {
  const data = {
    patient: await db.patient.toArray(),
    chemo: await db.chemo.toArray(),
    blood: await db.blood.toArray(),
    daily: await db.daily.toArray(),
    wearable: await db.wearable.toArray(),
    meals: await db.meals.toArray(),
    supplements: await db.supplements.toArray(),
    imaging: await db.imaging.toArray(),
    predictions: await db.predictions.toArray(),
    chat: await db.chat.toArray(),
    settings: await db.settings.toArray(),
    exportDate: new Date().toISOString(),
    version: '1.0',
  };
  return JSON.stringify(data, null, 2);
}

export async function importData(jsonString: string): Promise<void> {
  const data = JSON.parse(jsonString);
  await clearAllData();
  if (data.patient) await db.patient.bulkPut(data.patient);
  if (data.chemo) await db.chemo.bulkPut(data.chemo);
  if (data.blood) await db.blood.bulkPut(data.blood);
  if (data.daily) await db.daily.bulkPut(data.daily);
  if (data.wearable) await db.wearable.bulkPut(data.wearable);
  if (data.meals) await db.meals.bulkPut(data.meals);
  if (data.supplements) await db.supplements.bulkPut(data.supplements);
  if (data.imaging) await db.imaging.bulkPut(data.imaging);
  if (data.predictions) await db.predictions.bulkPut(data.predictions);
  if (data.chat) await db.chat.bulkPut(data.chat);
  if (data.settings) await db.settings.bulkPut(data.settings);
}
