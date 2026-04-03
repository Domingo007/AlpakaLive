import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div
      className={`bg-bg-card rounded-2xl border border-lavender-100 p-5 shadow-[0_4px_12px_rgba(45,31,84,0.08)] ${className}`}
      style={{ animation: 'card-enter 0.3s ease-out' }}
    >
      {title && <h3 className="text-[15px] font-semibold text-text-primary mb-3">{title}</h3>}
      {children}
    </div>
  );
}
