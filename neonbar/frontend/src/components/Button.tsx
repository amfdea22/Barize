import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'ghost-white';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  'aria-label'?: string;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-[var(--color-primary-container)] text-[var(--color-on-primary)] hover:brightness-110 active:brightness-90 glow-primary',
  secondary:
    'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary)] hover:brightness-110 active:brightness-90 glow-secondary',
  ghost:
    'bg-transparent border border-[var(--color-primary-container)] text-[var(--color-primary-container)] hover:bg-[var(--color-primary-container)] hover:text-[var(--color-on-primary)]',
  danger:
    'bg-[var(--color-error-container)] text-[var(--color-on-error-container)] hover:brightness-110 active:brightness-90 glow-error',
  'ghost-white':
    'bg-transparent border border-[rgba(255,255,255,0.15)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-high)]',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm min-h-[32px]',
  md: 'px-4 py-2.5 text-sm min-h-[40px]',
  lg: 'px-6 py-3 text-base min-h-[48px]',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-medium
        transition-all duration-150 cursor-pointer select-none
        disabled:opacity-40 disabled:cursor-not-allowed disabled:brightness-75
        ${variants[variant]} ${sizes[size]} ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="w-4 h-4">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
