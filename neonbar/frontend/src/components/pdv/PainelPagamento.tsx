import { useMemo, useState } from 'react';
import { Banknote, CreditCard, QrCode, ArrowLeft, Check, AlertCircle, Receipt } from 'lucide-react';
import SegmentedControl from '../SegmentedControl';
import TecladoNumerico from './TecladoNumerico';
import { FORMAS_PAGAMENTO, type FormaPagamento } from './types';

interface PainelPagamentoProps {
  total: number;
  desconto: number;
  taxa: number;
  valorFinal: number;
  onConfirm: (payload: {
    forma_pagamento: FormaPagamento;
    valor_recebido: number;
    troco: number;
    parcelas: number;
  }) => void;
  onCancel: () => void;
}

const FORM_ICONS: Record<FormaPagamento, typeof Banknote> = {
  dinheiro: Banknote,
  cartao_credito: CreditCard,
  cartao_debito: CreditCard,
  pix: QrCode,
};

const PARCELAS = ['À vista', '2x', '3x', '4x', '5x', '6x', '7x', '8x', '9x', '10x', '11x', '12x'];

export default function PainelPagamento({ total, desconto, taxa, valorFinal, onConfirm, onCancel }: PainelPagamentoProps) {
  const [forma, setForma] = useState<FormaPagamento>('dinheiro');
  const [parcelas, setParcelas] = useState('À vista');
  const [valorRecebido, setValorRecebido] = useState('');

  const recebido = parseInt(valorRecebido || '0', 10) / 100;
  const troco = recebido >= valorFinal ? recebido - valorFinal : 0;
  const ehDinheiro = forma === 'dinheiro';
  const podeConfirmar = !ehDinheiro || (recebido >= valorFinal && recebido > 0);
  const valorParcela = parcelas === 'À vista' ? valorFinal : valorFinal / (parseInt(parcelas, 10) || 1);

  const saldo = useMemo(() => (ehDinheiro ? Math.max(0, valorFinal - recebido) : 0), [ehDinheiro, valorFinal, recebido]);

  const fmtValor = (cents: number) => {
    const str = String(cents).padStart(3, '0');
    return `R$ ${str.slice(0, -2)},${str.slice(-2)}`;
  };

  const handleDigit = (digit: string) => {
    if (digit === '00x') {
      setValorRecebido(v => (v ? (v + '00').slice(0, 8) : v));
      return;
    }
    setValorRecebido(v => {
      const next = (v || '') + digit;
      if (next.length > 8) return v;
      return next;
    });
  };

  const handleBackspace = () => setValorRecebido(v => v.slice(0, -1));
  const handleClear = () => setValorRecebido('');

  const handleConfirm = () => {
    onConfirm({ forma_pagamento: forma, valor_recebido: ehDinheiro ? recebido : valorFinal, troco, parcelas: parcelas === 'À vista' ? 1 : parseInt(parcelas, 10) });
  };

  return (
    <div className="w-full min-w-0 space-y-5">
      {/* Resumo da venda */}
      <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-body-md text-[var(--color-on-surface-variant)]">
          <span>Subtotal</span>
          <span className="font-mono">R$ {total.toFixed(2)}</span>
        </div>
        {desconto > 0 && (
          <div className="flex justify-between text-body-md text-green-400">
            <span>Desconto</span>
            <span className="font-mono">- R$ {desconto.toFixed(2)}</span>
          </div>
        )}
        {taxa > 0 && (
          <div className="flex justify-between text-body-md text-[var(--color-on-surface-variant)]">
            <span>Taxa de serviço</span>
            <span className="font-mono">+ R$ {taxa.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-2 border-t border-[rgba(var(--overlay-rgb),0.08)]">
          <span className="text-headline-md font-bold text-[var(--color-on-surface)]">Total</span>
          <span className="text-data-display font-bold text-[var(--color-primary)]">R$ {valorFinal.toFixed(2)}</span>
        </div>
      </div>

      {/* Forma de pagamento */}
      <div>
        <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-2">Forma de Pagamento</label>
        <div className="grid grid-cols-4 gap-2">
          {FORMAS_PAGAMENTO.map(f => {
            const Icon = FORM_ICONS[f.key];
            const active = forma === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => { setForma(f.key); setValorRecebido(''); }}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all cursor-pointer ${
                  active
                    ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] border-[var(--color-primary)]'
                    : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] border-transparent hover:bg-[var(--color-surface-container-highest)]'
                }`}
              >
                <Icon size={22} />
                <span className="text-[11px] font-medium">{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Parcelamento */}
      {forma === 'cartao_credito' && (
        <div>
          <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-2">Parcelamento</label>
          <SegmentedControl options={PARCELAS.map(p => ({ value: p, label: p }))} value={parcelas} onChange={setParcelas} />
          <p className="mt-2 text-label-md text-[var(--color-on-surface-variant)] font-mono">
            {parcelas === 'À vista' ? 'Pagamento à vista' : `${parcelas} de R$ ${valorParcela.toFixed(2)}`}
          </p>
        </div>
      )}

      {/* Dinheiro: teclado + troco */}
      {forma === 'dinheiro' && (
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-2">Valor Recebido</label>
            <div className="bg-[var(--color-surface-container-lowest)] rounded-xl px-4 py-3 text-right text-data-display font-bold font-mono text-[var(--color-on-surface)] h-[52px] flex items-center justify-end">
              {valorRecebido ? fmtValor(parseInt(valorRecebido, 10)) : 'R$ 0,00'}
            </div>
          </div>

          {recebido > 0 && recebido < valorFinal && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-label-md text-amber-400">
              <AlertCircle size={15} />
              <span>Faltam R$ {saldo.toFixed(2)}</span>
            </div>
          )}

          {troco > 0 && (
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-green-500/10 border border-green-500/30">
              <span className="text-label-md text-green-400 uppercase font-medium">Troco</span>
              <span className="text-data-display font-bold text-green-400 font-mono">R$ {troco.toFixed(2)}</span>
            </div>
          )}

          <TecladoNumerico value={valorRecebido} onDigit={handleDigit} onBackspace={handleBackspace} onClear={handleClear} />
        </div>
      )}

      {podeConfirmar && (
        <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-green-500/10 border border-green-500/30">
          <span className="text-label-md text-green-400 uppercase font-medium flex items-center gap-2">
            <Check size={15} /> Recebido
          </span>
          <span className="text-data-display font-bold text-green-400 font-mono">
            R$ {(ehDinheiro ? recebido : valorFinal).toFixed(2)}
          </span>
        </div>
      )}

      {/* Ações */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center justify-center gap-2 h-11 px-4 rounded-lg border border-[rgba(var(--overlay-rgb),0.15)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)] transition-colors cursor-pointer text-label-md"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!podeConfirmar}
          className="flex-1 flex items-center justify-center gap-2 h-11 rounded-lg bg-[var(--color-primary-container)] text-[var(--color-on-primary)] font-bold text-label-md uppercase tracking-widest hover:brightness-110 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Receipt size={16} /> Confirmar Pagamento
        </button>
      </div>
    </div>
  );
}
