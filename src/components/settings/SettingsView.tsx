import { usePatient, useSettings } from '@/hooks/useDatabase';
import { Card } from '@/components/shared/Card';
import { Icon } from '@/components/shared/Icon';
import { HistoricalImport } from './HistoricalImport';
import { NotificationSettings } from './NotificationSettings';
import { AIProviderSettings } from './AIProviderSettings';
import { exportAllData, importData, clearAllData, saveSettings } from '@/lib/db';
import type { DrugEntry, ThemeMode } from '@/types';

export function SettingsView() {
  const { patient } = usePatient();
  const { settings } = useSettings();

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
    if (confirm('Na pewno chcesz usunąć WSZYSTKIE dane? Tej operacji nie można cofnąć.')) {
      if (confirm('To jest OSTATECZNE. Czy jesteś pewien/pewna?')) {
        await clearAllData();
        window.location.reload();
      }
    }
  }

  return (
    <div className="h-full overflow-y-auto px-3 py-4 space-y-4">
      <h2 className="font-display text-lg font-semibold text-accent-dark">Ustawienia</h2>

      {/* App Mode */}
      <Card title="🦙 Tryb aplikacji">
        <div className="space-y-2">
          {[
            { mode: 'ai' as const, icon: '🤖', label: 'Z agentem AI', desc: 'Rozmowa z agentem, analiza zdjęć, predykcja. Wymaga klucza API.' },
            { mode: 'notebook' as const, icon: '📓', label: 'Inteligentny notatnik', desc: 'Ręczne wpisywanie danych, wykresy, alerty. Darmowy, bez API.' },
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
                <span className="text-lg">{opt.icon}</span>
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
      <Card title="🎨 Wygląd">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name={settings?.theme === 'dark' ? 'dark_mode' : 'light_mode'} size={20} className="text-lavender-500" />
            <div>
              <div className="text-xs font-medium">Motyw</div>
              <div className="text-[10px] text-text-secondary">{settings?.theme === 'dark' ? 'Ciemny' : 'Jasny'}</div>
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
        <Card title="Profil pacjenta">
          <div className="space-y-2 text-sm">
            <ProfileRow label="Pseudonim" value={patient.displayName} />
            <ProfileRow label="Diagnoza" value={patient.diagnosis} />
            <ProfileRow label="Stadium" value={patient.stage} />
            {patient.molecularSubtype && <ProfileRow label="Podtyp" value={patient.molecularSubtype} />}
            <ProfileRow label="Schemat chemii" value={patient.currentChemo || 'Nie podano'} />
            <ProfileRow label="Cykl" value={patient.chemoCycle || 'Nie podano'} />

            {patient.oncologyMeds.filter(m => m.active).length > 0 && (
              <div>
                <div className="text-xs text-text-secondary mt-2 mb-1">Leki onkologiczne:</div>
                {patient.oncologyMeds.filter(m => m.active).map((med, i) => (
                  <DrugRow key={i} drug={med} />
                ))}
              </div>
            )}

            {patient.psychiatricMeds.filter(m => m.active).length > 0 && (
              <div>
                <div className="text-xs text-text-secondary mt-2 mb-1">Leki psychiatryczne:</div>
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
        <Card title="Ochrona prywatności">
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <span>🔒</span>
              <span className="text-text-secondary">Imie:</span>
              <span>{patient.pii.firstName || '(nie podano)'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔒</span>
              <span className="text-text-secondary">Nazwisko:</span>
              <span>{patient.pii.lastName || '(nie podano)'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>🔒</span>
              <span className="text-text-secondary">PESEL:</span>
              <span>{patient.pii.pesel ? '***' + patient.pii.pesel.slice(-4) : '(nie podano)'}</span>
            </div>
            <p className="text-[10px] text-text-secondary mt-2">
              Te dane nie opuszczają Twojego urządzenia. Agent widzi Cię jako "{patient.displayName}".
            </p>
          </div>
        </Card>
      )}

      {/* Data management */}
      <Card title="Zarządzanie danymi">
        <div className="space-y-2">
          <button
            onClick={handleExport}
            className="w-full border border-accent-dark text-accent-dark rounded-lg py-2 text-sm"
          >
            Eksportuj dane (JSON)
          </button>
          <button
            onClick={handleImport}
            className="w-full border border-accent-dark text-accent-dark rounded-lg py-2 text-sm"
          >
            Importuj dane (JSON)
          </button>
          <button
            onClick={handleReset}
            className="w-full border border-alert-critical text-alert-critical rounded-lg py-2 text-sm"
          >
            Resetuj wszystkie dane
          </button>
        </div>
      </Card>

      {/* PWA install hint */}
      <Card title="Instalacja na telefonie">
        <div className="text-xs text-text-secondary space-y-1">
          <p><strong>iPhone:</strong> Safari → Udostępnij → Dodaj do ekranu początkowego</p>
          <p><strong>Android:</strong> Chrome → Menu (3 kropki) → Zainstaluj aplikacje</p>
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
