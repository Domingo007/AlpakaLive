import { Icon } from '@/components/shared/Icon';

interface QuickActionsProps {
  onAction: (prompt: string) => void;
}

const ACTIONS = [
  { icon: 'wb_sunny', label: 'Raport poranny', prompt: 'Chcę zrobić raport poranny — jak się dzisiaj czuję.' },
  { icon: 'dark_mode', label: 'Podsumowanie', prompt: 'Zróbmy wieczorne podsumowanie dnia.' },
  { icon: 'vaccines', label: 'Po chemii', prompt: 'Właśnie wróciłam z chemii. Zanotuj sesję.' },
  { icon: 'description', label: 'Raport', prompt: 'Wygeneruj raport dla lekarza z ostatnich danych.' },
  { icon: 'auto_awesome', label: 'Predykcja', prompt: 'Jak będę się czuć w tym tygodniu? Predykcja.' },
  { icon: 'imagesmode', label: 'Obrazowanie', prompt: 'Chcę przeanalizować wyniki obrazowania.' },
];

export function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <div className="px-3 py-1.5 overflow-x-auto">
      <div className="flex gap-2">
        {ACTIONS.map(action => (
          <button
            key={action.label}
            onClick={() => onAction(action.prompt)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-bg-card border border-lavender-200 text-[13px] font-medium text-lavender-700 whitespace-nowrap shadow-[0_1px_2px_rgba(45,31,84,0.05)] active:bg-lavender-100 shrink-0"
          >
            <Icon name={action.icon} size={16} />
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
