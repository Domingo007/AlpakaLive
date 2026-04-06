import type { TabId } from '@/types';
import { Icon } from './Icon';
import { useI18n } from '@/lib/i18n';

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TAB_ICONS: { id: TabId; icon: string }[] = [
  { id: 'chat', icon: 'chat_bubble' },
  { id: 'calendar', icon: 'calendar_month' },
  { id: 'data', icon: 'monitoring' },
  { id: 'imaging', icon: 'imagesmode' },
  { id: 'settings', icon: 'more_horiz' },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const { t } = useI18n();

  const tabLabels: Record<TabId, string> = {
    chat: t.tabs.chat,
    calendar: t.tabs.calendar,
    data: t.tabs.data,
    imaging: t.tabs.imaging,
    settings: t.tabs.settings,
  };

  return (
    <nav className="bg-bg-card shadow-[0_-4px_12px_rgba(45,31,84,0.08)] flex shrink-0 safe-bottom">
      {TAB_ICONS.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 flex flex-col items-center py-2 min-h-[56px] relative"
          >
            <Icon name={tab.icon} size={22} className={active ? 'text-lavender-600' : 'text-text-tertiary'} />
            <span className={`text-[10px] mt-0.5 font-medium ${active ? 'text-lavender-600' : 'text-text-tertiary'}`}>
              {tabLabels[tab.id]}
            </span>
            {active && (
              <span className="absolute bottom-1 w-1 h-1 rounded-full bg-lavender-500" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
