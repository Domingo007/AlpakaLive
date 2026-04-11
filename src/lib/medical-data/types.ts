/*
 * AlpacaLive — Your Companion Through Cancer Treatment
 * Copyright (C) 2025 AlpacaLive Contributors
 * Licensed under AGPL-3.0 — see LICENSE file
 *
 * Medical reference data types — for external data packages loaded from CDN.
 */

// ==================== BLOOD NORMS ====================

export interface BloodMarkerNorm {
  name: string;
  shortName: string;
  unit: string;
  normalMin: number;
  normalMax: number;
  criticalLow?: number;
  criticalHigh?: number;
  category: 'morphology' | 'biochemistry' | 'tumor_markers' | 'coagulation' | 'immunotherapy_monitoring' | 'other';
}

// ==================== DRUG INTERACTIONS ====================

export interface CYP450Profile {
  substrate: string[];
  inhibitor: string[];
  inducer: string[];
  serotonergic?: boolean;
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  mechanism: string;
  severity: 'high' | 'moderate' | 'low';
  description: string;
  recommendation: string;
}

// ==================== DISEASE PROFILES ====================

export interface DiseaseProfileReference {
  icd10Codes: string[];
  name: Record<string, string>; // { pl: '...', en: '...' }
  relevantBloodMarkers: string[];
  relevantTreatmentTypes: string[];
  typicalMetastasisSites: string[];
  biomarkerConfig?: BiomarkerFormField[];
  monitoringSchedule: MonitoringItem[];
  sideEffectProfiles?: Record<string, SideEffectProfile>;
}

export interface BiomarkerFormField {
  id: string;
  label: Record<string, string>;
  type: 'select' | 'number' | 'text';
  options?: { value: string; label: Record<string, string> }[];
  unit?: string;
}

export interface MonitoringItem {
  name: Record<string, string>;
  frequency: string;
  type: 'blood_test' | 'imaging' | 'clinical_exam' | 'other';
  markers?: string[];
}

export interface SideEffectProfile {
  treatmentType: string;
  commonEffects: { name: Record<string, string>; frequency: string; severity: string }[];
  monitoringRequired: string[];
}

// ==================== FULL REFERENCE PACKAGE ====================

export interface MedicalReferencePackage {
  version: string;
  lastUpdated: string;
  source: string;
  sourceUrl?: string;
  bloodNorms: Record<string, BloodMarkerNorm>;
  drugInteractions: Record<string, CYP450Profile>;
  diseaseProfiles?: Record<string, DiseaseProfileReference>;
}

// ==================== PACKAGE METADATA ====================

export interface ReferencePackageMeta {
  id: string;
  type: 'blood_norms' | 'cyp450' | 'disease_profiles';
  version: string;
  lastUpdated: string;
  sourceUrl?: string;
}
