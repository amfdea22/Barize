import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { financeiroPlusService } from '../services/api';
import type { DRE as DREType, VendasPorCategoria, MetasFinanceiras } from '../types';


type Tab = 'dre' | 'vendas' | 'metas';

export default function DRE() {
  const [tab, setTab] = useState<Tab>('dre');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dre, setDre] = useState<DREType | null>(null);
  const [vendas, setVendas] = useState<VendasPorCategoria | null>(null);
  const [metas, setMetas] = useState<MetasFinanceiras | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [d, v, m] = await Promise.all([
        financeiroPlusService.dre(),
        financeiroPlusService.vendasPorCategoria(),
        financeiroPlusService.metas(),
      ]);
      setDre(d.data); setVendas(v.data); setMetas(m.data);
    } catch (err: any) { setError(err?.response?.data?.detail || 'Erro'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex items-center justify-center h-64 text-sm text-[var(--color-outline)]">Carregando...</div>;

  const DreLine = ({ label, value, pct, color, bold }: { label: string; value: string; pct?: string; color: string; bold?: boolean }) => (
    <div className="flex items-center justify-between py-2 border-b border-[rgba(var(--overlay-rgb),0.04)]">
      <span className={`text-sm ${bold ? 'font-bold text-[var(--color-on-surface)]' : 'text-[var(--color-on-surface-variant)]'}`}>{label}</span>
      <div className="flex items-center gap-2">
        {pct && <span className="text-[10px] font-mono text-[var(--color-outline)]">{pct}</span>}
        <span className={`text-sm font-mono font-bold ${color}`}>{value}</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-on-surface)]">DRE</h1>
          <p className="text-xs text-[var(--color-on-surface-variant)]">Demonstração do Resultado</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-[var(--color-surface-container-high)]">
          <RefreshCw size={16} className="text-[var(--color-on-surface-variant)]" />
        </button>
      </div>

      <div className="px-4 pb-3 flex gap-1">
        {(['dre', 'vendas', 'metas'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2 rounded-lg text-xs font-medium ${tab === t ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]' : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'}`}>
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {error && (
        <div className="mx-4 mb-3 p-2 rounded-lg bg-[var(--color-error)]/10 text-xs text-[var(--color-error)] flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {tab === 'dre' && dre && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-[var(--color-surface-container)]">
                <p className="text-[10px] text-[var(--color-outline)] uppercase">Receita Bruta</p>
                <p className="text-lg font-bold text-green-400">R$ {dre.receita_bruta.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-surface-container)]">
                <p className="text-[10px] text-[var(--color-outline)] uppercase">CMV</p>
                <p className="text-lg font-bold text-amber-400">R$ {dre.cmv.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-surface-container)]">
                <p className="text-[10px] text-[var(--color-outline)] uppercase">Lucro</p>
                <p className={`text-lg font-bold ${dre.lucro_operacional >= 0 ? 'text-green-400' : 'text-[var(--color-error)]'}`}>R$ {dre.lucro_operacional.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-surface-container)]">
                <p className="text-[10px] text-[var(--color-outline)] uppercase">Margem</p>
                <p className={`text-lg font-bold ${dre.margem_liquida >= 15 ? 'text-green-400' : dre.margem_liquida >= 5 ? 'text-[var(--color-primary)]' : 'text-[var(--color-error)]'}`}>{dre.margem_liquida.toFixed(1)}%</p>
              </div>
            </div>
            <div className="rounded-xl bg-[var(--color-surface-container)] p-3">
              <DreLine label="Receita Bruta" value={`R$ ${dre.receita_bruta.toFixed(2)}`} pct="100%" color="text-green-400" />
              <DreLine label="Deduções" value={`- R$ ${dre.deducoes_impostos.toFixed(2)}`} pct={`${dre.aliquota_impostos_pct}%`} color="text-red-400" />
              <DreLine label="Receita Líquida" value={`R$ ${dre.receita_liquida.toFixed(2)}`} color="text-cyan-400" />
              <DreLine label="(-) CMV" value={`- R$ ${dre.cmv.toFixed(2)}`} color="text-amber-400" />
              <DreLine label="(-) Custos Fixos" value={`- R$ ${dre.custos_fixos.toFixed(2)}`} color="text-amber-400" />
              <DreLine label="Lucro Operacional" value={`R$ ${dre.lucro_operacional.toFixed(2)}`} color={dre.lucro_operacional >= 0 ? 'text-green-400' : 'text-[var(--color-error)]'} bold />
            </div>
          </>
        )}

        {tab === 'vendas' && vendas && (
          <div className="rounded-xl bg-[var(--color-surface-container)] p-3 space-y-2">
            {vendas.categorias.map(cat => (
              <div key={cat.categoria} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[var(--color-on-surface)]">{cat.categoria}</p>
                  <div className="w-full h-1.5 rounded-full bg-[var(--color-surface-container-high)] overflow-hidden mt-1">
                    <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${cat.percentual}%` }} />
                  </div>
                </div>
                <span className="text-xs font-mono text-green-400 shrink-0">R$ {cat.receita.toFixed(2)}</span>
                <span className="text-[10px] text-[var(--color-outline)] shrink-0">{cat.percentual.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'metas' && metas && (
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(metas.metas_padrao).map(([key, val]) => {
              const ok = key === 'cmv' ? val.realizado <= val.meta : val.realizado >= val.meta;
              return (
                <div key={key} className={`p-3 rounded-xl bg-[var(--color-surface-container)] border-l-4 ${ok ? 'border-l-green-500' : 'border-l-amber-500'}`}>
                  <p className="text-[10px] text-[var(--color-outline)] uppercase">{key === 'receita' ? 'Receita' : key === 'cmv' ? 'CMV' : key}</p>
                  <p className="text-sm font-bold text-[var(--color-on-surface)]">
                    {key === 'cmv' ? `${val.realizado}%` : `R$ ${val.realizado.toFixed(2)}`}
                  </p>
                  {val.meta > 0 && <p className="text-[10px] text-[var(--color-outline)]">Meta: {key === 'cmv' ? `${val.meta}%` : `R$ ${val.meta.toFixed(0)}`}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
