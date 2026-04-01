interface QuickActionsProps {
  onAction: (prompt: string) => void;
}

const ACTIONS = [
  { emoji: '☀️', label: 'Raport poranny', prompt: 'Chce zrobic raport poranny — jak sie dziis czuje.' },
  { emoji: '🌙', label: 'Podsumowanie', prompt: 'Zrobmy wieczorne podsumowanie dnia.' },
  { emoji: '💉', label: 'Po chemii', prompt: 'Wlasnie wrocilam z chemii. Zanotuj sesje.' },
  { emoji: '📋', label: 'Raport', prompt: 'Wygeneruj raport dla lekarza z ostatnich danych.' },
  { emoji: '🔮', label: 'Predykcja', prompt: 'Jak bede sie czuc w tym tygodniu? Predykcja.' },
  { emoji: '🔍', label: 'Obrazowanie', prompt: 'Chce przeanalizowac wyniki obrazowania.' },
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
