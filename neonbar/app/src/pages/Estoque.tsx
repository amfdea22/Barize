import { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  AlertTriangle,
  Package,
  ChevronDown,
  Plus,
  Truck,
} from 'lucide-react';
import { estoqueService } from '../services/api';
import { toast } from '../components/Toast';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';

interface Insumo {
  id: number;
  nome: string;
  categoria: string;
  unidade_medida: string;
  estoque_atual: number;
  estoque_minimo: number;
  custo_unitario: number;
}

const CATEGORY_FILTERS = ['Todos', 'Destilados', 'Vinhos e Cervejas', 'Mixers e Ingredientes'];

function matchCategory(insumo: Insumo, filter: string): boolean {
  if (filter === 'Todos') return true;
  const cat = insumo.categoria?.toLowerCase() || '';
  switch (filter) {
    case 'Destilados': return cat.includes('destilado');
    case 'Vinhos e Cervejas': return cat.includes('vinho') || cat.includes('cerveja') || cat.includes('chopp');
    case 'Mixers e Ingredientes': return cat.includes('mixer') || cat.includes('suco') || cat.includes('xar') || cat.includes('ingrediente');
    default: return true;
  }
}

function getStockLevel(insumo: Insumo): { percent: number; status: 'critical' | 'low' | 'healthy' } {
  if (insumo.estoque_minimo <= 0) return { percent: 100, status: 'healthy' };
  const ratio = insumo.estoque_atual / insumo.estoque_minimo;
  if (ratio <= 0.5) return { percent: Math.max(0, Math.round(ratio * 100)), status: 'critical' };
  if (ratio <= 1.0) return { percent: Math.max(0, Math.round(ratio * 100)), status: 'low' };
  return { percent: Math.min(100, Math.round(ratio * 100)), status: 'healthy' };
}

export default function Estoque() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('Todos');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Movimentacao modal
  const [showMovimentacao, setShowMovimentacao] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null);
  const [movType, setMovType] = useState<'ENTRADA' | 'PERDA' | 'AJUSTE'>('ENTRADA');
  const [movQty, setMovQty] = useState('');
  const [movCusto, setMovCusto] = useState('');
  const [movMotivo, setMovMotivo] = useState('');
  const [saving, setSaving] = useState(false);

  // Low stock panel
  const [showLowStock, setShowLowStock] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await estoqueService.listarInsumos();
      setInsumos(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao carregar estoque');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const itensBaixa = insumos.filter((i) => i.estoque_atual <= i.estoque_minimo && i.estoque_minimo > 0);

  const filtered = insumos.filter((i) => {
    if (!matchCategory(i, catFilter)) return false;
    if (search && !i.nome.toLowerCase().includes(search.toLowerCase()) && !i.categoria?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openMovimentacao = (insumo: Insumo, type: 'ENTRADA' | 'PERDA' | 'AJUSTE') => {
    setSelectedInsumo(insumo);
    setMovType(type);
    setMovQty('');
    setMovCusto(type === 'ENTRADA' ? String(insumo.custo_unitario || '') : '');
    setMovMotivo('');
    setShowMovimentacao(true);
  };

  const handleMovimentacao = async () => {
    if (!selectedInsumo || !movQty || Number(movQty) <= 0) return;
    setSaving(true);
    try {
      if (movType === 'ENTRADA') {
        await estoqueService.entrada({
          insumo_id: selectedInsumo.id,
          tipo: 'COMPRA',
          quantidade: Number(movQty),
          custo_no_momento: Number(movCusto) || selectedInsumo.custo_unitario,
        });
        toast.success(`Entrada registrada: +${movQty} ${selectedInsumo.unidade_medida}`);
      } else if (movType === 'PERDA') {
        await estoqueService.perda(selectedInsumo.id, Number(movQty), movMotivo || 'Perda nao especificada');
        toast.success(`Perda registrada: -${movQty} ${selectedInsumo.unidade_medida}`);
      } else {
        await estoqueService.ajuste(selectedInsumo.id, Number(movQty), movMotivo || 'Ajuste manual');
        toast.success(`Estoque ajustado: ${movQty} ${selectedInsumo.unidade_medida}`);
      }
      setShowMovimentacao(false);
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erro ao registrar movimentacao');
    } finally {
      setSaving(false);
    }
  };

  const progressColor = (status: string) => {
    if (status === 'critical') return 'bg-[var(--color-error)] shadow-[0_0_8px_rgba(255,0,0,0.5)]';
    if (status === 'low') return 'bg-[var(--color-secondary-container)] shadow-[0_0_8px_rgba(254,170,0,0.3)]';
    return 'bg-[var(--color-primary-container)]';
  };

  const qtyColor = (status: string) => {
    if (status === 'critical') return 'text-[var(--color-error)]';
    if (status === 'low') return 'text-[var(--color-secondary-container)]';
    return 'text-[var(--color-on-surface)]';
  };

  const statusLabel = (status: string) => {
    if (status === 'critical') return 'Critico';
    if (status === 'low') return 'Baixo';
    return 'Normal';
  };

  return (
    <div className="flex flex-col h-dvh bg-[var(--color-background)]">
      {/* Header */}
      <header className="safe-top border-b border-[rgba(var(--overlay-rgb),0.1)] bg-[rgba(var(--glass-rgb),0.6)] backdrop-blur-[12px]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgba(0,229,255,0.2)] to-[rgba(0,218,243,0.1)] flex items-center justify-center border border-[var(--color-primary)]/30">
              <Package size={20} className="text-[var(--color-primary-container)]" />
            </div>
            <div>
              <h1 className="text-lg font-black text-[var(--color-on-surface)] tracking-tight">ESTOQUE</h1>
              <div className="flex items-center gap-2">
                {itensBaixa.length > 0 && (
                  <Badge variant="warning" pulsing>{itensBaixa.length} em falta</Badge>
                )}
                <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[var(--color-on-surface-variant)]">
                  {insumos.length} insumo(s)
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {itensBaixa.length > 0 && (
              <button
                onClick={() => setShowLowStock(true)}
                className="relative p-2 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 cursor-pointer"
              >
                <AlertTriangle size={16} className="text-[var(--color-error)]" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[var(--color-error)] text-white text-[8px] font-bold flex items-center justify-center">
                  {itensBaixa.length}
                </span>
              </button>
            )}
            <button
              onClick={load}
              className="p-2 rounded-lg bg-[var(--color-surface-container-high)]/50 border border-[rgba(var(--overlay-rgb),0.1)] cursor-pointer"
            >
              <RefreshCw size={16} className="text-[var(--color-on-surface-variant)]" />
            </button>
          </div>
        </div>
      </header>

      {/* Search */}
      <div className="px-4 py-3 border-b border-[rgba(var(--overlay-rgb),0.1)]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]" />
          <input
            type="text"
            placeholder="Buscar insumo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.1)] text-sm text-[var(--color-on-surface)] placeholder-[var(--color-outline)] focus:border-[var(--color-primary-container)]/50 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto border-b border-[rgba(var(--overlay-rgb),0.1)] scrollbar-none">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setCatFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer whitespace-nowrap ${
              catFilter === f
                ? 'bg-[var(--color-primary-container)]/15 text-[var(--color-primary-container)] border border-[var(--color-primary-container)]/30'
                : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] border border-[rgba(var(--overlay-rgb),0.1)]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Insumos List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-[var(--color-outline)]">
            <RefreshCw size={24} className="animate-spin mr-2" />
            <span className="text-sm">Carregando...</span>
          </div>
        ) : error ? (
          <div className="p-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-sm text-[var(--color-error)] text-center">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--color-outline)] gap-3">
            <Package size={48} className="opacity-20" />
            <p className="text-sm text-[var(--color-on-surface-variant)]">Nenhum item encontrado</p>
          </div>
        ) : (
          filtered.map((insumo) => {
            const { percent, status } = getStockLevel(insumo);
            const isExpanded = expandedId === insumo.id;
            const isCritical = status === 'critical';

            return (
              <div
                key={insumo.id}
                className={`glass glass-border border rounded-xl overflow-hidden transition-all ${
                  isCritical
                    ? 'border-[var(--color-error)]/40 shadow-[0_0_8px_rgba(255,0,0,0.2)]'
                    : 'border-[rgba(var(--overlay-rgb),0.1)]'
                }`}
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : insumo.id)}
                  className="px-4 py-3 flex items-center justify-between cursor-pointer active:bg-[var(--color-surface-container-high)]/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-lg bg-[var(--color-surface-container-highest)] flex items-center justify-center shrink-0 ${
                      isCritical ? 'border border-[var(--color-error)]/30' : 'border border-[rgba(var(--overlay-rgb),0.1)]'
                    }`}>
                      <Package size={18} className={isCritical ? 'text-[var(--color-error)]' : 'text-[var(--color-primary-container)]'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--color-on-surface)] truncate">{insumo.nome}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[var(--color-on-surface-variant)]">{insumo.categoria}</span>
                        <Badge variant={isCritical ? 'error' : status === 'low' ? 'warning' : 'success'} className="text-[8px]">
                          {statusLabel(status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <div className="text-right">
                      <p className={`text-sm font-bold font-mono ${qtyColor(status)}`}>
                        {insumo.estoque_atual} <span className="text-[10px] font-normal text-[var(--color-on-surface-variant)]">/ {insumo.estoque_minimo} {insumo.unidade_medida}</span>
                      </p>
                    </div>
                    <ChevronDown
                      size={16}
                      className="text-[var(--color-on-surface-variant)] transition-transform duration-200"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : '' }}
                    />
                  </div>
                </div>

                {/* Stock progress bar */}
                <div className="px-4 pb-2">
                  <div className="w-full h-1.5 bg-[var(--color-surface-container-highest)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${progressColor(status)} transition-all`}
                      style={{ width: `${Math.min(100, percent)}%` }}
                    />
                  </div>
                </div>

                {/* Expanded actions */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-[rgba(var(--overlay-rgb),0.06)] pt-3">
                    <div className="text-[10px] text-[var(--color-on-surface-variant)] font-mono uppercase tracking-wider mb-3">
                      Custo unitario: R$ {insumo.custo_unitario.toFixed(2)}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openMovimentacao(insumo, 'ENTRADA')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[var(--color-primary-container)]/15 text-[var(--color-primary-container)] font-bold text-[10px] uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <Plus size={14} /> Entrada
                      </button>
                      <button
                        onClick={() => openMovimentacao(insumo, 'PERDA')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/30 font-bold text-[10px] uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <AlertTriangle size={14} /> Perda
                      </button>
                      <button
                        onClick={() => openMovimentacao(insumo, 'AJUSTE')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] font-bold text-[10px] uppercase tracking-wider active:scale-[0.98] transition-all cursor-pointer"
                      >
                        Ajustar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bottom bar - low stock quick access */}
      {itensBaixa.length > 0 && (
        <div className="safe-bottom border-t border-[rgba(var(--overlay-rgb),0.1)] bg-[rgba(var(--glass-rgb),0.6)] backdrop-blur-[12px] p-4">
          <button
            onClick={() => setShowLowStock(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/30 font-bold text-[11px] uppercase tracking-widest active:scale-[0.98] transition-all cursor-pointer"
          >
            <Truck size={16} /> Repor {itensBaixa.length} item(s) em falta
          </button>
        </div>
      )}

      {/* Movimentacao Modal */}
      <Modal open={showMovimentacao} onClose={() => setShowMovimentacao(false)} title={`${movType} - ${selectedInsumo?.nome || ''}`}>
        {selectedInsumo && (
          <div className="space-y-4">
            {movType === 'AJUSTE' && (
              <div className="p-3 rounded-lg bg-[var(--color-surface-container-high)] text-sm">
                <span className="text-[var(--color-on-surface-variant)]">Estoque atual: </span>
                <span className="text-[var(--color-primary-container)] font-bold">{selectedInsumo.estoque_atual}</span>
                <span className="text-[var(--color-on-surface-variant)]"> {selectedInsumo.unidade_medida}</span>
              </div>
            )}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-1.5 block">
                Quantidade ({selectedInsumo.unidade_medida})
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={movQty}
                onChange={(e) => setMovQty(e.target.value)}
                placeholder="0"
                autoFocus
                className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-container-lowest)] border border-[rgba(var(--overlay-rgb),0.1)] text-sm text-[var(--color-on-surface)] placeholder-[var(--color-outline)] focus:border-[var(--color-primary-container)]/50 outline-none transition-colors font-mono text-center text-lg"
              />
            </div>
            {movType === 'ENTRADA' && (
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-1.5 block">
                  Custo Unitario (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={movCusto}
                  onChange={(e) => setMovCusto(e.target.value)}
                  placeholder={selectedInsumo.custo_unitario.toFixed(2)}
                  className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-container-lowest)] border border-[rgba(var(--overlay-rgb),0.1)] text-sm text-[var(--color-on-surface)] placeholder-[var(--color-outline)] focus:border-[var(--color-primary-container)]/50 outline-none transition-colors font-mono"
                />
              </div>
            )}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-1.5 block">
                {movType === 'ENTRADA' ? 'Observacao' : 'Motivo'} {movType !== 'ENTRADA' && '(obrigatorio)'}
              </label>
              <input
                type="text"
                value={movMotivo}
                onChange={(e) => setMovMotivo(e.target.value)}
                placeholder={movType === 'PERDA' ? 'Ex: Quebrou no transporte' : movType === 'AJUSTE' ? 'Ex: Inventario fisico' : 'Observacao (opcional)'}
                className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-container-lowest)] border border-[rgba(var(--overlay-rgb),0.1)] text-sm text-[var(--color-on-surface)] placeholder-[var(--color-outline)] focus:border-[var(--color-primary-container)]/50 outline-none transition-colors"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setShowMovimentacao(false)}>
                Cancelar
              </Button>
              <Button
                variant={movType === 'PERDA' ? 'danger' : 'primary'}
                className="flex-1"
                loading={saving}
                disabled={!movQty || Number(movQty) <= 0 || (movType !== 'ENTRADA' && !movMotivo.trim())}
                onClick={handleMovimentacao}
              >
                Registrar
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Low Stock Panel Modal */}
      <Modal open={showLowStock} onClose={() => setShowLowStock(false)} title="Itens em Falta">
        <div className="space-y-4">
          {itensBaixa.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-[var(--color-outline)] gap-2">
              <Package size={32} className="opacity-40" />
              <p className="text-sm">Nenhum item em falta</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-[10px] text-[var(--color-on-surface-variant)] font-mono uppercase tracking-wider px-1">
                <span>{itensBaixa.length} item(ns) abaixo do minimo</span>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {itensBaixa.map((item) => {
                  const ratio = item.estoque_minimo > 0 ? item.estoque_atual / item.estoque_minimo : 1;
                  const needToOrder = Math.max(0, item.estoque_minimo - item.estoque_atual);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-container-high)]/50 border border-[rgba(var(--overlay-rgb),0.1)]"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[var(--color-error)]/15 flex items-center justify-center shrink-0">
                        <AlertTriangle size={16} className="text-[var(--color-error)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[var(--color-on-surface)] truncate">{item.nome}</p>
                        <div className="w-[120px] h-1.5 rounded-full bg-[var(--color-surface-container-highest)] overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full transition-all ${
                              ratio <= 0.5 ? 'bg-[var(--color-error)]' : 'bg-[var(--color-secondary-container)]'
                            }`}
                            style={{ width: `${Math.min(100, ratio * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold font-mono text-[var(--color-on-surface)]">
                          {item.estoque_atual} <span className="text-[10px] font-normal text-[var(--color-on-surface-variant)]">/{item.estoque_minimo} {item.unidade_medida}</span>
                        </p>
                        {needToOrder > 0 && (
                          <p className="text-[10px] text-[var(--color-error)] mt-0.5">
                            Faltam {needToOrder} {item.unidade_medida}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button variant="ghost" className="w-full" onClick={() => setShowLowStock(false)}>
                Fechar
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
