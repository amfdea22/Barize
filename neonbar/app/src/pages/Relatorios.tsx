import { useState, useEffect, useCallback } from 'react';
import { Wallet, Receipt, Scale, Users } from 'lucide-react';
import { relatoriosAnalyticsService } from '../services/api';
import type { AnalyticsResumo, TopProduto, DesempenhoEquipe } from '../types';

type Periodo = 'dia' | 'semana' | 'mes';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin', gerente: 'Gerente', garcom: 'Garçom', bartender: 'Bartender',
};

export default function Relatorios() {
  const [periodo, setPeriodo] = useState<Periodo>('dia');
  const [resumo, setResumo] = useState<AnalyticsResumo | null>(null);
  const [topProdutos, setTopProdutos] = useState<TopProduto[]>([]);
  const [desempenho, setDesempenho] = useState<DesempenhoEquipe[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p: Periodo) => {
    setLoading(true);
    try {
      const [r, t, d] = await Promise.all([
        relatoriosAnalyticsService.resumo(p),
        relatoriosAnalyticsService.topProdutos(p, 5),
        relatoriosAnalyticsService.desempenhoEquipe(p),
      ]);
      setResumo(r.data);
      setTopProdutos(t.data);
      setDesempenho(d.data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(periodo); }, [periodo, load]);

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-lg font-bold text-[var(--color-on-surface)]">Relatórios</h1>
        <p className="text-xs text-[var(--color-on-surface-variant)]">Analytics e desempenho</p>
      </div>

      <div className="px-4 pb-3 flex gap-1.5">
        {(['dia', 'semana', 'mes'] as Periodo[]).map(p => (
          <button key={p} onClick={() => setPeriodo(p)} className={`flex-1 py-2 rounded-lg text-xs font-medium ${periodo === p ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]' : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'}`}>
            {p === 'dia' ? 'Hoje' : p === 'semana' ? 'Semana' : 'Mês'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {loading ? (
          <div className="py-12 text-center text-sm text-[var(--color-outline)]">Carregando...</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-[var(--color-surface-container)]">
                <p className="text-[10px] text-[var(--color-outline)] uppercase flex items-center gap-1"><Wallet size={10} /> Receita</p>
                <p className="text-lg font-bold text-green-400">{resumo ? fmt(resumo.receita) : '–'}</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-surface-container)]">
                <p className="text-[10px] text-[var(--color-outline)] uppercase flex items-center gap-1"><Receipt size={10} /> Pedidos</p>
                <p className="text-lg font-bold text-[var(--color-primary)]">{resumo?.total_pedidos ?? '–'}</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-surface-container)]">
                <p className="text-[10px] text-[var(--color-outline)] uppercase flex items-center gap-1"><Scale size={10} /> Ticket</p>
                <p className="text-lg font-bold text-[var(--color-on-surface)]">{resumo ? fmt(resumo.ticket_medio) : '–'}</p>
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-surface-container)]">
                <p className="text-[10px] text-[var(--color-outline)] uppercase flex items-center gap-1"><Users size={10} /> Mesas</p>
                <p className="text-lg font-bold text-amber-400">{resumo?.mesas_ativas ?? '–'}</p>
              </div>
            </div>

            {topProdutos.length > 0 && (
              <div className="rounded-xl bg-[var(--color-surface-container)] p-3">
                <p className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase mb-2">Top Produtos</p>
                <div className="space-y-2">
                  {topProdutos.map((p, i) => {
                    const maxQtd = topProdutos[0]?.quantidade || 1;
                    const pct = Math.round((p.quantidade / maxQtd) * 100);
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[10px] text-[var(--color-outline)] w-4 text-right">{i + 1}.</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[var(--color-on-surface)] truncate">{p.nome}</p>
                          <div className="w-full h-1.5 rounded-full bg-[var(--color-surface-container-high)] overflow-hidden mt-0.5">
                            <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <span className="text-xs font-mono text-[var(--color-on-surface-variant)] shrink-0">{p.quantidade}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {desempenho.length > 0 && (
              <div className="rounded-xl bg-[var(--color-surface-container)] p-3">
                <p className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase mb-2">Equipe</p>
                <div className="space-y-2">
                  {desempenho.map(d => (
                    <div key={d.usuario_id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-surface-container-high)] flex items-center justify-center text-xs font-bold text-[var(--color-primary)] shrink-0">
                        {d.nome?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[var(--color-on-surface)] truncate">{d.nome}</p>
                        <p className="text-[10px] text-[var(--color-on-surface-variant)]">{ROLE_LABEL[d.role] || d.role}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-mono text-[var(--color-on-surface)]">{d.vendas} vendas</p>
                        <p className="text-[10px] font-mono text-[var(--color-primary)]">{fmt(d.volume)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
