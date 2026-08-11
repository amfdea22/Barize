import { useMemo, useState } from 'react';
import { Delete, Calculator as CalculatorIcon } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

interface CalculadoraProps {
  open: boolean;
  onClose: () => void;
  onResult?: (valor: number) => void;
  title?: string;
}

interface CalcState {
  display: string;
  acumulado: number | null;
  operador: string | null;
  novoNumero: boolean;
}

const initialState: CalcState = { display: '0', acumulado: null, operador: null, novoNumero: true };

function calc(a: number, b: number, op: string): number {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '×': return a * b;
    case '÷': return b === 0 ? NaN : a / b;
    default: return b;
  }
}

export default function Calculadora({ open, onClose, onResult, title = 'Calculadora' }: CalculadoraProps) {
  const [state, setState] = useState<CalcState>(initialState);

  const reset = () => setState(initialState);

  const handleDigit = (digit: string) => {
    setState((s) => {
      if (s.novoNumero) {
        return { ...s, display: digit === '.' ? '0.' : digit, novoNumero: false };
      }
      if (digit === '.') {
        if (s.display.includes('.')) return s;
        return { ...s, display: s.display + '.' };
      }
      if (s.display.replace('-', '').replace('.', '').length >= 12) return s;
      return { ...s, display: s.display === '0' ? digit : s.display + digit };
    });
  };

  const handleOperator = (op: string) => {
    setState((s) => {
      const valorAtual = parseFloat(s.display);
      if (s.operador !== null && !s.novoNumero && s.acumulado !== null) {
        const resultado = calc(s.acumulado, valorAtual, s.operador);
        const display = Number.isNaN(resultado) ? 'Erro' : String(parseFloat(resultado.toFixed(10)));
        return { display, acumulado: Number.isNaN(resultado) ? null : resultado, operador: op, novoNumero: true };
      }
      return { display: s.display, acumulado: s.acumulado === null ? valorAtual : s.acumulado, operador: op, novoNumero: true };
    });
  };

  const handleEquals = () => {
    setState((s) => {
      if (s.operador === null || s.acumulado === null) return s;
      if (s.display === 'Erro') return s;
      const valorAtual = parseFloat(s.display);
      const resultado = calc(s.acumulado, valorAtual, s.operador);
      if (Number.isNaN(resultado)) return { ...initialState, display: 'Erro' };
      return { display: String(parseFloat(resultado.toFixed(10))), acumulado: null, operador: null, novoNumero: true };
    });
  };

  const handleBackspace = () => {
    setState((s) => {
      if (s.novoNumero || s.display === 'Erro') return s;
      const next = s.display.length > 1 ? s.display.slice(0, -1) : '0';
      return { ...s, display: next === '-' ? '0' : next };
    });
  };

  const handleToggleSignal = () => {
    setState((s) => {
      if (s.display === 'Erro') return s;
      const valor = parseFloat(s.display);
      return { ...s, display: String(valor * -1) };
    });
  };

  const handlePorcento = () => {
    setState((s) => {
      if (s.display === 'Erro') return s;
      const valor = parseFloat(s.display);
      const base = s.acumulado ?? 0;
      const pct = s.acumulado !== null ? (base * valor) / 100 : valor / 100;
      return { ...s, display: String(parseFloat(pct.toFixed(10))), novoNumero: false };
    });
  };

  const handleUsarResultado = () => {
    const valor = parseFloat(state.display);
    if (!Number.isNaN(valor)) {
      onResult?.(valor);
      reset();
      onClose();
    }
  };

  const keyClass =
    'h-14 rounded-xl bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] text-headline-md font-bold hover:bg-[var(--color-surface-container-highest)] active:scale-[0.96] transition-all cursor-pointer flex items-center justify-center';
  const opClass =
    'h-14 rounded-xl bg-[var(--color-primary)]/15 text-[var(--color-primary)] text-headline-md font-bold hover:bg-[var(--color-primary)]/25 active:scale-[0.96] transition-all cursor-pointer flex items-center justify-center';
  const funcClass =
    'h-14 rounded-xl bg-[var(--color-surface-container-low)] text-[var(--color-on-surface-variant)] text-label-sm font-medium hover:bg-[var(--color-surface-container-high)] active:scale-[0.96] transition-all cursor-pointer flex items-center justify-center';

  const displayText = useMemo(() => (state.display === 'Erro' ? 'Erro' : state.display), [state.display]);

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={title} size="sm">
      <div className="space-y-4">
        {/* Display */}
        <div className="bg-[var(--color-surface-container-lowest)] rounded-xl px-4 py-4 text-right text-data-display font-bold font-mono text-[var(--color-on-surface)] min-h-[72px] flex items-center justify-end break-all select-none">
          {displayText}
        </div>

        {/* Teclado */}
        <div className="grid grid-cols-4 gap-2">
          <button type="button" onClick={reset} className={funcClass}>C</button>
          <button type="button" onClick={handleToggleSignal} className={funcClass}>±</button>
          <button type="button" onClick={handlePorcento} className={funcClass}>%</button>
          <button type="button" onClick={() => handleOperator('÷')} className={opClass}>÷</button>

          <button type="button" onClick={() => handleDigit('7')} className={keyClass}>7</button>
          <button type="button" onClick={() => handleDigit('8')} className={keyClass}>8</button>
          <button type="button" onClick={() => handleDigit('9')} className={keyClass}>9</button>
          <button type="button" onClick={() => handleOperator('×')} className={opClass}>×</button>

          <button type="button" onClick={() => handleDigit('4')} className={keyClass}>4</button>
          <button type="button" onClick={() => handleDigit('5')} className={keyClass}>5</button>
          <button type="button" onClick={() => handleDigit('6')} className={keyClass}>6</button>
          <button type="button" onClick={() => handleOperator('-')} className={opClass}>−</button>

          <button type="button" onClick={() => handleDigit('1')} className={keyClass}>1</button>
          <button type="button" onClick={() => handleDigit('2')} className={keyClass}>2</button>
          <button type="button" onClick={() => handleDigit('3')} className={keyClass}>3</button>
          <button type="button" onClick={() => handleOperator('+')} className={opClass}>+</button>

          <button type="button" onClick={() => handleDigit('0')} className={`${keyClass} col-span-2`}>0</button>
          <button type="button" onClick={() => handleDigit('.')} className={keyClass}>,</button>
          <button type="button" onClick={handleEquals} className={`${opClass} bg-[var(--color-primary-container)] text-[var(--color-on-primary)]`}>=</button>
        </div>

        {/* Ações */}
        <div className="flex gap-3 pt-1">
          <Button variant="ghost" className="flex-1" icon={<Delete size={16} />} onClick={handleBackspace}>Apagar</Button>
          {onResult ? (
            <Button className="flex-1" icon={<CalculatorIcon size={16} />} onClick={handleUsarResultado}>
              Usar resultado
            </Button>
          ) : (
            <Button className="flex-1" onClick={() => { reset(); onClose(); }}>Fechar</Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
