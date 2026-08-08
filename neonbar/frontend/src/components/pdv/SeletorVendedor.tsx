import { User } from 'lucide-react';

interface SeletorVendedorProps {
  value: string;
  onChange: (vendedor: string) => void;
  defaultName: string;
}

export default function SeletorVendedor({ value, onChange, defaultName }: SeletorVendedorProps) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">
        Vendedor
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] pointer-events-none">
          <User size={16} />
        </span>
        <input
          type="text"
          value={value || defaultName}
          placeholder="Nome do vendedor"
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-10 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] pl-10 pr-3 outline-none focus:border-[var(--color-primary-container)] transition-colors placeholder:text-[var(--color-outline)]"
        />
      </div>
    </div>
  );
}
