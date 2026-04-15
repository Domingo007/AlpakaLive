import { describe, it, expect } from 'vitest';
import { extractDataFromResponse, extractAIProfileData, cleanResponseFromTags } from '../lib/data-extractor';
import { sanitizeExtractedData } from '../lib/input-guard';

// ==================== EXTRACTION ====================

describe('extractDataFromResponse', () => {
  it('extracts SAVE:daily tag', () => {
    const text = 'Some text [SAVE:daily:{"date":"2026-01-01","energy":7,"pain":3}] more text';
    const result = extractDataFromResponse(text);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('daily');
    expect(result[0].data.energy).toBe(7);
  });

  it('extracts SAVE:blood tag', () => {
    const text = '[SAVE:blood:{"date":"2026-01-01","markers":{"wbc":4.5}}]';
    const result = extractDataFromResponse(text);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('blood');
  });

  it('extracts multiple tags', () => {
    const text = '[SAVE:daily:{"energy":6}] text [SAVE:blood:{"markers":{}}]';
    const result = extractDataFromResponse(text);
    expect(result).toHaveLength(2);
  });

  it('extracts UPDATE:patient tag', () => {
    const text = '[UPDATE:patient:{"weight":65}]';
    const result = extractDataFromResponse(text);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('patient_update');
  });

  it('extracts DISEASE_PROFILE tag', () => {
    const text = '[DISEASE_PROFILE:{"icd10Code":"C50"}]';
    const result = extractDataFromResponse(text);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('disease_profile');
  });

  it('skips malformed JSON', () => {
    const text = '[SAVE:daily:{broken json}]';
    const result = extractDataFromResponse(text);
    expect(result).toHaveLength(0);
  });

  it('returns empty for text without tags', () => {
    const result = extractDataFromResponse('Just normal text without any tags');
    expect(result).toHaveLength(0);
  });

  it('handles empty string', () => {
    expect(extractDataFromResponse('')).toHaveLength(0);
  });
});

// ==================== TAG CLEANING ====================

describe('cleanResponseFromTags', () => {
  it('removes SAVE tags from text', () => {
    const text = 'Result: good. [SAVE:daily:{"energy":7}] Keep monitoring.';
    const cleaned = cleanResponseFromTags(text);
    expect(cleaned).not.toContain('[SAVE:');
    expect(cleaned).toContain('Result: good.');
    expect(cleaned).toContain('Keep monitoring.');
  });

  it('removes UPDATE tags', () => {
    const text = 'Updated. [UPDATE:patient:{"weight":65}]';
    const cleaned = cleanResponseFromTags(text);
    expect(cleaned).not.toContain('[UPDATE:');
  });

  it('removes DISEASE_PROFILE tags', () => {
    const text = 'Profile loaded. [DISEASE_PROFILE:{"icd10":"C50"}]';
    const cleaned = cleanResponseFromTags(text);
    expect(cleaned).not.toContain('[DISEASE_PROFILE:');
  });

  it('removes EXTRACT tags', () => {
    const text = 'Answer. [EXTRACT:{"scores":{"energy":{"value":3,"basis":"test"}}}]';
    const cleaned = cleanResponseFromTags(text);
    expect(cleaned).not.toContain('[EXTRACT:');
    expect(cleaned).toContain('Answer.');
  });

  it('preserves text without tags', () => {
    const text = 'Normal text without tags.';
    expect(cleanResponseFromTags(text)).toBe(text);
  });
});

// ==================== AI PROFILE EXTRACTION ====================

describe('extractAIProfileData', () => {
  it('extracts scores with basis', () => {
    const text = 'Response [EXTRACT:{"date":"2026-04-16","scores":{"energy":{"value":3,"basis":"nie wstala z lozka","confidence":0.9},"pain":{"value":4,"basis":"drectwienie stop","confidence":0.8}},"clinicalFindings":[],"flags":[]}]';
    const result = extractAIProfileData(text);
    expect(result).not.toBeNull();
    expect(result!.scores.energy.value).toBe(3);
    expect(result!.scores.energy.basis).toBe('nie wstala z lozka');
    expect(result!.scores.energy.confidence).toBe(0.9);
    expect(result!.scores.pain.value).toBe(4);
  });

  it('extracts clinical findings', () => {
    const text = '[EXTRACT:{"date":"2026-04-16","scores":{},"clinicalFindings":[{"finding":"neuropatia_obwodowa","grade":2,"grading":"CTCAE","details":"dretwienie stop","basis":"nie mogla utrzymac kubka","relatedDrug":"paklitaksel"}],"flags":[]}]';
    const result = extractAIProfileData(text);
    expect(result!.clinicalFindings).toHaveLength(1);
    expect(result!.clinicalFindings[0].finding).toBe('neuropatia_obwodowa');
    expect(result!.clinicalFindings[0].grade).toBe(2);
    expect(result!.clinicalFindings[0].relatedDrug).toBe('paklitaksel');
  });

  it('extracts ECOG estimate', () => {
    const text = '[EXTRACT:{"date":"2026-04-16","scores":{},"clinicalFindings":[],"flags":[],"ecogEstimate":{"value":3,"basis":"maz musial niesc do lazienki"}}]';
    const result = extractAIProfileData(text);
    expect(result!.ecogEstimate?.value).toBe(3);
    expect(result!.ecogEstimate?.basis).toContain('maz');
  });

  it('extracts flags', () => {
    const text = '[EXTRACT:{"date":"2026-04-16","scores":{},"clinicalFindings":[],"flags":[{"type":"monitor","message":"Temperatura 37.8 — monitoruj","urgency":"medium"}]}]';
    const result = extractAIProfileData(text);
    expect(result!.flags).toHaveLength(1);
    expect(result!.flags[0].urgency).toBe('medium');
  });

  it('rejects scores without basis (transparency requirement)', () => {
    const text = '[EXTRACT:{"date":"2026-04-16","scores":{"energy":{"value":5}},"clinicalFindings":[],"flags":[]}]';
    const result = extractAIProfileData(text);
    // Energy score has no basis → should be filtered out
    expect(result!.scores.energy).toBeUndefined();
  });

  it('rejects clinical findings without basis', () => {
    const text = '[EXTRACT:{"date":"2026-04-16","scores":{},"clinicalFindings":[{"finding":"bol","details":"boli"}],"flags":[]}]';
    const result = extractAIProfileData(text);
    // No basis → filtered out
    expect(result!.clinicalFindings).toHaveLength(0);
  });

  it('clamps confidence to 0-1', () => {
    const text = '[EXTRACT:{"date":"2026-04-16","scores":{"energy":{"value":5,"basis":"test","confidence":1.5}},"clinicalFindings":[],"flags":[]}]';
    const result = extractAIProfileData(text);
    expect(result!.scores.energy.confidence).toBe(1);
  });

  it('returns null for malformed JSON', () => {
    expect(extractAIProfileData('[EXTRACT:{broken}]')).toBeNull();
  });

  it('returns null for text without EXTRACT', () => {
    expect(extractAIProfileData('Normal AI response')).toBeNull();
  });

  it('returns null if no scores object', () => {
    expect(extractAIProfileData('[EXTRACT:{"date":"2026-04-16"}]')).toBeNull();
  });
});

// ==================== INJECTION PREVENTION (via sanitizeExtractedData) ====================

describe('Data extraction security', () => {
  it('CRITICAL: blocks injection of arbitrary fields into daily log', () => {
    const malicious = {
      date: '2026-01-01',
      energy: 7,
      // Injection attempts:
      apiKey: 'stolen_key',
      password: 'secret',
      __proto__: { admin: true },
      constructor: 'hacked',
      settings: { demoMode: false },
    };
    const safe = sanitizeExtractedData('daily', malicious);
    expect(safe).not.toHaveProperty('apiKey');
    expect(safe).not.toHaveProperty('password');
    expect(safe).not.toHaveProperty('__proto__');
    expect(safe).not.toHaveProperty('constructor');
    expect(safe).not.toHaveProperty('settings');
    expect(safe).toHaveProperty('date');
    expect(safe).toHaveProperty('energy');
  });

  it('CRITICAL: blocks injection into blood work', () => {
    const malicious = {
      date: '2026-01-01',
      markers: { wbc: 4.5 },
      patientId: 'leak_this',
      piiData: { name: 'John' },
    };
    const safe = sanitizeExtractedData('blood', malicious);
    expect(safe).not.toHaveProperty('patientId');
    expect(safe).not.toHaveProperty('piiData');
    expect(safe).toHaveProperty('markers');
  });

  it('CRITICAL: blocks injection into chemo session', () => {
    const malicious = {
      date: '2026-01-01',
      drugs: ['EC'],
      cycle: 1,
      secretField: 'malicious',
      exfiltrate: true,
    };
    const safe = sanitizeExtractedData('chemo', malicious);
    expect(safe).not.toHaveProperty('secretField');
    expect(safe).not.toHaveProperty('exfiltrate');
  });

  it('CRITICAL: rejects completely unknown data type', () => {
    const safe = sanitizeExtractedData('admin_panel', { admin: true, delete_all: true });
    expect(safe).toEqual({});
  });

  it('blocks injection into wearable data', () => {
    const malicious = { date: '2026-01-01', rhr: 68, serverUrl: 'evil.com', sendTo: 'attacker' };
    const safe = sanitizeExtractedData('wearable', malicious);
    expect(safe).not.toHaveProperty('serverUrl');
    expect(safe).not.toHaveProperty('sendTo');
    expect(safe).toHaveProperty('rhr');
  });

  it('blocks injection into imaging', () => {
    const malicious = { date: '2026-01-01', type: 'CT', executeCode: 'rm -rf /', script: '<script>' };
    const safe = sanitizeExtractedData('imaging', malicious);
    expect(safe).not.toHaveProperty('executeCode');
    expect(safe).not.toHaveProperty('script');
  });

  it('blocks injection into meals', () => {
    const malicious = { date: '2026-01-01', mealType: 'lunch', webhook: 'https://evil.com/steal' };
    const safe = sanitizeExtractedData('meals', malicious);
    expect(safe).not.toHaveProperty('webhook');
  });

  it('blocks injection into supplements', () => {
    const malicious = { date: '2026-01-01', supplements: [], apiToken: 'steal' };
    const safe = sanitizeExtractedData('supplements', malicious);
    expect(safe).not.toHaveProperty('apiToken');
  });
});
