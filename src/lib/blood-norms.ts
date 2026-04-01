export interface BloodMarkerNorm {
  name: string;
  shortName: string;
  unit: string;
  normalMin: number;
  normalMax: number;
  criticalLow?: number;
  criticalHigh?: number;
  category: 'morphology' | 'biochemistry' | 'tumor_markers' | 'coagulation' | 'other';
}

export const BLOOD_NORMS: Record<string, BloodMarkerNorm> = {
  wbc: { name: 'Leukocyty (WBC)', shortName: 'WBC', unit: 'tys/ul', normalMin: 4.0, normalMax: 10.0, criticalLow: 2.0, category: 'morphology' },
  neutrophils: { name: 'Neutrofile', shortName: 'NEU', unit: 'tys/ul', normalMin: 1.8, normalMax: 7.7, criticalLow: 1.0, category: 'morphology' },
  lymphocytes: { name: 'Limfocyty', shortName: 'LYM', unit: 'tys/ul', normalMin: 1.0, normalMax: 4.5, criticalLow: 0.5, category: 'morphology' },
  hgb: { name: 'Hemoglobina', shortName: 'HGB', unit: 'g/dl', normalMin: 12.0, normalMax: 16.0, criticalLow: 8.0, category: 'morphology' },
  hct: { name: 'Hematokryt', shortName: 'HCT', unit: '%', normalMin: 37, normalMax: 47, category: 'morphology' },
  plt: { name: 'Plytki krwi', shortName: 'PLT', unit: 'tys/ul', normalMin: 150, normalMax: 400, criticalLow: 50, category: 'morphology' },
  rbc: { name: 'Erytrocyty (RBC)', shortName: 'RBC', unit: 'mln/ul', normalMin: 3.8, normalMax: 5.2, category: 'morphology' },
  mcv: { name: 'MCV', shortName: 'MCV', unit: 'fl', normalMin: 80, normalMax: 100, category: 'morphology' },
  // Biochemistry
  albumin: { name: 'Albumina', shortName: 'ALB', unit: 'g/dl', normalMin: 3.5, normalMax: 5.0, criticalLow: 3.0, category: 'biochemistry' },
  totalProtein: { name: 'Bialko calkowite', shortName: 'TP', unit: 'g/dl', normalMin: 6.0, normalMax: 8.3, category: 'biochemistry' },
  creatinine: { name: 'Kreatynina', shortName: 'CREA', unit: 'mg/dl', normalMin: 0.6, normalMax: 1.2, criticalHigh: 2.0, category: 'biochemistry' },
  urea: { name: 'Mocznik', shortName: 'UREA', unit: 'mg/dl', normalMin: 15, normalMax: 45, category: 'biochemistry' },
  alt: { name: 'ALT (ALAT)', shortName: 'ALT', unit: 'U/l', normalMin: 0, normalMax: 35, criticalHigh: 200, category: 'biochemistry' },
  ast: { name: 'AST (ASPAT)', shortName: 'AST', unit: 'U/l', normalMin: 0, normalMax: 35, criticalHigh: 200, category: 'biochemistry' },
  bilirubin: { name: 'Bilirubina calkowita', shortName: 'BIL', unit: 'mg/dl', normalMin: 0, normalMax: 1.2, category: 'biochemistry' },
  glucose: { name: 'Glukoza', shortName: 'GLU', unit: 'mg/dl', normalMin: 70, normalMax: 100, criticalLow: 50, criticalHigh: 400, category: 'biochemistry' },
  sodium: { name: 'Sod (Na)', shortName: 'Na', unit: 'mmol/l', normalMin: 136, normalMax: 145, criticalLow: 125, criticalHigh: 155, category: 'biochemistry' },
  potassium: { name: 'Potas (K)', shortName: 'K', unit: 'mmol/l', normalMin: 3.5, normalMax: 5.1, criticalLow: 2.5, criticalHigh: 6.5, category: 'biochemistry' },
  calcium: { name: 'Wapn (Ca)', shortName: 'Ca', unit: 'mg/dl', normalMin: 8.5, normalMax: 10.5, criticalLow: 7.0, criticalHigh: 12.0, category: 'biochemistry' },
  ldh: { name: 'LDH', shortName: 'LDH', unit: 'U/l', normalMin: 120, normalMax: 246, category: 'biochemistry' },
  crp: { name: 'CRP', shortName: 'CRP', unit: 'mg/l', normalMin: 0, normalMax: 5, criticalHigh: 100, category: 'biochemistry' },
  // Tumor markers
  ca153: { name: 'CA 15-3', shortName: 'CA15-3', unit: 'U/ml', normalMin: 0, normalMax: 31.3, category: 'tumor_markers' },
  cea: { name: 'CEA', shortName: 'CEA', unit: 'ng/ml', normalMin: 0, normalMax: 5.0, category: 'tumor_markers' },
  ca125: { name: 'CA 125', shortName: 'CA125', unit: 'U/ml', normalMin: 0, normalMax: 35, category: 'tumor_markers' },
  // Coagulation
  inr: { name: 'INR', shortName: 'INR', unit: '', normalMin: 0.8, normalMax: 1.2, category: 'coagulation' },
  dDimer: { name: 'D-Dimer', shortName: 'D-dim', unit: 'ug/ml', normalMin: 0, normalMax: 0.5, category: 'coagulation' },
};

export type MarkerStatus = 'normal' | 'low' | 'high' | 'critical_low' | 'critical_high';

export function evaluateMarker(markerKey: string, value: number): MarkerStatus {
  const norm = BLOOD_NORMS[markerKey];
  if (!norm) return 'normal';

  if (norm.criticalLow !== undefined && value < norm.criticalLow) return 'critical_low';
  if (norm.criticalHigh !== undefined && value > norm.criticalHigh) return 'critical_high';
  if (value < norm.normalMin) return 'low';
  if (value > norm.normalMax) return 'high';
  return 'normal';
}

export function getStatusIcon(status: MarkerStatus): string {
  switch (status) {
    case 'critical_low': return '🔴↓';
    case 'critical_high': return '🔴↑';
    case 'low': return '🟡↓';
    case 'high': return '🟡↑';
    case 'normal': return '✅';
  }
}

export function getStatusColor(status: MarkerStatus): string {
  switch (status) {
    case 'critical_low':
    case 'critical_high':
      return '#e74c3c';
    case 'low':
    case 'high':
      return '#f39c12';
    case 'normal':
      return '#27ae60';
  }
}
