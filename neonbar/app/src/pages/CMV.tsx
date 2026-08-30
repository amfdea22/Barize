import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Package, BarChart3 } from 'lucide-react';
import { cmvService, cmvRelatoriosService } from '../services/api';
import type { CMVResult, CMVProdutosResult } from '../types';

type Tab = 'produtos' | 'categorias' | 'insumos';

export default function CMV() {
  const [cmv, setCmv] = useState<CMVResult | null>(null);
  const [_loading, setLoading] = useState(true);
  const [_error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('produtos');
  const [produtos, setProdutos] = useState<CMVProdutosResult | null>(null);
  const [dataInicio, _setDataInicio] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]; });
  const [dataFim, _setDataFim] = useState(() => new Date().toISOString().split('T')[0]);
  const [relLoading, setRelLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await cmvService.calcular(30);
      setCmv(res.data);
    } catch (err: any) { setError(err?.response?.data?.detail || 'Erro'); }
    finally { setLoading(false); }
  };

  const loadProdutos = useCallback(async () => {
    setRelLoading(true);
    try {
      const res = await cmvRelatoriosService.produtos({ data_inicio: dataInicio, data_fim: dataFim, order_by: 'receita' });
      setProdutos(res.data);
    } catch {} finally { setRelLoading(false); }
  }, [dataInicio, dataFim]);

  useEffect(() => { load(); }, []);
  useEffect(() => { loadProdutos(); }, [loadProdutos]);

  const cmvPct = cmv?.cmv_percentual ?? 0;
  const cmvColor = cmvPct <= 25 ? 'text-green-400' : cmvPct <= 40 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-on-surface)]">CMV</h1>
          <p className="text-xs text-[var(--color-on-surface-variant)]">Custo da Mercadoria Vendida</p>
        </div>
        <button onClick={() => { load(); loadProdutos(); }} className="p-2 rounded-lg bg-[var(--color-surface-container-high)]">
          <RefreshCw size={16} className="text-[var(--color-on-surface-variant)]" />
        </button>
      </div>

      <div className="px-4 pb-3 grid grid-cols-3 gap-2">
        <div className="p-2 rounded-xl bg-[var(--color-surface-container)] text-center">
          <p className="text-[9px] text-[var(--color-outline)] uppercase">Custo (30d)</p>
          <p className="text-sm font-bold text-amber-400">R$ {(cmv?.custo_total ?? 0).toFixed(0)}</p>
        </div>
        <div className="p-2 rounded-xl bg-[var(--color-surface-container)] text-center">
          <p className="text-[9px] text-[var(--color-outline)] uppercase">Receita</p>
          <p className="text-sm font-bold text-green-400">R$ {(cmv?.receita_total ?? 0).toFixed(0)}</p>
        </div>
        <div className="p-2 rounded-xl bg-[var(--color-surface-container)] text-center">
          <p className="text-[9px] text-[var(--color-outline)] uppercase">CMV %</p>
          <p className={`text-sm font-bold ${cmvColor}`}>{cmvPct.toFixed(1)}%</p>
        </div>
      </div>

      <div className="px-4 pb-2 flex gap-1">
        {(['produtos', 'categorias', 'insumos'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium ${tab === t ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]' : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'}`}>
            {t === 'produtos' ? <BarChart3 size={12} /> : t === 'categorias' ? <Package size={12} /> : <Package size={12} />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
        {relLoading ? (
          <div className="py-12 text-center text-sm text-[var(--color-outline)]">Carregando...</div>
        ) : tab === 'produtos' && produtos?.produtos ? (
          produtos.produtos.map(p => (
            <div key={p.produto_id} className="p-3 rounded-xl bg-[var(--color-surface-container)] flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--color-on-surface)] truncate">{p.nome}</p>
                <p className="text-[10px] text-[var(--color-on-surface-variant)]">{p.categoria || '–'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-mono text-[var(--color-on-surface)]">R$ {p.receita.toFixed(2)}</p>
                <p className={`text-xs font-mono font-bold ${p.cmv_pct <= 40 ? 'text-green-400' : p.cmv_pct <= 60 ? 'text-amber-400' : 'text-[var(--color-error)]'}`}>
                  CMV {p.cmv_pct.toFixed(1)}%
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-sm text-[var(--color-outline)]">Nenhum dado</div>
        )}
      </div>
    </div>
  );
}
