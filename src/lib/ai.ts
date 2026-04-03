import type { ChatMessage, MessageContent } from '@/types';
import { PIISanitizer, IMAGE_PII_INSTRUCTION } from './pii-sanitizer';
import type { PIIData } from '@/types';
import { sendToAI, getProviderLabel, type AIProvider, type AIMessage, type AIMessageContent } from './ai-provider';

export interface AIConfig {
  apiKey: string;
  provider: AIProvider;
  systemPrompt: string;
  piiData?: PIIData;
}

export interface AIResponseResult {
  content: string;
  rawContent?: string;
  provider: AIProvider;
  model: string;
  piiRemoved: number;
}

const MOCK_RESPONSES: Record<string, string> = {
  default: 'Dzień dobry! Jestem narzędziem do analizy danych zdrowotnych AlpakaLive. Jak się dziś czujesz? Opowiedz mi o swoim samopoczuciu — energia, ból, nudności, nastrój.',
  morning: 'Dzień dobry! Jak się dzisiaj czujesz po przebudzeniu?\n\nPowiedz mi o:\n- Energia (1-10)\n- Ból (0-10)\n- Nudności (0-10)\n- Jak spałaś/spałeś?',
  evening: 'Czas na wieczorne podsumowanie. Jak minął dzień?\n\nOpowiedz o:\n- Energia pod koniec dnia\n- Co jadłaś/jadłeś?\n- Czy brałaś/brałeś suplementy?\n- Jak ogólnie nastrój?',
  chemo: 'Rozumiem, że miałeś/miała dziś chemię. To ważne żeby monitorować jak się czujesz.\n\nPowiedz mi:\n- Jakie leki podano?\n- Jak się czujesz teraz? (nudności, zmęczenie)\n- Czy jesteś dobrze nawodniona/y?',
  report: '## Raport dla lekarza\n\n**Okres:** ostatnie 7 dni\n\n**Trendy:**\n- Energia: brak danych (tryb demo)\n- Ból: brak danych\n- Waga: brak danych\n\n**Alerty:** Brak danych do analizy\n\n*Aby uzyskać pełny raport, dodaj klucz API w ustawieniach i wprowadź dane przez dziennik.*',
  prediction: '**Predykcja** wymaga minimum 7 dni danych dziennika i 2 cykli chemii.\n\nZacznij od codziennego raportowania samopoczucia — po zebraniu wystarczającej ilości danych, będę mógł przewidywać Twoje samopoczucie.',
  imaging: 'Analiza obrazowania wymaga klucza API.\n\nGdy dodasz klucz API, będę mógł:\n- Analizować zdjęcia RTG, CT, PET, MRI\n- Porównywać z poprzednimi badaniami\n- Śledzić zmiany rozmiarów guza (RECIST)',
};

function getMockResponse(userMessage: string): string {
  const lower = typeof userMessage === 'string' ? userMessage.toLowerCase() : '';
  if (lower.includes('raport') || lower.includes('lekarz')) return MOCK_RESPONSES.report;
  if (lower.includes('predykcja') || lower.includes('prognoza') || lower.includes('przewiduj')) return MOCK_RESPONSES.prediction;
  if (lower.includes('obrazowan') || lower.includes('rtg') || lower.includes('tomografi')) return MOCK_RESPONSES.imaging;
  if (lower.includes('chemi') || lower.includes('chemiotera')) return MOCK_RESPONSES.chemo;
  if (lower.includes('rano') || lower.includes('pobudz') || lower.includes('dzien dobry')) return MOCK_RESPONSES.morning;
  if (lower.includes('wiecz') || lower.includes('koniec dnia') || lower.includes('dobranoc')) return MOCK_RESPONSES.evening;

  return `Dzięki za informacje! W trybie demo nie mogę w pełni analizować danych. Dodaj klucz API w ustawieniach, żeby odblokować pełną funkcjonalność.\n\nNa razie mogę Ci pomóc poruszać się po aplikacji — sprawdź zakładki Kalendarz, Dane, Obrazowanie i Ustawienia.`;
}

export async function sendMessage(
  messages: ChatMessage[],
  config: AIConfig,
): Promise<AIResponseResult> {
  const provider = config.provider || 'anthropic';

  if (!config.apiKey) {
    const lastMsg = messages[messages.length - 1];
    const userText = typeof lastMsg?.content === 'string' ? lastMsg.content : '';
    return { content: getMockResponse(userText), provider, model: 'demo', piiRemoved: 0 };
  }

  const sanitizer = config.piiData ? new PIISanitizer(config.piiData) : null;
  let piiRemoved = 0;

  // Convert ChatMessages to AIMessages with PII sanitization
  const hasImages = messages.some(m => Array.isArray(m.content) && m.content.some(c => c.type === 'image'));

  const aiMessages: AIMessage[] = messages
    .filter(m => m.role !== 'system')
    .map(m => {
      if (typeof m.content === 'string') {
        const sanitized = sanitizer ? sanitizer.sanitizeOutgoing(m.content) : m.content;
        if (sanitized !== m.content) piiRemoved++;
        return { role: m.role, content: sanitized };
      }
      const parts: AIMessageContent[] = m.content.map(c => {
        if (c.type === 'text') {
          const sanitized = sanitizer ? sanitizer.sanitizeOutgoing(c.text) : c.text;
          if (sanitized !== c.text) piiRemoved++;
          return { type: 'text' as const, text: sanitized };
        }
        if (c.type === 'image') {
          return { type: 'image' as const, mimeType: c.source.media_type, data: c.source.data };
        }
        return { type: 'text' as const, text: '' };
      });
      return { role: m.role, content: parts };
    });

  const systemPrompt = (sanitizer ? sanitizer.sanitizeOutgoing(config.systemPrompt) : config.systemPrompt)
    + (hasImages ? '\n\n' + IMAGE_PII_INSTRUCTION : '');

  console.log(`[PII Sanitizer] Usunięto ${piiRemoved} dopasowań`);
  console.log(`[API] Wysyłam do: ${provider}`);

  const result = await sendToAI(
    { provider, apiKey: config.apiKey },
    systemPrompt,
    aiMessages,
    hasImages,
  );

  console.log(`[API] Odpowiedź: ${result.text.length} znaków, model: ${result.model}`);

  const content = sanitizer ? sanitizer.restoreIncoming(result.text) : result.text;

  return {
    content,
    rawContent: result.text,
    provider: result.provider,
    model: result.model,
    piiRemoved,
  };
}

export function getWelcomeMessage(): string {
  return MOCK_RESPONSES.default;
}
