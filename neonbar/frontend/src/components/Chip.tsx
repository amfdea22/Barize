import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: ReactNode;
}

export default function Chip({ active = false, children, className = '', ...props }: ChipProps) {
  return (
    <button
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
        transition-all duration-150 cursor-pointer select-none min-h-[32px]
        ${
          active
            ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary)] glow-primary'
            : 'bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)] ghost-border hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-on-surface)]'
        }
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
