# Polityka bezpieczeństwa

## Prywatność pacjenta — priorytet nr 1

- Wszystkie dane przechowywane LOKALNIE (IndexedDB)
- Dane osobowe (PESEL, nazwisko, adres) filtrowane przez PII Sanitizer PRZED wysłaniem do API
- Brak backendu, chmury, analytics, cookies śledzących
- Klucz API przechowywany lokalnie na urządzeniu

## Zgłaszanie luk

Jeśli znajdziesz lukę — szczególnie taką która mogłaby ujawnić dane pacjenta:

1. **NIE** otwieraj publicznego Issue
2. Otwórz Issue z labelem `security` z OGÓLNYM opisem (bez szczegółów exploitu)
3. Lub skontaktuj się bezpośrednio z maintainerem: [gravitydesigne@gmail.com](mailto:gravitydesigne@gmail.com)

Odpowiedź w ciągu 48h.

## Maintainer

**Dominik Gaweł** · [Gravity Design](https://www.gravitydesign.pl/) · [gravitydesigne@gmail.com](mailto:gravitydesigne@gmail.com)
