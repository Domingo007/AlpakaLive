import { useState, useEffect } from 'react';
import { Card } from '@/components/shared/Card';
import { useSettings } from '@/hooks/useDatabase';
import { DEFAULT_NOTIFICATIONS } from '@/types';
import type { NotificationConfig } from '@/types';
import {
  requestNotificationPermission,
  getNotificationPermission,
  restartNotificationScheduler,
} from '@/lib/notification-scheduler';

export function NotificationSettings() {
  const { settings, update } = useSettings();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const config = settings?.notifications ?? DEFAULT_NOTIFICATIONS;

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  async function handleToggle(enabled: boolean) {
    if (enabled && permission !== 'granted') {
      const granted = await requestNotificationPermission();
      setPermission(getNotificationPermission());
      if (!granted) return;
    }

    await updateConfig({ enabled });
  }

  async function updateConfig(partial: Partial<NotificationConfig>) {
    const updated = { ...config, ...partial };
    await update({ notifications: updated });
    restartNotificationScheduler();
  }

  return (
    <Card title="Przypomnienia">
      {permission === 'unsupported' ? (
        <p className="text-xs text-text-secondary">
          Twoja przeglądarka nie obsługuje powiadomień. Użyj Chrome lub Safari.
        </p>
      ) : permission === 'denied' ? (
        <div className="text-xs text-alert-critical space-y-1">
          <p>Powiadomienia zostały zablokowane w przeglądarce.</p>
          <p className="text-text-secondary">Aby je włączyć: Ustawienia przeglądarki → Powiadomienia → Zezwól dla tej strony.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Master toggle */}
          <ToggleRow
            label="Włącz przypomnienia"
            description={config.enabled ? 'Aktywne' : 'Wyłączone'}
            checked={config.enabled}
            onChange={handleToggle}
          />

          {config.enabled && (
            <>
              {/* Morning */}
              <div className="border-t border-border pt-3 space-y-2">
                <ToggleRow
                  label="Raport poranny"
                  description="Przypomnienie o wpisaniu samopoczucia"
                  checked={config.morningEnabled}
                  onChange={v => updateConfig({ morningEnabled: v })}
                />
                {config.morningEnabled && (
                  <TimeInput
                    hour={config.morningHour}
                    minute={config.morningMinute}
                    onChange={(h, m) => updateConfig({ morningHour: h, morningMinute: m })}
                  />
                )}
              </div>

              {/* Evening */}
              <div className="border-t border-border pt-3 space-y-2">
                <ToggleRow
                  label="Podsumowanie wieczorne"
                  description="Przypomnienie o diecie i suplementach"
                  checked={config.eveningEnabled}
                  onChange={v => updateConfig({ eveningEnabled: v })}
                />
                {config.eveningEnabled && (
                  <TimeInput
                    hour={config.eveningHour}
                    minute={config.eveningMinute}
                    onChange={(h, m) => updateConfig({ eveningHour: h, eveningMinute: m })}
                  />
                )}
              </div>

              {/* Chemo reminder */}
              <div className="border-t border-border pt-3 space-y-2">
                <ToggleRow
                  label="Przypomnienie o chemii"
                  description="Dzień przed zaplanowaną sesją"
                  checked={config.chemoReminderEnabled}
                  onChange={v => updateConfig({ chemoReminderEnabled: v })}
                />
                {config.chemoReminderEnabled && (
                  <div className="flex items-center gap-2 pl-2">
                    <span className="text-[10px] text-text-secondary">Przypomnij</span>
                    <select
                      value={config.chemoReminderDaysBefore}
                      onChange={e => updateConfig({ chemoReminderDaysBefore: parseInt(e.target.value) })}
                      className="rounded border border-border px-2 py-1 text-xs bg-bg-primary"
                    >
                      <option value={1}>1 dzień</option>
                      <option value={2}>2 dni</option>
                      <option value={3}>3 dni</option>
                    </select>
                    <span className="text-[10px] text-text-secondary">przed chemią</span>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-text-secondary pt-1">
                Przypomnienia działają gdy aplikacja jest otwarta lub zainstalowana jako PWA.
              </p>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

function ToggleRow({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-xs font-medium">{label}</div>
        <div className="text-[10px] text-text-secondary">{description}</div>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors relative ${
          checked ? 'bg-accent-dark' : 'bg-border'
        }`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

function TimeInput({ hour, minute, onChange }: {
  hour: number;
  minute: number;
  onChange: (h: number, m: number) => void;
}) {
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2 pl-2">
      <span className="text-[10px] text-text-secondary">Godzina:</span>
      <input
        type="time"
        value={timeStr}
        onChange={e => {
          const [h, m] = e.target.value.split(':').map(Number);
          if (!isNaN(h) && !isNaN(m)) onChange(h, m);
        }}
        className="rounded border border-border px-2 py-1 text-xs bg-bg-primary"
      />
    </div>
  );
}
