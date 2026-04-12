import { useState } from 'react';
import { usePatient, useSettings } from '@/hooks/useDatabase';
import { Card } from '@/components/shared/Card';
import { Icon } from '@/components/shared/Icon';
import { HistoricalImport } from './HistoricalImport';
import { NotificationSettings } from './NotificationSettings';
import { AIProviderSettings } from './AIProviderSettings';
import { EducationView } from '@/components/education/EducationView';
import { exportAllData, importData, clearAllData, saveSettings } from '@/lib/db';
import { loadDemoData } from '@/lib/demo-data';
import { useI18n, type Lang } from '@/lib/i18n';
import type { DrugEntry, ThemeMode } from '@/types';

export function SettingsView() {
  const { patient } = usePatient();
  const { settings, update: updateSettings } = useSettings();
  const { t, lang, setLang } = useI18n();
  const [demoLoading, setDemoLoading] = useState(false);
  const [showEducation, setShowEducation] = useState(false);

  const isDemo = settings?.demoMode === true;

  if (showEducation) {
    return <EducationView onClose={() => setShowEducation(false)} />;
  }

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

      {/* Patient Education */}
      {patient?.diseaseProfileId && (
        <Card title={lang === 'pl' ? 'Wiedza pacjenta' : 'Patient Education'}>
          <button
            onClick={() => setShowEducation(true)}
            className="w-full flex items-center gap-3 p-2 rounded-xl bg-gradient-to-r from-accent-warm to-lavender-100 hover:from-lavender-100 hover:to-accent-warm transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-accent-dark flex items-center justify-center shrink-0">
              <Icon name="school" size={22} className="text-white" />
            </div>
            <div className="text-left flex-1">
              <div className="text-xs font-medium text-text-primary">
                {lang === 'pl' ? 'Słownik, poradniki faz, FAQ' : 'Glossary, phase guides, FAQ'}
              </div>
              <div className="text-[10px] text-text-secondary">
                {lang === 'pl' ? 'Materiały edukacyjne dopasowane do Twojej choroby' : 'Educational materials tailored to your condition'}
              </div>
            </div>
            <Icon name="chevron_right" size={18} className="text-text-tertiary shrink-0" />
          </button>
        </Card>
      )}

      {/* Demo Mode */}
      <Card title={t.settings.demoMode}>
        <div className="space-y-3">
          {isDemo ? (
            <>
              <div className="flex items-center gap-2 rounded-lg bg-lavender-100 dark:bg-lavender-200 p-2.5">
                <Icon name="info" size={18} className="text-accent-dark shrink-0" />
                <p className="text-xs text-accent-dark leading-relaxed">
                  {t.settings.demoActiveInfo}
                </p>
              </div>
              <button
                onClick={async () => {
                  if (!confirm(t.settings.exitDemoConfirm)) return;
                  await clearAllData();
                  window.location.reload();
                }}
                className="w-full rounded-lg py-2.5 text-sm font-medium border-2 border-alert-critical text-alert-critical hover:bg-alert-critical/10 transition-colors flex items-center justify-center gap-2"
              >
                <Icon name="logout" size={18} />
                {t.settings.exitDemo}
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
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
              document.documentElement.classList.toggle('dark', newTheme === 'dark');
              await updateSettings({ theme: newTheme });
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

      {/* Where is your data */}
      <Card title={lang === 'pl' ? 'Gdzie s\u0105 Twoje dane?' : 'Where is your data?'}>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent-green/15 flex items-center justify-center shrink-0 mt-0.5">
              <Icon name="smartphone" size={20} className="text-accent-green" />
            </div>
            <div>
              <div className="text-xs font-medium text-text-primary">
                {lang === 'pl' ? 'Tylko na tym urz\u0105dzeniu' : 'Only on this device'}
              </div>
              <div className="text-[11px] text-text-secondary leading-relaxed mt-0.5">
                {lang === 'pl'
                  ? 'Wszystkie Twoje dane s\u0105 zapisane lokalnie w przegl\u0105darce tego telefonu (IndexedDB). Nie s\u0105 wysy\u0142ane na \u017caden serwer. \u017badna inna osoba nie ma do nich dost\u0119pu.'
                  : 'All your data is stored locally in this phone\'s browser (IndexedDB). It is not sent to any server. No one else has access to it.'}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-lavender-100 flex items-center justify-center shrink-0 mt-0.5">
              <Icon name="folder" size={20} className="text-lavender-600" />
            </div>
            <div>
              <div className="text-xs font-medium text-text-primary">
                {lang === 'pl' ? 'Lokalizacja danych' : 'Data location'}
              </div>
              <div className="text-[11px] text-text-secondary leading-relaxed mt-0.5">
                {lang === 'pl'
                  ? 'Przegl\u0105darka \u2192 Ustawienia \u2192 Dane stron / Pami\u0119\u0107 podr\u0119czna \u2192 alpacalive (lub adres strony). Na iPhonie: Ustawienia \u2192 Safari \u2192 Zaawansowane \u2192 Dane witryn.'
                  : 'Browser \u2192 Settings \u2192 Site data / Storage \u2192 alpacalive (or site URL). On iPhone: Settings \u2192 Safari \u2192 Advanced \u2192 Website Data.'}
              </div>
            </div>
          </div>

          <div className="bg-alert-warning/10 rounded-lg px-3 py-2 flex items-start gap-2">
            <Icon name="warning" size={16} className="text-alert-warning shrink-0 mt-0.5" />
            <div className="text-[11px] text-text-primary leading-relaxed">
              {lang === 'pl'
                ? 'Je\u015bli wyczyszczysz dane przegl\u0105darki, usuniesz aplikacj\u0119 z ekranu lub zresetujesz telefon \u2014 dane zostan\u0105 utracone. Regularnie r\u00f3b kopi\u0119 zapasow\u0105 (przycisk poni\u017cej).'
                : 'If you clear browser data, remove the app from home screen, or reset your phone \u2014 data will be lost. Regularly make backups (button below).'}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
              <Icon name="devices" size={20} className="text-blue-500" />
            </div>
            <div>
              <div className="text-xs font-medium text-text-primary">
                {lang === 'pl' ? 'Ka\u017cdy telefon = osobna kopia' : 'Each phone = separate copy'}
              </div>
              <div className="text-[11px] text-text-secondary leading-relaxed mt-0.5">
                {lang === 'pl'
                  ? 'Dane NIE synchronizuj\u0105 si\u0119 mi\u0119dzy urz\u0105dzeniami. Je\u015bli chcesz przenie\u015b\u0107 dane na inny telefon, u\u017cyj eksportu i importu JSON.'
                  : 'Data does NOT sync between devices. To transfer data to another phone, use JSON export and import.'}
              </div>
            </div>
          </div>
        </div>
      </Card>

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
