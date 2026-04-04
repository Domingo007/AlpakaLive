import type { TabId } from '@/types';
import { Icon } from './Icon';

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'chat', icon: 'chat_bubble', label: 'Chat' },
  { id: 'calendar', icon: 'calendar_month', label: 'Kalendarz' },
  { id: 'data', icon: 'monitoring', label: 'Dane' },
  { id: 'imaging', icon: 'radiology', label: 'Obrazy' },
  { id: 'settings', icon: 'more_horiz', label: 'Więcej' },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="bg-bg-card shadow-[0_-4px_12px_rgba(45,31,84,0.08)] flex shrink-0 safe-bottom">
      {TABS.map(tab => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="flex-1 flex flex-col items-center py-2 min-h-[56px] relative"
          >
            <Icon name={tab.icon} size={22} className={active ? 'text-lavender-600' : 'text-text-tertiary'} />
            <span className={`text-[10px] mt-0.5 font-medium ${active ? 'text-lavender-600' : 'text-text-tertiary'}`}>
              {tab.label}
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
