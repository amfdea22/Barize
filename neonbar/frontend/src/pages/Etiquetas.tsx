import { useState, useEffect } from 'react';
import {
  Search,
  Tag,
  Printer,

  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { etiquetasService } from '../services/api';
import type { EtiquetaItem } from '../types';
import Modal from '../components/Modal';
import Button from '../components/Button';

export default function Etiquetas() {
  const [etiquetas, setEtiquetas] = useState<EtiquetaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tipoFilter, setTipoFilter] = useState<'all' | 'insumo' | 'produto'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showPreview, setShowPreview] = useState(false);

  const loadEtiquetas = async () => {
    setLoading(true);
    try {
      const res = await etiquetasService.listar({ tipo: tipoFilter === 'all' ? undefined : tipoFilter });
      setEtiquetas(Array.isArray(res.data) ? res.data : []);
    } catch {
      setEtiquetas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEtiquetas(); }, [tipoFilter]);

  const filtered = etiquetas.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return e.nome.toLowerCase().includes(q) || e.codigo_lote.toLowerCase().includes(q);
  });

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };



  const itemsToPrint = filtered.filter((e) => selectedIds.has(e.item_id));

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 className="text-headline-lg font-bold text-[var(--color-on-surface)]">Etiquetas de Validade</h1>
          <p className="text-label-md text-[var(--color-on-surface-variant)] mt-0.5">
            Gerar e imprimir etiquetas para insumos e produtos
          </p>
        </div>
        <Button onClick={loadEtiquetas} variant="ghost" className="h-[44px]">
          Atualizar
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-md mb-lg flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={18} className="absolute left-sm top-1/2 -translate-y-1/2 text-[var(--color-outline)]" />
          <input
            type="text"
            placeholder="Buscar por nome ou lote..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--color-surface-container-lowest)] border border-[rgba(255,255,255,0.1)] rounded-lg pl-xl pr-md py-xs text-body-md focus:border-[var(--color-primary)]/50 outline-none text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]/40 transition-colors"
          />
        </div>
        <div className="flex gap-1">
          {['all', 'insumo', 'produto'].map((t) => (
            <button
              key={t}
              onClick={() => setTipoFilter(t as any)}
              className={`px-md h-[36px] rounded-lg text-label-sm transition-all cursor-pointer ${
                tipoFilter === t
                  ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]'
                  : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]'
              }`}
            >
              {t === 'all' ? 'Todos' : t === 'insumo' ? 'Insumos' : 'Produtos'}
            </button>
          ))}
        </div>
      </div>

      {/* Selection bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between px-md py-sm bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-lg mb-lg">
          <span className="text-label-md text-[var(--color-primary)]">
            {selectedIds.size} item(ns) selecionado(s)
          </span>
          <div className="flex gap-sm">
            <Button variant="ghost" className="h-[36px]" onClick={() => setSelectedIds(new Set())}>
              <X size={16} /> Limpar
            </Button>
            <Button className="h-[36px]" onClick={() => setShowPreview(true)}>
              <Printer size={16} /> Visualizar e Imprimir
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-32 text-[var(--color-outline)] text-sm">
          Carregando etiquetas...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-[var(--color-outline)] text-sm gap-2">
          <Tag size={32} className="opacity-30" />
          <span>Nenhuma etiqueta encontrada</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-sm min-h-0">
          {filtered.map((e) => {
            const isSelected = selectedIds.has(e.item_id);
            const dias = e.dias_para_vencer;
            const isVencido = dias !== null && dias !== undefined && dias < 0;
            const isProximo = dias !== null && dias !== undefined && dias <= 7 && dias >= 0;
            return (
              <div
                key={e.item_id}
                onClick={() => toggleSelect(e.item_id)}
                className={`flex items-center gap-md px-lg py-md rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/50 shadow-[0_0_0_1px_var(--color-primary)]'
                    : 'bg-[var(--color-surface-container)] border-[rgba(255,255,255,0.06)] hover:bg-[var(--color-surface-container-high)]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(e.item_id)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-5 h-5 accent-[var(--color-primary)] shrink-0"
                />
                <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-container-high)] flex items-center justify-center shrink-0">
                  <Tag size={20} className={e.tipo === 'insumo' ? 'text-[var(--color-primary)]' : 'text-[var(--color-secondary-container)]'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-body-md font-semibold text-[var(--color-on-surface)] truncate">
                      {e.nome}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider"
                      style={{
                        backgroundColor: `color-mix(in srgb, ${e.tipo === 'insumo' ? 'var(--color-primary)' : 'var(--color-secondary-container)'} 20%, transparent)`,
                        color: e.tipo === 'insumo' ? 'var(--color-primary)' : 'var(--color-secondary-container)',
                      }}>
                      {e.tipo === 'insumo' ? 'Insumo' : 'Produto'}
                    </span>
                  </div>
                  <div className="flex items-center gap-md mt-1 text-label-sm text-[var(--color-on-surface-variant)]">
                    <span className="font-mono">Lote: {e.codigo_lote}</span>
                    {e.categoria && <span>• {e.categoria}</span>}
                    {e.unidade_medida && <span>• {e.unidade_medida}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1">
                    {e.data_validade && (
                      <span className={`text-label-sm font-mono ${isVencido ? 'text-[var(--color-error)]' : isProximo ? 'text-[var(--color-secondary-container)]' : 'text-[var(--color-on-surface-variant)]'}`}>
                        {isVencido ? <AlertTriangle size={14} /> : isProximo ? <Clock size={14} /> : <CheckCircle2 size={14} />}
                        {e.data_validade ? new Date(e.data_validade).toLocaleDateString('pt-BR') : '—'}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-[var(--color-outline)] font-mono">
                    Lote: {e.codigo_lote}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      <Modal open={showPreview} onClose={() => setShowPreview(false)} title="Visualização de Impressão" size="xl">
        <div className="space-y-4">
          <p className="text-xs text-[var(--color-on-surface-variant)] font-mono tracking-wider uppercase">
            {itemsToPrint.length} etiqueta(s) — use Ctrl+P para imprimir
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto p-4 bg-white rounded-lg border border-[rgba(0,0,0,0.1)]">
            {itemsToPrint.map((e) => (
              <div key={e.item_id} className="bg-white border border-black/20 rounded-sm p-3 text-xs leading-relaxed font-mono select-all" style={{ width: '100%', minWidth: '180px' }}>
                <div className="text-center font-bold text-sm tracking-widest mb-1">NEONBAR</div>
                <div className="text-center uppercase text-[10px] mb-2">
                  {e.tipo === 'insumo' ? 'Insumo' : 'Produto'}
                </div>
                <div className="border-t border-dashed border-black/20 mb-1" />

                <div className="text-left space-y-0.5 mb-1">
                  <div className="font-bold text-[11px] truncate">{e.nome}</div>
                  <div className="text-[10px] text-black/60">Lote: {e.codigo_lote}</div>
                  {e.categoria && <div className="text-[10px] text-black/60">{e.categoria}</div>}
                  {e.unidade_medida && <div className="text-[10px] text-black/60">{e.unidade_medida}</div>}
                </div>

                <div className="border-t border-dashed border-black/20 mb-1" />

                <div className="flex justify-between text-[10px] mb-1">
                  <span>Validade:</span>
                  <span className="font-bold">{e.data_validade ? new Date(e.data_validade).toLocaleDateString('pt-BR') : '—'}</span>
                </div>

                <div className="border-t border-dashed border-black/20 mb-1" />

                <div className="text-center text-[9px] text-black/50 space-y-0.5">
                  <div>NEONBAR — Controle de Validade</div>
                  <div className="text-black/30">Obrigado!</div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowPreview(false)}>
              Fechar
            </Button>
            <Button className="flex-1" onClick={() => window.print()}>
              <Printer size={16} /> Imprimir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
