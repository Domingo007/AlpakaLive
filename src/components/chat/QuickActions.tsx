interface QuickActionsProps {
  onAction: (prompt: string) => void;
}

const ACTIONS = [
  { emoji: '☀️', label: 'Raport poranny', prompt: 'Chcę zrobić raport poranny — jak się dzisiaj czuję.' },
  { emoji: '🌙', label: 'Podsumowanie', prompt: 'Zróbmy wieczorne podsumowanie dnia.' },
  { emoji: '💉', label: 'Po chemii', prompt: 'Właśnie wróciłam z chemii. Zanotuj sesję.' },
  { emoji: '📋', label: 'Raport', prompt: 'Wygeneruj raport dla lekarza z ostatnich danych.' },
  { emoji: '🔮', label: 'Predykcja', prompt: 'Jak będę się czuć w tym tygodniu? Predykcja.' },
  { emoji: '🔍', label: 'Obrazowanie', prompt: 'Chcę przeanalizować wyniki obrazowania.' },
];

export function QuickActions({ onAction }: QuickActionsProps) {
  return (
    <div className="px-3 py-1.5 overflow-x-auto">
      <div className="flex gap-2">
        {ACTIONS.map(action => (
          <button
            key={action.label}
            onClick={() => onAction(action.prompt)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-bg-card border border-border text-xs whitespace-nowrap hover:bg-accent-warm/30 transition-colors shrink-0"
          >
            <span>{action.emoji}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
