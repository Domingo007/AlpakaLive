/*
 * AlpacaLive — Your Companion Through Cancer Treatment
 * Copyright (C) 2025 AlpacaLive Contributors
 * Licensed under AGPL-3.0 — see LICENSE file
 */
import { useState, useEffect } from 'react';
import { Header } from '@/components/shared/Header';
import { TabBar } from '@/components/shared/TabBar';
import { ChatView } from '@/components/chat/ChatView';
import { NotebookView } from '@/components/notebook/NotebookView';
import { DataView } from '@/components/data/DataView';
import { CalendarView } from '@/components/calendar/CalendarView';
import { ImagingView } from '@/components/imaging/ImagingView';
import { SettingsView } from '@/components/settings/SettingsView';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { getSettings } from '@/lib/db';
import { startNotificationScheduler } from '@/lib/notification-scheduler';
import { useI18n } from '@/lib/i18n';
import type { TabId, NotebookTab, AppMode } from '@/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('chat');
  const [notebookTab, setNotebookTab] = useState<NotebookTab>('daily');
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [appMode, setAppMode] = useState<AppMode>('notebook');
  const { t, setLang } = useI18n();

  useEffect(() => {
    getSettings().then(s => {
      setOnboarded(s?.onboardingCompleted ?? false);
      setAppMode(s?.appMode || 'notebook');
      const theme = s?.theme || 'light';
      document.documentElement.classList.toggle('dark', theme === 'dark');
      if (s?.language) setLang(s.language);
      if (s?.onboardingCompleted && s?.notifications?.enabled) {
        startNotificationScheduler();
      }
    });
  }, [setLang]);

  // Re-check mode when returning to app (e.g. after changing in settings)
  useEffect(() => {
    if (!onboarded) return;
    const interval = setInterval(() => {
      getSettings().then(s => {
        if (s?.appMode && s.appMode !== appMode) setAppMode(s.appMode);
        const theme = s?.theme || 'light';
        document.documentElement.classList.toggle('dark', theme === 'dark');
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [onboarded, appMode]);

  if (onboarded === null) {
    return (
      <div className="h-screen flex items-center justify-center bg-bg-primary">
        <div className="text-center">
          <img src="/logo.png" alt="" className="w-12 h-12 rounded-xl mx-auto" onError={(e: any) => e.target.style.display="none"} />
          <div className="text-sm text-text-secondary">{t.common.loading}</div>
        </div>
      </div>
    );
  }

  if (!onboarded) {
    return <OnboardingFlow onComplete={() => {
      getSettings().then(s => setAppMode(s?.appMode || 'notebook'));
      setOnboarded(true);
    }} />;
  }

  return (
    <div className="h-screen flex flex-col bg-bg-primary">
      <Header />
      <main className="flex-1 overflow-hidden">
        {activeTab === 'chat' && (appMode === 'ai' ? <ChatView /> : <NotebookView activeTab={notebookTab} onTabChange={setNotebookTab} />)}
        {activeTab === 'calendar' && <CalendarView onNavigate={(tab, nbTab) => { setActiveTab(tab); if (nbTab) setNotebookTab(nbTab); }} />}
        {activeTab === 'data' && <DataView />}
        {activeTab === 'imaging' && <ImagingView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
