import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`bg-bg-card rounded-xl border border-border p-4 ${className}`}>
      {title && <h3 className="font-display text-sm font-semibold text-accent-dark mb-3">{title}</h3>}
      {children}
    </div>
  );
}
