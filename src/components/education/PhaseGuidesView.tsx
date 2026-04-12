import { useState } from 'react';
import { Icon } from '@/components/shared/Icon';
import { useI18n } from '@/lib/i18n';
import { localized, localizedList } from '@/lib/medical-data/content-utils';
import type { EducationPackage } from '@/lib/medical-data/knowledge-types';

interface PhaseGuidesViewProps {
  education: EducationPackage;
}

const TREATMENT_ICONS: Record<string, string> = {
  chemotherapy: 'vaccines',
  radiotherapy: 'radiology',
  hormonal_therapy: 'medication',
  immunotherapy: 'shield',
};

export function PhaseGuidesView({ education }: PhaseGuidesViewProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { lang } = useI18n();

  const guides = education.phaseGuides.guides;

  return (
    <div className="space-y-3">
      {Object.entries(guides).map(([treatmentType, phases]) => (
        <div key={treatmentType} className="space-y-1.5">
          <div className="flex items-center gap-2 px-1">
            <Icon name={TREATMENT_ICONS[treatmentType] || 'medical_services'} size={18} className="text-accent-dark" />
            <span className="text-xs font-semibold text-accent-dark capitalize">
              {treatmentType.replace(/_/g, ' ')}
            </span>
          </div>

          {Object.entries(phases).map(([phaseId, guide]) => {
            const key = `${treatmentType}-${phaseId}`;
            const isOpen = expanded === key;

            return (
              <div key={key} className="bg-bg-card rounded-lg border border-border overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : key)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                >
                  <span className="text-xs font-medium text-text-primary">{localized(guide.title, lang)}</span>
                  <Icon name={isOpen ? 'expand_less' : 'expand_more'} size={18} className="text-text-secondary shrink-0" />
                </button>

                {isOpen && (
                  <div className="px-3 pb-3 space-y-2">
                    <div className="text-[11px] text-text-primary bg-accent-warm/20 rounded-lg px-3 py-2 leading-relaxed">
                      {localized(guide.whatToExpect, lang)}
                    </div>
                    <div className="space-y-1">
                      {localizedList(guide.tips, lang).map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 text-[11px] text-text-primary">
                          <span className="text-accent-green mt-0.5 shrink-0">•</span>
                          <span className="leading-relaxed">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
