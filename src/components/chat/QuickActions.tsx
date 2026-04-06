import { Icon } from '@/components/shared/Icon';
import { useI18n } from '@/lib/i18n';

interface QuickActionsProps {
  onAction: (prompt: string) => void;
}

export function QuickActions({ onAction }: QuickActionsProps) {
  const { t } = useI18n();

  const actions = [
    { icon: 'wb_sunny', label: t.quickActions.morningReport, prompt: t.quickActions.morningPrompt },
    { icon: 'dark_mode', label: t.quickActions.summary, prompt: t.quickActions.summaryPrompt },
    { icon: 'vaccines', label: t.quickActions.afterChemo, prompt: t.quickActions.afterChemoPrompt },
    { icon: 'description', label: t.quickActions.report, prompt: t.quickActions.reportPrompt },
    { icon: 'auto_awesome', label: t.quickActions.prediction, prompt: t.quickActions.predictionPrompt },
    { icon: 'imagesmode', label: t.quickActions.imaging, prompt: t.quickActions.imagingPrompt },
  ];

  return (
    <div className="px-3 py-1.5 overflow-x-auto">
      <div className="flex gap-2">
        {actions.map(action => (
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
