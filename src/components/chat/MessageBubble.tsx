import type { ChatMessage } from '@/types';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const text = typeof message.content === 'string'
    ? message.content
    : message.content.filter(c => c.type === 'text').map(c => (c as { type: 'text'; text: string }).text).join('\n');

  const hasImages = Array.isArray(message.content) &&
    message.content.some(c => c.type === 'image');

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-accent-dark text-accent-warm rounded-br-sm'
            : 'bg-bg-card border border-border text-text-primary rounded-bl-sm'
        }`}
      >
        {hasImages && (
          <div className="mb-2 text-xs opacity-70">📷 Zdjęcie dołączone</div>
        )}
        <div className="whitespace-pre-wrap">{text}</div>
        <div className={`text-[10px] mt-1 ${isUser ? 'text-accent-warm/60' : 'text-text-secondary'}`}>
          {new Date(message.timestamp).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
