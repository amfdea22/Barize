import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Search, Wallet, Receipt, Scale, Users, Clock, Star } from 'lucide-react';
import Button from '../components/Button';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import StatsCard from '../components/StatsCard';
import Card from '../components/Card';
import SegmentedControl from '../components/SegmentedControl';
import { TrendLineChart, HorizontalBarList, StarRating } from '../components/RelatoriosCharts';
import type { Column } from '../components/DataTable';
import type { AuditLog, AnalyticsResumo, PontoReceita, TopProduto, DesempenhoEquipe } from '../types';
import { relatoriosService, relatoriosAnalyticsService } from '../services/api';

type Periodo = 'dia' | 'semana' | 'mes';

const PERIODOS: { value: Periodo; label: string }[] = [
  { value: 'dia', label: 'Hoje' },
  { value: 'semana', label: 'Semana' },
  { value: 'mes', label: 'Mês' },
];

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  gerente: 'Gerente',
  garcom: 'Garçom',
  bartender: 'Bartender',
};

function formatarMoeda(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function Relatorios() {
  const [aba, setAba] = useState<'analytics' | 'auditoria'>('analytics');

  // ─── Analytics ───
  const [periodo, setPeriodo] = useState<Periodo>('dia');
  const [resumo, setResumo] = useState<AnalyticsResumo | null>(null);
  const [receitaSerie, setReceitaSerie] = useState<PontoReceita[]>([]);
  const [topProdutos, setTopProdutos] = useState<TopProduto[]>([]);
  const [desempenho, setDesempenho] = useState<DesempenhoEquipe[]>([]);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  // ─── Auditoria ───
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAuditoria, setLoadingAuditoria] = useState(true);
  const [filterAcao, setFilterAcao] = useState('');

  const [error, setError] = useState('');

  const carregarAnalytics = useCallback(async (p: Periodo) => {
    setLoadingAnalytics(true);
    setError('');
    try {
      const [resumoRes, serieRes, topRes, equipeRes] = await Promise.all([
        relatoriosAnalyticsService.resumo(p),
        relatoriosAnalyticsService.receitaPorHora(p),
        relatoriosAnalyticsService.topProdutos(p, 5),
        relatoriosAnalyticsService.desempenhoEquipe(p),
      ]);
      setResumo(resumoRes.data);
      setReceitaSerie(serieRes.data);
      setTopProdutos(topRes.data);
      setDesempenho(equipeRes.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao carregar analytics');
    } finally {
      setLoadingAnalytics(false);
    }
  }, []);

  const carregarAuditoria = useCallback(async (acao?: string) => {
    setLoadingAuditoria(true);
    setError('');
    try {
      const res = await relatoriosService.auditoria({ acao: acao || undefined });
      setAuditLogs(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao carregar auditoria');
    } finally {
      setLoadingAuditoria(false);
    }
  }, []);

  useEffect(() => { carregarAnalytics(periodo); }, [periodo, carregarAnalytics]);
  useEffect(() => { if (aba === 'auditoria') carregarAuditoria(filterAcao); }, [aba, filterAcao, carregarAuditoria]);

  const acoes = Array.from(new Set(auditLogs.map((l) => l.acao)));

  const columns: Column<AuditLog>[] = [
    { key: 'acao', header: 'Ação', render: (l) => <Badge variant="info">{l.acao}</Badge> },
    { key: 'usuario_nome', header: 'Usuário' },
    { key: 'entidade_tipo', header: 'Entidade', className: 'text-[var(--color-outline)]', render: (l) => l.entidade_tipo || '-' },
    { key: 'entidade_id', header: 'ID', className: 'font-mono', render: (l) => l.entidade_id ?? '-' },
    { key: 'detalhes', header: 'Detalhes', render: (l) => l.detalhes || '-' },
    {
      key: 'created_at',
      header: 'Data',
      className: 'font-mono text-xs text-[var(--color-outline)]',
      render: (l) => new Date(l.created_at).toLocaleString('pt-BR'),
    },
  ];

  const maxQtd = topProdutos.length > 0 ? Math.max(...topProdutos.map((p) => p.quantidade)) : 1;
  const maxVolume = desempenho.length > 0 ? Math.max(...desempenho.map((d) => d.volume)) : 1;

  const kpis = [
    {
      title: 'Receita Total',
      value: resumo ? formatarMoeda(resumo.receita) : '—',
      icon: <Wallet size={20} />,
      variant: 'primary' as const,
      trend: resumo ? { value: Math.abs(resumo.variacao_percentual), positive: resumo.variacao_percentual >= 0 } : undefined,
      subtitle: resumo ? `vs ${formatarMoeda(resumo.periodo_anterior_receita)} (período anterior)` : 'Carregando...',
    },
    {
      title: 'Pedidos',
      value: resumo ? String(resumo.total_pedidos) : '—',
      icon: <Receipt size={20} />,
      variant: 'success' as const,
      subtitle: resumo ? `${resumo.total_itens} itens vendidos` : 'Carregando...',
    },
    {
      title: 'Ticket Médio',
      value: resumo ? formatarMoeda(resumo.ticket_medio) : '—',
      icon: <Scale size={20} />,
      variant: 'info' as const,
      subtitle: 'Valor médio por pedido',
    },
    {
      title: 'Mesas Ativas',
      value: resumo ? String(resumo.mesas_ativas) : '—',
      icon: <Users size={20} />,
      variant: 'warning' as const,
      subtitle: resumo ? `${resumo.pedidos_ativos} pedidos em preparo` : 'Carregando...',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-md">
        <div className="min-w-0">
          <h1 className="text-headline-lg text-[var(--color-on-surface)]">Relatórios & Analytics</h1>
          <p className="text-label-md text-[var(--color-outline)] mt-1 uppercase">Desempenho de vendas e auditoria do sistema</p>
        </div>
        <div className="flex items-center gap-sm shrink-0">
          {aba === 'analytics' && (
            <SegmentedControl
              options={PERIODOS}
              value={periodo}
              onChange={(v) => setPeriodo(v)}
            />
          )}
          <Button
            variant="ghost"
            icon={<RefreshCw size={16} />}
            onClick={() => aba === 'analytics' ? carregarAnalytics(periodo) : carregarAuditoria(filterAcao)}
          >
            Atualizar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-xs border-b border-[rgba(var(--overlay-rgb),0.08)]">
        <button
          onClick={() => setAba('analytics')}
          className={`px-lg py-sm text-label-md uppercase font-medium tracking-wider border-b-2 transition-colors cursor-pointer ${
            aba === 'analytics'
              ? 'text-[var(--color-primary)] border-[var(--color-primary)]'
              : 'text-[var(--color-on-surface-variant)] border-transparent hover:text-[var(--color-on-surface)]'
          }`}
        >
          Analytics
        </button>
        <button
          onClick={() => setAba('auditoria')}
          className={`px-lg py-sm text-label-md uppercase font-medium tracking-wider border-b-2 transition-colors cursor-pointer ${
            aba === 'auditoria'
              ? 'text-[var(--color-primary)] border-[var(--color-primary)]'
              : 'text-[var(--color-on-surface-variant)] border-transparent hover:text-[var(--color-on-surface)]'
          }`}
        >
          Auditoria
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      {/* ─── ANALYTICS ─── */}
      {aba === 'analytics' && (
        <div className="space-y-6">
          {/* KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-md">
            {kpis.map((kpi) => (
              <StatsCard key={kpi.title} {...kpi} />
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
            <Card className="lg:col-span-2 flex flex-col min-w-0 p-lg">
              <div className="flex items-center justify-between gap-md mb-lg flex-wrap">
                <div className="min-w-0">
                  <h3 className="text-headline-md text-[var(--color-on-surface)]">Tendência de Receita</h3>
                  <p className="text-sm text-[var(--color-on-surface-variant)]">
                    {periodo === 'dia' ? 'Vendas por hora' : 'Vendas por dia'} — período selecionado
                  </p>
                </div>
                <div className="flex items-center gap-lg shrink-0">
                  <div className="flex items-center gap-xs">
                    <span className="w-3 h-3 rounded-full bg-[var(--color-primary)]" />
                    <span className="text-xs text-[var(--color-on-surface-variant)]">Receita</span>
                  </div>
                </div>
              </div>
              {loadingAnalytics ? (
                <div className="flex items-center justify-center h-[320px] text-[var(--color-outline)] text-sm">
                  Carregando tendência...
                </div>
              ) : (
                <TrendLineChart data={receitaSerie.map((p) => ({ rotulo: p.rotulo, receita: p.receita }))} />
              )}
            </Card>

            <Card className="flex flex-col min-w-0 p-lg">
              <h3 className="text-headline-md text-[var(--color-on-surface)] mb-lg">Top Produtos</h3>
              {loadingAnalytics ? (
                <div className="flex items-center justify-center h-[280px] text-[var(--color-outline)] text-sm">
                  Carregando...
                </div>
              ) : (
                <HorizontalBarList
                  items={topProdutos.map((p) => ({
                    nome: p.nome,
                    quantidade: p.quantidade,
                    pct: Math.round((p.quantidade / maxQtd) * 100),
                  }))}
                />
              )}
              <div className="mt-lg flex flex-wrap gap-sm min-w-0">
                <Badge variant="primary">{topProdutos.length} produtos</Badge>
                {topProdutos[0] && (
                  <Badge variant="success">
                    <Star size={12} /> Mais vendido: {topProdutos[0].nome}
                  </Badge>
                )}
              </div>
            </Card>
          </div>

          {/* Staff Performance */}
          <Card className="min-w-0 overflow-hidden p-0">
            <div className="p-lg border-b border-[rgba(var(--overlay-rgb),0.08)] flex flex-wrap items-center justify-between gap-md">
              <h3 className="text-headline-md text-[var(--color-on-surface)]">Desempenho da Equipe</h3>
              <Badge variant="info">
                <Clock size={12} /> Período: {periodo}
              </Badge>
            </div>
            {loadingAnalytics ? (
              <div className="flex items-center justify-center h-40 text-[var(--color-outline)] text-sm">
                Carregando equipe...
              </div>
            ) : desempenho.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-[var(--color-outline)] text-sm">
                Nenhuma venda registrada no período
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[var(--color-surface-low)] text-[var(--color-on-surface-variant)] border-b border-[rgba(var(--overlay-rgb),0.08)]">
                      <th className="px-lg py-md text-label-md uppercase">Colaborador</th>
                      <th className="px-lg py-md text-label-md uppercase">Pedidos</th>
                      <th className="px-lg py-md text-label-md uppercase">Volume</th>
                      <th className="px-lg py-md text-label-md uppercase">Ticket Médio</th>
                      <th className="px-lg py-md text-label-md uppercase text-right">Avaliação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(var(--overlay-rgb),0.06)]">
                    {desempenho.map((d) => {
                      const rating = d.vendas > 0 ? Math.min(5, 1 + (d.vendas / Math.max(maxVolume, 1)) * 4) : 0;
                      return (
                        <tr key={d.usuario_id} className="hover:bg-[var(--color-surface-container-high)] transition-colors">
                          <td className="px-lg py-md">
                            <div className="flex items-center gap-md min-w-0">
                              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[var(--color-surface-container-high)] border border-[rgba(0,218,243,0.2)] text-[var(--color-primary)] font-bold shrink-0">
                                {d.nome?.charAt(0)?.toUpperCase() || 'U'}
                              </div>
                              <div className="min-w-0">
                                <p className="text-label-md text-[var(--color-on-surface)] truncate">{d.nome}</p>
                                <p className="text-xs text-[var(--color-on-surface-variant)] truncate">{ROLE_LABEL[d.role] || d.role}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-lg py-md font-mono text-[var(--color-on-surface)]">{d.vendas}</td>
                          <td className="px-lg py-md font-mono text-[var(--color-on-surface)]">{formatarMoeda(d.volume)}</td>
                          <td className="px-lg py-md font-mono text-[var(--color-secondary)]">{formatarMoeda(d.ticket_medio)}</td>
                          <td className="px-lg py-md text-right">
                            <StarRating rating={rating} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ─── AUDITORIA ─── */}
      {aba === 'auditoria' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" />
              <input
                type="text"
                placeholder="Filtrar por ação..."
                value={filterAcao}
                onChange={(e) => setFilterAcao(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-[var(--color-surface-low)] border border-[rgba(var(--overlay-rgb),0.1)] text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] input-glow"
              />
            </div>
            <div className="flex gap-2 flex-wrap min-w-0">
              <button
                onClick={() => setFilterAcao('')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 ${
                  !filterAcao ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary)]' : 'bg-[var(--color-surface-low)] text-[var(--color-on-surface-variant)] ghost-border hover:bg-[var(--color-surface-high)]'
                }`}
              >
                Todas
              </button>
              {acoes.slice(0, 10).map((acao) => (
                <button
                  key={acao}
                  onClick={() => setFilterAcao(acao)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 ${
                    filterAcao === acao ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary)]' : 'bg-[var(--color-surface-low)] text-[var(--color-on-surface-variant)] ghost-border hover:bg-[var(--color-surface-high)]'
                  }`}
                >
                  {acao}
                </button>
              ))}
            </div>
          </div>

          {loadingAuditoria ? (
            <div className="flex items-center justify-center h-32 text-[var(--color-outline)] text-sm">
              Carregando auditoria...
            </div>
          ) : (
            <DataTable columns={columns} data={auditLogs} emptyMessage="Nenhum registro de auditoria encontrado" />
          )}
        </div>
      )}
    </div>
  );
}
