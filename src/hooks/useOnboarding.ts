import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { PatientProfile, PIIData, PatientLocation, PatientLanguages, BreastCancerSubtype, ReceptorStatus, HER2Status } from '@/types';
import { detectGuidelineRegion, DEFAULT_NOTIFICATIONS } from '@/types';
import { savePatient, saveSettings } from '@/lib/db';

export type OnboardingStep = 'welcome' | 'data_transparency' | 'mode' | 'privacy' | 'apikey' | 'location' | 'languages' | 'diagnosis' | 'biomarkers' | 'medications' | 'confirmation';

const STEPS: OnboardingStep[] = ['welcome', 'data_transparency', 'mode', 'privacy', 'apikey', 'location', 'languages', 'diagnosis', 'biomarkers', 'medications', 'confirmation'];

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
