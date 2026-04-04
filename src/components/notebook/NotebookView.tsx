import { useState } from 'react';
import { DailyLogForm } from './DailyLogForm';
import { BloodEntryForm } from './BloodEntryForm';
import { ChemoEntryForm } from './ChemoEntryForm';
import { SupplementTracker } from './SupplementTracker';
import { ImagingEntryForm } from './ImagingEntryForm';
import { DisclaimerBanner } from '@/components/shared/DisclaimerBanner';
import { Icon } from '@/components/shared/Icon';

type NotebookTab = 'daily' | 'blood' | 'chemo' | 'supplements' | 'imaging';

const TABS: { id: NotebookTab; icon: string; label: string }[] = [
  { id: 'daily', icon: 'edit_note', label: 'Dziennik' },
  { id: 'blood', icon: 'water_drop', label: 'Krew' },
  { id: 'chemo', icon: 'vaccines', label: 'Chemia' },
  { id: 'supplements', icon: 'medication', label: 'Suplementy' },
  { id: 'imaging', icon: 'imagesmode', label: 'Obrazowanie' },
];

export function NotebookView() {
  const [tab, setTab] = useState<NotebookTab>('daily');

  return (
    <div className="h-full flex flex-col">
      {/* Tab row */}
      <div className="flex gap-1 px-3 pt-3 pb-1 overflow-x-auto shrink-0">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs whitespace-nowrap shrink-0 ${
              tab === t.id ? 'bg-accent-dark text-accent-warm' : 'bg-bg-card border border-border text-text-secondary'
            }`}
          >
            <Icon name={t.icon} size={16} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {tab === 'daily' && <DailyLogForm />}
        {tab === 'blood' && <BloodEntryForm />}
        {tab === 'chemo' && <ChemoEntryForm />}
        {tab === 'supplements' && <SupplementTracker />}
        {tab === 'imaging' && <ImagingEntryForm />}
      </div>

      {/* AI upsell banner */}
      <div className="px-3 py-2 bg-accent-warm/30 border-t border-accent-warm/50 text-center shrink-0">
        <p className="text-[10px] text-text-secondary">
          🤖 Z AI: automatyczna analiza zdjęć wyników, predykcja samopoczucia, rozmowa z agentem.
          <span className="text-accent-dark font-medium ml-1 cursor-pointer">Włącz w Ustawieniach →</span>
        </p>
      </div>

      <DisclaimerBanner variant="chat" />
    </div>
  );
}
