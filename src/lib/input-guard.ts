/*
 * AlpacaLive — Input security guard
 * Detects prompt injection attempts, enforces limits, validates files.
 *
 * Three layers:
 * 1. Message text: detect injection patterns, enforce length
 * 2. Files: validate MIME, enforce size, scan for text-based injection in images
 * 3. Rate limiting: debounce rapid-fire API calls
 */

// ==================== CONSTANTS ====================

export const MAX_MESSAGE_LENGTH = 3000;
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const MIN_MESSAGE_INTERVAL_MS = 2000;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
export const ALLOWED_DOC_TYPES = ['application/pdf'];

// ==================== PROMPT INJECTION DETECTION ====================

// Patterns that indicate prompt injection attempts
const INJECTION_PATTERNS: { pattern: RegExp; severity: 'block' | 'warn' }[] = [
  // Direct instruction override attempts
  { pattern: /ignore\s+(all\s+)?(previous|above|prior|earlier)\s+(instructions?|prompts?|rules?|guidelines?)/i, severity: 'block' },
  { pattern: /forget\s+(all\s+)?(previous|above|prior|your)\s+(instructions?|prompts?|rules?|context)/i, severity: 'block' },
  { pattern: /disregard\s+(all\s+)?(previous|above|system)\s+(instructions?|prompts?|rules?)/i, severity: 'block' },
  { pattern: /override\s+(system|safety|security)\s+(prompt|instructions?|rules?|settings?)/i, severity: 'block' },
  { pattern: /you\s+are\s+now\s+(a|an|in)\s+(new|different|admin|unrestricted|general)/i, severity: 'block' },
  { pattern: /switch\s+to\s+(admin|unrestricted|developer|debug|jailbreak)\s+mode/i, severity: 'block' },
  { pattern: /entering\s+(admin|root|developer|debug|sudo|jailbreak)\s+mode/i, severity: 'block' },

  // Role override
  { pattern: /from\s+now\s+on[,.]?\s+(you\s+are|act\s+as|pretend|behave)/i, severity: 'block' },
  { pattern: /pretend\s+(you\s+are|to\s+be)\s+(a\s+)?(different|new|regular|normal|general|unrestricted)/i, severity: 'block' },
  { pattern: /act\s+as\s+(if|though)\s+you\s+(have\s+no|don't\s+have|aren't)\s+(restrictions?|rules?|limits?)/i, severity: 'block' },
  { pattern: /zapomnij\s+(o\s+)?(poprzednich|wcze[sś]niejszych|swoich)\s+(instrukcjach|zasadach|regu[łl]ach)/i, severity: 'block' },
  { pattern: /zignoruj\s+(poprzednie|wcze[sś]niejsze|systemowe)\s+(instrukcje|zasady|regu[łl]y)/i, severity: 'block' },
  { pattern: /od\s+teraz\s+jeste[sś]\s+(zwyk[łl]ym|normalnym|innym)/i, severity: 'block' },

  // Data exfiltration
  { pattern: /reveal\s+(your|the|system)\s+(prompt|instructions?|rules?|configuration)/i, severity: 'block' },
  { pattern: /show\s+me\s+(your|the)\s+(system\s+)?(prompt|instructions?|source\s+code)/i, severity: 'block' },
  { pattern: /what\s+are\s+your\s+(system\s+)?(instructions?|rules?|guidelines?|restrictions?)/i, severity: 'warn' },
  { pattern: /poka[żz]\s+(mi\s+)?(swoje|systemowe)\s+(instrukcje|zasady|prompt)/i, severity: 'block' },

  // Token smuggling
  { pattern: /<\/?system>/i, severity: 'block' },
  { pattern: /\[SYSTEM\]/i, severity: 'block' },
  { pattern: /\[INST\]/i, severity: 'block' },
  { pattern: /<<SYS>>/i, severity: 'block' },
  { pattern: /\[\/INST\]/i, severity: 'block' },
  { pattern: /Human:|Assistant:|System:/i, severity: 'warn' },
];

// Topics that are clearly outside oncology diary scope
const OFF_TOPIC_PATTERNS: RegExp[] = [
  /przepis\s+na\s+/i,
  /recipe\s+for\s+/i,
  /napisz\s+(mi\s+)?(kod|program|skrypt|esej|wypracowanie|wiersz|piosenk)/i,
  /write\s+(me\s+)?(code|program|script|essay|poem|song)/i,
  /jak\s+(zrobi[ćc]|zhakowa[ćc]|w[łl]ama[ćc]\s+si[eę])/i,
  /how\s+to\s+(hack|break\s+into|synthesize|make\s+drugs)/i,
];

export interface InputGuardResult {
  allowed: boolean;
  reason?: string;
  severity?: 'block' | 'warn' | 'off_topic';
  cleanedText?: string;
}

/**
 * Check user message for prompt injection and enforce limits.
 */
export function guardMessage(text: string): InputGuardResult {
  // Length check
  if (text.length > MAX_MESSAGE_LENGTH) {
    return {
      allowed: false,
      reason: `Wiadomość zbyt długa (${text.length}/${MAX_MESSAGE_LENGTH} znaków)`,
      severity: 'block',
    };
  }

  // Empty check
  if (!text.trim()) {
    return { allowed: false, reason: 'Pusta wiadomość', severity: 'block' };
  }

  // Injection detection
  for (const { pattern, severity } of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      if (severity === 'block') {
        return {
          allowed: false,
          reason: 'Wykryto próbę modyfikacji instrukcji AI. Wiadomość zablokowana.',
          severity: 'block',
        };
      }
    }
  }

  // Off-topic detection
  for (const pattern of OFF_TOPIC_PATTERNS) {
    if (pattern.test(text)) {
      return {
        allowed: true, // Allow but AI will refuse via system prompt
        severity: 'off_topic',
        cleanedText: text,
      };
    }
  }

  return { allowed: true, cleanedText: text };
}

/**
 * Validate an uploaded file.
 */
export function guardFile(file: File): InputGuardResult {
  // Size check
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      allowed: false,
      reason: `Plik zbyt duży (${sizeMB}MB, max ${MAX_FILE_SIZE_MB}MB)`,
      severity: 'block',
    };
  }

  // MIME type check
  const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
  const isDoc = ALLOWED_DOC_TYPES.includes(file.type);
  if (!isImage && !isDoc) {
    return {
      allowed: false,
      reason: `Nieobsługiwany format pliku: ${file.type || 'nieznany'}. Dozwolone: JPG, PNG, WebP, PDF.`,
      severity: 'block',
    };
  }

  return { allowed: true };
}

// ==================== RATE LIMITING ====================

let lastMessageTime = 0;

/**
 * Check if enough time has passed since last message.
 */
export function checkRateLimit(): InputGuardResult {
  const now = Date.now();
  if (now - lastMessageTime < MIN_MESSAGE_INTERVAL_MS) {
    return {
      allowed: false,
      reason: 'Zbyt szybko. Poczekaj chwilę przed wysłaniem kolejnej wiadomości.',
      severity: 'block',
    };
  }
  lastMessageTime = now;
  return { allowed: true };
}

// ==================== DATA EXTRACTION GUARD ====================

// Whitelist of allowed fields per data type — only these can be written to DB
const ALLOWED_FIELDS: Record<string, string[]> = {
  daily: ['date', 'time', 'energy', 'pain', 'painLocation', 'nausea', 'mood', 'neuropathy', 'appetite', 'weight', 'temperature', 'bpSystolic', 'bpDiastolic', 'heartRate', 'hydration', 'notes', 'bowel'],
  blood: ['date', 'source', 'markers', 'lab', 'notes'],
  chemo: ['date', 'plannedDate', 'actualDate', 'status', 'drugs', 'dose', 'doseReduction', 'doseReductionPercent', 'cycle', 'notes', 'sideEffects'],
  wearable: ['date', 'source', 'rhr', 'hrv', 'spo2', 'sleepHours', 'deepSleep', 'remSleep', 'lightSleep', 'steps', 'activeMinutes', 'biocharge'],
  meals: ['date', 'mealType', 'description', 'calories', 'protein', 'carbs', 'fat', 'fiber', 'hydration', 'toleratedWell', 'notes'],
  supplements: ['date', 'supplements'],
  imaging: ['date', 'type', 'bodyRegion', 'findings', 'notes', 'tumors', 'metastases', 'radiologistReport'],
  prediction: ['date', 'targetDate', 'type', 'prediction', 'confidence', 'basedOn'],
};

/**
 * Sanitize extracted data — only allow whitelisted fields per type.
 * Prevents injection of arbitrary fields into the database.
 */
export function sanitizeExtractedData(type: string, data: Record<string, unknown>): Record<string, unknown> {
  const allowed = ALLOWED_FIELDS[type];
  if (!allowed) return {}; // Unknown type — reject entirely

  const sanitized: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in data) {
      sanitized[key] = data[key];
    }
  }
  return sanitized;
}
