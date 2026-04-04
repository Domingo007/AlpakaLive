# Baza wiedzy medycznej AlpacaLive

> **ZASTRZEŻENIE**
>
> Informacje w tym dokumencie pochodzą z opublikowanych badań naukowych i doświadczeń pacjentów.
> **NIE stanowią rekomendacji medycznych.** Przed podjęciem jakichkolwiek decyzji zdrowotnych
> na podstawie tych informacji skonsultuj się z lekarzem prowadzącym.
> Dawki podawane przy suplementach to dawki stosowane w cytowanych badaniach — nie zalecenia.

Każda informacja ma oznaczony **poziom dowodów** i **źródło**.
Społeczność może dodawać wiedzę przez Pull Request lub Issue.

## Podtypy raka piersi
Szczegółowa baza wiedzy o podtypach, leczeniu i różnicach regionalnych: [breast-cancer-subtypes.md](breast-cancer-subtypes.md)

## Poziomy dowodów
- 🟢 **Silne** — meta-analiza lub wiele RCT
- 🟡 **Umiarkowane** — jedno RCT lub badania obserwacyjne
- 🔴 **Przedkliniczne** — in vitro / in vivo
- 🔵 **Z doświadczenia pacjentów** — niezweryfikowane klinicznie ale cenne

## Suplementy — przegląd opublikowanych badań naukowych

**Poniższe informacje pochodzą z opublikowanych badań naukowych i NIE stanowią rekomendacji medycznych. Przed zastosowaniem jakiegokolwiek suplementu skonsultuj się z lekarzem onkologiem prowadzącym.**

| Substancja | Dawki w badaniach | Poziom dowodów | Uwagi |
|-----------|-------------------|----------------|-------|
| Witamina D3 | 2000-4000 IU/d | 🟢 | Cel: 40-60 ng/ml. Bezpieczna z chemią |
| L-Glutamina | 30g/d | 🟢 | Redukcja neuropatii (11/15 RCT+). Ochrona GI |
| Omega-3 EPA/DHA | 640mg 3x/d | 🟢 | 30% vs 70% neuropatii z paklitakselem (RCT) |
| Probiotyki | 10-20 mld CFU/d | 🟢 | L. rhamnosus GG. Meta-analiza 8 RCT |
| Żeń-szeń amerykański | 2000mg/d | 🟡 | ⚠️ Ryzyko z SSRI/SNRI (serotonina) |
| Kurkumina | 1-2g/d | 🟡 | Niska biodostępność. Forma z piperyną |
| Melatonina | 21mg/noc | 🟡 | ⚠️ Ostrożnie z trazodonem |
| Wlewy wit. C (IVC) | 25-75g IV | 🟡 | Tylko klinika. Wykluczyć G6PD. Nie w dzień chemii |
| Fenbendazol | 222-444mg/d | 🔴 | ⚠️ CYP3A4! Konkuruje z paklitakselem |
| Iwermektyna | eskalacja | 🔴 | Faza I/II ASCO 2025 NCT05318469 w TNBC |

### Substancje z opublikowanymi danymi o potencjalnych interakcjach:
- Antyoksydanty w dużych dawkach (wit. C doustna, E, A, CoQ10) — 41% wzrost ryzyka nawrotu (SWOG S0221)
- Żelazo w suplementach (bez potwierdzonej anemii)
- Wit. B12 w suplementach — gorsza DFS w SWOG S0221
- Dziurawiec — induktor CYP3A4, zmniejsza poziom chemii
- Resweratrol — może osłabiać paklitaksel

## Interakcje CYP450

| Lek | Substrat | Inhibitor | Induktor |
|-----|----------|-----------|----------|
| Paklitaksel | CYP3A4, CYP2C8 | - | - |
| Gemcytabina | - | słaby | - |
| Karboplatyna | - | - | - |
| Trazodon | CYP3A4, CYP2D6 | - | - |
| Wenlafaksyna | CYP2D6, CYP3A4 (minor) | CYP2D6 (słaby) | - |
| Fenbendazol | CYP3A4, CYP2C19 | - | - |
| Iwermektyna | CYP3A4 | CYP3A4 (słaby) | - |
| Dziurawiec | - | - | CYP3A4 (silny!) |

## Wzorce samopoczucia — z doświadczenia pacjentów

### Paklitaksel + Gemcytabina (cykl: pon-pon-tydzień wolny)
🔵 *Doświadczenie pacjentów — dodawajcie swoje!*
- Dzień 1-3 po podaniu: najgorsze (energia 2-4/10, nudności, brak apetytu)
- Dzień 4-7: powolna poprawa (energia 4-6/10)
- Tydzień wolny: najlepsza faza (energia 6-8/10), okno na aktywność

<!-- DODAJ SWOJE DOŚWIADCZENIE TUTAJ przez Pull Request -->

## Radioterapia — efekty uboczne per region

> **Informacje z opublikowanych badań. NIE stanowią rekomendacji. Konsultuj z lekarzem.**

| Region | Typowe efekty | Monitoruj |
|--------|--------------|-----------|
| Pierś | Toksyczność skóry, zmęczenie | Skóra (CTCAE), energia, HR/HRV (lewostronny → serce) |
| Głowa/szyja | Zapalenie śluzówek, dysfagia, suchość w ustach | Waga (trudności w jedzeniu), nawodnienie |
| Klatka piersiowa | Kaszel, zapalenie płuc popromienne | SpO2, kaszel, duszność |
| Brzuch/miednica | Nudności, biegunka | Nawodnienie, waga, częstość stolca |
| Mózg | Zmęczenie, nudności, ból głowy | Energia, nudności, objawy neurologiczne |
| Kości | Ból, zmęczenie | Ból (1-10), markery krwi |

## Immunoterapia — monitorowane irAE

> **Immunologiczne zdarzenia niepożądane (irAE) to efekty uboczne INNE niż chemioterapia. Wymagają specyficznego monitoringu.**

| irAE | Częstość | Objawy | Badania | Postępowanie wg CTCAE |
|------|---------|---------|---------|----------------------|
| Skóra | 30-40% | Wysypka, świąd | Obserwacja | 1-2: krem, 3+: steroidy |
| Tarczyca | 10-20% | Zmęczenie, wahania wagi | TSH, fT4 | 1-2: leczenie substytucyjne |
| Wątroba | 5-10% | Często bezobjawowe | ALT, AST, bilirubina | 2: wstrzymaj, 3+: steroidy |
| Płuca | 3-5% | Kaszel, duszność | SpO2, RTG/CT | 2+: wstrzymaj, steroidy |
| Jelita | 10-20% | Biegunka, ból brzucha | Kalprotektyna | 2+: wstrzymaj, steroidy |
| Serce | 1-2% | Ból w klatce, duszność | ECG, troponina, HR | KAŻDY: wstrzymaj, pilnie! |

## Terapia celowana — efekty uboczne per cel

| Cel | Lek (przykład) | Główne efekty | Monitoruj |
|-----|----------------|---------------|-----------|
| HER2 | Trastuzumab | Kardiotoksyczność | LVEF (echo), HR, duszność |
| CDK4/6 | Palbocyklib | Neutropenia, zmęczenie | WBC, neutrofile |
| PARP | Olaparib | Anemia, nudności | Hgb, MCV |
| mTOR | Everolimus | Zapalenie śluzówek, hiperglikemia | Glukoza, śluzówki jamy ustnej |
| PIK3CA | Alpelisib | Hiperglikemia, wysypka, biegunka | Glukoza, skóra |

## Hormonoterapia — długoterminowe efekty

| Typ | Lek (przykład) | Efekty | Monitoruj | Czas trwania |
|-----|----------------|--------|-----------|-------------|
| Inhibitor aromatazy | Letrozol | Bóle stawów, osteoporoza | Densytometria, ból | 5-10 lat |
| SERM | Tamoksyfen | Uderzenia gorąca, zakrzepy | Nastrój, objawy zakrzepowe | 5-10 lat |
| SERD | Fulwestrant | Ból w miejscu wstrzyknięcia | Miejscowe reakcje | Do progresji |
| Agonista GnRH | Goserelina | Uderzenia gorąca, osteoporoza | Densytometria, nastrój | Zależnie od schematu |

## Zabiegi chirurgiczne w onkologii

> **Informacje z opublikowanych badań. NIE stanowią rekomendacji. Konsultuj z lekarzem.**

### Mastektomia (usunięcie piersi)
- **Typy:** totalna, oszczędzająca skórę, oszczędzająca brodawkę, radykalna
- **Rekonwalescencja:** 4-8 tygodni. Ból, ograniczony ruch ręki, dreny 1-2 tygodnie
- **Rekonstrukcja:** natychmiastowa (implant lub płat) lub odroczona
- **Powikłania:** seroma, infekcja, ograniczony ruch barku, obrzęk limfatyczny
- **Dane z urządzeń:** RHR +5-15bpm przez 1-3 tyg. = normalne. Sen gorszy = ból/pozycja

### Usunięcie węzłów chłonnych
- **Biopsja węzła wartowniczego (SLNB):** 1-3 węzły, niskie ryzyko powikłań
- **Pełne usunięcie pachowe (ALND):** 10-20+ węzłów, ryzyko obrzęku limfatycznego
- **WAŻNE:** NIE mierzyć ciśnienia na ręce po stronie usunięcia węzłów!
- **Obrzęk limfatyczny:** może pojawić się tygodnie, miesiące lub LATA po operacji

### Usunięcie jajników (oophorectomy)
- **Skutki:** natychmiastowa menopauza chirurgiczna — uderzenia gorąca, nocne poty, bezsenność, wahania nastroju
- **Dane z urządzeń:** wzrosty temperatury w nocy = uderzenia gorąca (NIE infekcja!), zaburzenia snu = normalne
- **Densytometria kości** wskazana ze względu na spadek estrogenów

### Resekcja guza
- **Wątroba:** albumina może spaść, regeneracja 4-8 tyg.
- **Płuca:** SpO2 może być trwale niższe o 1-3% — ustal nowy baseline
- **Ból pooperacyjny** 5-8/10 przez 1-2 tyg. to norma

### Port-a-cath / PICC
- **Założenie:** ból w klatce/szyi 2-5 dni
- **Monitoruj:** gorączka + zaczerwienienie wokół portu = możliwa infekcja
- **Usunięcie:** po zakończeniu chemii, zabieg ambulatoryjny
