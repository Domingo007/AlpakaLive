export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  weight: number;
  diagnosis: string;
  stage: string;
  molecularSubtype?: string;
  surgeries: string[];
  currentChemo: string;
  chemoCycle: string;
  psychiatricMeds: DrugEntry[];
  oncologyMeds: DrugEntry[];
  otherMeds: DrugEntry[];
  allergies: string[];
  preferences: string[];
  pii: PIIData;
  displayName: string;
  diseaseProfile?: DiseaseProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface PIIData {
  firstName: string;
  lastName: string;
  pesel: string;
  address: string;
  phone: string;
  email: string;
  hospitalIds: string[];
}

export interface DrugEntry {
  name: string;
  genericName: string;
  dose: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  cyp450: string[];
  interactions: string[];
  sideEffects: string[];
  active: boolean;
}

export interface ChemoSession {
  id: string;
  date: string;
  plannedDate: string;
  actualDate?: string;
  status: 'planned' | 'completed' | 'postponed' | 'cancelled' | 'modified';
  postponeReason?: string;
  postponedTo?: string;
  preChemoBlood?: PreChemoBlood;
  drugs: string[];
  dose?: string;
  doseReduction?: boolean;
  doseReductionPercent?: number;
  cycle: number;
  notes: string;
  sideEffects: string[];
  bloodBeforeChemo?: string;
}

export interface PreChemoBlood {
  wbc?: number;
  neutrophils?: number;
  plt?: number;
  hgb?: number;
  otherIssues?: string;
}

export interface BloodWork {
  id: string;
  date: string;
  source: 'manual' | 'photo_extraction' | 'document';
  sourceImageId?: string;
  markers: Record<string, number>;
  lab?: string;
  notes: string;
  aiAnalysis?: string;
}

export interface DailyLog {
  id: string;
  date: string;
  time: string;
  energy: number;
  pain: number;
  painLocation?: string;
  nausea: number;
  mood: number;
  neuropathy: number;
  appetite: number;
  weight?: number;
  temperature?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  heartRate?: number;
  sleep?: SleepData;
  bowel?: string;
  hydration?: number;
  notes: string;
  chemoPhase: 'A' | 'B' | 'C' | null;
  dayInCycle: number;
}

export interface SleepData {
  hours: number;
  quality: number;
  deepSleep?: number;
  remSleep?: number;
}

export interface WearableData {
  id: string;
  date: string;
  source: 'amazfit_helio' | 'apple_health' | 'manual';
  rhr: number;
  hrv: number;
  spo2: number;
  sleepHours: number;
  deepSleep: number;
  remSleep: number;
  lightSleep: number;
  steps: number;
  activeMinutes: number;
  biocharge: number;
  skinTemperature?: number;
  respiratoryRate?: number;
  stressLevel?: number;
}

export interface MealLog {
  id: string;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'supplement_drink';
  description: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  hydration?: number;
  toleratedWell: boolean;
  notes?: string;
}

export interface SupplementLog {
  id: string;
  date: string;
  supplements: SupplementEntry[];
}

export interface SupplementEntry {
  name: string;
  dose: string;
  taken: boolean;
  time?: string;
}

export interface ImagingStudy {
  id: string;
  date: string;
  type: 'CT' | 'PET' | 'MRI' | 'RTG' | 'USG' | 'mammography' | 'bone_density' | 'other';
  bodyRegion: string;
  images: ImagingImage[];
  findings: string;
  aiAnalysis?: string;
  tumors?: TumorMeasurement[];
  metastases?: MetastasisRecord[];
  comparison?: ImagingComparison;
  notes: string;
}

export interface ImagingImage {
  id: string;
  base64?: string;
  blobKey?: string;
  description: string;
}

export interface TumorMeasurement {
  location: string;
  sizeMm: number[];
  volume?: number;
  recistResponse?: 'CR' | 'PR' | 'SD' | 'PD';
  previousSize?: number[];
  changePercent?: number;
}

export interface MetastasisRecord {
  location: string;
  status: 'new' | 'stable' | 'growing' | 'shrinking' | 'resolved';
  sizeMm?: number[];
  notes: string;
}

export interface ImagingComparison {
  previousStudyId: string;
  changes: string;
  aiComparison?: string;
}

export interface Prediction {
  id: string;
  date: string;
  targetDate: string;
  type: 'wellbeing' | 'blood' | 'sideEffects' | 'energy';
  prediction: string;
  confidence: number;
  basedOn: string[];
  actual?: string;
  accuracy?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | MessageContent[];
  timestamp: Date;
  dataExtracted?: Record<string, unknown>[];
  imagesAttached?: string[];
}

export type MessageContent =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
  | { type: 'document'; source: { type: 'base64'; media_type: string; data: string } };

export interface DiseaseProfile {
  icd10Code: string;
  namePolish: string;
  nameEnglish: string;
  nameLatin: string;
  stage: string;
  molecularSubtype?: string;
  relevantBloodMarkers: BloodMarkerConfig[];
  tumorMarkers: TumorMarkerConfig[];
  standardChemoRegimens: ChemoRegimen[];
  typicalMetastasisSites: string[];
  relevantImaging: ImagingConfig[];
  keyInteractions: string[];
}

export interface BloodMarkerConfig {
  marker: string;
  frequency: string;
  normalRange: { min: number; max: number; unit: string };
  criticalLow?: number;
  criticalHigh?: number;
}

export interface TumorMarkerConfig {
  marker: string;
  normalMax: number;
  unit: string;
}

export interface ChemoRegimen {
  name: string;
  drugs: string[];
  cycleLength: number;
  commonSideEffects: string[];
}

export interface ImagingConfig {
  type: string;
  frequency: string;
  purpose: string;
}

export interface ChemoReadinessAssessment {
  readiness: 'go' | 'caution' | 'postpone';
  issues: string[];
  recommendation: string;
  affectedPredictions: boolean;
}

export type ChemoPhase = 'A' | 'B' | 'C' | null;

export type TabId = 'chat' | 'data' | 'imaging' | 'settings';

export interface AppSettings {
  apiKey: string;
  onboardingCompleted: boolean;
}
