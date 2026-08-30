import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, DollarSign, RefreshCw, Lock, Unlock, ArrowUpRight, ArrowDownRight, Calculator, Receipt, AlertTriangle } from 'lucide-react';
import { financeiroService, cmvService } from '../services/api';
import type { FinanceiroData, CMVResult } from '../types';

export default function Financeiro() {
  const [data, setData] = useState<FinanceiroData | null>(null);
  const [_cmv, setCmv] = useState<CMVResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [result, cmvRes] = await Promise.all([
        financeiroService.carregarPainel(),
        cmvService.calcular(30).catch(() => ({ data: null })),
      ]);
      setData(result as FinanceiroData);
      setCmv(cmvRes.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-[var(--color-outline)] text-sm">Carregando...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-on-surface)]">Financeiro</h1>
          <p className="text-xs text-[var(--color-on-surface-variant)]">Painel de resultados</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-[var(--color-surface-container-high)]">
          <RefreshCw size={16} className="text-[var(--color-on-surface-variant)]" />
        </button>
      </div>

      {error && (
        <div className="mx-4 mb-3 p-2 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-xs text-[var(--color-error)] flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {/* Caixa Status */}
        <div className="p-3 rounded-xl bg-[var(--color-surface-container)] flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${data?.caixaAtivo ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
            {data?.caixaAtivo ? <Unlock size={18} /> : <Lock size={18} />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[var(--color-on-surface)]">Caixa {data?.caixaAtivo ? 'Aberto' : 'Fechado'}</p>
            <p className="text-[10px] text-[var(--color-on-surface-variant)]">
              {data?.caixaAtivo ? `Desde ${new Date(data.caixaAtivo.data_abertura).toLocaleTimeString('pt-BR')}` : 'Nenhum caixa ativo'}
            </p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl bg-[var(--color-surface-container)]">
            <p className="text-[10px] text-[var(--color-outline)] uppercase flex items-center gap-1"><DollarSign size={10} /> Hoje</p>
            <p className="text-lg font-bold text-green-400">R$ {(data?.receitaHoje ?? 0).toFixed(2)}</p>
            <p className="text-[10px] text-[var(--color-on-surface-variant)]">{data?.totalPedidosHoje ?? 0} pedido(s)</p>
          </div>
          <div className="p-3 rounded-xl bg-[var(--color-surface-container)]">
            <p className="text-[10px] text-[var(--color-outline)] uppercase flex items-center gap-1"><Receipt size={10} /> Mês</p>
            <p className="text-lg font-bold text-[var(--color-primary)]">R$ {(data?.receitaMes ?? 0).toFixed(2)}</p>
            <p className="text-[10px] text-[var(--color-on-surface-variant)]">Projeção: R$ {(data?.projecaoMes?.receitaProjetada ?? 0).toFixed(0)}</p>
          </div>
          <div className="p-3 rounded-xl bg-[var(--color-surface-container)]">
            <p className="text-[10px] text-[var(--color-outline)] uppercase flex items-center gap-1"><Calculator size={10} /> CMV</p>
            <p className="text-lg font-bold text-amber-400">{(data?.cmvPercentual ?? 0).toFixed(1)}%</p>
            <p className="text-[10px] text-[var(--color-on-surface-variant)]">{data?.cmvInterpretacao ?? '-'}</p>
          </div>
          <div className="p-3 rounded-xl bg-[var(--color-surface-container)]">
            <p className="text-[10px] text-[var(--color-outline)] uppercase flex items-center gap-1"><TrendingUp size={10} /> Lucro</p>
            <p className={`text-lg font-bold ${(data?.lucroEstimado ?? 0) >= 0 ? 'text-green-400' : 'text-[var(--color-error)]'}`}>
              R$ {(data?.lucroEstimado ?? 0).toFixed(2)}
            </p>
            <p className="text-[10px] text-[var(--color-on-surface-variant)]">Ticket: R$ {(data?.ticketMedio ?? 0).toFixed(2)}</p>
          </div>
        </div>

        {/* Comparação */}
        {data?.comparacao && (
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-[var(--color-surface-container)]">
              <p className="text-[10px] text-[var(--color-outline)] uppercase">Vs. Ontem</p>
              <div className="flex items-center gap-1">
                <p className="text-sm font-bold text-[var(--color-on-surface)]">R$ {data.comparacao.ontem.toFixed(0)}</p>
                <span className={`flex items-center text-[10px] font-bold ${data.comparacao.variacaoOntem >= 0 ? 'text-green-400' : 'text-[var(--color-error)]'}`}>
                  {data.comparacao.variacaoOntem >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {Math.abs(data.comparacao.variacaoOntem)}%
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-surface-container)]">
              <p className="text-[10px] text-[var(--color-outline)] uppercase">Vs. Semana</p>
              <div className="flex items-center gap-1">
                <p className="text-sm font-bold text-[var(--color-on-surface)]">R$ {data.comparacao.semanaPassada.toFixed(0)}</p>
                <span className={`flex items-center text-[10px] font-bold ${data.comparacao.variacaoSemana >= 0 ? 'text-green-400' : 'text-[var(--color-error)]'}`}>
                  {data.comparacao.variacaoSemana >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                  {Math.abs(data.comparacao.variacaoSemana)}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Projeção */}
        {data?.projecaoMes && (
          <div className="p-3 rounded-xl bg-[var(--color-surface-container)]">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] text-[var(--color-outline)] uppercase">Progresso do Mês</p>
              <span className="text-[10px] font-bold text-[var(--color-primary)]">{data.projecaoMes.percentualConcluido}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[var(--color-surface-container-high)] overflow-hidden">
              <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${data.projecaoMes.percentualConcluido}%` }} />
            </div>
            <p className="text-[10px] text-[var(--color-on-surface-variant)] mt-1">
              Dia {data.projecaoMes.diasConcluidos} de {data.projecaoMes.diasTotal}
            </p>
          </div>
        )}

        {/* Movimentações */}
        {data?.ultimasMovimentacoes && data.ultimasMovimentacoes.length > 0 && (
          <div className="rounded-xl bg-[var(--color-surface-container)] overflow-hidden">
            <div className="px-3 py-2 border-b border-[rgba(var(--overlay-rgb),0.06)]">
              <p className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase">Últimas Movimentações</p>
            </div>
            <div className="divide-y divide-[rgba(var(--overlay-rgb),0.06)]">
              {data.ultimasMovimentacoes.slice(0, 8).map(m => (
                <div key={m.id} className="px-3 py-2 flex items-center justify-between">
                  <span className="text-xs text-[var(--color-on-surface)]">{m.tipo}</span>
                  <span className="text-xs font-mono text-[var(--color-on-surface-variant)]">{Math.abs(m.quantidade)}x</span>
                  <span className="text-xs font-mono font-bold text-[var(--color-on-surface)]">R${(m.custo_no_momento ?? 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
