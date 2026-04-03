import { useState } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import type { AIProvider } from '@/lib/ai-provider';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const ob = useOnboarding();
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [dataConsentAccepted, setDataConsentAccepted] = useState(false);

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
          <div className="space-y-4 mt-4">
            <div className="text-center">
              <div className="text-5xl mb-2">🦙</div>
              <h1 className="font-display text-2xl font-bold text-accent-dark">AlpakaLive</h1>
            </div>

            <div className="text-sm font-medium text-accent-dark">Ważna informacja przed rozpoczęciem</div>

            <div className="bg-bg-card rounded-xl border border-border p-4 text-xs text-text-primary space-y-2">
              <p>AlpakaLive jest narzędziem do <strong>ANALIZY DANYCH</strong> dostarczonych przez użytkownika.</p>

              <div className="space-y-1">
                <p className="font-medium">⚠️ Aplikacja:</p>
                <ul className="list-disc pl-4 text-text-secondary space-y-0.5">
                  <li>NIE jest wyrobem medycznym</li>
                  <li>NIE stawia diagnoz</li>
                  <li>NIE zaleca leków ani suplementów</li>
                  <li>NIE zastępuje lekarza, farmaceuty ani żadnego specjalisty medycznego</li>
                </ul>
              </div>

              <div className="space-y-1">
                <p className="font-medium">Aplikacja MOŻE:</p>
                <ul className="list-disc pl-4 text-text-secondary space-y-0.5">
                  <li>Analizować dostarczone wyniki</li>
                  <li>Porównywać dane z normami referencyjnymi</li>
                  <li>Pokazywać trendy i sygnalizować wartości poza normami</li>
                  <li>Informować o opublikowanych badaniach naukowych</li>
                  <li>Sugerować pytania do lekarza</li>
                </ul>
              </div>

              <p className="text-text-secondary">Wszelkie decyzje dotyczące zdrowia podejmuj <strong>WYŁĄCZNIE</strong> w konsultacji z lekarzem prowadzącym.</p>
              <p className="text-text-secondary">Twórcy aplikacji nie ponoszą odpowiedzialności za decyzje zdrowotne podjęte na podstawie informacji wyświetlanych w aplikacji.</p>
            </div>

            <div className="bg-accent-warm/50 rounded-xl p-3 text-xs text-text-primary">
              <p className="font-medium mb-1">🔒 Twoje dane są bezpieczne</p>
              <p className="text-text-secondary">Wszystko przechowywane lokalnie na Twoim urządzeniu. Dane osobowe nigdy nie opuszczają telefonu.</p>
            </div>

            <label className="flex items-start gap-2 cursor-pointer py-2">
              <input
                type="checkbox"
                checked={disclaimerAccepted}
                onChange={e => setDisclaimerAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 shrink-0"
              />
              <span className="text-xs text-text-primary">Rozumiem i akceptuję powyższe zastrzeżenia</span>
            </label>

            <button
              onClick={ob.next}
              disabled={!disclaimerAccepted}
              className="w-full bg-accent-dark text-accent-warm rounded-xl py-3 text-sm font-medium disabled:opacity-40"
            >
              Rozpocznij konfigurację
            </button>
          </div>
        )}

        {ob.step === 'data_transparency' && (
          <div className="space-y-3 mt-2">
            <h2 className="font-display text-lg font-semibold text-accent-dark">🔒 Jak przetwarzamy Twoje dane</h2>

            <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-3 text-xs space-y-1">
              <div className="font-medium text-accent-dark">📱 Na Twoim telefonie (nie opuszczają urządzenia):</div>
              <div className="text-text-secondary space-y-0.5 pl-2">
                <div>✅ Imię, nazwisko, PESEL, adres, telefon, email</div>
                <div>✅ Numery identyfikacyjne pacjenta</div>
                <div>✅ Pełna historia danych i rozmów</div>
                <div>✅ Zdjęcia dokumentów (kopie lokalne)</div>
              </div>
            </div>

            <div className="bg-alert-warning/10 border border-alert-warning/30 rounded-xl p-3 text-xs space-y-1">
              <div className="font-medium text-accent-dark">☁️ Wysyłane do API AI (serwery dostawcy):</div>
              <div className="text-text-secondary space-y-0.5 pl-2">
                <div>📤 Treść rozmów (BEZ danych osobowych — PII Sanitizer je usuwa)</div>
                <div>📤 Zdjęcia wyników (mogą zawierać nagłówek z danymi)</div>
                <div>📤 Dane medyczne: diagnoza, wyniki krwi, leki</div>
                <div>📤 Dane z opaski (RHR, sen, SpO2)</div>
              </div>
              <div className="text-[10px] text-text-secondary mt-1">
                Dostawcy AI (Anthropic/OpenAI/Google) — serwery w USA/UE. Dane szyfrowane (HTTPS).
              </div>
            </div>

            <div className="bg-bg-card border border-border rounded-xl p-3 text-xs space-y-1">
              <div className="font-medium text-accent-dark">🛡️ PII Sanitizer</div>
              <div className="text-text-secondary space-y-0.5 pl-2">
                <div>"Paula Kowalska" → "[PACJENT]"</div>
                <div>"90011512345" → "[PESEL]"</div>
                <div>"ul. Kwiatowa 5" → "[ADRES]"</div>
              </div>
              <div className="text-[10px] text-text-secondary">Model AI widzi Cię jako "[PACJENT]" lub pseudonim.</div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer py-1">
              <input type="checkbox" checked={dataConsentAccepted} onChange={e => setDataConsentAccepted(e.target.checked)} className="mt-0.5 w-4 h-4 shrink-0" />
              <span className="text-xs">Rozumiem jak przetwarzane są moje dane i wyrażam zgodę</span>
            </label>

            <button onClick={ob.next} disabled={!dataConsentAccepted} className="w-full bg-accent-dark text-accent-warm rounded-xl py-3 text-sm font-medium disabled:opacity-40">
              Dalej
            </button>
          </div>
        )}

        {ob.step === 'privacy' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-accent-dark">🔒 Dane prywatne</h2>
            <p className="text-xs text-text-secondary">
              Te dane NIE opuszczą Twojego telefonu. Agent widzi tylko pseudonim.
            </p>

            <InputField label="Imię" value={ob.pii.firstName} onChange={v => ob.setPii({ ...ob.pii, firstName: v })} />
            <InputField label="Nazwisko (opcjonalnie)" value={ob.pii.lastName} onChange={v => ob.setPii({ ...ob.pii, lastName: v })} />
            <InputField label="PESEL (opcjonalnie)" value={ob.pii.pesel} onChange={v => ob.setPii({ ...ob.pii, pesel: v })} />
            <InputField label="Pseudonim dla agenta" value={ob.displayName} onChange={ob.setDisplayName} placeholder={ob.pii.firstName || 'np. Paula'} />

            <p className="text-[10px] text-text-secondary">
              Agent będzie Cię nazywał "{ob.displayName || ob.pii.firstName || 'Pacjent'}".
            </p>

            <NavButtons onBack={ob.back} onNext={ob.next} canBack={ob.canGoBack} />
          </div>
        )}

        {ob.step === 'apikey' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-accent-dark">🔑 Klucz API</h2>
            <p className="text-xs text-text-secondary">
              Klucz Anthropic Claude jest potrzebny do pełnej funkcjonalności AI. Możesz go dodać później.
            </p>

            <InputField
              label="Klucz API Anthropic"
              value={ob.apiKey}
              onChange={ob.setApiKey}
              placeholder="sk-ant-..."
              type="password"
            />

            <p className="text-[10px] text-text-secondary">
              Klucz przechowywany lokalnie. Bez klucza aplikacja działa w trybie demo.
            </p>

            <NavButtons onBack={ob.back} onNext={ob.next} canBack={ob.canGoBack} />
          </div>
        )}

        {ob.step === 'location' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-accent-dark">📍 Lokalizacja</h2>
            <p className="text-xs text-text-secondary">
              Potrzebne aby dobrać właściwe wytyczne leczenia (ESMO/NCCN).
            </p>

            <InputField label="Kraj zamieszkania" value={ob.residenceCountry} onChange={v => { ob.setResidenceCountry(v); if (!ob.treatmentCountry || ob.treatmentCountry === ob.residenceCountry) ob.setTreatmentCountry(v); }} placeholder="np. Polska" />
            <InputField label="Miasto (opcjonalnie)" value={ob.residenceCity} onChange={ob.setResidenceCity} placeholder="np. Warszawa" />
            <InputField label="Kraj leczenia (jeśli inny)" value={ob.treatmentCountry} onChange={ob.setTreatmentCountry} placeholder="np. Polska" />
            <InputField label="Miasto leczenia (opcjonalnie)" value={ob.treatmentCity} onChange={ob.setTreatmentCity} />
            <InputField label="Szpital / klinika (opcjonalnie)" value={ob.treatmentFacility} onChange={ob.setTreatmentFacility} />

            <NavButtons onBack={ob.back} onNext={ob.next} canBack={ob.canGoBack} />
          </div>
        )}

        {ob.step === 'languages' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-accent-dark">🌐 Języki dokumentów</h2>
            <p className="text-xs text-text-secondary">
              W jakim języku są Twoje dokumenty medyczne? Możesz wybrać kilka.
            </p>
            <div className="space-y-2">
              {[
                { code: 'pl', label: 'Polski' },
                { code: 'de', label: 'Niemiecki' },
                { code: 'en', label: 'Angielski' },
                { code: 'fr', label: 'Francuski' },
                { code: 'uk', label: 'Ukraiński' },
                { code: 'cs', label: 'Czeski' },
              ].map(lang => (
                <label key={lang.code} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ob.documentLanguages.includes(lang.code)}
                    onChange={e => {
                      if (e.target.checked) {
                        ob.setDocumentLanguages([...ob.documentLanguages, lang.code]);
                      } else {
                        ob.setDocumentLanguages(ob.documentLanguages.filter(l => l !== lang.code));
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{lang.label}</span>
                </label>
              ))}
            </div>
            <p className="text-[10px] text-text-secondary">
              Agent przeanalizuje dokumenty w oryginalnym języku i odpowie Ci po polsku z terminami medycznymi w nawiasie.
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
              label="Podtyp molekularny (jeśli znany)"
              value={ob.molecularSubtype}
              onChange={ob.setMolecularSubtype}
              placeholder="np. HER2+, Triple Negative..."
            />

            <NavButtons onBack={ob.back} onNext={ob.next} canBack={ob.canGoBack} />
          </div>
        )}

        {ob.step === 'biomarkers' && ob.isBreastCancer && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-accent-dark">🧬 Podtyp i biomarkery</h2>
            <p className="text-xs text-text-secondary">
              Z opisu histopatologicznego. Nie znasz? Wyślij agentowi zdjęcie wyniku.
            </p>

            <div>
              <label className="text-xs text-text-secondary block mb-1">Podtyp molekularny</label>
              <select value={ob.breastCancerSubtype} onChange={e => ob.setBreastCancerSubtype(e.target.value as any)} className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-bg-primary">
                <option value="unknown">Nie wiem</option>
                <option value="luminal_a">HR+/HER2- (Luminal A)</option>
                <option value="luminal_b">HR+/HER2- Ki-67 wysoki (Luminal B)</option>
                <option value="her2_positive">HER2-dodatni</option>
                <option value="tnbc">Potrójnie ujemny (TNBC)</option>
                <option value="her2_low">HER2-low</option>
                <option value="other">Inny</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-text-secondary block">Status receptorowy</label>
              <StatusRow label="ER" value={ob.erStatus} onChange={ob.setErStatus} options={['positive', 'negative', 'unknown']} labels={['Dodatni', 'Ujemny', 'Nie wiem']} />
              <StatusRow label="PR" value={ob.prStatus} onChange={ob.setPrStatus} options={['positive', 'negative', 'unknown']} labels={['Dodatni', 'Ujemny', 'Nie wiem']} />
              <StatusRow label="HER2" value={ob.her2Status} onChange={ob.setHer2Status} options={['positive', 'negative', 'low', 'unknown']} labels={['Dodatni (3+)', 'Ujemny', 'Low (1+/2+)', 'Nie wiem']} />
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary w-10">Ki-67</span>
                <input type="number" value={ob.ki67} onChange={e => ob.setKi67(e.target.value)} placeholder="%" className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm bg-bg-primary" />
                <span className="text-[10px] text-text-secondary">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-text-secondary block">Badania genetyczne</label>
              <StatusRow label="BRCA" value={ob.brcaStatus} onChange={ob.setBrcaStatus} options={['brca1', 'brca2', 'negative', 'not_tested']} labels={['BRCA1+', 'BRCA2+', 'Negatywny', 'Nie badano']} />
              <StatusRow label="PD-L1" value={ob.pdl1Status} onChange={ob.setPdl1Status} options={['positive', 'negative', 'not_tested']} labels={['Dodatni', 'Ujemny', 'Nie badano']} />
              <StatusRow label="PIK3CA" value={ob.piK3caStatus} onChange={ob.setPiK3caStatus} options={['mutated', 'wild_type', 'not_tested']} labels={['Zmutowany', 'Dziki typ', 'Nie badano']} />
            </div>

            <NavButtons onBack={ob.back} onNext={ob.next} canBack={ob.canGoBack} />
          </div>
        )}

        {ob.step === 'medications' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-accent-dark">💊 Leczenie</h2>
            <p className="text-xs text-text-secondary">
              Możesz to uzupełnić później przez chat lub ustawienia.
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
              placeholder="np. co 3 tygodnie, pon-pon-tydzień wolny"
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
              Wszystkie dane można zmienić później w Ustawieniach lub przez rozmowę z agentem.
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

function StatusRow({ label, value, onChange, options, labels }: {
  label: string;
  value: string;
  onChange: (v: any) => void;
  options: string[];
  labels: string[];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-text-secondary w-10 shrink-0">{label}</span>
      <div className="flex gap-1 flex-1 flex-wrap">
        {options.map((opt, i) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`px-2 py-1 rounded text-[10px] border ${
              value === opt
                ? 'bg-accent-dark text-accent-warm border-accent-dark'
                : 'bg-bg-card border-border text-text-primary'
            }`}
          >
            {labels[i]}
          </button>
        ))}
      </div>
    </div>
  );
}
