import { useState, useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage, PatientProfile } from '@/types';
import { getChatMessages, addChatMessage, getSettings, getPatient, getRecentDailyLogs, getRecentBloodWork, getRecentWearableData, getRecentMeals, getRecentChemo, getRecentImaging, getRecentPredictions } from '@/lib/db';
import { sendMessage, getWelcomeMessage } from '@/lib/ai';
import { buildSystemPrompt } from '@/lib/system-prompt';
import { extractDataFromResponse, saveExtractedData, cleanResponseFromTags } from '@/lib/data-extractor';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  async function loadMessages() {
    const msgs = await getChatMessages(50);
    if (msgs.length === 0) {
      const welcome: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: getWelcomeMessage(),
        timestamp: new Date(),
      };
      await addChatMessage(welcome);
      setMessages([welcome]);
    } else {
      setMessages(msgs);
    }
  }

  const send = useCallback(async (text: string, images?: { base64: string; mediaType: string }[]) => {
    setError(null);

    const content: ChatMessage['content'] = images && images.length > 0
      ? [
          { type: 'text' as const, text },
          ...images.map(img => ({
            type: 'image' as const,
            source: { type: 'base64' as const, media_type: img.mediaType, data: img.base64 },
          })),
        ]
      : text;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    await addChatMessage(userMessage);
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const settings = await getSettings();
      const patient = await getPatient();

      let systemPrompt = 'Jestes agentem medycznym AlpakaLive. Pomagasz pacjentowi onkologicznemu. Mow po polsku.';

      if (patient) {
        const [daily, blood, wearable, meals, chemo, imaging, predictions] = await Promise.all([
          getRecentDailyLogs(),
          getRecentBloodWork(),
          getRecentWearableData(),
          getRecentMeals(),
          getRecentChemo(),
          getRecentImaging(),
          getRecentPredictions(),
        ]);
        systemPrompt = buildSystemPrompt(patient, { daily, blood, wearable, meals, chemo, imaging, predictions });
      }

      const allMessages = [...messages, userMessage];
      const response = await sendMessage(allMessages, {
        apiKey: settings?.apiKey || '',
        systemPrompt,
        piiData: patient?.pii,
      });

      // Extract and save structured data from response
      const extracted = extractDataFromResponse(response.content);
      if (extracted.length > 0) {
        await saveExtractedData(extracted);
      }

      const cleanContent = cleanResponseFromTags(response.content);

      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: cleanContent,
        timestamp: new Date(),
        dataExtracted: extracted.length > 0 ? extracted.map(e => e.data) : undefined,
      };

      await addChatMessage(assistantMessage);
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Nieznany blad';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  return { messages, isLoading, error, send, reload: loadMessages };
}
