import { Coffee } from 'lucide-react';

interface SeletorMesaProps {
  mesas: string[];
  value: string;
  onChange: (mesa: string) => void;
}

export default function SeletorMesa({ mesas, value, onChange }: SeletorMesaProps) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">
        Mesa
      </label>
      <div className="flex flex-wrap gap-1.5">
        {mesas.map(mesa => (
          <button
            key={mesa}
            onClick={() => onChange(mesa === value ? '' : mesa)}
            className={`px-2.5 h-[32px] rounded-lg text-label-sm transition-all cursor-pointer ${
              value === mesa
                ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]'
                : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]'
            }`}
          >
            {mesa}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MesaBadge({ value }: { value: string }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 h-[30px] rounded-full bg-[var(--color-primary-container)]/20 text-[var(--color-primary)] font-mono text-label-sm">
      <Coffee size={14} />
      {value}
    </span>
  );
}
