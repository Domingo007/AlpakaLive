import type { NotificationConfig } from '@/types';
import { getSettings } from './db';
import { db } from './db';

let intervalId: ReturnType<typeof setInterval> | null = null;
let lastMorningCheck = '';
let lastEveningCheck = '';
let lastChemoCheck = '';

const MORNING_MESSAGES = [
  'Dzień dobry! Jak się dziś czujesz? Wejdź do AlpakaLive i powiedz agentowi. 🦙',
  'Pora na poranny raport! Jak energia, ból, nastrój? 🌅',
  'Dzień dobry! Opowiedz mi jak się czujesz po przebudzeniu. ☀️',
];

const EVENING_MESSAGES = [
  'Podsumowanie dnia — co jadłaś, jakie suplementy wzięłaś? 🌙',
  'Pora na wieczorny raport! Jak minął dzień? Co udało się zjeść? 🌜',
  'Dobry wieczór! Zanotujmy jak minął dzień zanim pójdziesz spać. ✨',
];

const CHEMO_MESSAGES = [
  'Jutro chemia. Pamiętaj o kontrolnej krwi i dobrym nawodnieniu! 💉',
  'Przypomnienie: jutro sesja chemii. Sprawdź czy masz aktualne wyniki krwi. 🏥',
];

function randomMessage(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

function showNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  try {
    const notification = new Notification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `alpakalive-${Date.now()}`,
      requireInteraction: false,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch {
    // SW-based notification fallback for mobile
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SHOW_NOTIFICATION',
        title,
        body,
      });
    }
  }
}

async function checkAndSendNotifications() {
  const settings = await getSettings();
  if (!settings?.notifications?.enabled) return;

  const config = settings.notifications;
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Morning notification
  if (config.morningEnabled && lastMorningCheck !== todayStr) {
    if (currentHour === config.morningHour && currentMinute >= config.morningMinute && currentMinute < config.morningMinute + 5) {
      showNotification('AlpakaLive — Raport poranny', randomMessage(MORNING_MESSAGES));
      lastMorningCheck = todayStr;
    }
  }

  // Evening notification
  if (config.eveningEnabled && lastEveningCheck !== todayStr) {
    if (currentHour === config.eveningHour && currentMinute >= config.eveningMinute && currentMinute < config.eveningMinute + 5) {
      showNotification('AlpakaLive — Podsumowanie wieczorne', randomMessage(EVENING_MESSAGES));
      lastEveningCheck = todayStr;
    }
  }

  // Chemo reminder (check if chemo is planned for tomorrow)
  if (config.chemoReminderEnabled && lastChemoCheck !== todayStr) {
    // Check once in the evening (after 18:00)
    if (currentHour >= 18) {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + config.chemoReminderDaysBefore);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const plannedChemo = await db.chemo
        .where('plannedDate')
        .equals(tomorrowStr)
        .filter(s => s.status === 'planned')
        .toArray();

      if (plannedChemo.length > 0) {
        const dayLabel = config.chemoReminderDaysBefore === 1 ? 'Jutro' : `Za ${config.chemoReminderDaysBefore} dni`;
        showNotification(
          `AlpakaLive — Przypomnienie o chemii`,
          `${dayLabel} zaplanowana sesja chemii. Pamiętaj o kontrolnej krwi i nawodnieniu! 💉`,
        );
      }
      lastChemoCheck = todayStr;
    }
  }
}

export function startNotificationScheduler() {
  if (intervalId) return;
  // Check every 60 seconds
  intervalId = setInterval(checkAndSendNotifications, 60_000);
  // Also check immediately
  checkAndSendNotifications();
}

export function stopNotificationScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function restartNotificationScheduler() {
  stopNotificationScheduler();
  startNotificationScheduler();
}
