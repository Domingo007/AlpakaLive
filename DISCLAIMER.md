# Zastrzeżenie prawne — AlpakaLive

## Status prawny aplikacji

AlpakaLive jest aplikacją open source służącą do analizy danych zdrowotnych dostarczonych przez użytkownika.

**Aplikacja NIE jest:**
- Wyrobem medycznym w rozumieniu przepisów UE (MDR 2017/745) ani USA (FDA)
- Narzędziem diagnostycznym
- Substytutem porady medycznej, farmaceutycznej ani dietetycznej
- Certyfikowanym oprogramowaniem do wspomagania decyzji klinicznych

**Aplikacja JEST:**
- Narzędziem do gromadzenia, wizualizacji i analizy danych dostarczonych przez użytkownika
- Źródłem informacji opartych na opublikowanej literaturze naukowej (z podanymi źródłami)
- Narzędziem wspomagającym komunikację pacjent-lekarz (generowanie pytań, raportów)

## Odpowiedzialność

Twórcy, kontrybutorzy i opiekunowie projektu AlpakaLive:
- NIE ponoszą odpowiedzialności za decyzje zdrowotne podjęte na podstawie informacji wyświetlanych w aplikacji
- NIE gwarantują poprawności, kompletności ani aktualności informacji medycznych
- NIE zapewniają że analiza AI jest wolna od błędów
- NIE ponoszą odpowiedzialności za skutki zdrowotne wynikające z użytkowania aplikacji

## Analiza AI

Aplikacja wykorzystuje modele językowe AI (Claude, Anthropic) do analizy danych.
- Analiza AI może zawierać błędy, nieścisłości lub być nieaktualna
- Analiza obrazowania (RTG, CT, PET, MRI) przez AI NIE jest opisem radiologicznym i NIE może zastępować oceny lekarza
- Porównania z normami referencyjnymi mają charakter informacyjny, nie diagnostyczny
- AI nie ma dostępu do pełnej historii medycznej pacjenta — analizuje wyłącznie dane wprowadzone do aplikacji

## Suplementacja i leki

Informacje o suplementach, witaminach i substancjach eksperymentalnych:
- Pochodzą z opublikowanych badań naukowych (ze wskazaniem źródła i poziomu dowodów)
- NIE stanowią rekomendacji stosowania
- Mogą wchodzić w interakcje z lekami onkologicznymi, psychiatrycznymi i innymi
- Decyzja o zastosowaniu MUSI być podjęta w konsultacji z lekarzem onkologiem
- Dawki podawane w aplikacji to dawki stosowane w cytowanych badaniach, NIE zalecenia

## Przetwarzanie danych przez AI

AlpakaLive korzysta z zewnętrznych usług AI do analizy danych medycznych dostarczonych przez użytkownika:

**Dane przechowywane WYŁĄCZNIE na urządzeniu:**
- Imię, nazwisko, PESEL, adres, telefon, email
- Numery identyfikacyjne pacjenta
- Pełna historia danych i rozmów
- Zdjęcia dokumentów (kopie lokalne)

**Dane wysyłane do dostawcy AI (po filtracji PII Sanitizer):**
- Treść rozmów z agentem (bez danych osobowych)
- Wartości wyników badań (bez danych identyfikujących pacjenta)
- Zdjęcia dokumentów medycznych (mogą zawierać dane w nagłówku — agent jest instruowany aby je ignorować)
- Dane medyczne: diagnoza, leki, wyniki, dane z opaski

**PII Sanitizer** automatycznie usuwa dane osobowe z treści przed wysłaniem do API. Filtr zastępuje imię, nazwisko, PESEL, adres, telefon i email placeholderami (np. "[PACJENT]", "[PESEL]").

**Dostawcy AI:**
- Anthropic (Claude) — serwery w USA. Polityka: dane z API nie są używane do trenowania modeli.
- OpenAI (GPT) — serwery w USA. Polityka: dane z API (nie ChatGPT) nie są używane do trenowania.
- Google (Gemini) — serwery w USA/UE. Polityka: darmowy tier może być używany do trenowania.

**Uwaga dotycząca Gemini (darmowy tier):** Google może używać danych z darmowego API Gemini do ulepszania swoich modeli. Jeśli prywatność jest priorytetem, zalecamy Anthropic Claude lub OpenAI z płatnym API.

## Dane prywatne

- Dane osobowe (PESEL, imię, nazwisko, adres) przechowywane wyłącznie na urządzeniu użytkownika
- Dane medyczne wysyłane do API AI są filtrowane przez PII Sanitizer (usunięcie danych osobowych)
- Twórcy aplikacji nie mają dostępu do danych użytkowników
- Użytkownik ponosi odpowiedzialność za bezpieczeństwo swojego urządzenia i klucza API

## Prawo właściwe

Niniejsze zastrzeżenie podlega prawu Unii Europejskiej. W przypadku sporów właściwe są sądy państwa zamieszkania użytkownika.

## Akceptacja

Korzystanie z aplikacji AlpakaLive oznacza zapoznanie się z powyższym zastrzeżeniem i jego akceptację. Akceptacja jest wymagana przy pierwszym uruchomieniu aplikacji i rejestrowana z datą i godziną.
