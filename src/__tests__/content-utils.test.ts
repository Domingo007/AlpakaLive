import { describe, it, expect } from 'vitest';
import { localized, localizedList } from '../lib/medical-data/content-utils';

describe('localized', () => {
  it('returns Polish when lang=pl', () => {
    expect(localized({ pl: 'Rak piersi', en: 'Breast cancer' }, 'pl')).toBe('Rak piersi');
  });

  it('returns English when lang=en', () => {
    expect(localized({ pl: 'Rak piersi', en: 'Breast cancer' }, 'en')).toBe('Breast cancer');
  });

  it('falls back to English when requested lang missing', () => {
    expect(localized({ en: 'Breast cancer' }, 'de')).toBe('Breast cancer');
  });

  it('falls back to Polish when en also missing', () => {
    expect(localized({ pl: 'Rak piersi' }, 'de')).toBe('Rak piersi');
  });

  it('falls back to first available value', () => {
    expect(localized({ fr: 'Cancer du sein' }, 'de')).toBe('Cancer du sein');
  });

  it('returns empty string for undefined', () => {
    expect(localized(undefined, 'pl')).toBe('');
  });

  it('returns empty string for empty object', () => {
    expect(localized({}, 'pl')).toBe('');
  });
});

describe('localizedList', () => {
  it('returns localized array', () => {
    const list = [
      { pl: 'Jeden', en: 'One' },
      { pl: 'Dwa', en: 'Two' },
    ];
    expect(localizedList(list, 'pl')).toEqual(['Jeden', 'Dwa']);
    expect(localizedList(list, 'en')).toEqual(['One', 'Two']);
  });

  it('returns empty array for undefined', () => {
    expect(localizedList(undefined, 'pl')).toEqual([]);
  });
});
