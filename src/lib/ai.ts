import type { ChatMessage, MessageContent } from '@/types';
import { PIISanitizer, IMAGE_PII_INSTRUCTION } from './pii-sanitizer';
import type { PIIData } from '@/types';

interface AIConfig {
  apiKey: string;
  systemPrompt: string;
  piiData?: PIIData;
}

interface AIResponse {
  content: string;
  rawContent?: string;
}

const MOCK_RESPONSES: Record<string, string> = {
  default: 'Dzień dobry! Jestem Twoim agentem medycznym AlpakaLive. Jak się dziś czujesz? Opowiedz mi o swoim samopoczuciu — energia, ból, nudności, nastrój.',
  morning: 'Dzień dobry! Jak się dzisiaj czujesz po przebudzeniu?\n\nPowiedz mi o:\n- Energia (1-10)\n- Ból (0-10)\n- Nudności (0-10)\n- Jak spałaś/spałeś?',
  evening: 'Czas na wieczorne podsumowanie. Jak minął dzień?\n\nOpowiedz o:\n- Energia pod koniec dnia\n- Co jadłaś/jadłeś?\n- Czy brałaś/brałeś suplementy?\n- Jak ogólnie nastrój?',
  chemo: 'Rozumiem, że miałeś/miała dziś chemię. To ważne żeby monitorować jak się czujesz.\n\nPowiedz mi:\n- Jakie leki podano?\n- Jak się czujesz teraz? (nudności, zmęczenie)\n- Czy jesteś dobrze nawodniona/y?',
  report: '## Raport dla lekarza\n\n**Okres:** ostatnie 7 dni\n\n**Trendy:**\n- Energia: brak danych (tryb demo)\n- Ból: brak danych\n- Waga: brak danych\n\n**Alerty:** Brak danych do analizy\n\n*Aby uzyskać pełny raport, dodaj klucz API w ustawieniach i wprowadź dane przez dziennik.*',
  prediction: '**Predykcja** wymaga minimum 7 dni danych dziennika i 2 cykli chemii.\n\nZacznij od codziennego raportowania samopoczucia — po zebraniu wystarczającej ilości danych, będę mógł przewidywać Twoje samopoczucie.',
  imaging: 'Analiza obrazowania wymaga klucza API Claude z obsługą Vision.\n\nGdy dodasz klucz API, będę mógł:\n- Analizować zdjęcia RTG, CT, PET, MRI\n- Porównywać z poprzednimi badaniami\n- Śledzić zmiany rozmiarów guza (RECIST)',
};

function getMockResponse(userMessage: string): string {
  const lower = typeof userMessage === 'string' ? userMessage.toLowerCase() : '';
  if (lower.includes('raport') || lower.includes('lekarz')) return MOCK_RESPONSES.report;
  if (lower.includes('predykcja') || lower.includes('prognoza') || lower.includes('przewiduj')) return MOCK_RESPONSES.prediction;
  if (lower.includes('obrazowan') || lower.includes('rtg') || lower.includes('tomografi')) return MOCK_RESPONSES.imaging;
  if (lower.includes('chemi') || lower.includes('chemiotera')) return MOCK_RESPONSES.chemo;
  if (lower.includes('rano') || lower.includes('pobudz') || lower.includes('dzien dobry')) return MOCK_RESPONSES.morning;
  if (lower.includes('wiecz') || lower.includes('koniec dnia') || lower.includes('dobranoc')) return MOCK_RESPONSES.evening;

  return `Dzięki za informacje! W trybie demo nie mogę w pełni analizować danych. Dodaj klucz API Anthropic w ustawieniach, żeby odblokować pełną funkcjonalność agenta.\n\nNa razie mogę Ci pomóc poruszać się po aplikacji — sprawdź zakładki Dane, Obrazowanie i Ustawienia.`;
}

export async function sendMessage(
  messages: ChatMessage[],
  config: AIConfig,
): Promise<AIResponse> {
  if (!config.apiKey) {
    const lastMsg = messages[messages.length - 1];
    const userText = typeof lastMsg?.content === 'string' ? lastMsg.content : '';
    return { content: getMockResponse(userText) };
  }

  const sanitizer = config.piiData ? new PIISanitizer(config.piiData) : null;

  const apiMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => {
      let content: string | MessageContent[];
      if (typeof m.content === 'string') {
        content = sanitizer ? sanitizer.sanitizeOutgoing(m.content) : m.content;
      } else {
        content = m.content.map(c => {
          if (c.type === 'text') {
            return { ...c, text: sanitizer ? sanitizer.sanitizeOutgoing(c.text) : c.text };
          }
          return c;
        });
      }
      return { role: m.role, content };
    });

  const systemPrompt = sanitizer
    ? sanitizer.sanitizeOutgoing(config.systemPrompt)
    : config.systemPrompt;

  const hasImages = messages.some(
    m => Array.isArray(m.content) && m.content.some(c => c.type === 'image'),
  );

  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt + (hasImages ? '\n\n' + IMAGE_PII_INSTRUCTION : ''),
    messages: apiMessages,
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error ${response.status}: ${error}`);
  }

  const data = await response.json();
  const rawContent = data.content?.[0]?.text || 'Brak odpowiedzi.';
  const content = sanitizer ? sanitizer.restoreIncoming(rawContent) : rawContent;

  return { content, rawContent };
}

export function getWelcomeMessage(): string {
  return MOCK_RESPONSES.default;
}
