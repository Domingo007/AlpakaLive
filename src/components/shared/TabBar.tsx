import type { TabId } from '@/types';

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const TABS: { id: TabId; icon: string; label: string }[] = [
  { id: 'chat', icon: '💬', label: 'Chat' },
  { id: 'data', icon: '📊', label: 'Dane' },
  { id: 'imaging', icon: '🏥', label: 'Obrazowanie' },
  { id: 'settings', icon: '⚙️', label: 'Ustawienia' },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav className="bg-bg-card border-t border-border flex shrink-0 safe-bottom">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex flex-col items-center py-2 min-h-[56px] transition-colors ${
            activeTab === tab.id
              ? 'text-accent-dark'
              : 'text-text-secondary'
          }`}
        >
          <span className="text-xl">{tab.icon}</span>
          <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
