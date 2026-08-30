import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, ArrowLeft, Calculator } from 'lucide-react';
import Button from '../components/Button';

function safeMathEval(expr: string): number {
  const tokens = expr.match(/(\d+\.?\d*|[+\-*/])/g) || [];
  if (tokens.length === 0) return NaN;

  let pos = 0;
  function parseExpr(): number {
    let left = parseTerm();
    while (pos < tokens.length && (tokens[pos] === '+' || tokens[pos] === '-')) {
      const op = tokens[pos++];
      const right = parseTerm();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }
  function parseTerm(): number {
    let left = parseFactor();
    while (pos < tokens.length && (tokens[pos] === '*' || tokens[pos] === '/')) {
      const op = tokens[pos++];
      const right = parseFactor();
      left = op === '*' ? left * right : left / right;
    }
    return left;
  }
  function parseFactor(): number {
    const t = tokens[pos++];
    if (t === '(') {
      const val = parseExpr();
      pos++; // skip ')'
      return val;
    }
    return parseFloat(t);
  }
  return parseExpr();
}

export default function Caixa() {
  const navigate = useNavigate();
  const [saldoInicial, setSaldoInicial] = useState('');
  const [showCalc, setShowCalc] = useState(false);
  const [calcVal, setCalcVal] = useState('');

  const handleCalc = (v: string) => {
    if (v === 'C') { setCalcVal(''); return; }
    if (v === '=') {
      try {
        const sanitized = calcVal.replace(/[^0-9+\-*/.()]/g, '');
        if (!sanitized) { setCalcVal(''); return; }
        const result = safeMathEval(sanitized);
        setCalcVal(isFinite(result) ? String(Math.round(result * 100) / 100) : 'Erro');
      } catch { setCalcVal('Erro'); }
      return;
    }
    setCalcVal((p) => p + v);
  };

  return (
    <div className="flex flex-col h-dvh bg-[var(--color-background)]">
      {/* Header */}
      <header className="safe-top border-b border-[rgba(var(--overlay-rgb),0.1)] bg-[rgba(var(--glass-rgb),0.6)] backdrop-blur-[12px]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-[var(--color-surface-container-high)] transition-colors cursor-pointer">
            <ArrowLeft size={20} className="text-[var(--color-on-surface)]" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgba(0,229,255,0.2)] to-[rgba(0,218,243,0.1)] flex items-center justify-center border border-[var(--color-primary)]/30">
            <DollarSign size={20} className="text-[var(--color-primary-container)]" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[var(--color-on-surface)] tracking-tight">CAIXA</h1>
            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[var(--color-on-surface-variant)]">CONTROLE FINANCEIRO</span>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Saldo Inicial */}
        <div className="glass glass-border border border-[rgba(var(--overlay-rgb),0.1)] rounded-xl p-4">
          <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-2 block">
            Saldo Inicial (R$)
          </label>
          <input
            type="number"
            step="0.01"
            value={saldoInicial}
            onChange={(e) => setSaldoInicial(e.target.value)}
            placeholder="0,00"
            className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-container-lowest)] border border-[rgba(var(--overlay-rgb),0.1)] text-lg font-mono text-center text-[var(--color-on-surface)] focus:border-[var(--color-primary-container)]/50 outline-none transition-colors"
          />
        </div>

        {/* Calculadora */}
        <Button variant="ghost-white" className="w-full" onClick={() => setShowCalc(!showCalc)}>
          <Calculator size={16} className="text-[var(--color-primary-container)]" />
          {showCalc ? 'Fechar Calculadora' : 'Abrir Calculadora'}
        </Button>

        {showCalc && (
          <div className="glass glass-border border border-[rgba(var(--overlay-rgb),0.1)] rounded-xl p-4">
            <div className="text-right font-mono text-lg mb-3 h-8 text-[var(--color-on-surface)]">
              {calcVal || '0'}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map((v) => (
                <button
                  key={v}
                  onClick={() => handleCalc(v)}
                  className={`py-2.5 rounded-lg font-mono text-sm font-bold cursor-pointer transition-all ${
                    v === '=' ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary)]' :
                    ['+','-','*','/'].includes(v) ? 'bg-[var(--color-primary-container)]/15 text-[var(--color-primary-container)]' :
                    'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] border border-[rgba(var(--overlay-rgb),0.1)]'
                  }`}
                >
                  {v}
                </button>
              ))}
              <button
                onClick={() => handleCalc('C')}
                className="col-span-4 py-2 rounded-lg bg-[var(--color-error-container)]/15 text-[var(--color-error)] text-xs font-bold cursor-pointer"
              >
                Limpar
              </button>
            </div>
          </div>
        )}

        {/* Resumo do Dia */}
        <div className="glass glass-border border border-[rgba(var(--overlay-rgb),0.1)] rounded-xl p-4 space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-on-surface-variant)]">Resumo do Dia</h3>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-on-surface-variant)]">Faturamento</span>
            <span className="font-mono font-bold text-[var(--color-on-surface)]">R$ 0,00</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[var(--color-on-surface-variant)]">Pedidos</span>
            <span className="font-mono font-bold text-[var(--color-on-surface)]">0</span>
          </div>
          <div className="border-t border-[rgba(var(--overlay-rgb),0.1)] pt-3 flex justify-between">
            <span className="font-bold text-[var(--color-on-surface)]">Saldo</span>
            <span className="font-mono font-bold text-[var(--color-primary-container)]">R$ {saldoInicial || '0,00'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
