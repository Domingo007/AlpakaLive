/*
 * AlpacaLive — Type definitions for medical knowledge JSON files.
 * These types describe the structure of JSON files in medical-knowledge/ folder.
 * Doctors edit JSON, this file types it for TypeScript safety.
 */

// ==================== LOCALIZED TEXT ====================

export type LocalizedText = Record<string, string>; // { "pl": "...", "en": "..." }

// ==================== DISEASE PROFILE ====================

export interface DiseaseProfileJSON {
  id: string;
  version: string;
  lastUpdated: string;
  icd10Codes: string[];
  name: LocalizedText;
  aliases: Record<string, string[]>;
  subtypes: SubtypeDefinition[];
  stages: { id: string; name: LocalizedText }[];
  relevantBloodMarkers: string[];
  tumorMarkers: TumorMarkerDef[];
  typicalMetastasisSites: MetastasisSiteDef[];
  biomarkerConfig: BiomarkerFieldDef[];
}

export interface SubtypeDefinition {
  id: string;
  name: LocalizedText;
  markers: Record<string, string | number>;
  prognosis?: LocalizedText;
}

export interface TumorMarkerDef {
  id: string;
  name: LocalizedText;
  normalMax: number;
  unit: string;
  frequency?: LocalizedText;
}

export interface MetastasisSiteDef {
  site: string;
  name: LocalizedText;
  frequency: string;
}

export interface BiomarkerFieldDef {
  id: string;
  label: LocalizedText;
  type: 'select' | 'number' | 'text';
  options?: { value: string; label: LocalizedText }[];
  unit?: string;
}

// ==================== REGIMENS ====================

export interface RegimensJSON {
  version: string;
  lastUpdated: string;
  regimens: RegimenDefinition[];
}

export interface RegimenDefinition {
  id: string;
  name: string;
  fullName: LocalizedText;
  drugs: string[];
  cycleLength: number;
  cycles: number;
  administration: LocalizedText;
  indication: LocalizedText;
  subtypes: string[];
  commonSideEffects: string[];
  emetogenicRisk: 'high' | 'moderate' | 'low' | 'minimal';
  monitoringRequired: string[];
  preChemoChecks: Record<string, number>;
  phaseProfile: {
    crisis: PhaseExpectedValues;
    recovery: PhaseExpectedValues;
    rebuild: PhaseExpectedValues;
  };
}

export interface PhaseExpectedValues {
  days: [number, number];
  energy: number;
  nausea: number;
  pain: number;
  mood: number;
}

// ==================== SIDE EFFECTS ====================

export interface SideEffectsJSON {
  version: string;
  lastUpdated: string;
  byDrug: Record<string, DrugSideEffectProfile>;
}

export interface DrugSideEffectProfile {
  name: LocalizedText;
  class: string;
  common: SideEffectEntry[];
  serious: SeriousSideEffectEntry[];
}

export interface SideEffectEntry {
  effect: LocalizedText;
  frequency: string;
  timing: LocalizedText;
}

export interface SeriousSideEffectEntry {
  effect: LocalizedText;
  frequency: string;
  monitoring?: LocalizedText;
  action?: LocalizedText;
}

// ==================== MONITORING ====================

export interface MonitoringJSON {
  version: string;
  lastUpdated: string;
  bloodSchedule: BloodSchedulePhase[];
  imagingSchedule: ImagingScheduleItem[];
}

export interface BloodSchedulePhase {
  phase: string;
  name: LocalizedText;
  tests: {
    name: LocalizedText;
    markers: string[];
    frequency: LocalizedText;
  }[];
}

export interface ImagingScheduleItem {
  type: string;
  name: LocalizedText;
  frequency: LocalizedText;
  notes?: LocalizedText;
}

// ==================== EDUCATION ====================

export interface GlossaryJSON {
  version: string;
  terms: GlossaryTerm[];
}

export interface GlossaryTerm {
  id: string;
  term: LocalizedText;
  definition: LocalizedText;
  category: string;
}

export interface PhaseGuidesJSON {
  version: string;
  guides: Record<string, Record<string, PhaseGuide>>;
}

export interface PhaseGuide {
  title: LocalizedText;
  whatToExpect: LocalizedText;
  tips: LocalizedText[];
}

export interface WhenToCallJSON {
  version: string;
  categories: WhenToCallCategory[];
}

export interface WhenToCallCategory {
  severity: 'emergency' | 'urgent' | 'monitor';
  color: string;
  title: LocalizedText;
  symptoms: LocalizedText[];
}

export interface FaqJSON {
  version: string;
  questions: FaqEntry[];
}

export interface FaqEntry {
  q: LocalizedText;
  a: LocalizedText;
  category: string;
}

export interface SideEffectTipsJSON {
  version: string;
  tips: SideEffectTipGroup[];
}

export interface SideEffectTipGroup {
  effect: LocalizedText;
  icon: string;
  tips: LocalizedText[];
}

export interface EducationPackage {
  glossary: GlossaryJSON;
  phaseGuides: PhaseGuidesJSON;
  whenToCall: WhenToCallJSON;
  faq: FaqJSON;
  sideEffectTips: SideEffectTipsJSON;
}

// ==================== FULL KNOWLEDGE PACKAGE ====================

export interface DiseaseKnowledgePackage {
  profile: DiseaseProfileJSON;
  regimens: RegimensJSON;
  sideEffects: SideEffectsJSON;
  monitoring: MonitoringJSON;
  education: EducationPackage;
}

// ==================== COMMON KNOWLEDGE ====================

export interface CommonKnowledge {
  bloodNorms: { version: string; markers: Record<string, unknown> };
  emergencySymptoms: { version: string; universal: unknown[] };
}
