import { useState } from 'react';
import { usePatient, useSettings } from '@/hooks/useDatabase';
import { Card } from '@/components/shared/Card';
import { Icon } from '@/components/shared/Icon';
import { HistoricalImport } from './HistoricalImport';
import { NotificationSettings } from './NotificationSettings';
import { AIProviderSettings } from './AIProviderSettings';
import { exportAllData, importData, clearAllData, saveSettings } from '@/lib/db';
import { loadDemoData } from '@/lib/demo-data';
import { useI18n, type Lang } from '@/lib/i18n';
import type { DrugEntry, ThemeMode } from '@/types';

export function SettingsView() {
  const { patient } = usePatient();
  const { settings } = useSettings();
  const { t, lang, setLang } = useI18n();
  const [demoLoading, setDemoLoading] = useState(false);

  async function handleExport() {
    const json = await exportAllData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alpacalive-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      await importData(text);
      window.location.reload();
    };
    input.click();
  }

  async function handleReset() {
    if (confirm(t.settings.resetConfirm1)) {
      if (confirm(t.settings.resetConfirm2)) {
        await clearAllData();
        window.location.reload();
      }
    }
  }

  async function handleLanguageChange(newLang: Lang) {
    setLang(newLang);
    await saveSettings({ language: newLang });
  }

  return (
    <div className="h-full overflow-y-auto px-3 py-4 space-y-4">
      <h2 className="font-display text-lg font-semibold text-accent-dark">{t.settings.title}</h2>

      {/* Language */}
      <Card title={t.settings.language}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="translate" size={20} className="text-lavender-500" />
            <div>
              <div className="text-xs font-medium">{t.settings.language}</div>
              <div className="text-[10px] text-text-secondary">{t.settings.languageDesc}</div>
            </div>
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              onClick={() => handleLanguageChange('pl')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                lang === 'pl'
                  ? 'bg-accent-dark text-accent-warm'
                  : 'bg-bg-primary text-text-secondary hover:bg-accent-warm/20'
              }`}
            >
              PL
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                lang === 'en'
                  ? 'bg-accent-dark text-accent-warm'
                  : 'bg-bg-primary text-text-secondary hover:bg-accent-warm/20'
              }`}
            >
              EN
            </button>
          </div>
        </div>
      </Card>

      {/* Demo Mode */}
      <Card title={t.settings.demoMode}>
        <div className="space-y-3">
          <p className="text-xs text-text-secondary leading-relaxed">
            {t.settings.demoModeDesc}
          </p>
          <button
            onClick={async () => {
              if (!confirm(t.settings.loadDemoConfirm)) return;
              setDemoLoading(true);
              try {
                await loadDemoData();
                window.location.reload();
              } catch {
                setDemoLoading(false);
              }
            }}
            disabled={demoLoading}
            className={`w-full rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              demoLoading
                ? 'bg-lavender-200 text-text-secondary cursor-wait'
                : 'bg-gradient-to-r from-lavender-500 to-accent-dark text-white hover:from-lavender-600 hover:to-accent-dark/90'
            }`}
          >
            <Icon name={demoLoading ? 'hourglass_empty' : 'play_circle'} size={18} />
            {demoLoading ? t.settings.loadingDemo : t.settings.loadDemo}
          </button>
        </div>
      </Card>

      {/* App Mode */}
      <Card title={t.settings.appMode}>
        <div className="space-y-2">
          {[
            { mode: 'ai' as const, icon: 'smart_toy', label: t.settings.aiMode, desc: t.settings.aiModeDesc },
            { mode: 'notebook' as const, icon: 'note', label: t.settings.notebookMode, desc: t.settings.notebookModeDesc },
          ].map(opt => (
            <button
              key={opt.mode}
              onClick={async () => {
                const { update } = await import('@/lib/db').then(m => ({ update: m.saveSettings }));
                await update({ appMode: opt.mode });
              }}
              className={`w-full text-left rounded-lg p-3 border transition-colors ${
                settings?.appMode === opt.mode ? 'border-accent-dark bg-accent-warm/20' : 'border-border bg-bg-primary'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon name={opt.icon} size={24} className="text-lavender-500" />
                <div>
                  <div className="text-xs font-medium">{opt.label}</div>
                  <div className="text-[10px] text-text-secondary">{opt.desc}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Theme */}
      <Card title={t.settings.appearance}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name={settings?.theme === 'dark' ? 'dark_mode' : 'light_mode'} size={20} className="text-lavender-500" />
            <div>
              <div className="text-xs font-medium">{t.settings.theme}</div>
              <div className="text-[10px] text-text-secondary">{settings?.theme === 'dark' ? t.settings.themeDark : t.settings.themeLight}</div>
            </div>
          </div>
          <button
            onClick={async () => {
              const newTheme: ThemeMode = settings?.theme === 'dark' ? 'light' : 'dark';
              await saveSettings({ theme: newTheme });
              document.documentElement.classList.toggle('dark', newTheme === 'dark');
            }}
            className={`w-11 h-6 rounded-full relative transition-colors ${
              settings?.theme === 'dark' ? 'bg-lavender-600' : 'bg-lavender-200'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${
              settings?.theme === 'dark' ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
      </Card>

      {/* AI Provider — only show in AI mode */}
      {settings?.appMode === 'ai' && <AIProviderSettings />}

      {/* Notifications */}
      <NotificationSettings />

      {/* Patient Profile */}
      {patient && (
        <Card title={t.settings.patientProfile}>
          <div className="space-y-2 text-sm">
            <ProfileRow label={t.settings.nickname} value={patient.displayName} />
            <ProfileRow label={t.settings.diagnosis} value={patient.diagnosis} />
            <ProfileRow label={t.settings.stage} value={patient.stage} />
            {patient.molecularSubtype && <ProfileRow label={t.settings.subtype} value={patient.molecularSubtype} />}
            <ProfileRow label={t.settings.chemoRegimen} value={patient.currentChemo || t.common.notProvided} />
            <ProfileRow label={t.settings.cycle} value={patient.chemoCycle || t.common.notProvided} />

            {patient.oncologyMeds.filter(m => m.active).length > 0 && (
              <div>
                <div className="text-xs text-text-secondary mt-2 mb-1">{t.settings.oncologyMeds}</div>
                {patient.oncologyMeds.filter(m => m.active).map((med, i) => (
                  <DrugRow key={i} drug={med} />
                ))}
              </div>
            )}

            {patient.psychiatricMeds.filter(m => m.active).length > 0 && (
              <div>
                <div className="text-xs text-text-secondary mt-2 mb-1">{t.settings.psychiatricMeds}</div>
                {patient.psychiatricMeds.filter(m => m.active).map((med, i) => (
                  <DrugRow key={i} drug={med} />
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Historical Data Import */}
      <HistoricalImport />

      {/* Privacy */}
      {patient?.pii && (
        <Card title={t.settings.privacy}>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-rounded text-lavender-500" style={{fontSize:16}}>lock</span>
              <span className="text-text-secondary">{t.settings.firstName}</span>
              <span>{patient.pii.firstName || `(${t.common.notProvided.toLowerCase()})`}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-rounded text-lavender-500" style={{fontSize:16}}>lock</span>
              <span className="text-text-secondary">{t.settings.lastName}</span>
              <span>{patient.pii.lastName || `(${t.common.notProvided.toLowerCase()})`}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-rounded text-lavender-500" style={{fontSize:16}}>lock</span>
              <span className="text-text-secondary">{t.settings.pesel}</span>
              <span>{patient.pii.pesel ? '***' + patient.pii.pesel.slice(-4) : `(${t.common.notProvided.toLowerCase()})`}</span>
            </div>
            <p className="text-[10px] text-text-secondary mt-2">
              {t.settings.privacyNote(patient.displayName)}
            </p>
          </div>
        </Card>
      )}

      {/* Data management */}
      <Card title={t.settings.dataManagement}>
        <div className="space-y-2">
          <button
            onClick={handleExport}
            className="w-full border border-accent-dark text-accent-dark rounded-lg py-2 text-sm"
          >
            {t.settings.exportData}
          </button>
          <button
            onClick={handleImport}
            className="w-full border border-accent-dark text-accent-dark rounded-lg py-2 text-sm"
          >
            {t.settings.importData}
          </button>
          <button
            onClick={handleReset}
            className="w-full border border-alert-critical text-alert-critical rounded-lg py-2 text-sm"
          >
            {t.settings.resetData}
          </button>
        </div>
      </Card>

      {/* PWA install hint */}
      <Card title={t.settings.pwaInstall}>
        <div className="text-xs text-text-secondary space-y-1">
          <p><strong>{t.settings.pwaIphone}</strong> {t.settings.pwaIphoneDesc}</p>
          <p><strong>{t.settings.pwaAndroid}</strong> {t.settings.pwaAndroidDesc}</p>
        </div>
      </Card>
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-border">
      <span className="text-text-secondary text-xs">{label}</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}

function DrugRow({ drug }: { drug: DrugEntry }) {
  return (
    <div className="text-xs py-0.5 pl-2 border-l-2 border-accent-green">
      {drug.name} {drug.dose} — {drug.frequency}
    </div>
  );
}
