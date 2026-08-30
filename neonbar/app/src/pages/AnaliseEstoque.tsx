import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Clock, BarChart3 } from 'lucide-react';
import { analiseEstoqueService } from '../services/api';
import type { GiroEstoque, CurvaABC, PontoPedido } from '../types';
import Badge from '../components/Badge';

type Tab = 'giro' | 'abc' | 'pedido';

export default function AnaliseEstoque() {
  const [tab, setTab] = useState<Tab>('giro');
  const [loading, setLoading] = useState(true);
  const [giro, setGiro] = useState<GiroEstoque | null>(null);
  const [abc, setAbc] = useState<CurvaABC | null>(null);
  const [pedido, setPedido] = useState<PontoPedido | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [g, a, p] = await Promise.all([
        analiseEstoqueService.giro(30),
        analiseEstoqueService.abc(90),
        analiseEstoqueService.pontoPedido(),
      ]);
      setGiro(g.data); setAbc(a.data); setPedido(p.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getAbcColor = (c: string) => c === 'A' ? 'text-red-400' : c === 'B' ? 'text-amber-400' : 'text-green-400';
  const getStatusBadge = (s: string): 'error' | 'warning' | 'success' => s === 'urgente' ? 'error' : s === 'repor_em_breve' ? 'warning' : 'success';

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-on-surface)]">Análise de Estoque</h1>
          <p className="text-xs text-[var(--color-on-surface-variant)]">Giro, ABC & Pedido</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-[var(--color-surface-container-high)]">
          <RefreshCw size={16} className="text-[var(--color-on-surface-variant)]" />
        </button>
      </div>

      <div className="px-4 pb-3 flex gap-1">
        {([
          { id: 'giro' as Tab, label: 'Giro', icon: RefreshCw },
          { id: 'abc' as Tab, label: 'ABC', icon: BarChart3 },
          { id: 'pedido' as Tab, label: 'Pedido', icon: Clock },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1 flex-1 py-2 rounded-lg text-xs font-medium ${tab === t.id ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]' : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'}`}>
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {loading ? <div className="py-12 text-center text-sm text-[var(--color-outline)]">Carregando...</div> :

          tab === 'giro' && giro ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-[var(--color-surface-container)]">
                  <p className="text-[10px] text-[var(--color-outline)] uppercase">Giro</p>
                  <p className="text-lg font-bold text-[var(--color-primary)]">{giro.giro_estoque.toFixed(2)}</p>
                  <p className="text-[10px] text-[var(--color-on-surface-variant)]">{giro.interpretacao}</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-surface-container)]">
                  <p className="text-[10px] text-[var(--color-outline)] uppercase">Cobertura</p>
                  <p className="text-lg font-bold text-amber-400">{giro.dias_cobertura.toFixed(1)}d</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-surface-container)]">
                  <p className="text-[10px] text-[var(--color-outline)] uppercase">Custo Vendas</p>
                  <p className="text-sm font-bold text-[var(--color-on-surface)]">R$ {giro.custo_vendas_periodo.toFixed(0)}</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-surface-container)]">
                  <p className="text-[10px] text-[var(--color-outline)] uppercase">Estoque Médio</p>
                  <p className="text-sm font-bold text-[var(--color-on-surface)]">R$ {giro.estoque_medio_valor.toFixed(0)}</p>
                </div>
              </div>
            </>
          ) : tab === 'abc' && abc ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-xl bg-[var(--color-surface-container)] border-l-3 border-l-red-500">
                  <p className="text-[9px] text-[var(--color-outline)] uppercase">A</p>
                  <p className="text-sm font-bold">{abc.resumo.A.itens} itens</p>
                  <p className="text-[9px] text-[var(--color-outline)]">{abc.resumo.A.percentual}%</p>
                </div>
                <div className="p-2 rounded-xl bg-[var(--color-surface-container)] border-l-3 border-l-amber-500">
                  <p className="text-[9px] text-[var(--color-outline)] uppercase">B</p>
                  <p className="text-sm font-bold">{abc.resumo.B.itens} itens</p>
                  <p className="text-[9px] text-[var(--color-outline)]">{abc.resumo.B.percentual}%</p>
                </div>
                <div className="p-2 rounded-xl bg-[var(--color-surface-container)] border-l-3 border-l-green-500">
                  <p className="text-[9px] text-[var(--color-outline)] uppercase">C</p>
                  <p className="text-sm font-bold">{abc.resumo.C.itens} itens</p>
                  <p className="text-[9px] text-[var(--color-outline)]">{abc.resumo.C.percentual}%</p>
                </div>
              </div>
              <div className="rounded-xl bg-[var(--color-surface-container)] p-3 space-y-2">
                {abc.itens.slice(0, 20).map(item => (
                  <div key={item.insumo_id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--color-on-surface)] truncate">{item.nome}</p>
                      <p className="text-[10px] text-[var(--color-outline)]">{item.categoria || '–'}</p>
                    </div>
                    <span className={`text-xs font-bold ${getAbcColor(item.classificacao)} shrink-0 ml-2`}>{item.classificacao}</span>
                  </div>
                ))}
              </div>
            </>
          ) : tab === 'pedido' && pedido ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-xl bg-[var(--color-surface-container)] text-center">
                  <p className="text-[9px] text-[var(--color-outline)] uppercase">Urgentes</p>
                  <p className="text-lg font-bold text-[var(--color-error)]">{pedido.resumo.urgentes}</p>
                </div>
                <div className="p-2 rounded-xl bg-[var(--color-surface-container)] text-center">
                  <p className="text-[9px] text-[var(--color-outline)] uppercase">Repor</p>
                  <p className="text-lg font-bold text-amber-400">{pedido.resumo.repor_em_breve}</p>
                </div>
                <div className="p-2 rounded-xl bg-[var(--color-surface-container)] text-center">
                  <p className="text-[9px] text-[var(--color-outline)] uppercase">OK</p>
                  <p className="text-lg font-bold text-green-400">{pedido.resumo.ok}</p>
                </div>
              </div>
              <div className="rounded-xl bg-[var(--color-surface-container)] p-3 space-y-2">
                {pedido.itens.map(item => (
                  <div key={item.insumo_id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[var(--color-on-surface)] truncate">{item.nome}</p>
                      <p className="text-[10px] text-[var(--color-outline)]">Estoque: {item.estoque_atual.toFixed(1)} | P.P.: {item.ponto_pedido.toFixed(1)}</p>
                    </div>
                    <Badge variant={getStatusBadge(item.status)}>{item.status === 'urgente' ? 'Urgente' : item.status === 'repor_em_breve' ? 'Repor' : 'OK'}</Badge>
                  </div>
                ))}
              </div>
            </>
          ) : <div className="py-12 text-center text-sm text-[var(--color-outline)]">Nenhum dado</div>
        }
      </div>
    </div>
  );
}
