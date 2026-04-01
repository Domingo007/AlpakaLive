import { useOnboarding } from '@/hooks/useOnboarding';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const ob = useOnboarding();

  async function handleComplete() {
    await ob.complete();
    onComplete();
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Progress bar */}
      <div className="h-1 bg-border">
        <div
          className="h-full bg-accent-dark transition-all duration-300"
          style={{ width: `${ob.progress}%` }}
        />
      </div>

      <div className="flex-1 px-6 py-8 max-w-md mx-auto w-full">
        {ob.step === 'welcome' && (
          <div className="text-center space-y-6 mt-12">
            <div className="text-6xl">🦙</div>
            <h1 className="font-display text-2xl font-bold text-accent-dark">AlpakaLive</h1>
            <p className="text-text-secondary text-sm leading-relaxed">
              Holistyczny System Wsparcia Onkologicznego. Twoj codzienny towarzysz w walce z choroba.
            </p>
            <div className="bg-accent-warm/50 rounded-xl p-4 text-xs text-text-primary">
              <p className="font-medium mb-2">🔒 Twoje dane sa bezpieczne</p>
              <p>Wszystko przechowywane lokalnie na Twoim urzadzeniu. Dane osobowe nigdy nie opuszczaja telefonu.</p>
            </div>
            <button
              onClick={ob.next}
              className="w-full bg-accent-dark text-accent-warm rounded-xl py-3 text-sm font-medium"
            >
              Rozpocznij konfiguracje
            </button>
          </div>
        )}

        {ob.step === 'privacy' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-accent-dark">🔒 Dane prywatne</h2>
            <p className="text-xs text-text-secondary">
              Te dane NIE opuszcza Twojego telefonu. Agent widzi tylko pseudonim.
            </p>

            <InputField label="Imie" value={ob.pii.firstName} onChange={v => ob.setPii({ ...ob.pii, firstName: v })} />
            <InputField label="Nazwisko (opcjonalnie)" value={ob.pii.lastName} onChange={v => ob.setPii({ ...ob.pii, lastName: v })} />
            <InputField label="PESEL (opcjonalnie)" value={ob.pii.pesel} onChange={v => ob.setPii({ ...ob.pii, pesel: v })} />
            <InputField label="Pseudonim dla agenta" value={ob.displayName} onChange={ob.setDisplayName} placeholder={ob.pii.firstName || 'np. Paula'} />

            <p className="text-[10px] text-text-secondary">
              Agent bedzie Cie nazywal "{ob.displayName || ob.pii.firstName || 'Pacjent'}".
            </p>

            <NavButtons onBack={ob.back} onNext={ob.next} canBack={ob.canGoBack} />
          </div>
        )}

        {ob.step === 'apikey' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-accent-dark">🔑 Klucz API</h2>
            <p className="text-xs text-text-secondary">
              Klucz Anthropic Claude jest potrzebny do pelnej funkcjonalnosci AI. Mozesz go dodac pozniej.
            </p>

            <InputField
              label="Klucz API Anthropic"
              value={ob.apiKey}
              onChange={ob.setApiKey}
              placeholder="sk-ant-..."
              type="password"
            />

            <p className="text-[10px] text-text-secondary">
              Klucz przechowywany lokalnie. Bez klucza aplikacja dziala w trybie demo.
            </p>

            <NavButtons onBack={ob.back} onNext={ob.next} canBack={ob.canGoBack} />
          </div>
        )}

        {ob.step === 'diagnosis' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-accent-dark">🏥 Diagnoza</h2>

            <InputField
              label="Nazwa choroby"
              value={ob.diagnosis}
              onChange={ob.setDiagnosis}
              placeholder="np. Rak piersi inwazyjny"
            />

            <div>
              <label className="text-xs text-text-secondary block mb-1">Stadium</label>
              <div className="flex gap-2">
                {['I', 'II', 'III', 'IV'].map(s => (
                  <button
                    key={s}
                    onClick={() => ob.setStage(s)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
                      ob.stage === s
                        ? 'bg-accent-dark text-accent-warm border-accent-dark'
                        : 'bg-bg-card border-border text-text-primary'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <InputField
              label="Podtyp molekularny (jesli znany)"
              value={ob.molecularSubtype}
              onChange={ob.setMolecularSubtype}
              placeholder="np. HER2+, Triple Negative..."
            />

            <NavButtons onBack={ob.back} onNext={ob.next} canBack={ob.canGoBack} />
          </div>
        )}

        {ob.step === 'medications' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-accent-dark">💊 Leczenie</h2>
            <p className="text-xs text-text-secondary">
              Mozesz to uzupelnic pozniej przez chat lub ustawienia.
            </p>

            <InputField
              label="Aktualny schemat chemii"
              value={ob.currentChemo}
              onChange={ob.setCurrentChemo}
              placeholder="np. paklitaksel + gemcytabina"
            />

            <InputField
              label="Cykl chemii"
              value={ob.chemoCycle}
              onChange={ob.setChemoCycle}
              placeholder="np. co 3 tygodnie, pon-pon-tydzien wolny"
            />

            <NavButtons onBack={ob.back} onNext={ob.next} canBack={ob.canGoBack} />
          </div>
        )}

        {ob.step === 'confirmation' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-accent-dark">Podsumowanie</h2>

            <div className="bg-bg-card rounded-xl border border-border p-4 space-y-2 text-sm">
              <SummaryRow label="Pseudonim" value={ob.displayName || ob.pii.firstName || 'Pacjent'} />
              <SummaryRow label="Diagnoza" value={ob.diagnosis || '(nie podano)'} />
              <SummaryRow label="Stadium" value={ob.stage || '(nie podano)'} />
              {ob.molecularSubtype && <SummaryRow label="Podtyp" value={ob.molecularSubtype} />}
              <SummaryRow label="Chemioterapia" value={ob.currentChemo || '(nie podano)'} />
              <SummaryRow label="Cykl" value={ob.chemoCycle || '(nie podano)'} />
              <SummaryRow label="Klucz API" value={ob.apiKey ? 'Podany' : 'Tryb demo'} />
            </div>

            <p className="text-xs text-text-secondary">
              Wszystkie dane mozna zmienic pozniej w Ustawieniach lub przez rozmowe z agentem.
            </p>

            <button
              onClick={ob.back}
              className="w-full border border-border text-text-secondary rounded-xl py-2 text-sm"
            >
              Wstecz
            </button>
            <button
              onClick={handleComplete}
              className="w-full bg-accent-dark text-accent-warm rounded-xl py-3 text-sm font-medium"
            >
              Rozpocznij korzystanie z AlpakaLive
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InputField({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-text-secondary block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-bg-primary focus:outline-none focus:border-accent-dark"
      />
    </div>
  );
}

function NavButtons({ onBack, onNext, canBack }: { onBack: () => void; onNext: () => void; canBack: boolean }) {
  return (
    <div className="flex gap-3 pt-2">
      {canBack && (
        <button onClick={onBack} className="flex-1 border border-border text-text-secondary rounded-xl py-2 text-sm">
          Wstecz
        </button>
      )}
      <button onClick={onNext} className="flex-1 bg-accent-dark text-accent-warm rounded-xl py-2 text-sm font-medium">
        Dalej
      </button>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1 border-b border-border">
      <span className="text-text-secondary text-xs">{label}</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}
