import { useState } from 'react';
import { Icon } from '@/components/shared/Icon';
import { useI18n } from '@/lib/i18n';
import { localized } from '@/lib/medical-data/content-utils';
import type { EducationPackage } from '@/lib/medical-data/knowledge-types';

interface FaqViewProps {
  education: EducationPackage;
}

export function FaqView({ education }: FaqViewProps) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const { lang } = useI18n();

  return (
    <div className="space-y-1.5">
      {education.faq.questions.map((faq, i) => {
        const isOpen = expanded === i;
        return (
          <div key={i} className="bg-bg-card rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : i)}
              className="w-full flex items-start justify-between px-3 py-2.5 text-left gap-2"
            >
              <span className="text-xs font-medium text-text-primary leading-relaxed">
                {localized(faq.q, lang)}
              </span>
              <Icon name={isOpen ? 'expand_less' : 'expand_more'} size={18} className="text-text-secondary shrink-0 mt-0.5" />
            </button>
            {isOpen && (
              <div className="px-3 pb-3">
                <div className="text-[11px] text-text-primary leading-relaxed bg-accent-warm/10 rounded-lg p-3">
                  {localized(faq.a, lang)}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
