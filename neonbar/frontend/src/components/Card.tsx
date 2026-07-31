import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  glow?: 'primary' | 'secondary' | 'error' | 'none';
}

export default function Card({
  children,
  className = '',
  hover = false,
  onClick,
  glow = 'none',
}: CardProps) {
  return (
    <div
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? 'Ativar' : undefined}
      className={`
        rounded-xl bg-[var(--color-surface-container)] ghost-border
        p-4 transition-all duration-200
        ${hover || onClick ? 'cursor-pointer hover:bg-[var(--color-surface-container-high)] hover:border-[var(--color-outline-variant)]' : ''}
        ${glow === 'primary' ? 'glow-primary border-[var(--color-primary-container)]' : ''}
        ${glow === 'secondary' ? 'glow-secondary border-[var(--color-secondary-container)]' : ''}
        ${glow === 'error' ? 'glow-error border-[var(--color-error)]' : ''}
        ${onClick ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-primary-container)] focus-visible:outline-none' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
