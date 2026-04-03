> **WAŻNE ZASTRZEŻENIE PRAWNE**
>
> AlpakaLive jest narzędziem do analizy danych dostarczonych przez użytkownika.
> **NIE jest wyrobem medycznym, NIE stawia diagnoz, NIE zaleca leków ani suplementów.**
> Informacje wyświetlane w aplikacji opierają się na danych użytkownika i opublikowanej literaturze naukowej.
> Wszelkie decyzje dotyczące zdrowia powinny być podejmowane wyłącznie w konsultacji z lekarzem prowadzącym.
> Twórcy aplikacji nie ponoszą odpowiedzialności za decyzje zdrowotne podjęte na podstawie informacji z aplikacji.
> Pełne zastrzeżenie: [DISCLAIMER.md](DISCLAIMER.md) | [TERMS.md](TERMS.md)

# AlpakaLive — Holistyczny System Wsparcia Onkologicznego

**Darmowa, open-source aplikacja webowa (PWA) wspierająca pacjentów onkologicznych i ich opiekunów w analizie danych zdrowotnych podczas chemioterapii.**

---

## Co wyróżnia AlpakaLive

| Funkcja | AlpakaLive | Inne apki onkologiczne |
|---------|-----------|----------------------|
| Dziennik zdrowia | Rozmowa z agentem AI | Ręczne formularze |
| Wyniki krwi | Zdjęcie → automatyczna analiza | Ręczne wpisywanie |
| Predykcja | Przewiduje samopoczucie wg cyklu chemii | Brak |
| Interakcje leków | Dynamiczna baza CYP450 | Brak |
| Obrazowanie | Analiza RTG/CT/PET z RECIST | Brak |
| Prywatność | PII Sanitizer — dane osobowe nie opuszczają telefonu | Różnie |
| Kod | Open source, MIT | Zamknięty |

## Szybki start

```bash
git clone https://github.com/Domingo007/AlpakaLive.git
cd AlpakaLive
npm install
npm run dev
```

Wymagania: Node.js 18+, [klucz API Anthropic](https://console.anthropic.com/) (opcjonalny — aplikacja działa w trybie demo bez klucza)

### Instalacja na telefonie
1. Otwórz w przeglądarce (Safari/Chrome)
2. **iPhone:** Udostępnij → "Dodaj do ekranu początkowego"
3. **Android:** Menu → "Dodaj do ekranu głównego"
4. Wpisz klucz API w ustawieniach

### Deploy własnej instancji
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Domingo007/AlpakaLive)

## Architektura

```
AlpakaLive (100% lokalne — brak chmury)
├── PWA (Vite + React + TypeScript + Tailwind)
├── Dane (IndexedDB via Dexie.js — na urządzeniu)
├── AI Agent (Claude API — klucz użytkownika)
│   ├── PII Sanitizer → filtruje dane osobowe
│   ├── Medical Skill → pełna wiedza onkologiczna
│   ├── Data Extractor → parsuje odpowiedzi
│   └── Vision API → analiza zdjęć wyników i obrazowania
└── Brak backendu / brak analytics / brak reklam
```

## Stos technologiczny

| Warstwa | Technologia |
|---------|-------------|
| Framework | Vite + React 18 + TypeScript |
| Style | Tailwind CSS |
| Baza danych | IndexedDB via Dexie.js |
| AI | Anthropic Claude API (claude-sonnet) |
| Wykresy | Recharts |
| Raporty PDF | jsPDF |
| PWA | vite-plugin-pwa + Workbox |
| Deploy | Vercel |

## Jak dołączyć

Szukamy **pacjentów** (Twoje doświadczenie z chemią jest bezcenne!), **programistów**, **lekarzy** i **tłumaczy**. Przeczytaj [CONTRIBUTING.md](CONTRIBUTING.md).

## Dokumentacja medyczna

- [Baza wiedzy medycznej](docs/MEDICAL_KNOWLEDGE.md) — suplementy, interakcje, wzorce
- [Kompatybilne opaski](docs/wearables.md) — ranking dla pacjentów onkologicznych

## Prywatność

Wszystkie dane przechowywane lokalnie w IndexedDB na urządzeniu użytkownika. Jedyna komunikacja zewnętrzna to zapytania do Claude API — przed wysłaniem dane osobowe są automatycznie zastępowane placeholderami (`[PACJENT]`, `[PESEL]` itp.). Szczegóły w [SECURITY.md](SECURITY.md).

## Licencja

MIT — zobacz [LICENSE](LICENSE)
