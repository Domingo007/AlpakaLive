import { describe, it, expect } from 'vitest';
import { PIISanitizer } from '../lib/pii-sanitizer';
import type { PIIData } from '@/types';

const testPII: PIIData = {
  firstName: 'Anna',
  lastName: 'Kowalska',
  pesel: '82010112345',
  address: 'ul. Przykładowa 1, 00-001 Warszawa',
  phone: '+48 500 123 456',
  email: 'anna.kowalska@example.com',
  hospitalIds: ['WCO-2024-1234'],
};

describe('PIISanitizer — sanitizeOutgoing', () => {
  const sanitizer = new PIISanitizer(testPII);

  it('replaces first name', () => {
    expect(sanitizer.sanitizeOutgoing('Pacjentka Anna')).toContain('[IMIE]');
    expect(sanitizer.sanitizeOutgoing('Pacjentka Anna')).not.toContain('Anna');
  });

  it('replaces last name', () => {
    expect(sanitizer.sanitizeOutgoing('Pani Kowalska')).toContain('[NAZWISKO]');
    expect(sanitizer.sanitizeOutgoing('Pani Kowalska')).not.toContain('Kowalska');
  });

  it('replaces full name', () => {
    const result = sanitizer.sanitizeOutgoing('Wyniki pacjentki Anna Kowalska');
    expect(result).toContain('[PACJENT]');
    expect(result).not.toContain('Anna Kowalska');
  });

  it('replaces reversed name', () => {
    const result = sanitizer.sanitizeOutgoing('Kowalska Anna - karta');
    expect(result).toContain('[PACJENT]');
  });

  it('replaces PESEL', () => {
    const result = sanitizer.sanitizeOutgoing('PESEL: 82010112345');
    expect(result).toContain('[PESEL]');
    expect(result).not.toContain('82010112345');
  });

  it('replaces phone number', () => {
    const result = sanitizer.sanitizeOutgoing('Tel: +48 500 123 456');
    expect(result).toContain('[TELEFON]');
    expect(result).not.toContain('500 123 456');
  });

  it('replaces email', () => {
    const result = sanitizer.sanitizeOutgoing('Email: anna.kowalska@example.com');
    expect(result).toContain('[EMAIL]');
    expect(result).not.toContain('anna.kowalska@example.com');
  });

  it('replaces hospital ID', () => {
    const result = sanitizer.sanitizeOutgoing('Nr pacjenta: WCO-2024-1234');
    expect(result).toContain('[NR_PACJENTA]');
    expect(result).not.toContain('WCO-2024-1234');
  });

  it('replaces postal code in standalone text', () => {
    // Note: when postal code is part of the address PII, [ADRES_FRAGMENT] takes priority
    // This tests the regex fallback for postal codes not in PII address
    const result = sanitizer.sanitizeOutgoing('Kod: 30-500');
    expect(result).toContain('[KOD_POCZTOWY]');
  });

  it('is case insensitive for names', () => {
    expect(sanitizer.sanitizeOutgoing('ANNA')).toContain('[IMIE]');
    expect(sanitizer.sanitizeOutgoing('anna')).toContain('[IMIE]');
  });

  it('preserves medical data', () => {
    const medical = 'WBC 4.5 tys/ul, HGB 11.2 g/dl, PLT 180 tys/ul';
    expect(sanitizer.sanitizeOutgoing(medical)).toBe(medical);
  });
});

describe('PIISanitizer — restoreIncoming', () => {
  const sanitizer = new PIISanitizer(testPII);

  it('restores first name', () => {
    expect(sanitizer.restoreIncoming('Wyniki [IMIE]')).toContain('Anna');
  });

  it('restores full name', () => {
    expect(sanitizer.restoreIncoming('Karta [PACJENT]')).toContain('Anna Kowalska');
  });

  it('does not modify text without placeholders', () => {
    const text = 'WBC 4.5, HGB 11.2';
    expect(sanitizer.restoreIncoming(text)).toBe(text);
  });
});

describe('PIISanitizer — sanitizeObject', () => {
  const sanitizer = new PIISanitizer(testPII);

  it('sanitizes object values', () => {
    const obj = { note: 'Pacjentka Anna Kowalska, PESEL 82010112345' };
    const result = sanitizer.sanitizeObject(obj);
    expect(result.note).not.toContain('Anna');
    expect(result.note).not.toContain('82010112345');
    expect(result.note).toContain('[PACJENT]');
    expect(result.note).toContain('[PESEL]');
  });
});

describe('PIISanitizer — edge cases', () => {
  it('handles empty PII gracefully', () => {
    const sanitizer = new PIISanitizer({
      firstName: '', lastName: '', pesel: '', address: '', phone: '', email: '', hospitalIds: [],
    });
    expect(sanitizer.sanitizeOutgoing('Hello world')).toBe('Hello world');
  });

  it('handles partial PII', () => {
    const sanitizer = new PIISanitizer({
      firstName: 'Jan', lastName: '', pesel: '', address: '', phone: '', email: '', hospitalIds: [],
    });
    const result = sanitizer.sanitizeOutgoing('Pacjent Jan');
    expect(result).toContain('[IMIE]');
  });
});
