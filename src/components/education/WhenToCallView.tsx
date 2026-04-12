import { useI18n } from '@/lib/i18n';
import { localized } from '@/lib/medical-data/content-utils';
import type { EducationPackage } from '@/lib/medical-data/knowledge-types';

interface WhenToCallViewProps {
  education: EducationPackage;
}

const SEVERITY_ICONS: Record<string, string> = {
  emergency: 'emergency',
  urgent: 'warning',
  monitor: 'visibility',
};

export function WhenToCallView({ education }: WhenToCallViewProps) {
  const { lang } = useI18n();

  return (
    <div className="space-y-4">
      {education.whenToCall.categories.map(cat => (
        <div key={cat.severity} className="rounded-xl border-2 overflow-hidden"
          style={{ borderColor: cat.color + '60' }}>
          <div className="flex items-center gap-2 px-3 py-2.5" style={{ backgroundColor: cat.color + '15' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: cat.color }}>{SEVERITY_ICONS[cat.severity] || 'info'}</span>
            <span className="text-xs font-bold" style={{ color: cat.color }}>
              {localized(cat.title, lang)}
            </span>
          </div>
          <div className="px-3 py-2 space-y-1.5">
            {cat.symptoms.map((symptom, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] text-text-primary">
                <span className="mt-0.5 shrink-0" style={{ color: cat.color }}>●</span>
                <span className="leading-relaxed">{localized(symptom, lang)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
