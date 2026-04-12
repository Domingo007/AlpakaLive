/*
 * AlpacaLive — Medical Knowledge Registry
 * Static imports of JSON files from medical-knowledge/ folder.
 * Bundled at build time by Vite — works offline.
 *
 * To add a new cancer type:
 * 1. Create JSON files in medical-knowledge/<cancer-type>/
 * 2. Import them here and add to DISEASE_REGISTRY
 */

// Breast cancer — complete reference implementation
import breastCancerProfile from '../../../medical-knowledge/breast-cancer/disease-profile.json';
import breastCancerRegimens from '../../../medical-knowledge/breast-cancer/regimens.json';
import breastCancerSideEffects from '../../../medical-knowledge/breast-cancer/side-effects.json';
import breastCancerMonitoring from '../../../medical-knowledge/breast-cancer/monitoring.json';
import breastCancerGlossary from '../../../medical-knowledge/breast-cancer/education/glossary.json';
import breastCancerPhaseGuides from '../../../medical-knowledge/breast-cancer/education/phase-guides.json';
import breastCancerWhenToCall from '../../../medical-knowledge/breast-cancer/education/when-to-call.json';
import breastCancerFaq from '../../../medical-knowledge/breast-cancer/education/faq.json';
import breastCancerSideEffectTips from '../../../medical-knowledge/breast-cancer/education/side-effect-tips.json';

// Common knowledge
import commonBloodNorms from '../../../medical-knowledge/common/blood-norms.json';
import commonEmergencySymptoms from '../../../medical-knowledge/common/emergency-symptoms.json';

import type { DiseaseKnowledgePackage, CommonKnowledge } from './knowledge-types';

// ==================== DISEASE REGISTRY ====================

export const DISEASE_REGISTRY: Record<string, DiseaseKnowledgePackage> = {
  'breast-cancer': {
    profile: breastCancerProfile as unknown as DiseaseKnowledgePackage['profile'],
    regimens: breastCancerRegimens as unknown as DiseaseKnowledgePackage['regimens'],
    sideEffects: breastCancerSideEffects as unknown as DiseaseKnowledgePackage['sideEffects'],
    monitoring: breastCancerMonitoring as unknown as DiseaseKnowledgePackage['monitoring'],
    education: {
      glossary: breastCancerGlossary as unknown as DiseaseKnowledgePackage['education']['glossary'],
      phaseGuides: breastCancerPhaseGuides as unknown as DiseaseKnowledgePackage['education']['phaseGuides'],
      whenToCall: breastCancerWhenToCall as unknown as DiseaseKnowledgePackage['education']['whenToCall'],
      faq: breastCancerFaq as unknown as DiseaseKnowledgePackage['education']['faq'],
      sideEffectTips: breastCancerSideEffectTips as unknown as DiseaseKnowledgePackage['education']['sideEffectTips'],
    },
  },
};

// ==================== COMMON KNOWLEDGE ====================

export const COMMON_KNOWLEDGE: CommonKnowledge = {
  bloodNorms: commonBloodNorms as unknown as CommonKnowledge['bloodNorms'],
  emergencySymptoms: commonEmergencySymptoms as unknown as CommonKnowledge['emergencySymptoms'],
};

// ==================== ACCESSORS ====================

export function getDiseaseKnowledge(diseaseId: string): DiseaseKnowledgePackage | null {
  return DISEASE_REGISTRY[diseaseId] || null;
}

export function getAllDiseaseIds(): string[] {
  return Object.keys(DISEASE_REGISTRY);
}

export function getDiseaseNames(lang: string): { id: string; name: string }[] {
  return Object.entries(DISEASE_REGISTRY).map(([id, pkg]) => ({
    id,
    name: pkg.profile.name[lang] || pkg.profile.name['en'] || id,
  }));
}
