import { useState } from 'react';
import { Icon } from '@/components/shared/Icon';
import { useI18n } from '@/lib/i18n';
import { localized, localizedList } from '@/lib/medical-data/content-utils';
import type { EducationPackage } from '@/lib/medical-data/knowledge-types';

interface SideEffectTipsViewProps {
  education: EducationPackage;
}

export function SideEffectTipsView({ education }: SideEffectTipsViewProps) {
  const [expanded, setExpanded] = useState<number | null>(0);
  const { lang } = useI18n();

  return (
    <div className="space-y-1.5">
      {education.sideEffectTips.tips.map((group, i) => {
        const isOpen = expanded === i;
        return (
          <div key={i} className="bg-bg-card rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : i)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left gap-2"
            >
              <div className="flex items-center gap-2">
                <Icon name={group.icon} size={18} className="text-accent-dark shrink-0" />
                <span className="text-xs font-medium text-text-primary">{localized(group.effect, lang)}</span>
              </div>
              <Icon name={isOpen ? 'expand_less' : 'expand_more'} size={18} className="text-text-secondary shrink-0" />
            </button>
            {isOpen && (
              <div className="px-3 pb-3 space-y-1">
                {localizedList(group.tips, lang).map((tip, j) => (
                  <div key={j} className="flex items-start gap-2 text-[11px] text-text-primary">
                    <span className="text-accent-green mt-0.5 shrink-0">✓</span>
                    <span className="leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
