import type { PIIData } from '@/types';

interface PIIMapping {
  original: string;
  placeholder: string;
  type: 'name' | 'pesel' | 'address' | 'phone' | 'email' | 'id_number';
}

export class PIISanitizer {
  private mappings: PIIMapping[] = [];

  constructor(pii: PIIData) {
    this.buildMappings(pii);
  }

  private buildMappings(pii: PIIData) {
    const { firstName, lastName, pesel, address, phone, email } = pii;

    if (firstName) {
      this.addNameVariants(firstName, '[IMIE]', 'name');
    }
    if (lastName) {
      this.addNameVariants(lastName, '[NAZWISKO]', 'name');
    }
    if (firstName && lastName) {
      this.mappings.push(
        { original: `${firstName} ${lastName}`, placeholder: '[PACJENT]', type: 'name' },
        { original: `${lastName} ${firstName}`, placeholder: '[PACJENT]', type: 'name' },
      );
    }
    if (pesel) {
      this.mappings.push(
        { original: pesel, placeholder: '[PESEL]', type: 'pesel' },
        { original: pesel.replace(/(\d{2})(\d{2})(\d{2})(\d{5})/, '$1-$2-$3-$4'), placeholder: '[PESEL]', type: 'pesel' },
        { original: pesel.replace(/(\d{2})(\d{2})(\d{2})(\d{5})/, '$1 $2 $3 $4'), placeholder: '[PESEL]', type: 'pesel' },
      );
    }
    if (address) {
      this.mappings.push({ original: address, placeholder: '[ADRES]', type: 'address' });
      address
        .split(',')
        .map(part => part.trim())
        .filter(part => part.length > 3)
        .forEach(part => {
          this.mappings.push({ original: part, placeholder: '[ADRES_FRAGMENT]', type: 'address' });
        });
    }
    if (phone) {
      this.mappings.push(
        { original: phone, placeholder: '[TELEFON]', type: 'phone' },
        { original: phone.replace(/\s/g, ''), placeholder: '[TELEFON]', type: 'phone' },
        { original: phone.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3'), placeholder: '[TELEFON]', type: 'phone' },
      );
    }
    if (email) {
      this.mappings.push(
        { original: email, placeholder: '[EMAIL]', type: 'email' },
        { original: email.toLowerCase(), placeholder: '[EMAIL]', type: 'email' },
      );
    }

    for (const id of pii.hospitalIds) {
      if (id) this.mappings.push({ original: id, placeholder: '[NR_PACJENTA]', type: 'id_number' });
    }

    this.mappings.sort((a, b) => b.original.length - a.original.length);
  }

  private addNameVariants(name: string, placeholder: string, type: PIIMapping['type']) {
    this.mappings.push(
      { original: name, placeholder, type },
      { original: name.toLowerCase(), placeholder, type },
      { original: name.toUpperCase(), placeholder, type },
    );
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  sanitizeOutgoing(text: string): string {
    let sanitized = text;
    for (const mapping of this.mappings) {
      const regex = new RegExp(this.escapeRegex(mapping.original), 'gi');
      sanitized = sanitized.replace(regex, mapping.placeholder);
    }
    // PESEL pattern
    sanitized = sanitized.replace(/\b\d{2}[0-3]\d[0-3]\d\d{5}\b/g, '[PESEL]');
    // Polish phone
    sanitized = sanitized.replace(/(?:\+48\s?)?(?:\d[\s-]?){9}\b/g, '[TELEFON]');
    // Email
    sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');
    // Polish postal code
    sanitized = sanitized.replace(/\b\d{2}-\d{3}\b/g, '[KOD_POCZTOWY]');

    return sanitized;
  }

  restoreIncoming(text: string): string {
    let restored = text;
    for (const mapping of this.mappings) {
      restored = restored.replaceAll(mapping.placeholder, mapping.original);
    }
    return restored;
  }

  sanitizeObject<T>(obj: T): T {
    const json = JSON.stringify(obj);
    return JSON.parse(this.sanitizeOutgoing(json));
  }
}

export const IMAGE_PII_INSTRUCTION = `
INSTRUKCJA PRYWATNOŚCI DLA ZDJĘCIA:
Na tym zdjęciu mogą być widoczne dane osobowe pacjenta (imię, nazwisko, PESEL, adres, numer pacjenta).
NIGDY nie powtarzaj tych danych w odpowiedzi.
Wyciągnij WYŁĄCZNIE wartości medyczne: wyniki badań, markery, daty badań.
Jeśli w wynikach widnieje nazwisko lekarza — możesz je podać (to nie dane pacjenta).
Wszelkie dane pacjenta z nagłówka dokumentu — ZIGNORUJ i NIE CYTUJ.`;
