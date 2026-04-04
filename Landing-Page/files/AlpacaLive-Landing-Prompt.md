# PROMPT DLA CLAUDE CODE — Integracja Landing Page AlpacaLive z PL/EN

Nazwa aplikacji została już zmieniona na AlpacaLive. Teraz dodaj landing page jako stronę główną.

W repo znajduje się plik `alpacalive-landing-v2.html` — gotowy landing page z przełącznikiem PL/EN i Google Material Symbols Rounded (filled).

---

## ZADANIE 1: Dodaj landing page jako "/" a aplikację przenieś na "/app"

### Struktura routingu:
- `/` → Landing page (opis aplikacji, CTA "Launch AlpacaLive" kieruje do /app)
- `/app` → Aplikacja (chat, kalendarz, dane, obrazowanie, ustawienia)

### Jeśli Next.js App Router:

Utwórz `app/(landing)/page.tsx` — przepisz `alpacalive-landing-v2.html` na React/JSX:
- Style: Tailwind klasy LUB CSS module `landing.module.css`
- Zachowaj WSZYSTKO: sekcje, kolory, animacje, przełącznik PL/EN, Material Symbols
- Logo: `import Image from 'next/image'` → `<Image src="/logo.png" />`
- Linki do app: `import Link from 'next/link'` → `<Link href="/app">`
- Przełącznik języka: `const [lang, setLang] = useState(() => typeof window !== 'undefined' ? localStorage.getItem('alpacalive-lang') || 'en' : 'en')`
- Reveal on scroll: `useEffect` z `IntersectionObserver`
- Nav scroll: `useEffect` z `scroll` event listener

Utwórz `app/(landing)/layout.tsx` — minimalny, BEZ tab baru:
```tsx
export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

Przenieś aplikację do `app/(app)/`:
- `app/(app)/page.tsx` ← obecna strona główna aplikacji
- `app/(app)/layout.tsx` ← layout z headerem i tab barem
- Wszystkie istniejące pliki aplikacji w tej grupie

### Jeśli to zbyt skomplikowane — Opcja B:
Skopiuj `alpacalive-landing-v2.html` do `public/index.html`.
Zmień routing aplikacji na `/app`. Landing serwowany statycznie.

---

## ZADANIE 2: Fonty i ikony w root layout

W `app/layout.tsx` dodaj:

```html
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,400,1,0" rel="stylesheet">
```

Material Symbols styl (dodaj do globalnego CSS):
```css
.material-symbols-rounded {
  font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  vertical-align: middle;
}
```

---

## ZADANIE 3: Logo i ikony PWA

Upewnij się że istnieją:
- `public/logo.png` — oryginał lawendowej alpaki
- `public/icon-192.png` — 192x192
- `public/icon-512.png` — 512x512

Jeśli brak ikon, wygeneruj:
```bash
npx sharp-cli -i public/logo.png -o public/icon-192.png resize 192 192
npx sharp-cli -i public/logo.png -o public/icon-512.png resize 512 512
```

---

## ZADANIE 4: Manifest PWA

```json
{
  "name": "AlpacaLive",
  "short_name": "AlpacaLive",
  "description": "Your companion through cancer treatment",
  "start_url": "/app",
  "display": "standalone",
  "background_color": "#faf8ff",
  "theme_color": "#7c5cc9",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

---

## ZADANIE 5: Commit i push

```bash
git add -A
git commit -m "Dodaj: landing page AlpacaLive z PL/EN i Material Symbols

- Landing page na '/' z przełącznikiem PL/EN
- Google Material Symbols Rounded (filled) zamiast emoji
- 9 sekcji: Hero, Problem, Features, How it works, Devices, Privacy, Open Source, CTA, Footer
- Aplikacja przeniesiona na '/app'
- Manifest PWA start_url: /app, theme_color: #7c5cc9"

git push origin main
```
