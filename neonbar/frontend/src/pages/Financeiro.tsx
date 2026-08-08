import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  DollarSign,
  RefreshCw,
  Receipt,
  BarChart3,
  PieChart,
  Calculator,
  AlertTriangle,
  Lock,
  Unlock,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,

} from 'lucide-react';
import Card from '../components/Card';
import StatsCard from '../components/StatsCard';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Badge from '../components/Badge';
import Chip from '../components/Chip';
import { BarChart, DonutChart, CMVGauge } from '../components/FinanceiroCharts';
import { financeiroService, caixaService, cmvService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { FinanceiroData, Movimentacao, CMVResult } from '../types';

export default function Financeiro() {
  const { usuario } = useAuth();
  const [data, setData] = useState<FinanceiroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Caixa modals
  const [showAbrirCaixa, setShowAbrirCaixa] = useState(false);
  const [saldoInicial, setSaldoInicial] = useState(100);

  // CMV detalhado
  const [cmvPeriod, setCmvPeriod] = useState(30);
  const [cmvDetalhado, setCmvDetalhado] = useState<CMVResult | null>(null);

  const loadCmvDetalhado = useCallback(async (dias: number) => {
    try {
      const res = await cmvService.calcular(dias);
      setCmvDetalhado(res.data);
    } catch {}
  }, []);

  const load = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const result = await financeiroService.carregarPainel();
      setData(result);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCmvDetalhado(cmvPeriod); }, [cmvPeriod, loadCmvDetalhado]);

  const handleAbrirCaixa = async () => {
    try {
      await caixaService.abrir({ saldo_inicial: saldoInicial });
      setShowAbrirCaixa(false);
      load(true);
    } catch { }
  };

  const isAdmin = usuario?.role === 'admin' || usuario?.role === 'gerente';

  const movColumns = [
    { key: 'tipo', header: 'Tipo', render: (m: Movimentacao) => (
      <Badge variant={m.tipo === 'VENDA' ? 'success' : m.tipo === 'COMPRA' ? 'info' : 'warning'}>{m.tipo}</Badge>
    )},
    { key: 'quantidade', header: 'Qtd', className: 'font-mono', render: (m: Movimentacao) => Math.abs(m.quantidade) },
    { key: 'custo_no_momento', header: 'Valor', className: 'font-mono', render: (m: Movimentacao) => `R$${(m.custo_no_momento ?? 0).toFixed(2)}` },
    { key: 'created_at', header: 'Data', className: 'font-mono text-xs text-[var(--color-outline)]', render: (m: Movimentacao) => new Date(m.created_at).toLocaleString('pt-BR') },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-outline)] text-sm">
        Carregando painel financeiro...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg font-bold text-[var(--color-on-surface)]">FINANCEIRO</h1>
          <p className="text-label-md text-[var(--color-outline)] mt-1 uppercase">Painel Inteligente de Resultados</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" icon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />} onClick={() => load(true)}>
            Atualizar
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-sm text-[var(--color-error)] flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Caixa Widget */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${data?.caixaAtivo ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
              {data?.caixaAtivo ? <Unlock size={20} /> : <Lock size={20} />}
            </div>
            <div>
              <p className="text-label-sm font-bold text-[var(--color-on-surface)] uppercase">
                Caixa {data?.caixaAtivo ? 'Aberto' : 'Fechado'}
              </p>
              {data?.caixaAtivo ? (
                <p className="text-xs text-[var(--color-on-surface-variant)]">
                  Aberto desde {new Date(data.caixaAtivo.data_abertura).toLocaleTimeString('pt-BR')} • Saldo inicial: R${data.caixaAtivo.saldo_inicial.toFixed(2)}
                </p>
              ) : (
                <p className="text-xs text-[var(--color-on-surface-variant)]">
                  Nenhum caixa aberto no momento
                </p>
              )}
            </div>
          </div>
          {isAdmin && !data?.caixaAtivo && (
            <Button onClick={() => setShowAbrirCaixa(true)} icon={<Wallet size={16} />}>
              Abrir Caixa
            </Button>
          )}
        </div>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard
          title="Faturamento Hoje"
          value={`R$ ${(data?.receitaHoje ?? 0).toFixed(2)}`}
          icon={<DollarSign size={20} />}
          variant="success"
          subtitle={`${data?.totalPedidosHoje ?? 0} pedido(s)`}
          trend={data?.comparacao ? {
            value: Math.abs(data.comparacao.variacaoOntem),
            positive: data.comparacao.variacaoOntem >= 0,
          } : undefined}
        />
        <StatsCard
          title="Faturamento do Mês"
          value={`R$ ${(data?.receitaMes ?? 0).toFixed(2)}`}
          icon={<BarChart3 size={20} />}
          variant="primary"
          subtitle={`Meta projetada: R$ ${(data?.projecaoMes?.receitaProjetada ?? 0).toFixed(0)}`}
        />
        <StatsCard
          title="Faturamento Turno"
          value={`R$ ${(data?.receitaTurno ?? 0).toFixed(2)}`}
          icon={<Receipt size={20} />}
          variant="info"
          subtitle={data?.caixaAtivo ? 'Caixa atual' : 'Sem caixa ativo'}
        />
        <StatsCard
          title="CMV"
          value={`${(data?.cmvPercentual ?? 0).toFixed(1)}%`}
          icon={<Calculator size={20} />}
          variant={data?.cmvPercentual && data.cmvPercentual < 25 ? 'success' : data?.cmvPercentual && data.cmvPercentual < 35 ? 'primary' : data?.cmvPercentual && data.cmvPercentual < 45 ? 'warning' : 'error'}
          subtitle={data?.cmvInterpretacao ?? '-'}
        />
        <StatsCard
          title="Lucro Estimado"
          value={`R$ ${(data?.lucroEstimado ?? 0).toFixed(2)}`}
          icon={<TrendingUp size={20} />}
          variant={data?.lucroEstimado && data.lucroEstimado > 0 ? 'success' : 'error'}
          subtitle="Receita - Custos"
        />
        <StatsCard
          title="Ticket Médio"
          value={`R$ ${(data?.ticketMedio ?? 0).toFixed(2)}`}
          icon={<Receipt size={20} />}
          variant="secondary"
          subtitle="Por pedido hoje"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-label-sm font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">
              Receita Diária
            </h3>
            <BarChart3 size={16} className="text-[var(--color-primary)]" />
          </div>
          <BarChart data={data?.receitaUltimosDias ?? []} />
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-label-sm font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">
              Receita por Forma de Pagamento
            </h3>
            <PieChart size={16} className="text-[var(--color-primary)]" />
          </div>
          <DonutChart data={data?.pagamentosPorForma ?? []} />
        </Card>
      </div>

      {/* CMV Detalhado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-label-sm font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">
              CMV & Interpretação
            </h3>
            <div className="flex items-center gap-1">
              {[7, 15, 30, 60].map((d) => (
                <Chip
                  key={d}
                  active={cmvPeriod === d}
                  onClick={() => setCmvPeriod(d)}
                >{`${d}d`}</Chip>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-4">
            <CMVGauge
              value={cmvDetalhado?.cmv_percentual ?? data?.cmvPercentual ?? 0}
              interpretation={cmvDetalhado?.interpretacao ?? data?.cmvInterpretacao ?? '-'}
            />
            <div className="grid grid-cols-3 gap-4 w-full">
              <div className="text-center p-2 rounded-lg bg-[var(--color-surface-container-lowest)]">
                <p className="text-xs text-[var(--color-outline)]">Custo Período</p>
                <p className="text-label-md font-bold text-[var(--color-on-surface)]">R$ {(cmvDetalhado?.custo_total ?? data?.custoMes ?? 0).toFixed(2)}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-[var(--color-surface-container-lowest)]">
                <p className="text-xs text-[var(--color-outline)]">Receita Período</p>
                <p className="text-label-md font-bold text-[var(--color-on-surface)]">R$ {(cmvDetalhado?.receita_total ?? data?.receitaMes ?? 0).toFixed(2)}</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-[var(--color-surface-container-lowest)]">
                <p className="text-xs text-[var(--color-outline)]">Lucro</p>
                <p className={`text-label-md font-bold ${(data?.lucroEstimado ?? 0) >= 0 ? 'text-[var(--color-primary)]' : 'text-[var(--color-error)]'}`}>
                  R$ {(data?.lucroEstimado ?? 0).toFixed(2)}
                </p>
              </div>
            </div>
            {cmvDetalhado && cmvDetalhado.periodo && (
              <div className="w-full mt-2 pt-3 border-t border-[rgba(var(--overlay-rgb),0.06)]">
                <p className="text-[10px] text-[var(--color-outline)] font-mono tracking-wider mb-1">
                  Período: {new Date(cmvDetalhado.periodo.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')} — {new Date(cmvDetalhado.periodo.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--color-outline)]">Benchmark:</span>
                  {cmvDetalhado.cmv_percentual <= 25 ? (
                    <span className="text-[10px] font-bold text-green-400">Excelente (≤25%)</span>
                  ) : cmvDetalhado.cmv_percentual <= 35 ? (
                    <span className="text-[10px] font-bold text-cyan-400">Bom (25-35%)</span>
                  ) : cmvDetalhado.cmv_percentual <= 45 ? (
                    <span className="text-[10px] font-bold text-amber-400">Atenção (35-45%)</span>
                  ) : (
                    <span className="text-[10px] font-bold text-red-400">Crítico (&gt;45%)</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-label-sm font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-4">
            Inteligência & Comparação
          </h3>
          <div className="space-y-4">
            {/* Comparação dia vs ontem / semana */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[var(--color-surface-container-lowest)] border border-[rgba(var(--overlay-rgb),0.06)]">
                <p className="text-xs text-[var(--color-outline)] mb-1">Vs. Ontem</p>
                <div className="flex items-center gap-2">
                  <span className="text-headline-sm font-bold text-[var(--color-on-surface)]">
                    R$ {(data?.comparacao?.ontem ?? 0).toFixed(0)}
                  </span>
                  {data?.comparacao && (
                    <span className={`flex items-center gap-0.5 text-xs font-bold ${data.comparacao.variacaoOntem >= 0 ? 'text-[var(--color-primary)]' : 'text-[var(--color-error)]'}`}>
                      {data.comparacao.variacaoOntem >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {Math.abs(data.comparacao.variacaoOntem)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--color-surface-container-lowest)] border border-[rgba(var(--overlay-rgb),0.06)]">
                <p className="text-xs text-[var(--color-outline)] mb-1">Vs. Semana Passada</p>
                <div className="flex items-center gap-2">
                  <span className="text-headline-sm font-bold text-[var(--color-on-surface)]">
                    R$ {(data?.comparacao?.semanaPassada ?? 0).toFixed(0)}
                  </span>
                  {data?.comparacao && (
                    <span className={`flex items-center gap-0.5 text-xs font-bold ${data.comparacao.variacaoSemana >= 0 ? 'text-[var(--color-primary)]' : 'text-[var(--color-error)]'}`}>
                      {data.comparacao.variacaoSemana >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                      {Math.abs(data.comparacao.variacaoSemana)}%
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Projeção do mês */}
            {data?.projecaoMes && (
              <div className="p-3 rounded-lg bg-[var(--color-surface-container-lowest)] border border-[rgba(var(--overlay-rgb),0.06)]">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs text-[var(--color-outline)]">Progresso do Mês</p>
                  <span className="text-xs font-bold text-[var(--color-primary)]">
                    {data.projecaoMes.percentualConcluido}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--color-surface-container)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary)]/60 transition-all"
                    style={{ width: `${data.projecaoMes.percentualConcluido}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] text-[var(--color-outline)]">
                    Dia {data.projecaoMes.diasConcluidos} de {data.projecaoMes.diasTotal}
                  </span>
                  <span className="text-[10px] text-[var(--color-primary)] font-bold">
                    Projeção: R$ {data.projecaoMes.receitaProjetada.toFixed(0)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Movimentações */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-label-sm font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">
              Últimas Movimentações
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[11px] font-mono tracking-wider text-[var(--color-outline)] uppercase border-b border-[rgba(var(--overlay-rgb),0.06)]">
                  {movColumns.map((col) => (
                    <th key={col.key} className={`pb-2 pr-4 ${col.className || ''}`}>{col.header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data?.ultimasMovimentacoes ?? []).length === 0 ? (
                  <tr><td colSpan={4} className="pt-4 text-sm text-[var(--color-outline)] text-center">Nenhuma movimentação encontrada</td></tr>
                ) : (
                  (data?.ultimasMovimentacoes ?? []).slice(0, 10).map((m) => (
                    <tr key={m.id} className="border-b border-[rgba(var(--overlay-rgb),0.03)] hover:bg-[rgba(var(--overlay-rgb),0.02)]">
                      {movColumns.map((col) => (
                        <td key={col.key} className={`py-2 pr-4 text-sm ${col.className || ''}`}>
                          {col.render ? col.render(m) : (m as any)[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Modal Abrir Caixa */}
      <Modal open={showAbrirCaixa} onClose={() => setShowAbrirCaixa(false)} title="Abrir Caixa" size="sm">
        <div className="space-y-4">
          <Input
            label="Saldo Inicial (R$)"
            type="number"
            value={saldoInicial}
            onChange={(e) => setSaldoInicial(Number(e.target.value))}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowAbrirCaixa(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleAbrirCaixa}>Abrir Caixa</Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

