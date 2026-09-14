import { useState, useEffect, useCallback } from 'react';
import { Trophy, TrendingUp, TrendingDown, AlertTriangle, BarChart3, DollarSign, Percent, Filter } from 'lucide-react';
import { rankingsService } from '../services/api';

type Tab = 'mais-vendidos' | 'maior-cmv' | 'melhor-cmv' | 'maior-lucro' | 'prejuizos' | 'maior-receita' | 'melhor-margem' | 'por-categoria';
type Periodo = 7 | 30 | 90;

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'mais-vendidos', label: 'Mais Vendidos', icon: Trophy },
  { key: 'maior-receita', label: 'Maior Receita', icon: DollarSign },
  { key: 'maior-lucro', label: 'Maior Lucro', icon: TrendingUp },
  { key: 'melhor-margem', label: 'Melhor Margem', icon: Percent },
  { key: 'melhor-cmv', label: 'Melhor CMV', icon: TrendingDown },
  { key: 'maior-cmv', label: 'Maior CMV', icon: AlertTriangle },
  { key: 'prejuizos', label: 'Prejuizos', icon: AlertTriangle },
  { key: 'por-categoria', label: 'Por Categoria', icon: BarChart3 },
];

const CATEGORIAS = ['drinks', 'cervejas', 'vinhos', 'destilados', 'comidas', 'porcoes', 'alcoolico', 'nao-alcoolico'];

function BarChart({ items, maxValue, valueKey, labelKey, color }: {
  items: { nome: string; valor: number; rank?: number }[];
  maxValue: number;
  valueKey: string;
  labelKey: string;
  color: string;
}) {
  return (
    <div className='space-y-2'>
      {items.map((item: any, i: number) => {
        const pct = maxValue > 0 ? (item[valueKey] / maxValue) * 100 : 0;
        return (
          <div key={i} className='flex items-center gap-2'>
            <span className='text-[10px] text-[var(--color-outline)] w-4 text-right shrink-0'>{item.rank || i + 1}</span>
            <div className='flex-1 min-w-0'>
              <p className='text-xs text-[var(--color-on-surface)] truncate'>{item[labelKey]}</p>
              <div className='w-full h-1.5 rounded-full bg-[var(--color-surface-container-high)] overflow-hidden mt-0.5'>
                <div className='h-full rounded-full transition-all' style={{ width: pct + '%', backgroundColor: color }} />
              </div>
            </div>
            <span className='text-xs font-mono text-[var(--color-on-surface-variant)] shrink-0'>
              {typeof item[valueKey] === 'number'
                ? valueKey.includes('pct')
                  ? item[valueKey] + '%'
                  : 'R$ ' + item[valueKey].toLocaleString('pt-BR', { minimumFractionDigits: 2 })
                : item[valueKey]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function PrejuizosList({ items }: { items: any[] }) {
  if (items.length === 0) {
    return <p className='text-xs text-[var(--color-outline)] text-center py-8'>Nenhum prejuizo encontrado</p>;
  }
  return (
    <div className='space-y-2'>
      {items.map((item: any, i: number) => (
        <div key={i} className='p-3 bg-[var(--color-error)]/10 border border-[var(--color-error)]/20 rounded-lg'>
          <div className='flex items-center justify-between'>
            <div className='min-w-0 flex-1'>
              <p className='text-xs font-semibold text-[var(--color-on-surface)] truncate'>{item.nome}</p>
              <p className='text-[10px] text-[var(--color-on-surface-variant)]'>{item.categoria}</p>
            </div>
            <div className='text-right shrink-0 ml-2'>
              <p className='text-xs font-mono text-[var(--color-error)]'>
                -R$ {item.prejuizo?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
              </p>
              <p className='text-[10px] text-[var(--color-on-surface-variant)]'>
                Custo: R$ {item.custo?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | Venda: R$ {item.receita?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CategoriaList({ items }: { items: any[] }) {
  if (items.length === 0) {
    return <p className='text-xs text-[var(--color-outline)] text-center py-8'>Nenhuma categoria encontrada</p>;
  }
  const maxReceita = Math.max(...items.map((c: any) => c.receita), 1);
  return (
    <div className='space-y-2'>
      {items.map((cat: any, i: number) => {
        const pct = maxReceita > 0 ? (cat.receita / maxReceita) * 100 : 0;
        return (
          <div key={i} className='p-3 bg-[var(--color-surface-container)] rounded-lg'>
            <div className='flex items-center justify-between mb-1.5'>
              <p className='text-xs font-semibold text-[var(--color-on-surface)]'>{cat.categoria}</p>
              <span className='text-[10px] font-mono text-[var(--color-primary)]'>
                {cat.total_produtos} produtos
              </span>
            </div>
            <div className='w-full h-1.5 rounded-full bg-[var(--color-surface-container-high)] overflow-hidden mb-2'>
              <div className='h-full rounded-full bg-[var(--color-primary)]' style={{ width: pct + '%' }} />
            </div>
            <div className='grid grid-cols-3 gap-2'>
              <div>
                <p className='text-[10px] text-[var(--color-outline)]'>Receita</p>
                <p className='text-xs font-mono text-green-400'>
                  R$ {cat.receita?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className='text-[10px] text-[var(--color-outline)]'>Custo</p>
                <p className='text-xs font-mono text-amber-400'>
                  R$ {cat.custo?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className='text-[10px] text-[var(--color-outline)]'>Margem</p>
                <p className='text-xs font-mono text-green-400'>
                  {cat.margem_pct?.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Rankings() {
  const [tab, setTab] = useState<Tab>('mais-vendidos');
  const [periodo, setPeriodo] = useState<Periodo>(30);
  const [categoria, setCategoria] = useState<string>('');
  const [showCategoriaFilter, setShowCategoriaFilter] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { dias: periodo };
      if (categoria) params.categoria = categoria;
      let res;
      switch (tab) {
        case 'mais-vendidos': res = await rankingsService.maisVendidos(params); break;
        case 'maior-cmv': res = await rankingsService.maiorCmv(params); break;
        case 'melhor-cmv': res = await rankingsService.melhorCmv(params); break;
        case 'maior-lucro': res = await rankingsService.maiorLucro(params); break;
        case 'prejuizos': res = await rankingsService.prejuizos(params); break;
        case 'maior-receita': res = await rankingsService.maiorReceita(params); break;
        case 'melhor-margem': res = await rankingsService.melhorMargem(params); break;
        case 'por-categoria': res = await rankingsService.porCategoria(params); break;
      }
      setData(res?.data || null);
    } catch {} finally { setLoading(false); }
  }, [tab, periodo, categoria]);

  useEffect(() => { load(); }, [load]);

  const renderContent = () => {
    if (loading) return <div className='py-12 text-center text-sm text-[var(--color-outline)]'>Carregando...</div>;
    if (!data) return <div className='py-12 text-center text-sm text-[var(--color-outline)]'>Sem dados</div>;

    if (tab === 'prejuizos') return <PrejuizosList items={data.itens || []} />;
    if (tab === 'por-categoria') return <CategoriaList items={data.categorias || []} />;

    const items = data.itens || [];
    if (items.length === 0) return <p className='text-xs text-[var(--color-outline)] text-center py-8'>Nenhum dado encontrado</p>;

    const maxValue = Math.max(...items.map((i: any) => i.valor), 1);
    const colors: Record<string, string> = {
      'mais-vendidos': 'var(--color-primary)',
      'maior-cmv': 'var(--color-error)',
      'melhor-cmv': 'var(--color-secondary-container)',
      'maior-lucro': '#22c55e',
      'maior-receita': '#3b82f6',
      'melhor-margem': '#22c55e',
    };

    return (
      <div className='bg-[var(--color-surface-container)] p-3 rounded-xl'>
        <div className='flex items-center justify-between mb-3'>
          <p className='text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase'>
            {TABS.find(t => t.key === tab)?.label}
          </p>
          <p className='text-[10px] text-[var(--color-outline)]'>{items.length} itens</p>
        </div>
        <BarChart items={items} maxValue={maxValue} valueKey='valor' labelKey='nome' color={colors[tab] || 'var(--color-primary)'} />
      </div>
    );
  };

  return (
    <div className='flex flex-col h-full'>
      <div className='px-4 pt-4 pb-3'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-lg font-bold text-[var(--color-on-surface)]'>Rankings</h1>
            <p className='text-xs text-[var(--color-on-surface-variant)]'>Analytics e performance</p>
          </div>
          <button
            onClick={() => setShowCategoriaFilter(!showCategoriaFilter)}
            className={showCategoriaFilter || categoria ? 'w-9 h-9 rounded-full flex items-center justify-center bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]' : 'w-9 h-9 rounded-full flex items-center justify-center bg-[var(--color-surface-container-high)] text-[var(--color-outline)]'}
          >
            <Filter size={16} />
          </button>
        </div>
      </div>

      {showCategoriaFilter && (
        <div className='px-4 pb-2'>
          <div className='flex gap-1 flex-wrap'>
            <button
              onClick={() => setCategoria('')}
              className={!categoria ? 'px-2.5 py-1 rounded-full text-[10px] font-medium bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]' : 'px-2.5 py-1 rounded-full text-[10px] font-medium bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'}
            >
              Todos
            </button>
            {CATEGORIAS.map(c => (
              <button
                key={c}
                onClick={() => setCategoria(c)}
                className={categoria === c ? 'px-2.5 py-1 rounded-full text-[10px] font-medium bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]' : 'px-2.5 py-1 rounded-full text-[10px] font-medium bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className='px-4 pb-2 flex gap-1.5'>
        {([7, 30, 90] as Periodo[]).map(p => (
          <button key={p} onClick={() => setPeriodo(p)} className={periodo === p ? 'flex-1 py-1.5 rounded-lg text-[10px] font-medium bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]' : 'flex-1 py-1.5 rounded-lg text-[10px] font-medium bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'}>
            {p} dias
          </button>
        ))}
      </div>

      <div className='px-4 pb-2'>
        <div className='flex gap-1 overflow-x-auto' style={{ scrollbarWidth: 'none' }}>
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={tab === t.key ? 'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap shrink-0 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]' : 'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap shrink-0 bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'}
              >
                <Icon size={12} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className='flex-1 overflow-y-auto px-4 pb-6'>
        {renderContent()}
      </div>
    </div>
  );
}
