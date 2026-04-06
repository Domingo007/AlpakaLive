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
import { useI18n } from '@/lib/i18n';

export function NotificationSettings() {
  const { settings, update } = useSettings();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const config = settings?.notifications ?? DEFAULT_NOTIFICATIONS;
  const { t } = useI18n();

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
    <Card title={t.notifications.title}>
      {permission === 'unsupported' ? (
        <p className="text-xs text-text-secondary">
          {t.notifications.unsupported}
        </p>
      ) : permission === 'denied' ? (
        <div className="text-xs text-alert-critical space-y-1">
          <p>{t.notifications.blocked}</p>
          <p className="text-text-secondary">{t.notifications.blockedHelp}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <ToggleRow
            label={t.notifications.enable}
            description={config.enabled ? t.notifications.active : t.notifications.disabled}
            checked={config.enabled}
            onChange={handleToggle}
          />

          {config.enabled && (
            <>
              <div className="border-t border-border pt-3 space-y-2">
                <ToggleRow
                  label={t.notifications.morningReport}
                  description={t.notifications.morningDesc}
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

              <div className="border-t border-border pt-3 space-y-2">
                <ToggleRow
                  label={t.notifications.eveningSummary}
                  description={t.notifications.eveningDesc}
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

              <div className="border-t border-border pt-3 space-y-2">
                <ToggleRow
                  label={t.notifications.chemoReminder}
                  description={t.notifications.chemoDesc}
                  checked={config.chemoReminderEnabled}
                  onChange={v => updateConfig({ chemoReminderEnabled: v })}
                />
                {config.chemoReminderEnabled && (
                  <div className="flex items-center gap-2 pl-2">
                    <span className="text-[10px] text-text-secondary">{t.notifications.remind}</span>
                    <select
                      value={config.chemoReminderDaysBefore}
                      onChange={e => updateConfig({ chemoReminderDaysBefore: parseInt(e.target.value) })}
                      className="rounded border border-border px-2 py-1 text-xs bg-bg-primary"
                    >
                      <option value={1}>{t.notifications.day1}</option>
                      <option value={2}>{t.notifications.days2}</option>
                      <option value={3}>{t.notifications.days3}</option>
                    </select>
                    <span className="text-[10px] text-text-secondary">{t.notifications.beforeChemo}</span>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-text-secondary pt-1">
                {t.notifications.pwaNote}
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
  const { t } = useI18n();
  const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2 pl-2">
      <span className="text-[10px] text-text-secondary">{t.notifications.hour}</span>
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
