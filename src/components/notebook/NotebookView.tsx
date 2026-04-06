import { DailyLogForm } from './DailyLogForm';
import { BloodEntryForm } from './BloodEntryForm';
import { ChemoEntryForm } from './ChemoEntryForm';
import { SupplementTracker } from './SupplementTracker';
import { ImagingEntryForm } from './ImagingEntryForm';
import { DisclaimerBanner } from '@/components/shared/DisclaimerBanner';
import { Icon } from '@/components/shared/Icon';
import { useI18n } from '@/lib/i18n';
import type { NotebookTab } from '@/types';

interface NotebookViewProps {
  activeTab: NotebookTab;
  onTabChange: (tab: NotebookTab) => void;
}

export function NotebookView({ activeTab: tab, onTabChange: setTab }: NotebookViewProps) {
  const { t } = useI18n();

  const tabs: { id: NotebookTab; icon: string; label: string }[] = [
    { id: 'daily', icon: 'edit_note', label: t.notebook.journal },
    { id: 'blood', icon: 'water_drop', label: t.notebook.blood },
    { id: 'chemo', icon: 'vaccines', label: t.notebook.chemo },
    { id: 'supplements', icon: 'medication', label: t.notebook.supplements },
    { id: 'imaging', icon: 'imagesmode', label: t.notebook.imaging },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex gap-1 px-3 pt-3 pb-1 overflow-x-auto shrink-0">
        {tabs.map(tb => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs whitespace-nowrap shrink-0 ${
              tab === tb.id ? 'bg-accent-dark text-accent-warm' : 'bg-bg-card border border-border text-text-secondary'
            }`}
          >
            <Icon name={tb.icon} size={16} />
            <span>{tb.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {tab === 'daily' && <DailyLogForm />}
        {tab === 'blood' && <BloodEntryForm />}
        {tab === 'chemo' && <ChemoEntryForm />}
        {tab === 'supplements' && <SupplementTracker />}
        {tab === 'imaging' && <ImagingEntryForm />}
      </div>

      <div className="px-3 py-2 bg-accent-warm/30 border-t border-accent-warm/50 text-center shrink-0">
        <p className="text-[10px] text-text-secondary">
          {t.notebook.aiPromo}
          <span className="text-accent-dark font-medium ml-1 cursor-pointer">{t.notebook.enableInSettings}</span>
        </p>
      </div>

      <DisclaimerBanner variant="chat" />
    </div>
  );
}
