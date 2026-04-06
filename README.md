> **IMPORTANT LEGAL DISCLAIMER**
>
> AlpacaLive is a tool for analyzing data provided by the user.
> **It is NOT a medical device, does NOT make diagnoses, does NOT recommend medications or supplements.**
> Information displayed in the app is based on user data and published scientific literature.
> All health-related decisions should be made solely in consultation with your treating physician.
> The app creators bear no responsibility for health decisions made based on information from the app.
> Full disclaimer: [DISCLAIMER.md](DISCLAIMER.md) | [TERMS.md](TERMS.md)

# AlpacaLive — Holistic Oncology Support System

**A free, open-source web app (PWA) supporting cancer patients and their caregivers in analyzing health data during chemotherapy.**

---

## What Makes AlpacaLive Different

| Feature | AlpacaLive | Other Oncology Apps |
|---------|-----------|---------------------|
| Health journal | Conversation with an AI agent | Manual forms |
| Blood results | Photo → automatic analysis | Manual entry |
| Prediction | Predicts well-being by chemo cycle | None |
| Drug interactions | Dynamic CYP450 database | None |
| Imaging | RTG/CT/PET analysis with RECIST | None |
| Privacy | PII Sanitizer — personal data never leaves your phone | Varies |
| Code | Open source, AGPL-3.0 | Closed |

## Quick Start

```bash
git clone https://github.com/Domingo007/AlpacaLive.git
cd AlpacaLive
npm install
npm run dev
```

Requirements: Node.js 18+, [Anthropic API key](https://console.anthropic.com/) (optional — the app works in demo mode without a key)

### Install on Your Phone
1. Open in your browser (Safari/Chrome)
2. **iPhone:** Share → "Add to Home Screen"
3. **Android:** Menu → "Add to Home Screen"
4. Enter your API key in settings

### Deploy Your Own Instance
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Domingo007/AlpacaLive)

## Architecture

```
AlpacaLive (100% local — no cloud)
├── PWA (Vite + React + TypeScript + Tailwind)
├── Data (IndexedDB via Dexie.js — on device)
├── AI Agent (Claude API — user's key)
│   ├── PII Sanitizer → filters personal data
│   ├── Medical Skill → comprehensive oncology knowledge
│   ├── Data Extractor → parses responses
│   └── Vision API → analyzes photos of results and imaging
└── No backend / no analytics / no ads
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Vite + React 18 + TypeScript |
| Styles | Tailwind CSS |
| Database | IndexedDB via Dexie.js |
| AI | Anthropic Claude API (claude-sonnet) |
| Charts | Recharts |
| PDF Reports | jsPDF |
| PWA | vite-plugin-pwa + Workbox |
| Deploy | Vercel |

## How to Contribute

We're looking for **patients** (your experience with chemo is invaluable!), **developers**, **doctors**, and **translators**. Read [CONTRIBUTING.md](CONTRIBUTING.md).

## Medical Documentation

- [Medical Knowledge Base](docs/MEDICAL_KNOWLEDGE.md) — supplements, interactions, patterns
- [Compatible Wearables](docs/wearables.md) — ranking for cancer patients

## Privacy

All data is stored locally in IndexedDB on the user's device. The only external communication is queries to the Claude API — before sending, personal data is automatically replaced with placeholders (`[PATIENT]`, `[SSN]`, etc.). Details in [SECURITY.md](SECURITY.md).

## License

AGPL-3.0 — see [LICENSE](LICENSE)

The code is open. You can use, modify, and distribute it under the terms of AGPL-3.0.
If you modify the code and make it available as a service (e.g., SaaS) — you must release your changes under the same license.

Interested in a commercial license (without AGPL requirements)? Contact: [gravitydesigne@gmail.com](mailto:gravitydesigne@gmail.com)

## Contact

**Dominik Gaweł** · [Gravity Design](https://www.gravitydesign.pl/)
Email: [gravitydesigne@gmail.com](mailto:gravitydesigne@gmail.com)
GitHub: [github.com/Domingo007](https://github.com/Domingo007)
