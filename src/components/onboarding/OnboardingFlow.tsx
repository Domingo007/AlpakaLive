import { useState } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { Icon } from '@/components/shared/Icon';
import { LanguageSelector } from '@/components/shared/LanguageSelector';
import { useI18n } from '@/lib/i18n';
import type { AIProvider } from '@/lib/ai-provider';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const ob = useOnboarding();
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [dataConsentAccepted, setDataConsentAccepted] = useState(false);
  const { t, lang } = useI18n();

  async function handleComplete() {
    await ob.complete();
    onComplete();
  }

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col safe-top">
      <div className="h-1 bg-border">
        <div
          className="h-full bg-accent-dark transition-all duration-300"
          style={{ width: `${ob.progress}%` }}
        />
      </div>

      <div className="flex-1 px-6 py-8 max-w-md mx-auto w-full">
        {ob.step === 'welcome' && (
          <div className="space-y-4 mt-4">
            {/* Language switcher */}
            <div className="flex justify-end">
              <LanguageSelector compact persist={false} />
            </div>

            <div className="text-center">
              <img src="/logo.png" alt="AlpacaLive" className="w-20 h-20 rounded-2xl mx-auto shadow-lg" onError={(e: any) => e.target.style.display="none"} />
              <h1 className="font-display text-2xl font-bold text-accent-dark">AlpacaLive</h1>
            </div>

            <div className="text-sm font-medium text-accent-dark">{t.onboarding.importantInfo}</div>

            <div className="bg-bg-card rounded-xl border border-border p-4 text-xs text-text-primary space-y-2">
              <p>{t.onboarding.disclaimerIntro}</p>

              <div className="space-y-1">
                <p className="font-medium flex items-center gap-1"><span className="material-symbols-rounded text-alert-warning" style={{fontSize:16}}>warning</span> {t.onboarding.appIsNot}</p>
                <ul className="list-disc pl-4 text-text-secondary space-y-0.5">
                  <li>{t.onboarding.notDoctor}</li>
                  <li>{t.onboarding.notDiagnosis}</li>
                  <li>{t.onboarding.notEmergency}</li>
                </ul>
              </div>

              <div className="space-y-1">
                <p className="font-medium">{t.onboarding.appCan}</p>
                <ul className="list-disc pl-4 text-text-secondary space-y-0.5">
                  <li>{t.onboarding.canNotes}</li>
                  <li>{t.onboarding.canAnalyze}</li>
                  <li>{t.onboarding.canRemind}</li>
                  <li>{t.onboarding.canTranslate}</li>
                </ul>
              </div>

              <p className="text-text-secondary">{t.onboarding.userResponsibility}</p>
            </div>

            <div className="bg-accent-warm/50 rounded-xl p-3 text-xs text-text-primary">
              <p className="font-medium mb-1 flex items-center gap-1"><span className="material-symbols-rounded" style={{fontSize:16}}>lock</span> {t.onboarding.yourDataSafe}</p>
              <p className="text-text-secondary">{t.onboarding.dataLocalOnly}</p>
            </div>

            <label className="flex items-start gap-2 cursor-pointer py-2">
              <input
                type="checkbox"
                checked={disclaimerAccepted}
                onChange={e => setDisclaimerAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 shrink-0"
              />
              <span className="text-xs text-text-primary">{t.onboarding.acceptDisclaimer}</span>
            </label>

            <button
              onClick={ob.next}
              disabled={!disclaimerAccepted}
              className="w-full bg-accent-dark text-accent-warm rounded-xl py-3 text-sm font-medium disabled:opacity-40"
            >
              {t.onboarding.startSetup}
            </button>
          </div>
        )}

        {ob.step === 'data_transparency' && (
          <div className="space-y-3 mt-2">
            <h2 className="font-display text-lg font-semibold text-accent-dark">{t.onboarding.dataTransparency}</h2>

            <div className="bg-accent-green/10 border border-accent-green/30 rounded-xl p-3 text-xs space-y-1">
              <div className="font-medium text-accent-dark">{t.onboarding.onYourPhone}:</div>
              <div className="text-text-secondary space-y-0.5 pl-2">
                <div>✅ {t.onboarding.onPhoneDesc}</div>
              </div>
            </div>

            <div className="bg-alert-warning/10 border border-alert-warning/30 rounded-xl p-3 text-xs space-y-1">
              <div className="font-medium text-accent-dark">{t.onboarding.sentToAI}:</div>
              <div className="text-text-secondary space-y-0.5 pl-2">
                <div>{t.onboarding.sentToAIDesc}</div>
              </div>
            </div>

            <div className="bg-bg-card border border-border rounded-xl p-3 text-xs space-y-1">
              <div className="font-medium text-accent-dark">PII Sanitizer — {t.onboarding.piiExample}</div>
              <div className="text-text-secondary space-y-0.5 pl-2">
                <div>"{t.onboarding.piiExampleBefore}" → "{t.onboarding.piiExampleAfter}"</div>
              </div>
            </div>

            <label className="flex items-start gap-2 cursor-pointer py-1">
              <input type="checkbox" checked={dataConsentAccepted} onChange={e => setDataConsentAccepted(e.target.checked)} className="mt-0.5 w-4 h-4 shrink-0" />
              <span className="text-xs">{t.onboarding.consentText}</span>
            </label>

            <button onClick={ob.next} disabled={!dataConsentAccepted} className="w-full bg-accent-dark text-accent-warm rounded-xl py-3 text-sm font-medium disabled:opacity-40">
              {t.common.next}
            </button>
          </div>
        )}

        {ob.step === 'mode' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-accent-dark">{t.onboarding.howToUse}</h2>
            <div className="space-y-3">
              <button
                onClick={() => ob.setAppMode('ai')}
                className={`w-full text-left rounded-xl p-4 border-2 transition-colors ${
                  ob.appMode === 'ai' ? 'border-accent-dark bg-accent-warm/20' : 'border-border'
                }`}
              >
                <div className="text-lg mb-1">{t.onboarding.aiModeTitle}</div>
                <div className="text-xs text-text-secondary">{t.onboarding.aiModeDesc}</div>
              </button>
              <button
                onClick={() => ob.setAppMode('notebook')}
                className={`w-full text-left rounded-xl p-4 border-2 transition-colors ${
                  ob.appMode === 'notebook' ? 'border-accent-dark bg-accent-warm/20' : 'border-border'
                }`}
              >
                <div className="text-lg mb-1">{t.onboarding.notebookModeTitle}</div>
                <div className="text-xs text-text-secondary">{t.onboarding.notebookModeDesc}</div>
              </button>
            </div>
            <p className="text-[10px] text-text-secondary text-center">{t.onboarding.canChangeLater}</p>
            <NavButtons onBack={ob.back} onNext={ob.next} canBack={ob.canGoBack} />
          </div>
        )}

        {ob.step === 'privacy' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-accent-dark">{t.onboarding.privateData}</h2>
            <p className="text-xs text-text-secondary">{t.onboarding.privateDataDesc}</p>

            <InputField label={t.onboarding.firstNameLabel} value={ob.pii.firstName} onChange={v => ob.setPii({ ...ob.pii, firstName: v })} />
            <InputField label={t.onboarding.lastNameLabel} value={ob.pii.lastName} onChange={v => ob.setPii({ ...ob.pii, lastName: v })} />
            <InputField label={t.onboarding.peselLabel} value={ob.pii.pesel} onChange={v => ob.setPii({ ...ob.pii, pesel: v })} />
            <InputField label={t.onboarding.nicknameLabel} value={ob.displayName} onChange={ob.setDisplayName} placeholder={ob.pii.firstName || t.onboarding.nicknamePlaceholder} />

            <p className="text-[10px] text-text-secondary">
              {t.onboarding.agentWillCall(ob.displayName || ob.pii.firstName || 'Patient')}
            </p>

            <NavButtons onBack={ob.back} onNext={ob.next} canBack={ob.canGoBack} />
          </div>
        )}

        {ob.step === 'apikey' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-accent-dark">{t.onboarding.apiKeyTitle}</h2>
            <p className="text-xs text-text-secondary">{t.onboarding.apiKeyDesc}</p>

            <InputField
              label={t.onboarding.apiKeyLabel}
              value={ob.apiKey}
              onChange={ob.setApiKey}
              placeholder={t.onboarding.apiKeyPlaceholder}
              type="password"
            />

            <p className="text-[10px] text-text-secondary">{t.onboarding.apiKeyStorage}</p>

            <NavButtons onBack={ob.back} onNext={ob.next} canBack={ob.canGoBack} />
          </div>
        )}

        {ob.step === 'location' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-accent-dark">{t.onboarding.locationTitle}</h2>
            <p className="text-xs text-text-secondary">{t.onboarding.locationDesc}</p>

            <InputField label={t.onboarding.residenceCountry} value={ob.residenceCountry} onChange={v => { ob.setResidenceCountry(v); if (!ob.treatmentCountry || ob.treatmentCountry === ob.residenceCountry) ob.setTreatmentCountry(v); }} placeholder={t.onboarding.countryPlaceholder} />
            <InputField label={t.onboarding.residenceCityOpt} value={ob.residenceCity} onChange={ob.setResidenceCity} placeholder={t.onboarding.cityPlaceholder} />
            <InputField label={t.onboarding.treatmentCountryOpt} value={ob.treatmentCountry} onChange={ob.setTreatmentCountry} placeholder={t.onboarding.countryPlaceholder} />
            <InputField label={t.onboarding.treatmentCityOpt} value={ob.treatmentCity} onChange={ob.setTreatmentCity} />
            <InputField label={t.onboarding.hospitalOpt} value={ob.treatmentFacility} onChange={ob.setTreatmentFacility} />

            <NavButtons onBack={ob.back} onNext={ob.next} canBack={ob.canGoBack} />
          </div>
        )}

        {ob.step === 'languages' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-accent-dark">{t.onboarding.languagesTitle}</h2>
            <p className="text-xs text-text-secondary">{t.onboarding.languagesDesc}</p>
            <div className="space-y-2">
              {[
                { code: 'pl', label: 'Polski' },
                { code: 'de', label: 'Deutsch' },
                { code: 'en', label: 'English' },
                { code: 'fr', label: 'Français' },
                { code: 'uk', label: 'Українська' },
                { code: 'cs', label: 'Čeština' },
              ].map(lng => (
                <label key={lng.code} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ob.documentLanguages.includes(lng.code)}
                    onChange={e => {
                      if (e.target.checked) {
                        ob.setDocumentLanguages([...ob.documentLanguages, lng.code]);
                      } else {
                        ob.setDocumentLanguages(ob.documentLanguages.filter(l => l !== lng.code));
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{lng.label}</span>
                </label>
              ))}
            </div>
            <NavButtons onBack={ob.back} onNext={ob.next} canBack={ob.canGoBack} />
          </div>
        )}

        {ob.step === 'diagnosis' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-accent-dark">{t.onboarding.diagnosisTitle}</h2>

            <InputField
              label={t.onboarding.diseaseName}
              value={ob.diagnosis}
              onChange={ob.setDiagnosis}
              placeholder={t.onboarding.diseaseNamePlaceholder}
            />

            <div>
              <label className="text-xs text-text-secondary block mb-1">{t.onboarding.stageLabel}</label>
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
              label={t.onboarding.molecularSubtype}
              value={ob.molecularSubtype}
              onChange={ob.setMolecularSubtype}
              placeholder={t.onboarding.subtypePlaceholder}
            />

            <NavButtons onBack={ob.back} onNext={ob.next} canBack={ob.canGoBack} />
          </div>
        )}

        {ob.step === 'treatments' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-text-primary">{t.onboarding.treatmentsTitle}</h2>
            <p className="text-xs text-text-secondary">{t.onboarding.treatmentsSubtitle}</p>
            <div className="space-y-3">
              {[
                { id: 'chemotherapy', label: t.onboarding.chemotherapy, icon: 'vaccines' },
                { id: 'radiotherapy', label: t.onboarding.radiotherapy, icon: 'radiology' },
                { id: 'immunotherapy', label: t.onboarding.immunotherapy, icon: 'shield' },
                { id: 'targeted_therapy', label: t.onboarding.targetedTherapy, icon: 'target' },
                { id: 'hormonal_therapy', label: t.onboarding.hormonalTherapy, icon: 'medication' },
              ].map(tx => (
                <label key={tx.id} className="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors"
                  style={{ borderColor: ob.treatmentTypes.includes(tx.id) ? '#7c5cc9' : undefined, backgroundColor: ob.treatmentTypes.includes(tx.id) ? '#f3eeff' : undefined }}>
                  <input type="checkbox" checked={ob.treatmentTypes.includes(tx.id)}
                    onChange={e => {
                      if (e.target.checked) ob.setTreatmentTypes([...ob.treatmentTypes, tx.id]);
                      else ob.setTreatmentTypes(ob.treatmentTypes.filter(x => x !== tx.id));
                    }} className="w-4 h-4" />
                  <Icon name={tx.icon} size={20} className="text-lavender-500" />
                  <span className="text-sm font-medium">{tx.label}</span>
                </label>
              ))}
            </div>

            {ob.treatmentTypes.includes('radiotherapy') && (
              <div className="bg-bg-elevated rounded-xl p-3 space-y-2">
                <div className="text-xs font-medium">{t.onboarding.radiotherapyDetails}</div>
                <InputField label={t.onboarding.targetRegion} value={ob.rtRegion} onChange={ob.setRtRegion} />
                <InputField label={t.onboarding.totalFractions} value={ob.rtFractions} onChange={ob.setRtFractions} />
              </div>
            )}
            {ob.treatmentTypes.includes('immunotherapy') && (
              <div className="bg-bg-elevated rounded-xl p-3">
                <InputField label={t.onboarding.immunotherapy} value={ob.immunoDrug} onChange={ob.setImmunoDrug} placeholder="e.g. pembrolizumab (Keytruda)" />
              </div>
            )}
            {ob.treatmentTypes.includes('targeted_therapy') && (
              <div className="bg-bg-elevated rounded-xl p-3">
                <InputField label={t.onboarding.targetedTherapy} value={ob.targetedDrug} onChange={ob.setTargetedDrug} placeholder="e.g. trastuzumab (Herceptin)" />
              </div>
            )}
            {ob.treatmentTypes.includes('hormonal_therapy') && (
              <div className="bg-bg-elevated rounded-xl p-3">
                <InputField label={t.onboarding.hormonalTherapy} value={ob.hormonalDrug} onChange={ob.setHormonalDrug} placeholder="e.g. letrozol (Femara)" />
              </div>
            )}

            <NavButtons onBack={ob.back} onNext={ob.next} canBack={ob.canGoBack} />
          </div>
        )}

        {ob.step === 'biomarkers' && ob.isBreastCancer && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-accent-dark">{t.onboarding.biomarkersTitle}</h2>
            <p className="text-xs text-text-secondary">{t.onboarding.biomarkersDesc}</p>

            <div>
              <label className="text-xs text-text-secondary block mb-1">{t.onboarding.molecularSubtypeLabel}</label>
              <select value={ob.breastCancerSubtype} onChange={e => ob.setBreastCancerSubtype(e.target.value as any)} className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-bg-primary">
                <option value="unknown">{t.onboarding.dontKnow}</option>
                <option value="luminal_a">HR+/HER2- (Luminal A)</option>
                <option value="luminal_b">HR+/HER2- Ki-67 high (Luminal B)</option>
                <option value="her2_positive">HER2+</option>
                <option value="tnbc">Triple Negative (TNBC)</option>
                <option value="her2_low">HER2-low</option>
                <option value="other">{t.common.other}</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-text-secondary block">{t.onboarding.receptorStatus}</label>
              <StatusRow label="ER" value={ob.erStatus} onChange={ob.setErStatus} options={['positive', 'negative', 'unknown']} labels={[t.onboarding.positive, t.onboarding.negative, t.onboarding.dontKnow]} />
              <StatusRow label="PR" value={ob.prStatus} onChange={ob.setPrStatus} options={['positive', 'negative', 'unknown']} labels={[t.onboarding.positive, t.onboarding.negative, t.onboarding.dontKnow]} />
              <StatusRow label="HER2" value={ob.her2Status} onChange={ob.setHer2Status} options={['positive', 'negative', 'low', 'unknown']} labels={[`${t.onboarding.positive} (3+)`, t.onboarding.negative, 'Low (1+/2+)', t.onboarding.dontKnow]} />
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-secondary w-10">{t.onboarding.ki67Label}</span>
                <input type="number" value={ob.ki67} onChange={e => ob.setKi67(e.target.value)} placeholder="%" className="flex-1 rounded-lg border border-border px-3 py-1.5 text-sm bg-bg-primary" />
                <span className="text-[10px] text-text-secondary">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-text-secondary block">{t.onboarding.geneticTests}</label>
              <StatusRow label="BRCA" value={ob.brcaStatus} onChange={ob.setBrcaStatus} options={['brca1', 'brca2', 'negative', 'not_tested']} labels={['BRCA1+', 'BRCA2+', t.onboarding.negative, t.onboarding.notTested]} />
              <StatusRow label="PD-L1" value={ob.pdl1Status} onChange={ob.setPdl1Status} options={['positive', 'negative', 'not_tested']} labels={[t.onboarding.positive, t.onboarding.negative, t.onboarding.notTested]} />
              <StatusRow label="PIK3CA" value={ob.piK3caStatus} onChange={ob.setPiK3caStatus} options={['mutated', 'wild_type', 'not_tested']} labels={['Mutated', 'Wild type', t.onboarding.notTested]} />
            </div>

            <NavButtons onBack={ob.back} onNext={ob.next} canBack={ob.canGoBack} />
          </div>
        )}

        {ob.step === 'medications' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-accent-dark">{t.onboarding.medicationsTitle}</h2>
            <p className="text-xs text-text-secondary">{t.onboarding.medicationsDesc}</p>

            <InputField
              label={t.onboarding.currentChemoRegimen}
              value={ob.currentChemo}
              onChange={ob.setCurrentChemo}
            />

            <InputField
              label={t.onboarding.chemoCycle}
              value={ob.chemoCycle}
              onChange={ob.setChemoCycle}
            />

            <NavButtons onBack={ob.back} onNext={ob.next} canBack={ob.canGoBack} />
          </div>
        )}

        {ob.step === 'confirmation' && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold text-accent-dark">{t.onboarding.summaryTitle}</h2>

            <div className="bg-bg-card rounded-xl border border-border p-4 space-y-2 text-sm">
              <SummaryRow label={t.onboarding.summaryNickname} value={ob.displayName || ob.pii.firstName || 'Patient'} />
              <SummaryRow label={t.onboarding.summaryDiagnosis} value={ob.diagnosis || `(${t.common.notProvided.toLowerCase()})`} />
              <SummaryRow label={t.onboarding.summaryStage} value={ob.stage || `(${t.common.notProvided.toLowerCase()})`} />
              {ob.molecularSubtype && <SummaryRow label={t.onboarding.summarySubtype} value={ob.molecularSubtype} />}
              <SummaryRow label={t.onboarding.summaryChemo} value={ob.currentChemo || `(${t.common.notProvided.toLowerCase()})`} />
              <SummaryRow label={t.onboarding.summaryCycle} value={ob.chemoCycle || `(${t.common.notProvided.toLowerCase()})`} />
              <SummaryRow label={t.onboarding.summaryApiKey} value={ob.apiKey ? t.onboarding.summaryApiProvided : t.onboarding.summaryApiDemo} />
            </div>

            <p className="text-xs text-text-secondary">{t.onboarding.summaryClosing}</p>

            <button
              onClick={ob.back}
              className="w-full border border-border text-text-secondary rounded-xl py-2 text-sm"
            >
              {t.common.back}
            </button>
            <button
              onClick={handleComplete}
              className="w-full bg-accent-dark text-accent-warm rounded-xl py-3 text-sm font-medium"
            >
              {t.onboarding.startUsing}
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
  const { t } = useI18n();
  return (
    <div className="flex gap-3 pt-2">
      {canBack && (
        <button onClick={onBack} className="flex-1 border border-border text-text-secondary rounded-xl py-2 text-sm">
          {t.common.back}
        </button>
      )}
      <button onClick={onNext} className="flex-1 bg-accent-dark text-accent-warm rounded-xl py-2 text-sm font-medium">
        {t.common.next}
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
