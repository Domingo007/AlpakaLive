/*
 * AlpacaLive — Disease Matcher
 * Matches free-text diagnosis to a disease profile in the registry.
 */
import { DISEASE_REGISTRY } from './knowledge-registry';

/**
 * Match a diagnosis text to a disease ID from the registry.
 * Checks aliases across all languages and ICD-10 codes.
 * Returns the disease ID (e.g., 'breast-cancer') or null if no match.
 */
export function matchDiagnosis(diagnosisText: string): string | null {
  const normalized = diagnosisText.toLowerCase().trim();
  if (!normalized) return null;

  for (const [diseaseId, pkg] of Object.entries(DISEASE_REGISTRY)) {
    // Check aliases across all languages
    for (const aliases of Object.values(pkg.profile.aliases)) {
      for (const alias of aliases) {
        if (normalized.includes(alias.toLowerCase())) {
          return diseaseId;
        }
      }
    }

    // Check disease name across all languages
    for (const name of Object.values(pkg.profile.name)) {
      if (normalized.includes(name.toLowerCase())) {
        return diseaseId;
      }
    }

    // Check ICD-10 codes
    for (const code of pkg.profile.icd10Codes) {
      if (normalized.includes(code.toLowerCase())) {
        return diseaseId;
      }
    }
  }

  return null;
}

/**
 * Get relevant blood markers for a disease.
 */
export function getRelevantBloodMarkers(diseaseId: string): string[] {
  const pkg = DISEASE_REGISTRY[diseaseId];
  return pkg?.profile.relevantBloodMarkers || [];
}

/**
 * Get regimens applicable to a specific subtype.
 */
export function getRegimensForSubtype(diseaseId: string, subtypeId: string) {
  const pkg = DISEASE_REGISTRY[diseaseId];
  if (!pkg) return [];
  return pkg.regimens.regimens.filter(r =>
    r.subtypes.includes(subtypeId) || r.subtypes.includes('all'),
  );
}

/**
 * Get all regimens for a disease.
 */
export function getAllRegimens(diseaseId: string) {
  const pkg = DISEASE_REGISTRY[diseaseId];
  return pkg?.regimens.regimens || [];
}
