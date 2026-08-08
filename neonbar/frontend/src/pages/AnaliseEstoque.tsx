import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  Package,
  TrendingUp,
  Clock,
  BarChart3,
} from 'lucide-react';
import Card from '../components/Card';
import StatsCard from '../components/StatsCard';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Chip from '../components/Chip';
import { analiseEstoqueService } from '../services/api';
import type { GiroEstoque, CurvaABC, PontoPedido } from '../types';

type Tab = 'giro' | 'abc' | 'pedido';

export default function AnaliseEstoque() {
  const [tab, setTab] = useState<Tab>('giro');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [giro, setGiro] = useState<GiroEstoque | null>(null);
  const [abc, setAbc] = useState<CurvaABC | null>(null);
  const [pedido, setPedido] = useState<PontoPedido | null>(null);

  const [giroDias, setGiroDias] = useState(30);
  const [abcDias, setAbcDias] = useState(90);

  const loadGiro = useCallback(async () => {
    try {
      const res = await analiseEstoqueService.giro(giroDias);
      setGiro(res.data);
    } catch {}
  }, [giroDias]);

  const loadAbc = useCallback(async () => {
    try {
      const res = await analiseEstoqueService.abc(abcDias);
      setAbc(res.data);
    } catch {}
  }, [abcDias]);

  const loadPedido = useCallback(async () => {
    try {
      const res = await analiseEstoqueService.pontoPedido();
      setPedido(res.data);
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    setError('');
    Promise.all([loadGiro(), loadAbc(), loadPedido()]).finally(() => setLoading(false));
  }, [loadGiro, loadAbc, loadPedido]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError('');
    try {
      await Promise.all([loadGiro(), loadAbc(), loadPedido()]);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao carregar dados');
    } finally {
      setRefreshing(false);
    }
  };

  const getAbcColor = (c: string) => {
    switch (c) {
      case 'A': return 'text-red-400';
      case 'B': return 'text-amber-400';
      case 'C': return 'text-green-400';
      default: return 'text-[var(--color-outline)]';
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'urgente': return 'error';
      case 'repor_em_breve': return 'warning';
      default: return 'success';
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'urgente': return 'Urgente';
      case 'repor_em_breve': return 'Repor em Breve';
      default: return 'OK';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-outline)] text-sm">
        Carregando análise de estoque...
      </div>
    );
  }

  const tabs = [
    { id: 'giro' as Tab, label: 'Giro de Estoque', icon: <RefreshCw size={14} /> },
    { id: 'abc' as Tab, label: 'Curva ABC', icon: <BarChart3 size={14} /> },
    { id: 'pedido' as Tab, label: 'Ponto de Pedido', icon: <Clock size={14} /> },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg font-bold text-[var(--color-on-surface)]">ANÁLISE DE ESTOQUE</h1>
          <p className="text-label-md text-[var(--color-outline)] mt-1 uppercase">Giro, ABC & Ponto de Pedido</p>
        </div>
        <Button variant="ghost" icon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />} onClick={handleRefresh}>
          Atualizar
        </Button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-sm text-[var(--color-error)] flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Tabs */}
      <Card className="!p-1">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                tab === t.id
                  ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] shadow-[0_0_8px_rgba(0,218,243,0.15)]'
                  : 'text-[var(--color-on-surface-variant)] hover:bg-[rgba(var(--overlay-rgb),0.04)]'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Giro de Estoque */}
      {tab === 'giro' && giro && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Giro de Estoque"
              value={giro.giro_estoque.toFixed(2)}
              icon={<RefreshCw size={20} />}
              variant={giro.giro_estoque >= 4 ? 'success' : giro.giro_estoque >= 2 ? 'primary' : 'warning'}
              subtitle={giro.interpretacao}
            />
            <StatsCard
              title="Custo Vendas"
              value={`R$ ${giro.custo_vendas_periodo.toFixed(2)}`}
              icon={<TrendingUp size={20} />}
              variant="primary"
              subtitle={`Últimos ${giro.periodo.dias} dias`}
            />
            <StatsCard
              title="Estoque Médio"
              value={`R$ ${giro.estoque_medio_valor.toFixed(2)}`}
              icon={<Package size={20} />}
              variant="info"
              subtitle="Valor médio em insumos"
            />
            <StatsCard
              title="Cobertura"
              value={`${giro.dias_cobertura.toFixed(1)}d`}
              icon={<Clock size={20} />}
              variant={giro.dias_cobertura <= 30 ? 'success' : giro.dias_cobertura <= 60 ? 'warning' : 'error'}
              subtitle="Dias de estoque"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-outline)] font-mono uppercase">Período:</span>
            {[7, 15, 30, 60, 90].map((d) => (
              <Chip key={d} active={giroDias === d} onClick={() => setGiroDias(d)}>{`${d}d`}</Chip>
            ))}
          </div>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-label-sm font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Detalhes do Período</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-[var(--color-surface-container-lowest)]">
                <p className="text-[10px] text-[var(--color-outline)] uppercase">Início</p>
                <p className="text-sm font-mono text-[var(--color-on-surface)]">{new Date(giro.periodo.data_inicio).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--color-surface-container-lowest)]">
                <p className="text-[10px] text-[var(--color-outline)] uppercase">Fim</p>
                <p className="text-sm font-mono text-[var(--color-on-surface)]">{new Date(giro.periodo.data_fim).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--color-surface-container-lowest)]">
                <p className="text-[10px] text-[var(--color-outline)] uppercase">Insumos Ativos</p>
                <p className="text-sm font-mono text-[var(--color-on-surface)]">{giro.total_insumos_ativos}</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--color-surface-container-lowest)]">
                <p className="text-[10px] text-[var(--color-outline)] uppercase">Benchmark</p>
                <p className="text-sm text-[var(--color-on-surface)]">Ideal: ≥ 4 giros</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Curva ABC */}
      {tab === 'abc' && abc && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className={`border-l-4 border-red-500`}>
              <p className="text-xs font-mono tracking-wider text-[var(--color-on-surface-variant)] uppercase mb-1">Classe A</p>
              <p className="text-headline-sm font-bold text-[var(--color-on-surface)]">{abc.resumo.A.itens} itens</p>
              <p className="text-xs text-[var(--color-outline)]">R$ {abc.resumo.A.valor.toFixed(2)} ({abc.resumo.A.percentual}% do valor)</p>
            </Card>
            <Card className={`border-l-4 border-amber-500`}>
              <p className="text-xs font-mono tracking-wider text-[var(--color-on-surface-variant)] uppercase mb-1">Classe B</p>
              <p className="text-headline-sm font-bold text-[var(--color-on-surface)]">{abc.resumo.B.itens} itens</p>
              <p className="text-xs text-[var(--color-outline)]">R$ {abc.resumo.B.valor.toFixed(2)} ({abc.resumo.B.percentual}% do valor)</p>
            </Card>
            <Card className={`border-l-4 border-green-500`}>
              <p className="text-xs font-mono tracking-wider text-[var(--color-on-surface-variant)] uppercase mb-1">Classe C</p>
              <p className="text-headline-sm font-bold text-[var(--color-on-surface)]">{abc.resumo.C.itens} itens</p>
              <p className="text-xs text-[var(--color-outline)]">R$ {abc.resumo.C.valor.toFixed(2)} ({abc.resumo.C.percentual}% do valor)</p>
            </Card>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-outline)] font-mono uppercase">Período:</span>
            {[30, 60, 90, 180].map((d) => (
              <Chip key={d} active={abcDias === d} onClick={() => setAbcDias(d)}>{`${d}d`}</Chip>
            ))}
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-mono tracking-wider text-[var(--color-outline)] uppercase border-b border-[rgba(var(--overlay-rgb),0.06)]">
                    <th className="pb-2 pr-4">Insumo</th>
                    <th className="pb-2 pr-4">Categoria</th>
                    <th className="pb-2 pr-4 text-right">Valor Consumo</th>
                    <th className="pb-2 pr-4 text-right">%</th>
                    <th className="pb-2 pr-4 text-right">% Acum.</th>
                    <th className="pb-2 pr-4 text-center">Classe</th>
                    <th className="pb-2 pr-4 text-right">Estoque</th>
                  </tr>
                </thead>
                <tbody>
                  {abc.itens.map((item) => (
                    <tr key={item.insumo_id} className="border-b border-[rgba(var(--overlay-rgb),0.03)] hover:bg-[rgba(var(--overlay-rgb),0.02)]">
                      <td className="py-2 pr-4 text-sm text-[var(--color-on-surface)]">{item.nome}</td>
                      <td className="py-2 pr-4 text-xs text-[var(--color-outline)]">{item.categoria || '-'}</td>
                      <td className="py-2 pr-4 text-right font-mono text-sm">R$ {item.valor_consumo.toFixed(2)}</td>
                      <td className="py-2 pr-4 text-right font-mono text-sm">{item.percentual.toFixed(1)}%</td>
                      <td className="py-2 pr-4 text-right font-mono text-sm text-[var(--color-outline)]">{item.percentual_acumulado.toFixed(1)}%</td>
                      <td className="py-2 pr-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${getAbcColor(item.classificacao)} bg-current/10`}>
                          {item.classificacao}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-right font-mono text-sm">{item.estoque_atual.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Ponto de Pedido */}
      {tab === 'pedido' && pedido && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <StatsCard title="Total de Insumos" value={pedido.resumo.total} icon={<Package size={20} />} variant="primary" />
            <StatsCard title="Urgentes" value={pedido.resumo.urgentes} icon={<AlertTriangle size={20} />} variant="error" subtitle="Abaixo do estoque de segurança" />
            <StatsCard title="Repor em Breve" value={pedido.resumo.repor_em_breve} icon={<Clock size={20} />} variant="warning" subtitle="Abaixo do ponto de pedido" />
            <StatsCard title="OK" value={pedido.resumo.ok} icon={<TrendingUp size={20} />} variant="success" subtitle="Estoque adequado" />
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-mono tracking-wider text-[var(--color-outline)] uppercase border-b border-[rgba(var(--overlay-rgb),0.06)]">
                    <th className="pb-2 pr-4">Insumo</th>
                    <th className="pb-2 pr-4 text-right">Estoque</th>
                    <th className="pb-2 pr-4 text-right">Consumo/dia</th>
                    <th className="pb-2 pr-4 text-right">Ponto Pedido</th>
                    <th className="pb-2 pr-4 text-right">Repor</th>
                    <th className="pb-2 pr-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pedido.itens.map((item) => (
                    <tr key={item.insumo_id} className="border-b border-[rgba(var(--overlay-rgb),0.03)] hover:bg-[rgba(var(--overlay-rgb),0.02)]">
                      <td className="py-2 pr-4">
                        <span className="text-sm font-medium text-[var(--color-on-surface)]">{item.nome}</span>
                        <span className="text-xs text-[var(--color-outline)] ml-2">({item.unidade_medida})</span>
                      </td>
                      <td className="py-2 pr-4 text-right font-mono text-sm">{item.estoque_atual.toFixed(1)}</td>
                      <td className="py-2 pr-4 text-right font-mono text-sm text-[var(--color-on-surface-variant)]">{item.consumo_diario_medio.toFixed(3)}</td>
                      <td className="py-2 pr-4 text-right font-mono text-sm text-[var(--color-primary)]">{item.ponto_pedido.toFixed(1)}</td>
                      <td className="py-2 pr-4 text-right font-mono text-sm font-bold">{item.quantidade_repor.toFixed(1)}</td>
                      <td className="py-2 pr-4 text-center">
                        <Badge variant={getStatusBadge(item.status)}>{getStatusLabel(item.status)}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
