import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { PatientProfile, PIIData } from '@/types';
import { savePatient, saveSettings } from '@/lib/db';

export type OnboardingStep = 'welcome' | 'privacy' | 'apikey' | 'diagnosis' | 'medications' | 'confirmation';

const STEPS: OnboardingStep[] = ['welcome', 'privacy', 'apikey', 'diagnosis', 'medications', 'confirmation'];

export function useOnboarding() {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [apiKey, setApiKey] = useState('');
  const [pii, setPii] = useState<PIIData>({
    firstName: '',
    lastName: '',
    pesel: '',
    address: '',
    phone: '',
    email: '',
    hospitalIds: [],
  });
  const [displayName, setDisplayName] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [stage, setStage] = useState('');
  const [molecularSubtype, setMolecularSubtype] = useState('');
  const [currentChemo, setCurrentChemo] = useState('');
  const [chemoCycle, setChemoCycle] = useState('');

  const currentIndex = STEPS.indexOf(step);
  const canGoBack = currentIndex > 0;
  const canGoNext = currentIndex < STEPS.length - 1;

  const next = useCallback(() => {
    if (canGoNext) setStep(STEPS[currentIndex + 1]);
  }, [currentIndex, canGoNext]);

  const back = useCallback(() => {
    if (canGoBack) setStep(STEPS[currentIndex - 1]);
  }, [currentIndex, canGoBack]);

  const complete = useCallback(async () => {
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
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await savePatient(patient);
    await saveSettings({ apiKey, onboardingCompleted: true });

    return patient;
  }, [apiKey, pii, displayName, diagnosis, stage, molecularSubtype, currentChemo, chemoCycle]);

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
    next, back, canGoBack, canGoNext,
    complete,
    progress: (currentIndex / (STEPS.length - 1)) * 100,
  };
}
