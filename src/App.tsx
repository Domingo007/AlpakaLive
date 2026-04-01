import { useState, useEffect } from 'react';
import { Header } from '@/components/shared/Header';
import { TabBar } from '@/components/shared/TabBar';
import { ChatView } from '@/components/chat/ChatView';
import { DataView } from '@/components/data/DataView';
import { ImagingView } from '@/components/imaging/ImagingView';
import { SettingsView } from '@/components/settings/SettingsView';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { getSettings } from '@/lib/db';
import type { TabId } from '@/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('chat');
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    getSettings().then(s => {
      setOnboarded(s?.onboardingCompleted ?? false);
    });
  }, []);

  if (onboarded === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <div className="text-4xl mb-3">🦙</div>
          <div className="text-sm text-text-secondary">Ladowanie...</div>
        </div>
      </div>
    );
  }

  if (!onboarded) {
    return <OnboardingFlow onComplete={() => setOnboarded(true)} />;
  }

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      <Header />
      <main className="flex-1 overflow-hidden">
        {activeTab === 'chat' && <ChatView />}
        {activeTab === 'data' && <DataView />}
        {activeTab === 'imaging' && <ImagingView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
