import { useState, useEffect, useCallback } from 'react';
import { DollarSign, RefreshCw, AlertTriangle, ChevronRight } from 'lucide-react';
import { precificacaoService } from '../services/api';
import type { PrecificacaoItem } from '../types';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { toast } from '../components/Toast';

export default function Precificacao() {
  const [produtos, setProdutos] = useState<PrecificacaoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [categorias, setCategorias] = useState<string[]>([]);
  const [selected, setSelected] = useState<PrecificacaoItem | null>(null);
  const [applying, setApplying] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await precificacaoService.listar({ categoria: catFilter || undefined });
      setProdutos(res.data.produtos || []);
      setCategorias(res.data.categorias || []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao carregar');
    } finally {
      setLoading(false);
    }
  }, [catFilter]);

  useEffect(() => { load(); }, [load]);

  const cmvColor = (cmv: number) => cmv <= 25 ? 'text-green-400' : cmv <= 35 ? 'text-cyan-400' : cmv <= 45 ? 'text-amber-400' : 'text-red-400';
  const cmvBadge = (cmv: number): 'success' | 'info' | 'warning' | 'error' => cmv <= 25 ? 'success' : cmv <= 35 ? 'info' : cmv <= 45 ? 'warning' : 'error';

  const cmvMedio = produtos.length ? produtos.reduce((s, p) => s + p.cmv_atual, 0) / produtos.length : 0;
  const ajustar = produtos.filter(p => p.cmv_atual > 35).length;

  const handleAplicar = async () => {
    if (!selected) return;
    setApplying(true);
    try {
      await precificacaoService.aplicarPreco(selected.produto_id, 30);
      toast.success('Preço aplicado com sucesso!');
      setSelected(null);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erro ao aplicar preço');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-on-surface)]">Precificação</h1>
          <p className="text-xs text-[var(--color-on-surface-variant)]">CMV por dose & preço sugerido</p>
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

      <div className="px-4 pb-3 grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-[var(--color-surface-container)]">
          <p className="text-[10px] text-[var(--color-outline)] uppercase">CMV Médio</p>
          <p className={`text-lg font-bold ${cmvColor(cmvMedio)}`}>{cmvMedio.toFixed(1)}%</p>
        </div>
        <div className="p-3 rounded-xl bg-[var(--color-surface-container)]">
          <p className="text-[10px] text-[var(--color-outline)] uppercase">Ajustar (CMV &gt; 35%)</p>
          <p className="text-lg font-bold text-amber-400">{ajustar}</p>
        </div>
      </div>

      {categorias.length > 0 && (
        <div className="px-4 pb-3 flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setCatFilter('')} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${!catFilter ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'}`}>
            Todas
          </button>
          {categorias.map(c => (
            <button key={c} onClick={() => setCatFilter(c)} className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${catFilter === c ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'}`}>
              {c}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
        {loading ? (
          <div className="py-12 text-center text-sm text-[var(--color-outline)]">Carregando...</div>
        ) : produtos.length === 0 ? (
          <div className="py-12 text-center text-sm text-[var(--color-outline)]">Nenhum produto</div>
        ) : (
          produtos.map(p => (
            <button
              key={p.produto_id}
              onClick={() => p.possui_receita && setSelected(p)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-container)] border border-[rgba(var(--overlay-rgb),0.06)] text-left active:bg-[var(--color-surface-container-high)]"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--color-on-surface)] truncate">{p.nome}</p>
                <p className="text-[10px] text-[var(--color-on-surface-variant)]">{p.categoria || 'Sem categoria'}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-[var(--color-on-surface)]">R$ {p.preco_venda.toFixed(2)}</p>
                {p.possui_receita ? (
                  <Badge variant={cmvBadge(p.cmv_atual)}>CMV {p.cmv_atual.toFixed(1)}%</Badge>
                ) : (
                  <span className="text-[10px] text-[var(--color-outline)]">Sem receita</span>
                )}
              </div>
              {p.possui_receita && <ChevronRight size={16} className="text-[var(--color-outline)] shrink-0" />}
            </button>
          ))
        )}
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.nome || ''} size="lg">
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded-lg bg-[var(--color-surface-container-lowest)]">
                <p className="text-[10px] text-[var(--color-outline)] uppercase">Preço Atual</p>
                <p className="text-sm font-bold">R$ {selected.preco_venda.toFixed(2)}</p>
              </div>
              <div className="p-2 rounded-lg bg-[var(--color-surface-container-lowest)]">
                <p className="text-[10px] text-[var(--color-outline)] uppercase">Custo/Dose</p>
                <p className="text-sm font-bold">R$ {selected.custo_dose.toFixed(2)}</p>
              </div>
              <div className="p-2 rounded-lg bg-[var(--color-surface-container-lowest)]">
                <p className="text-[10px] text-[var(--color-outline)] uppercase">CMV</p>
                <p className={`text-sm font-bold ${cmvColor(selected.cmv_atual)}`}>{selected.cmv_atual.toFixed(1)}%</p>
              </div>
              <div className="p-2 rounded-lg bg-[var(--color-surface-container-lowest)]">
                <p className="text-[10px] text-[var(--color-outline)] uppercase">Margem</p>
                <p className="text-sm font-bold">{selected.margem_atual.toFixed(1)}%</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-center">
              <p className="text-[10px] text-[var(--color-primary)] uppercase mb-1">Preço Sugerido (30% margem)</p>
              <p className="text-xl font-bold text-[var(--color-primary)]">R$ {selected.preco_sugerido_30.toFixed(2)}</p>
            </div>
            <Button onClick={handleAplicar} loading={applying} disabled={applying} className="w-full">
              <DollarSign size={16} /> Aplicar Margem 30%
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
