import { useState, useEffect } from 'react';
import { Tag, Search, Printer, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { etiquetasService } from '../services/api';
import type { EtiquetaItem } from '../types';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { toast } from '../components/Toast';

export default function Etiquetas() {
  const [etiquetas, setEtiquetas] = useState<EtiquetaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<'all' | 'insumo' | 'produto'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showPreview, setShowPreview] = useState(false);

  const load = () => {
    setLoading(true);
    etiquetasService.listar({ tipo: tipoFilter === 'all' ? undefined : tipoFilter })
      .then((res) => setEtiquetas(Array.isArray(res.data) ? res.data : []))
      .catch(() => setEtiquetas([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tipoFilter]);

  const filtered = etiquetas.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.nome.toLowerCase().includes(q) || e.codigo_lote.toLowerCase().includes(q);
  });

  const toggle = (id: number) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const itemsToPrint = filtered.filter(e => selectedIds.has(e.item_id));

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3">
        <h1 className="text-lg font-bold text-[var(--color-on-surface)]">Etiquetas</h1>
        <p className="text-xs text-[var(--color-on-surface-variant)]">Impressão de etiquetas</p>
      </div>

      <div className="px-4 pb-3 space-y-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.1)] rounded-lg pl-9 pr-3 py-2.5 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]/40 outline-none"
          />
        </div>
        <div className="flex gap-1.5">
          {(['all', 'insumo', 'produto'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTipoFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                tipoFilter === t
                  ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary)]'
                  : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'
              }`}
            >
              {t === 'all' ? 'Todos' : t === 'insumo' ? 'Insumos' : 'Produtos'}
            </button>
          ))}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="mx-4 mb-3 flex items-center justify-between px-3 py-2 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-lg">
          <span className="text-xs text-[var(--color-primary)] font-medium">{selectedIds.size} selecionado(s)</span>
          <div className="flex gap-2">
            <button onClick={() => setSelectedIds(new Set())} className="text-xs text-[var(--color-on-surface-variant)]">Limpar</button>
            <Button onClick={() => setShowPreview(true)}>
              <Printer size={14} /> Imprimir
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
        {loading ? (
          <div className="py-12 text-center text-sm text-[var(--color-outline)]">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-2">
            <Tag size={28} className="text-[var(--color-outline)]/30" />
            <span className="text-sm text-[var(--color-outline)]">Nenhuma etiqueta</span>
          </div>
        ) : (
          filtered.map(e => {
            const isVencido = e.dias_para_vencer != null && e.dias_para_vencer < 0;
            const isProximo = e.dias_para_vencer != null && e.dias_para_vencer <= 7 && e.dias_para_vencer >= 0;
            return (
              <div
                key={e.item_id}
                onClick={() => toggle(e.item_id)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  selectedIds.has(e.item_id)
                    ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/50'
                    : 'bg-[var(--color-surface-container)] border-[rgba(var(--overlay-rgb),0.06)]'
                }`}
              >
                <input type="checkbox" checked={selectedIds.has(e.item_id)} onChange={() => toggle(e.item_id)} className="w-5 h-5 accent-[var(--color-primary)]" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--color-on-surface)] truncate">{e.nome}</p>
                  <p className="text-[10px] text-[var(--color-on-surface-variant)] font-mono">Lote: {e.codigo_lote}</p>
                </div>
                <div className="text-right shrink-0">
                  {e.data_validade && (
                    <span className={`text-xs font-mono flex items-center gap-1 justify-end ${isVencido ? 'text-[var(--color-error)]' : isProximo ? 'text-amber-400' : 'text-[var(--color-on-surface-variant)]'}`}>
                      {isVencido ? <AlertTriangle size={12} /> : isProximo ? <Clock size={12} /> : <CheckCircle2 size={12} />}
                      {new Date(e.data_validade).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <Modal open={showPreview} onClose={() => setShowPreview(false)} title="Pré-visualização" size="lg">
        <div className="space-y-3">
          <p className="text-xs text-[var(--color-on-surface-variant)]">{itemsToPrint.length} etiqueta(s)</p>
          {itemsToPrint.map(item => (
            <div key={item.item_id} className="p-3 bg-white rounded-lg border text-black text-xs">
              <p className="font-bold">{item.nome}</p>
              <p>Lote: {item.codigo_lote}</p>
              <p>Validade: {item.data_validade ? new Date(item.data_validade).toLocaleDateString('pt-BR') : '–'}</p>
            </div>
          ))}
          <Button onClick={() => { toast.success('Etiquetas enviadas para impressão'); setShowPreview(false); }} className="w-full">
            <Printer size={16} /> Imprimir
          </Button>
        </div>
      </Modal>
    </div>
  );
}
