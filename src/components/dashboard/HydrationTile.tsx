import { useEffect, useState } from 'react';
import { Card } from '@/components/shared/Card';
import { Icon } from '@/components/shared/Icon';
import { useI18n } from '@/lib/i18n';
import { collectHydrationInputs } from '@/lib/hydration-adapter';
import {
  buildHydrationBaseline,
  computeHydrationFlag,
  type HydrationFlag,
  type FlagColor,
} from '@/lib/hydration-engine';

const COLOR_CLASSES: Record<FlagColor, { bg: string; border: string; icon: string; iconColor: string }> = {
  gray: {
    bg: 'bg-bg-primary',
    border: 'border-l-4 border-text-tertiary/50',
    icon: 'hourglass_empty',
    iconColor: 'text-text-tertiary',
  },
  green: {
    bg: 'bg-green-50/50',
    border: 'border-l-4 border-green-500',
    icon: 'water_drop',
    iconColor: 'text-green-600',
  },
  yellow: {
    bg: 'bg-yellow-50/50',
    border: 'border-l-4 border-yellow-500',
    icon: 'warning',
    iconColor: 'text-yellow-600',
  },
  red: {
    bg: 'bg-red-50/50',
    border: 'border-l-4 border-red-500',
    icon: 'error',
    iconColor: 'text-red-600',
  },
};

export function HydrationTile() {
  const { t } = useI18n();
  const [flag, setFlag] = useState<HydrationFlag | null>(null);
  const [loading, setLoading] = useState(true);
  const [drillDown, setDrillDown] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const inputs = await collectHydrationInputs();
        const baseline = buildHydrationBaseline(inputs.dailyMeasurements);
        const result = computeHydrationFlag(inputs, baseline);
        if (!cancelled) setFlag(result);
      } catch {
        // Silent fail — don't show broken tile
        if (!cancelled) setFlag(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card title={t.hydration.title}>
        <div className="text-xs text-text-tertiary py-2">{t.common.loading}</div>
      </Card>
    );
  }
  if (!flag) return null;

  const styles = COLOR_CLASSES[flag.color];

  return (
    <>
      <button
        onClick={() => setDrillDown(true)}
        className={`w-full text-left rounded-2xl ${styles.bg} ${styles.border} p-4 transition-transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-lavender-400`}
        aria-label={`${t.hydration.title} — ${t.hydration.flag[flag.color]}`}
      >
        <div className="flex items-start gap-3">
          <Icon name={styles.icon} size={28} className={`shrink-0 ${styles.iconColor}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-[15px] font-semibold text-text-primary">{t.hydration.title}</h3>
              <span className={`text-[11px] font-semibold ${styles.iconColor}`}>
                {t.hydration.flag[flag.color]}
              </span>
            </div>

            {flag.color === 'gray' && (
              <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                {t.hydration.collecting(flag.daysUntilBaseline ?? 0)}
              </p>
            )}

            {flag.color === 'green' && (
              <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">
                {t.hydration.patternsNormal}
              </p>
            )}

            {(flag.color === 'yellow' || flag.color === 'red') && (
              <div className="mt-1.5 space-y-1">
                <p className={`text-xs leading-relaxed ${flag.color === 'red' ? 'font-medium text-red-700' : 'text-yellow-700'}`}>
                  {t.hydration.summary[flag.color]}
                </p>
                <ul className="text-[11px] text-text-secondary space-y-0.5">
                  {flag.reasons.slice(0, 2).map((r, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-text-tertiary">•</span>
                      <span>{t.hydration.reason[r.description as keyof typeof t.hydration.reason](r.value)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {!flag.dataAvailability.hasBodyWater && flag.color !== 'gray' && (
              <div className="mt-2 px-2.5 py-1.5 bg-lavender-100/60 rounded-lg text-[11px] text-lavender-700 flex items-start gap-1.5">
                <Icon name="scale" size={14} className="shrink-0 mt-0.5" />
                <span>{t.hydration.nudge.connectWithings}</span>
              </div>
            )}

            <p className="text-[10px] text-text-tertiary mt-2 italic">{t.hydration.notMedicalAdvice}</p>
          </div>
        </div>
      </button>

      {drillDown && <HydrationDrillDownModal flag={flag} onClose={() => setDrillDown(false)} />}
    </>
  );
}

function HydrationDrillDownModal({ flag, onClose }: { flag: HydrationFlag; onClose: () => void }) {
  const { t } = useI18n();
  const styles = COLOR_CLASSES[flag.color];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t.hydration.drilldown.title}
    >
      <div
        className="bg-bg-card rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className={`p-4 ${styles.border} ${styles.bg} flex items-center gap-3 rounded-t-2xl`}>
          <Icon name={styles.icon} size={32} className={`shrink-0 ${styles.iconColor}`} />
          <div className="flex-1">
            <h2 className="text-base font-semibold text-text-primary">{t.hydration.drilldown.title}</h2>
            <span className={`text-xs font-semibold ${styles.iconColor}`}>
              {t.hydration.flag[flag.color]}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-text-tertiary hover:text-text-primary p-1"
            aria-label={t.common.close}
          >
            <Icon name="close" size={22} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <section>
            <h3 className="text-[13px] font-semibold text-text-primary mb-2">{t.hydration.drilldown.activeReasons}</h3>
            {flag.reasons.filter(r => r.type !== 'insufficient_data').length === 0 ? (
              <p className="text-xs text-text-secondary">{t.hydration.drilldown.noActiveReasons}</p>
            ) : (
              <ul className="space-y-2">
                {flag.reasons
                  .filter(r => r.type !== 'insufficient_data')
                  .map((r, i) => (
                    <li key={i} className="bg-bg-primary rounded-lg p-2.5">
                      <div className="text-xs font-medium text-text-primary">
                        {t.hydration.reason[r.description as keyof typeof t.hydration.reason](r.value)}
                      </div>
                      <div className="text-[10px] text-text-tertiary mt-0.5">
                        {t.hydration.severity[r.severity]}
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </section>

          <section>
            <h3 className="text-[13px] font-semibold text-text-primary mb-2">{t.hydration.drilldown.dataSources}</h3>
            <ul className="space-y-1 text-xs">
              <DataSourceRow
                present={flag.dataAvailability.hasBodyWater}
                label={t.hydration.source.bodyWater}
                nudge={t.hydration.nudge.connectWithings}
              />
              <DataSourceRow
                present={flag.dataAvailability.hasBloodResults}
                label={t.hydration.source.bloodResults}
                nudge={t.hydration.nudge.addBloodResults}
              />
              <DataSourceRow
                present={flag.dataAvailability.hasTodayLog}
                label={t.hydration.source.todayLog}
                nudge={t.hydration.nudge.logToday}
              />
              <DataSourceRow
                present={flag.dataAvailability.hasWatchData}
                label={t.hydration.source.watchData}
                nudge={t.hydration.nudge.addWatch}
              />
            </ul>
          </section>

          {(flag.color === 'yellow' || flag.color === 'red') && (
            <section className="bg-lavender-50 rounded-lg p-3 border border-lavender-200">
              <p className="text-xs text-text-primary font-medium mb-1">{t.hydration.drilldown.suggestion}</p>
            </section>
          )}

          <section className="pt-2 border-t border-lavender-100">
            <p className="text-[10px] text-text-tertiary leading-relaxed italic">
              {t.hydration.drilldown.notMedicalAdviceFull}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function DataSourceRow({ present, label, nudge }: { present: boolean; label: string; nudge: string }) {
  return (
    <li className={`flex items-start gap-2 ${present ? 'text-green-700' : 'text-text-tertiary'}`}>
      <Icon name={present ? 'check_circle' : 'radio_button_unchecked'} size={16} className="shrink-0 mt-0.5" />
      <div className="flex-1">
        <span>{label}</span>
        {!present && <p className="text-[10px] text-text-tertiary mt-0.5">{nudge}</p>}
      </div>
    </li>
  );
}
