import type { ReactNode } from 'react';
import { Package } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({
  icon,
  title = 'Nenhum registro encontrado',
  description = 'Nao ha dados para exibir no momento.',
  action,
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      role="status"
    >
      <div className="w-16 h-16 rounded-full bg-[var(--color-surface-container-high)] flex items-center justify-center mb-4 text-[var(--color-outline)]" aria-hidden="true">
        {icon || <Package size={28} />}
      </div>
      <h3 className="text-base font-semibold text-[var(--color-on-surface)] mb-1">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-on-surface-variant)] max-w-sm mb-4">
        {description}
      </p>
      {action}
    </div>
  );
}
