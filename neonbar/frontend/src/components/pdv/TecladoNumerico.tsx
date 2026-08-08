import { Delete } from 'lucide-react';

interface TecladoNumericoProps {
  value: string;
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '00x'];

export default function TecladoNumerico({ onDigit, onBackspace, onClear }: TecladoNumericoProps) {
  const keyClass =
    'h-14 rounded-xl bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] text-headline-md font-bold hover:bg-[var(--color-surface-container-highest)] active:scale-[0.96] transition-all cursor-pointer flex items-center justify-center';

  return (
    <div className="grid grid-cols-3 gap-2">
      {KEYS.map(key => (
        <button
          key={key}
          type="button"
          onClick={() => onDigit(key)}
          className={keyClass}
        >
          {key === '00x' ? '00' : key}
        </button>
      ))}
      <button type="button" onClick={onClear} className={`${keyClass} text-label-sm text-[var(--color-error)]`}>
        C
      </button>
      <button
        type="button"
        onClick={onBackspace}
        aria-label="Apagar último dígito"
        className={`${keyClass} text-[var(--color-error)]`}
      >
        <Delete size={22} />
      </button>
    </div>
  );
}
