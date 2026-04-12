/*
 * AlpacaLive — Content utilities for medical knowledge.
 * Helpers for working with bilingual JSON content.
 */
import type { LocalizedText } from './knowledge-types';

/**
 * Get localized text with fallback chain: requested lang → en → pl → first available.
 */
export function localized(obj: LocalizedText | undefined, lang: string): string {
  if (!obj) return '';
  return obj[lang] || obj['en'] || obj['pl'] || Object.values(obj)[0] || '';
}

/**
 * Get localized text from an array of LocalizedText objects.
 */
export function localizedList(arr: LocalizedText[] | undefined, lang: string): string[] {
  if (!arr) return [];
  return arr.map(item => localized(item, lang));
}
