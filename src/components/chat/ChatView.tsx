import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import { MessageBubble } from './MessageBubble';
import { QuickActions } from './QuickActions';

export function ChatView() {
  const { messages, isLoading, error, send } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  async function handleSend() {
    const text = input.trim();
    if (!text && !isLoading) return;
    setInput('');
    await send(text);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const mediaType = file.type;
      await send(input || 'Przeanalizuj to zdjecie', [{ base64, mediaType }]);
      setInput('');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleQuickAction(prompt: string) {
    send(prompt);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-accent-dark animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-accent-dark animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-accent-dark animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs text-text-secondary">Mysle...</span>
          </div>
        )}
        {error && (
          <div className="bg-alert-critical/10 text-alert-critical text-sm rounded-lg p-3">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <QuickActions onAction={handleQuickAction} />

      {/* Input */}
      <div className="border-t border-border bg-bg-card px-3 py-2 safe-bottom">
        <div className="flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-xl shrink-0"
            title="Dodaj zdjecie"
          >
            📷
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoUpload}
          />
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Napisz wiadomosc..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-border px-3 py-2 text-sm bg-bg-primary focus:outline-none focus:border-accent-dark min-h-[40px] max-h-[120px]"
            style={{ height: 'auto', overflow: 'hidden' }}
            onInput={e => {
              const t = e.currentTarget;
              t.style.height = 'auto';
              t.style.height = Math.min(t.scrollHeight, 120) + 'px';
            }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-2 rounded-xl bg-accent-dark text-accent-warm disabled:opacity-40 shrink-0 min-w-[40px] min-h-[40px] flex items-center justify-center"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
