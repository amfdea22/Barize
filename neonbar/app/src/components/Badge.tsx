import type { ReactNode } from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  pulsing?: boolean;
}

const variants: Record<BadgeVariant, string> = {
  primary: 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border-[var(--color-primary)]/30',
  secondary: 'bg-[var(--color-secondary)]/15 text-[var(--color-secondary)] border-[var(--color-secondary)]/30',
  success: 'bg-[var(--color-primary)]/15 text-[var(--color-primary)] border-[var(--color-primary)]/30',
  warning: 'bg-[var(--color-secondary)]/15 text-[var(--color-secondary)] border-[var(--color-secondary)]/30',
  error: 'bg-[var(--color-error)]/15 text-[var(--color-error)] border-[var(--color-error)]/30',
  info: 'bg-[var(--color-tertiary)]/15 text-[var(--color-tertiary)] border-[var(--color-tertiary)]/30',
  neutral: 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] border-[var(--color-outline-variant)]',
};

export default function Badge({
  children,
  variant = 'neutral',
  className = '',
  pulsing = false,
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-0.5
        rounded-full text-xs font-medium font-mono tracking-wider uppercase
        border ${variants[variant]}
        ${pulsing ? 'animate-pulse-glow' : ''}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
