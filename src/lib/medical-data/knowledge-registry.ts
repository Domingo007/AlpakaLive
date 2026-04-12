/*
 * AlpacaLive — Medical Knowledge Registry
 * Loads all medical data from JSON files in medical-knowledge/ folder.
 * Two sections: cancers (per type) and shared (drugs, supplements, reference ranges).
 *
 * Doctors edit JSON → PR → medical review → merge. Zero code contact.
 */

// ==================== CANCER MODULES ====================
import breastCancerInfo from '../../../medical-knowledge/cancers/breast/cancer-info.json';
import breastTreatments from '../../../medical-knowledge/cancers/breast/treatments.json';
import breastSideEffects from '../../../medical-knowledge/cancers/breast/side-effects.json';
import breastMonitoring from '../../../medical-knowledge/cancers/breast/monitoring.json';
import breastGlossary from '../../../medical-knowledge/cancers/breast/education/glossary.json';
import breastPhaseGuides from '../../../medical-knowledge/cancers/breast/education/phase-guides.json';
import breastWhenToCall from '../../../medical-knowledge/cancers/breast/education/when-to-call.json';
import breastFaq from '../../../medical-knowledge/cancers/breast/education/faq.json';
import breastSideEffectTips from '../../../medical-knowledge/cancers/breast/education/side-effect-tips.json';

// ==================== DRUGS ====================
import chemoAgents from '../../../medical-knowledge/drugs/chemo-agents.json';
import immunotherapyDrugs from '../../../medical-knowledge/drugs/immunotherapy.json';
import targetedDrugs from '../../../medical-knowledge/drugs/targeted-therapy.json';
import hormonalDrugs from '../../../medical-knowledge/drugs/hormonal-therapy.json';
import supportiveCareDrugs from '../../../medical-knowledge/drugs/supportive-care.json';
import psychiatricDrugs from '../../../medical-knowledge/drugs/psychiatric.json';
import cyp450Matrix from '../../../medical-knowledge/drugs/interactions/cyp450-matrix.json';

// ==================== SUPPLEMENTS ====================
import supplementsDb from '../../../medical-knowledge/supplements/evidence-database.json';

// ==================== REFERENCE RANGES ====================
import bloodMarkers from '../../../medical-knowledge/reference-ranges/blood-markers.json';
import tumorMarkers from '../../../medical-knowledge/reference-ranges/tumor-markers.json';
import vitals from '../../../medical-knowledge/reference-ranges/vitals.json';

// ==================== RADIOTHERAPY & SURGERY ====================
import rtProtocols from '../../../medical-knowledge/radiotherapy/protocols.json';
import rtSideEffects from '../../../medical-knowledge/radiotherapy/side-effects-by-region.json';
import surgeryProcedures from '../../../medical-knowledge/surgery/procedures.json';

// ==================== MEDICAL TERMS ====================
import medicalTermsPl from '../../../medical-knowledge/medical-terms/pl.json';
import medicalTermsDe from '../../../medical-knowledge/medical-terms/de.json';
import medicalTermsEn from '../../../medical-knowledge/medical-terms/en.json';
import abbreviations from '../../../medical-knowledge/medical-terms/abbreviations.json';

import type { DiseaseKnowledgePackage, CommonKnowledge } from './knowledge-types';

// ==================== DISEASE REGISTRY ====================

export const DISEASE_REGISTRY: Record<string, DiseaseKnowledgePackage> = {
  'breast-cancer': {
    profile: breastCancerInfo as unknown as DiseaseKnowledgePackage['profile'],
    regimens: breastTreatments as unknown as DiseaseKnowledgePackage['regimens'],
    sideEffects: breastSideEffects as unknown as DiseaseKnowledgePackage['sideEffects'],
    monitoring: breastMonitoring as unknown as DiseaseKnowledgePackage['monitoring'],
    education: {
      glossary: breastGlossary as unknown as DiseaseKnowledgePackage['education']['glossary'],
      phaseGuides: breastPhaseGuides as unknown as DiseaseKnowledgePackage['education']['phaseGuides'],
      whenToCall: breastWhenToCall as unknown as DiseaseKnowledgePackage['education']['whenToCall'],
      faq: breastFaq as unknown as DiseaseKnowledgePackage['education']['faq'],
      sideEffectTips: breastSideEffectTips as unknown as DiseaseKnowledgePackage['education']['sideEffectTips'],
    },
  },
};

// ==================== COMMON KNOWLEDGE ====================

export const COMMON_KNOWLEDGE: CommonKnowledge = {
  bloodNorms: bloodMarkers as unknown as CommonKnowledge['bloodNorms'],
  emergencySymptoms: { version: '1.0.0', universal: [] },
};

// ==================== DRUG DATABASE (all categories merged) ====================

export const ALL_DRUGS = {
  chemo: chemoAgents.drugs,
  immunotherapy: immunotherapyDrugs.drugs,
  targeted: targetedDrugs.drugs,
  hormonal: hormonalDrugs.drugs,
  supportive: supportiveCareDrugs.drugs,
  psychiatric: psychiatricDrugs.drugs,
};

export const CYP450_INTERACTIONS = cyp450Matrix;
export const SUPPLEMENTS = supplementsDb;
export const TUMOR_MARKERS = tumorMarkers;
export const VITALS = vitals;
export const RT_PROTOCOLS = rtProtocols;
export const RT_SIDE_EFFECTS = rtSideEffects;
export const SURGERY_PROCEDURES = surgeryProcedures;
export const ABBREVIATIONS = abbreviations;

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

/**
 * Get all drug IDs across all categories for interaction checking.
 */
export function findDrugById(drugId: string): unknown | null {
  const normalized = drugId.toLowerCase().replace(/\s+/g, '_');
  for (const category of Object.values(ALL_DRUGS)) {
    const found = (category as { id: string }[]).find(d => d.id === normalized);
    if (found) return found;
  }
  return null;
}

/**
 * Get CYP450 interactions for a list of drug IDs.
 */
export function getInteractionsForDrugs(drugIds: string[]): typeof cyp450Matrix.interactions {
  const normalized = drugIds.map(d => d.toLowerCase().replace(/\s+/g, '_'));
  return cyp450Matrix.interactions.filter(
    i => normalized.includes(i.drug1) || normalized.includes(i.drug2),
  );
}

/**
 * Get medical terms for a language.
 */
export function getMedicalTerms(lang: string) {
  switch (lang) {
    case 'de': return medicalTermsDe;
    case 'pl': return medicalTermsPl;
    default: return medicalTermsEn;
  }
}
