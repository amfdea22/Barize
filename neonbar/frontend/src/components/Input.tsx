import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, suffix, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 w-[18px] h-[18px] flex items-center justify-center text-[var(--color-outline)] pointer-events-none" aria-hidden="true">
            {icon || <span className="block w-[18px] h-[18px]" />}
          </span>

          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-[var(--color-outline)]" aria-hidden="true">
              {suffix}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`
              block w-full h-12 outline-none
              rounded-lg bg-[var(--color-surface-container-low)]
              border border-[rgba(var(--overlay-rgb),0.08)]
              text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)]
              transition-all duration-150
              ${icon ? 'pl-[44px]' : 'pl-4'}
              ${suffix ? 'pr-[44px]' : ''}
              focus:border-[var(--color-primary-container)]
              focus:shadow-[0_0_0_1px_var(--color-primary-container)]
              ${error ? 'border-[var(--color-error)] shadow-[0_0_0_1px_var(--color-error)]' : ''}
              ${className}
            `}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={errorId}
            {...props}
          />
        </div>
        {error && (
          <span id={errorId} role="alert" className="block text-xs text-[var(--color-error)] mt-1">{error}</span>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
