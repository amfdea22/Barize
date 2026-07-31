import type { ReactNode } from 'react';
import Card from './Card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error';
  subtitle?: string;
  trend?: { value: number; positive: boolean };
}

const variantStyles = {
  primary: 'border-l-[var(--color-primary-container)]',
  secondary: 'border-l-[var(--color-secondary-container)]',
  success: 'border-l-[var(--color-primary)]',
  warning: 'border-l-[var(--color-secondary)]',
  info: 'border-l-[var(--color-tertiary)]',
  error: 'border-l-[var(--color-error)]',
};

export default function StatsCard({
  title,
  value,
  icon,
  variant = 'primary',
  subtitle,
  trend,
}: StatsCardProps) {
  return (
    <Card className={`border-l-4 ${variantStyles[variant]} p-5`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-[var(--color-on-surface-variant)] font-mono tracking-wider uppercase">
            {title}
          </p>
          <p className="text-data-display font-bold text-[var(--color-on-surface)] tracking-tight">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-[var(--color-outline)]">{subtitle}</p>
          )}
          {trend && (
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium ${
                trend.positive ? 'text-[var(--color-primary)]' : 'text-[var(--color-error)]'
              }`}
            >
              <span>{trend.positive ? '↑' : '↓'}</span>
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
        {icon && (
          <span className="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--color-primary-container)]/10 text-[var(--color-primary-container)]">
            {icon}
          </span>
        )}
      </div>
    </Card>
  );
}
