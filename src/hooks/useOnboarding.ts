import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { PatientProfile, PIIData, PatientLocation, PatientLanguages, BreastCancerSubtype, ReceptorStatus, HER2Status, TreatmentProtocol, RadiotherapyPlan } from '@/types';
import { detectGuidelineRegion, DEFAULT_NOTIFICATIONS } from '@/types';
import { savePatient, saveSettings } from '@/lib/db';

export type OnboardingStep = 'welcome' | 'data_transparency' | 'mode' | 'privacy' | 'apikey' | 'location' | 'languages' | 'diagnosis' | 'treatments' | 'biomarkers' | 'medications' | 'confirmation';

const STEPS: OnboardingStep[] = ['welcome', 'data_transparency', 'mode', 'privacy', 'apikey', 'location', 'languages', 'diagnosis', 'treatments', 'biomarkers', 'medications', 'confirmation'];

export function useOnboarding() {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [apiKey, setApiKey] = useState('');
  const [pii, setPii] = useState<PIIData>({
    firstName: '', lastName: '', pesel: '', address: '', phone: '', email: '', hospitalIds: [],
  });
  const [displayName, setDisplayName] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [stage, setStage] = useState('');
  const [molecularSubtype, setMolecularSubtype] = useState('');
  const [currentChemo, setCurrentChemo] = useState('');
  const [chemoCycle, setChemoCycle] = useState('');

  // Location
  const [residenceCountry, setResidenceCountry] = useState('Polska');
  const [residenceCity, setResidenceCity] = useState('');
  const [treatmentCountry, setTreatmentCountry] = useState('Polska');
  const [treatmentCity, setTreatmentCity] = useState('');
  const [treatmentFacility, setTreatmentFacility] = useState('');

  // App mode
  const [appMode, setAppMode] = useState<'ai' | 'notebook'>('notebook');

  // Treatment types
  const [treatmentTypes, setTreatmentTypes] = useState<string[]>([]);
  const [rtRegion, setRtRegion] = useState('');
  const [rtFractions, setRtFractions] = useState('');
  const [immunoDrug, setImmunoDrug] = useState('');
  const [targetedDrug, setTargetedDrug] = useState('');
  const [hormonalDrug, setHormonalDrug] = useState('');

  // Languages
  const [documentLanguages, setDocumentLanguages] = useState<string[]>(['pl']);

  // Breast cancer biomarkers
  const [breastCancerSubtype, setBreastCancerSubtype] = useState<BreastCancerSubtype>('unknown');
  const [erStatus, setErStatus] = useState<ReceptorStatus>('unknown');
  const [prStatus, setPrStatus] = useState<ReceptorStatus>('unknown');
  const [her2Status, setHer2Status] = useState<HER2Status>('unknown');
  const [ki67, setKi67] = useState('');
  const [brcaStatus, setBrcaStatus] = useState<string>('not_tested');
  const [pdl1Status, setPdl1Status] = useState<string>('not_tested');
  const [piK3caStatus, setPiK3caStatus] = useState<string>('not_tested');

  const currentIndex = STEPS.indexOf(step);
  const canGoBack = currentIndex > 0;
  const canGoNext = currentIndex < STEPS.length - 1;

  // Check if diagnosis is breast cancer
  const isBreastCancer = diagnosis.toLowerCase().includes('piersi') || diagnosis.toLowerCase().includes('breast');

  // Skip steps based on mode and diagnosis
  function shouldSkip(step: OnboardingStep): boolean {
    if (step === 'apikey' && appMode === 'notebook') return true;
    if (step === 'biomarkers' && !isBreastCancer) return true;
    return false;
  }

  const next = useCallback(() => {
    if (!canGoNext) return;
    let nextIndex = currentIndex + 1;
    while (nextIndex < STEPS.length && shouldSkip(STEPS[nextIndex])) nextIndex++;
    if (nextIndex < STEPS.length) setStep(STEPS[nextIndex]);
  }, [currentIndex, canGoNext, isBreastCancer, appMode]);

  const back = useCallback(() => {
    if (!canGoBack) return;
    let prevIndex = currentIndex - 1;
    while (prevIndex >= 0 && shouldSkip(STEPS[prevIndex])) prevIndex--;
    if (prevIndex >= 0) setStep(STEPS[prevIndex]);
  }, [currentIndex, canGoBack, isBreastCancer, appMode]);

  const complete = useCallback(async () => {
    const location: PatientLocation = {
      residenceCountry,
      residenceCity: residenceCity || undefined,
      treatmentCountry,
      treatmentCity: treatmentCity || undefined,
      treatmentFacility: treatmentFacility || undefined,
      guidelineRegion: detectGuidelineRegion(treatmentCountry),
    };

    // Build TreatmentProtocol[] from selected treatment types
    const treatments: TreatmentProtocol[] = [];
    const today = new Date().toISOString().split('T')[0];

    for (const tt of treatmentTypes) {
      const protocol: TreatmentProtocol = {
        id: uuidv4(),
        type: tt as TreatmentProtocol['type'],
        name: tt,
        startDate: today,
        status: 'active',
      };

      if (tt === 'radiotherapy' && (rtRegion || rtFractions)) {
        const fractions = rtFractions ? parseInt(rtFractions) : 25;
        protocol.radiotherapy = {
          type: 'external_beam',
          targetArea: rtRegion || '',
          totalDoseGy: fractions * 2, // default 2 Gy per fraction
          fractions,
          dosePerFractionGy: 2,
          frequency: 'pon-pią',
          startDate: today,
          sessions: [],
        } as RadiotherapyPlan;
      }

      if (tt === 'immunotherapy' && immunoDrug) {
        protocol.name = immunoDrug;
        protocol.drugs = [{ name: immunoDrug, genericName: immunoDrug, dose: '', frequency: '', startDate: today, cyp450: [], interactions: [], sideEffects: [], active: true }];
      }

      if (tt === 'targeted_therapy' && targetedDrug) {
        protocol.name = targetedDrug;
        protocol.drugs = [{ name: targetedDrug, genericName: targetedDrug, dose: '', frequency: '', startDate: today, cyp450: [], interactions: [], sideEffects: [], active: true }];
      }

      if (tt === 'hormonal_therapy' && hormonalDrug) {
        protocol.name = hormonalDrug;
        protocol.drugs = [{ name: hormonalDrug, genericName: hormonalDrug, dose: '', frequency: '', startDate: today, cyp450: [], interactions: [], sideEffects: [], active: true }];
      }

      treatments.push(protocol);
    }

    const patient: PatientProfile = {
      id: uuidv4(),
      name: displayName || pii.firstName || 'Pacjent',
      displayName: displayName || pii.firstName || 'Pacjent',
      age: 0,
      weight: 0,
      diagnosis,
      stage,
      molecularSubtype: molecularSubtype || undefined,
      surgeries: [],
      currentChemo,
      chemoCycle,
      psychiatricMeds: [],
      oncologyMeds: [],
      otherMeds: [],
      allergies: [],
      preferences: [],
      pii,
      location,
      languages: {
        appLanguage: 'pl',
        documentLanguages,
        preferredMedicalTerms: 'pl',
      },
      treatments: treatments.length > 0 ? treatments : undefined,
      ...(isBreastCancer ? {
        breastCancerSubtype,
        erStatus,
        prStatus,
        her2Status,
        ki67: ki67 ? parseInt(ki67) : null,
        brcaStatus: brcaStatus as PatientProfile['brcaStatus'],
        pdl1Status: pdl1Status as PatientProfile['pdl1Status'],
        piK3caStatus: piK3caStatus as PatientProfile['piK3caStatus'],
      } : {}),
      disclaimerAccepted: {
        accepted: true,
        acceptedAt: new Date().toISOString(),
        version: '1.0',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await savePatient(patient);
    await saveSettings({ apiKey, aiProvider: 'anthropic', appMode, onboardingCompleted: true, notifications: DEFAULT_NOTIFICATIONS });

    return patient;
  }, [apiKey, pii, displayName, diagnosis, stage, molecularSubtype, currentChemo, chemoCycle,
      appMode, documentLanguages, residenceCountry, residenceCity, treatmentCountry, treatmentCity, treatmentFacility,
      treatmentTypes, rtRegion, rtFractions, immunoDrug, targetedDrug, hormonalDrug,
      isBreastCancer, breastCancerSubtype, erStatus, prStatus, her2Status, ki67, brcaStatus, pdl1Status, piK3caStatus]);

  return {
    step, setStep,
    apiKey, setApiKey,
    pii, setPii,
    displayName, setDisplayName,
    diagnosis, setDiagnosis,
    stage, setStage,
    molecularSubtype, setMolecularSubtype,
    currentChemo, setCurrentChemo,
    chemoCycle, setChemoCycle,
    // Mode
    appMode, setAppMode,
    // Treatments
    treatmentTypes, setTreatmentTypes,
    rtRegion, setRtRegion, rtFractions, setRtFractions,
    immunoDrug, setImmunoDrug, targetedDrug, setTargetedDrug, hormonalDrug, setHormonalDrug,
    // Languages
    documentLanguages, setDocumentLanguages,
    // Location
    residenceCountry, setResidenceCountry,
    residenceCity, setResidenceCity,
    treatmentCountry, setTreatmentCountry,
    treatmentCity, setTreatmentCity,
    treatmentFacility, setTreatmentFacility,
    // Biomarkers
    isBreastCancer,
    breastCancerSubtype, setBreastCancerSubtype,
    erStatus, setErStatus,
    prStatus, setPrStatus,
    her2Status, setHer2Status,
    ki67, setKi67,
    brcaStatus, setBrcaStatus,
    pdl1Status, setPdl1Status,
    piK3caStatus, setPiK3caStatus,
    // Nav
    next, back, canGoBack, canGoNext,
    complete,
    progress: (currentIndex / (STEPS.length - 1)) * 100,
  };
}
