import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  DollarSign,
  BarChart3,
  PieChart,
} from 'lucide-react';
import Card from '../components/Card';
import StatsCard from '../components/StatsCard';
import Button from '../components/Button';
import { financeiroPlusService } from '../services/api';
import type { DRE as DREProps, VendasPorCategoria, MetasFinanceiras } from '../types';

type Tab = 'dre' | 'vendas' | 'metas';

export default function DRE() {
  const [tab, setTab] = useState<Tab>('dre');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [dre, setDre] = useState<DREProps | null>(null);
  const [vendas, setVendas] = useState<VendasPorCategoria | null>(null);
  const [metas, setMetas] = useState<MetasFinanceiras | null>(null);
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [dreRes, vendasRes, metasRes] = await Promise.all([
        financeiroPlusService.dre(),
        financeiroPlusService.vendasPorCategoria(),
        financeiroPlusService.metas(),
      ]);
      setDre(dreRes.data);
      setVendas(vendasRes.data);
      setMetas(metasRes.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [dreRes, vendasRes, metasRes] = await Promise.all([
        financeiroPlusService.dre(),
        financeiroPlusService.vendasPorCategoria(),
        financeiroPlusService.metas(),
      ]);
      setDre(dreRes.data);
      setVendas(vendasRes.data);
      setMetas(metasRes.data);
    } catch {}
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-outline)] text-sm">
        Carregando DRE...
      </div>
    );
  }

  const tabs = [
    { id: 'dre' as Tab, label: 'DRE', icon: <BarChart3 size={14} /> },
    { id: 'vendas' as Tab, label: 'Vendas por Categoria', icon: <PieChart size={14} /> },
    { id: 'metas' as Tab, label: 'Metas vs Realizado', icon: <TrendingUp size={14} /> },
  ];

  const DreLine = ({ label, value, pct, color, isTotal }: { label: string; value: string; pct?: string; color: string; isTotal?: boolean }) => (
    <div className={`flex items-center justify-between py-2 ${isTotal ? 'border-t-2 border-[var(--color-primary)]/30 mt-2 pt-3' : 'border-b border-[rgba(255,255,255,0.04)]'}`}>
      <span className={`text-sm ${isTotal ? 'font-bold text-[var(--color-on-surface)]' : 'text-[var(--color-on-surface-variant)]'}`}>
        {label}
      </span>
      <div className="flex items-center gap-3">
        {pct && <span className="text-xs font-mono text-[var(--color-outline)]">{pct}</span>}
        <span className={`text-sm font-mono font-bold ${color}`}>{value}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg font-bold text-[var(--color-on-surface)]">DEMONSTRATIVO DE RESULTADOS</h1>
          <p className="text-label-md text-[var(--color-outline)] mt-1 uppercase">DRE, Vendas por Categoria & Metas</p>
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

      <Card className="!p-1">
        <div className="flex gap-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                tab === t.id
                  ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] shadow-[0_0_8px_rgba(0,218,243,0.15)]'
                  : 'text-[var(--color-on-surface-variant)] hover:bg-[rgba(255,255,255,0.04)]'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      {tab === 'dre' && dre && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Receita Bruta" value={`R$ ${dre.receita_bruta.toFixed(2)}`} icon={<DollarSign size={20} />} variant="success" />
            <StatsCard title="CMV" value={`R$ ${dre.cmv.toFixed(2)}`} icon={<TrendingUp size={20} />} variant="warning" subtitle={`${dre.cmv > 0 ? ((dre.cmv / dre.receita_bruta) * 100).toFixed(1) : 0}% da receita`} />
            <StatsCard title="Lucro Operacional" value={`R$ ${dre.lucro_operacional.toFixed(2)}`} icon={<BarChart3 size={20} />} variant={dre.lucro_operacional >= 0 ? 'success' : 'error'} />
            <StatsCard title="Margem Líquida" value={`${dre.margem_liquida.toFixed(1)}%`} icon={<PieChart size={20} />} variant={dre.margem_liquida >= 15 ? 'success' : dre.margem_liquida >= 5 ? 'primary' : 'error'} />
          </div>

          <Card>
            <h3 className="text-label-sm font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-4">
              DRE - Demonstrativo de Resultados
              <span className="ml-2 text-[10px] text-[var(--color-outline)] font-normal">
                {dre.periodo.data_inicio.slice(0, 7)}
              </span>
            </h3>
            <DreLine label="Receita Bruta" value={`R$ ${dre.receita_bruta.toFixed(2)}`} pct="100%" color="text-green-400" />
            <DreLine label="Deduções / Impostos" value={`- R$ ${dre.deducoes_impostos.toFixed(2)}`} pct={`${dre.aliquota_impostos_pct}%`} color="text-red-400" />
            <DreLine label="Receita Líquida" value={`R$ ${dre.receita_liquida.toFixed(2)}`} pct={`${(dre.receita_liquida / dre.receita_bruta * 100).toFixed(1)}%`} color="text-cyan-400" />
            <DreLine label="(-) CMV" value={`- R$ ${dre.cmv.toFixed(2)}`} pct={`${(dre.cmv / dre.receita_bruta * 100).toFixed(1)}%`} color="text-amber-400" />
            <DreLine label="(-) Custos Fixos" value={`- R$ ${dre.custos_fixos.toFixed(2)}`} pct={`${(dre.custos_fixos / dre.receita_bruta * 100).toFixed(1)}%`} color="text-amber-400" />
            <DreLine
              label="Lucro Operacional"
              value={`R$ ${dre.lucro_operacional.toFixed(2)}`}
              pct={`${dre.margem_liquida.toFixed(1)}%`}
              color={dre.lucro_operacional >= 0 ? 'text-green-400' : 'text-red-400'}
              isTotal
            />
          </Card>
        </div>
      )}

      {tab === 'vendas' && vendas && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard title="Total Receita" value={`R$ ${vendas.total_receita.toFixed(2)}`} icon={<DollarSign size={20} />} variant="success" />
            <StatsCard title="Categorias" value={vendas.categorias.length} icon={<PieChart size={20} />} variant="primary" />
            <StatsCard title="Principal Categoria" value={vendas.categorias[0]?.categoria || '-'} icon={<BarChart3 size={20} />} variant="info" subtitle={`${vendas.categorias[0]?.percentual || 0}% da receita`} />
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-mono tracking-wider text-[var(--color-outline)] uppercase border-b border-[rgba(255,255,255,0.06)]">
                    <th className="pb-2 pr-4">Categoria</th>
                    <th className="pb-2 pr-4 text-right">Vendas</th>
                    <th className="pb-2 pr-4 text-right">Quantidade</th>
                    <th className="pb-2 pr-4 text-right">Receita</th>
                    <th className="pb-2 pr-4 text-right">%</th>
                    <th className="pb-2 pr-4">Barra</th>
                  </tr>
                </thead>
                <tbody>
                  {vendas.categorias.map((cat) => (
                    <tr key={cat.categoria} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)]">
                      <td className="py-2 pr-4 text-sm text-[var(--color-on-surface)]">{cat.categoria}</td>
                      <td className="py-2 pr-4 text-right font-mono text-sm">{cat.total_vendas}</td>
                      <td className="py-2 pr-4 text-right font-mono text-sm">{cat.quantidade_total.toFixed(0)}</td>
                      <td className="py-2 pr-4 text-right font-mono text-sm text-green-400">R$ {cat.receita.toFixed(2)}</td>
                      <td className="py-2 pr-4 text-right font-mono text-sm">{cat.percentual.toFixed(1)}%</td>
                      <td className="py-2 pr-4">
                        <div className="w-full h-2 rounded-full bg-[var(--color-surface-container)] overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary)]/60" style={{ width: `${cat.percentual}%` }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab === 'metas' && metas && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(metas.metas_padrao).map(([key, val]) => {
              const semMeta = val.meta === 0;
              const pct = semMeta ? 0 : Math.round((val.realizado / val.meta) * 100);
              const isCmv = key === 'cmv';
              const metaAtingida = semMeta ? false : (isCmv ? val.realizado <= val.meta : val.realizado >= val.meta);
              return (
                <Card key={key} className={`border-l-4 ${semMeta ? 'border-l-[var(--color-outline)]' : metaAtingida ? 'border-l-green-500' : 'border-l-amber-500'}`}>
                  <p className="text-xs font-mono tracking-wider text-[var(--color-on-surface-variant)] uppercase mb-1">
                    {key === 'receita' ? 'Receita' : key === 'cmv' ? 'CMV' : key === 'lucro' ? 'Lucro' : 'Ticket Médio'}
                  </p>
                  <p className="text-headline-sm font-bold text-[var(--color-on-surface)]">
                    {key === 'cmv' ? `${val.realizado}%` : `R$ ${val.realizado.toFixed(2)}`}
                  </p>
                  {semMeta ? (
                    <p className="text-[10px] text-[var(--color-outline)] mt-2">Meta não configurada</p>
                  ) : (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--color-surface-container)] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${metaAtingida ? 'bg-green-500' : 'bg-amber-500'}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-mono ${metaAtingida ? 'text-green-400' : 'text-amber-400'}`}>
                        {isCmv ? `${val.meta}% alvo` : `Meta: R$ ${val.meta.toFixed(0)}`}
                      </span>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
