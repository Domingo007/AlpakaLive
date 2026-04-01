# AlpakaLive

Holistyczny System Wsparcia Pacjenta Onkologicznego — aplikacja PWA działająca lokalnie na telefonie.

## Funkcje

- **Chat z agentem AI** — codzienny dziennik zdrowia, analiza wyników, predykcje
- **Analiza wyników krwi** — rozpoznawanie ze zdjęć, porównanie z normami, alerty
- **Obrazowanie** — analiza RTG/CT/PET/MRI, śledzenie zmian guzów (RECIST 1.1)
- **Predykcje** — przewidywanie samopoczucia na podstawie wzorców z cykli chemii
- **Interakcje leków** — automatyczne sprawdzanie CYP450 między lekami onkologicznymi, psychiatrycznymi i suplementami
- **Harmonogram chemii** — fazy A/B/C cyklu, obsługa odroczeń
- **Ochrona prywatności** — dane osobowe (PESEL, nazwisko) nigdy nie opuszczają urządzenia

## Stos technologiczny

| Warstwa | Technologia |
|---------|-------------|
| Framework | Vite + React 18 + TypeScript |
| Style | Tailwind CSS |
| Baza danych | IndexedDB via Dexie.js |
| AI | Anthropic Claude API (claude-sonnet) |
| Wykresy | Recharts |
| PWA | vite-plugin-pwa + Workbox |
| Deploy | Vercel |

## Uruchomienie lokalne

```bash
npm install
npm run dev
```

Aplikacja dostępna pod `http://localhost:5173`

## Deploy

Podłącz repo do Vercel — konfiguracja w `vercel.json` jest gotowa.

## Instalacja na telefonie (PWA)

- **iPhone**: Safari → Udostępnij → Dodaj do ekranu początkowego
- **Android**: Chrome → Menu (⋮) → Zainstaluj aplikację

## Prywatność

Wszystkie dane przechowywane lokalnie w IndexedDB na urządzeniu użytkownika. Jedyna komunikacja zewnętrzna to zapytania do Claude API — przed wysłaniem dane osobowe są automatycznie zastępowane placeholderami (`[PACJENT]`, `[PESEL]` itp.).

## Licencja

MIT
