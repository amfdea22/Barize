import { useState, useEffect } from 'react';
import {
  Plus,
  AlertTriangle,
  RefreshCw,
  Search,
  Download,
  ShoppingCart,
  Edit,
  Droplets,
  Beer,
  FlaskConical,
  Zap,
  Truck,
  Trash2,
  Sliders,
  Save,
  X,
  ClipboardList,
  Package,
} from 'lucide-react';
import type { Insumo, InsumoBaixo } from '../types';
import { estoqueService } from '../services/api';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Input from '../components/Input';

/* ─── Helpers ─── */
function getIcon(insumo: Insumo) {
  const cat = insumo.categoria?.toLowerCase() || '';
  if (cat.includes('cerveja') || cat.includes('chopp')) return Beer;
  if (cat.includes('mixer') || cat.includes('suco') || cat.includes('xar')) return Droplets;
  return FlaskConical;
}

function getStockLevel(insumo: Insumo): { percent: number; status: 'critical' | 'low' | 'healthy' } {
  if (insumo.estoque_minimo <= 0) return { percent: 100, status: 'healthy' };
  const ratio = insumo.estoque_atual / insumo.estoque_minimo;
  if (ratio <= 0.5) return { percent: Math.max(0, Math.round(ratio * 100)), status: 'critical' };
  if (ratio <= 1.0) return { percent: Math.max(0, Math.round(ratio * 100)), status: 'low' };
  return { percent: Math.min(100, Math.round(ratio * 100)), status: 'healthy' };
}

const categoryFilters = ['Todos os Itens', 'Destilados', 'Vinhos e Cervejas', 'Mixers e Ingredientes'];

function matchCategory(insumo: Insumo, filter: string): boolean {
  if (filter === 'Todos os Itens') return true;
  const cat = insumo.categoria?.toLowerCase() || '';
  switch (filter) {
    case 'Destilados': return cat.includes('destilado');
    case 'Vinhos e Cervejas': return cat.includes('vinho') || cat.includes('cerveja') || cat.includes('chopp');
    case 'Mixers e Ingredientes': return cat.includes('mixer') || cat.includes('suco') || cat.includes('xar') || cat.includes('ingrediente');
    default: return true;
  }
}

export default function Estoque() {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('Todos os Itens');
  const [showNewInsumo, setShowNewInsumo] = useState(false);
  const [showEntrada, setShowEntrada] = useState(false);
  const [showPerda, setShowPerda] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState<Insumo | null>(null);

  // Edit state
  const [showEditInsumo, setShowEditInsumo] = useState(false);
  const [editInsumo, setEditInsumo] = useState({
    nome: '', categoria: '', unidade_medida: 'un',
    estoque_minimo: 0, custo_unitario: 0,
  });

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Ajuste state
  const [showAjuste, setShowAjuste] = useState(false);
  const [ajusteEstoque, setAjusteEstoque] = useState(0);
  const [ajusteMotivo, setAjusteMotivo] = useState('');

  // Form states
  const [newInsumo, setNewInsumo] = useState({
    nome: '', categoria: '', unidade_medida: 'un',
    estoque_atual: 0, estoque_minimo: 10, custo_unitario: 0,
  });
  const [entradaQty, setEntradaQty] = useState(0);
  const [entradaCusto, setEntradaCusto] = useState(0);
  const [perdaQty, setPerdaQty] = useState(0);
  const [perdaMotivo, setPerdaMotivo] = useState('');

  // Auto-Reposição state
  const [baixoEstoque, setBaixoEstoque] = useState<InsumoBaixo[]>([]);
  const [showReposicao, setShowReposicao] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [insumosRes, baixoRes] = await Promise.all([
        estoqueService.listarInsumos(),
        estoqueService.baixoEstoque(),
      ]);
      setInsumos(insumosRes.data);
      setBaixoEstoque(baixoRes.data);
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
    if (search && !i.nome.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  /* ─── Modal handlers ─── */
  const handleCreateInsumo = async () => {
    try {
      await estoqueService.criarInsumo(newInsumo);
      setShowNewInsumo(false);
      setNewInsumo({ nome: '', categoria: '', unidade_medida: 'un', estoque_atual: 0, estoque_minimo: 10, custo_unitario: 0 });
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao criar insumo');
    }
  };

  const handleEntrada = async () => {
    if (!selectedInsumo || entradaQty <= 0) return;
    try {
      await estoqueService.entrada({
        insumo_id: selectedInsumo.id, tipo: 'COMPRA',
        quantidade: entradaQty, custo_no_momento: entradaCusto || selectedInsumo.custo_unitario,
      });
      setShowEntrada(false);
      setEntradaQty(0);
      setEntradaCusto(0);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao registrar entrada');
    }
  };

  const handlePerda = async () => {
    if (!selectedInsumo || perdaQty <= 0) return;
    try {
      await estoqueService.perda(selectedInsumo.id, perdaQty, perdaMotivo || 'Perda não especificada');
      setShowPerda(false);
      setPerdaQty(0);
      setPerdaMotivo('');
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao registrar perda');
    }
  };

  /* ─── Edit handler ─── */
  const openEdit = (insumo: Insumo) => {
    setSelectedInsumo(insumo);
    setEditInsumo({
      nome: insumo.nome,
      categoria: insumo.categoria || '',
      unidade_medida: insumo.unidade_medida || 'un',
      estoque_minimo: insumo.estoque_minimo,
      custo_unitario: insumo.custo_unitario,
    });
    setShowEditInsumo(true);
  };

  const handleEditInsumo = async () => {
    if (!selectedInsumo) return;
    try {
      await estoqueService.atualizarInsumo(selectedInsumo.id, editInsumo);
      setShowEditInsumo(false);
      setSelectedInsumo(null);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao atualizar insumo');
    }
  };

  /* ─── Delete handler ─── */
  const openDelete = (insumo: Insumo) => {
    setSelectedInsumo(insumo);
    setShowDeleteConfirm(true);
  };

  const handleDeleteInsumo = async () => {
    if (!selectedInsumo) return;
    setDeleting(true);
    try {
      await estoqueService.excluirInsumo(selectedInsumo.id);
      setShowDeleteConfirm(false);
      setSelectedInsumo(null);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao excluir insumo');
    } finally {
      setDeleting(false);
    }
  };

  /* ─── Ajuste handler ─── */
  const openAjuste = (insumo: Insumo) => {
    setSelectedInsumo(insumo);
    setAjusteEstoque(insumo.estoque_atual);
    setAjusteMotivo('');
    setShowAjuste(true);
  };

  const handleAjuste = async () => {
    if (!selectedInsumo || ajusteMotivo.trim() === '') return;
    try {
      await estoqueService.ajuste(selectedInsumo.id, ajusteEstoque, ajusteMotivo);
      setShowAjuste(false);
      setSelectedInsumo(null);
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao ajustar estoque');
    }
  };

  return (
    <div className="h-[calc(100vh-7rem)] overflow-y-auto">
      {/* Inventory Header & Stats */}
      <div className="mb-lg flex justify-between items-end">
        <div>
          <h2 className="text-headline-lg text-[var(--color-on-surface)] mb-xs tracking-tight">
            Inventário de Produtos
          </h2>
          <p className="text-[var(--color-on-surface-variant)] text-body-md">
            Gestão em tempo real do estoque do Bar Principal.
          </p>
        </div>
        <div className="flex gap-md">
          {/* Low Stock Indicator */}
          <div className="bg-[rgba(32,31,31,0.6)] backdrop-blur-[12px] px-md py-sm rounded-xl border border-[var(--color-secondary-container)]/20 flex items-center gap-md">
            <div className="p-2 bg-[var(--color-secondary-container)]/10 rounded-lg text-[var(--color-secondary-container)]">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-label-md text-[var(--color-on-surface-variant)]">Itens em Baixa</p>
              <p className="text-headline-md text-[var(--color-secondary-container)]">
                {itensBaixa.length}
              </p>
            </div>
          </div>
          {/* Export Button */}
          <button className="bg-[var(--color-primary)] text-[var(--color-on-primary)] px-lg py-sm rounded-lg font-bold text-label-md flex items-center gap-sm hover:opacity-90 active:scale-95 duration-150 shadow-lg shadow-[var(--color-primary)]/10 cursor-pointer">
            <Download size={18} />
            Exportar Relatório
          </button>
          <button
            onClick={() => setShowNewInsumo(true)}
            className="bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] px-lg py-sm rounded-lg font-bold text-label-md flex items-center gap-sm hover:opacity-90 active:scale-95 duration-150 cursor-pointer"
          >
            <Plus size={18} />
            Novo Insumo
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-lg p-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-sm text-[var(--color-error)] flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')} className="underline cursor-pointer">Fechar</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-md mb-lg border-b border-[rgba(var(--neutral-rgb),0.1)]">
        {categoryFilters.map((f) => (
          <button
            key={f}
            onClick={() => setCatFilter(f)}
            className={`px-md py-sm text-label-md transition-colors cursor-pointer ${
              catFilter === f
                ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
            }`}
          >
            {f}
          </button>
        ))}
        {/* Search */}
        <div className="ml-auto relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]" />
          <input
            type="text"
            placeholder="Buscar no estoque..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[var(--color-surface-container-lowest)] border-none rounded-full pl-10 pr-4 py-2 w-64 text-body-md focus:ring-1 focus:ring-[var(--color-primary)] text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]/40 outline-none"
          />
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="flex items-center justify-center h-32 text-[var(--color-outline)] text-sm">
          Carregando estoque...
        </div>
      ) : (
        <>
          <div className="bg-[rgba(32,31,31,0.6)] backdrop-blur-[12px] rounded-xl overflow-hidden border border-[rgba(var(--neutral-rgb),0.1)] mb-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--color-surface-container-high)]/50 border-b border-[rgba(var(--neutral-rgb),0.1)]">
                  <th className="px-lg py-md text-label-md text-[var(--color-on-surface-variant)] uppercase tracking-widest">
                    Nome do Item
                  </th>
                  <th className="px-lg py-md text-label-md text-[var(--color-on-surface-variant)] uppercase tracking-widest">
                    Categoria
                  </th>
                  <th className="px-lg py-md text-label-md text-[var(--color-on-surface-variant)] uppercase tracking-widest">
                    Nível de Estoque
                  </th>
                  <th className="px-lg py-md text-label-md text-[var(--color-on-surface-variant)] uppercase tracking-widest">
                    Quantidade
                  </th>
                  <th className="px-lg py-md text-label-md text-[var(--color-on-surface-variant)] uppercase tracking-widest text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(var(--neutral-rgb),0.1)]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-lg py-md text-center text-[var(--color-outline)] text-sm">
                      Nenhum item encontrado
                    </td>
                  </tr>
                ) : (
                  filtered.map((insumo) => {
                    const { percent, status } = getStockLevel(insumo);
                    const isCritical = status === 'critical';
                    const isLow = status === 'low';
                    const Icon = getIcon(insumo);
                    const iconeBorder = isCritical
                      ? 'border border-[var(--color-secondary-container)]/30 shadow-[0_0_12px_rgba(254,170,0,0.3)]'
                      : 'border border-[rgba(var(--neutral-rgb),0.1)]';
                    const iconeColor = isCritical ? 'text-[var(--color-secondary-container)]' : 'text-[var(--color-primary)]';
                    const statusLabel = isCritical
                      ? 'Nível Crítico'
                      : isLow
                        ? 'Estoque Baixo'
                        : 'Estoque Normal';
                    const statusColor = isCritical
                      ? 'text-[var(--color-secondary-container)]'
                      : 'text-[var(--color-on-surface-variant)]';
                    const progressColor = isCritical
                      ? 'bg-[var(--color-secondary-container)] shadow-[0_0_8px_rgba(254,170,0,0.5)]'
                      : 'bg-[var(--color-primary-container)]';
                    const qtyColor = isCritical ? 'text-[var(--color-secondary-container)]' : '';

                    return (
                      <tr key={insumo.id} className="hover:bg-[var(--color-surface-container-high)]/30 transition-colors group">
                        <td className="px-lg py-md">
                          <div className="flex items-center gap-md">
                            <div className={`w-10 h-10 rounded-lg bg-[var(--color-surface-container-highest)] flex items-center justify-center ${iconeBorder}`}>
                              <Icon size={20} className={iconeColor} />
                            </div>
                            <div>
                              <p className="text-headline-md text-[16px] text-[var(--color-on-surface)]">
                                {insumo.nome}
                              </p>
                              <p className={`text-label-md flex items-center gap-1 ${statusColor}`}>
                                {isCritical && <AlertTriangle size={12} />}
                                {statusLabel}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-lg py-md">
                          <span className="px-sm py-1 bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface-variant)] rounded-full text-label-md">
                            {insumo.categoria}
                          </span>
                        </td>
                        <td className="px-lg py-md">
                          <div className="w-full max-w-[160px]">
                            <div className="flex justify-between mb-1">
                              <span className="text-label-md text-[var(--color-on-surface)]">
                                {percent}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-[var(--color-surface-container-highest)] rounded-full overflow-hidden">
                              <div
                                className={`h-full ${progressColor} rounded-full`}
                                style={{ width: `${Math.min(100, percent)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className={`px-lg py-md text-data-display ${qtyColor}`}>
                          {insumo.estoque_atual} / {insumo.estoque_minimo} {insumo.unidade_medida}
                        </td>
                        <td className="px-lg py-md text-right">
                          <div className={`flex items-center justify-end gap-1 ${isCritical ? '' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                            <button
                              onClick={() => { setSelectedInsumo(insumo); setShowEntrada(true); }}
                              className={`p-2 rounded-lg font-bold hover:scale-105 transition-transform active:scale-95 cursor-pointer ${
                                isCritical
                                  ? 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary)] shadow-lg shadow-[var(--color-secondary-container)]/10'
                                  : 'bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] hover:text-[var(--color-primary)]'
                              }`}
                              title="Registrar entrada"
                            >
                              <ShoppingCart size={16} />
                            </button>
                            <button
                              onClick={() => { setSelectedInsumo(insumo); setShowPerda(true); }}
                              className="p-2 rounded-lg bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] hover:text-[var(--color-secondary-container)] transition-colors cursor-pointer"
                              title="Registrar perda"
                            >
                              <Trash2 size={16} />
                            </button>
                            <button
                              onClick={() => openAjuste(insumo)}
                              className="p-2 rounded-lg bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
                              title="Ajustar estoque"
                            >
                              <Sliders size={16} />
                            </button>
                            <button
                              onClick={() => openEdit(insumo)}
                              className="p-2 rounded-lg bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] hover:text-[var(--color-primary-fixed)] transition-colors cursor-pointer"
                              title="Editar insumo"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => openDelete(insumo)}
                              className="p-2 rounded-lg bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] hover:text-[var(--color-error)] transition-colors cursor-pointer"
                              title="Excluir insumo"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer / Batch Actions */}
          <div className="flex justify-between items-center bg-[var(--color-surface-container-high)]/40 p-md rounded-xl border border-[rgba(var(--neutral-rgb),0.1)] backdrop-blur-[12px]">
            <div className="flex items-center gap-lg">
              <div className="flex items-center gap-sm">
                <span className="w-3 h-3 rounded-full bg-[var(--color-secondary-container)]" />
                <span className="text-label-md text-[var(--color-on-surface-variant)]">
                  Alerta de Estoque Baixo
                </span>
              </div>
              <div className="flex items-center gap-sm">
                <span className="w-3 h-3 rounded-full bg-[var(--color-primary-container)]" />
                <span className="text-label-md text-[var(--color-on-surface-variant)]">
                  Estoque Saudável
                </span>
              </div>
            </div>
            <div className="flex gap-md">
              <button
                onClick={load}
                className="bg-[var(--color-surface-container-highest)] text-[var(--color-on-surface)] px-lg py-sm rounded-lg font-bold text-label-md flex items-center gap-sm hover:bg-[var(--color-surface-variant)] transition-colors active:scale-95 duration-150 cursor-pointer"
              >
                <RefreshCw size={18} />
                Atualizar
              </button>
              <button
                onClick={load}
                className="bg-[var(--color-secondary-container)] text-[var(--color-on-secondary)] px-xl py-sm rounded-lg font-bold text-label-md flex items-center gap-sm hover:opacity-90 active:scale-95 duration-150 shadow-[0_0_12px_rgba(254,170,0,0.3)] cursor-pointer"
              >
                <Truck size={18} />
                Repor Todos Críticos
              </button>
            </div>
          </div>
        </>
      )}

      {/* ─── Side Panel: Auto-Reposição ─── */}
      <aside className="fixed right-6 bottom-6 w-80 bg-[rgba(32,31,31,0.6)] backdrop-blur-[12px] rounded-2xl p-lg border border-[rgba(var(--overlay-rgb),0.1)] shadow-2xl z-40 hidden xl:block">
        <div className="flex justify-between items-start mb-md">
          <div>
            <h3 className="text-headline-md text-[18px] text-[var(--color-on-surface)]">Auto-Reposição</h3>
            <p className="text-label-md text-[var(--color-on-surface-variant)]">
              {baixoEstoque.length > 0
                ? `${baixoEstoque.length} insumo(s) abaixo do mínimo`
                : 'Estoque saudável'}
            </p>
          </div>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${baixoEstoque.length > 0 ? 'bg-[var(--color-secondary-container)]/20 text-[var(--color-secondary-container)] animate-pulse' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'}`}>
            <Zap size={24} />
          </div>
        </div>
        <div className="space-y-md">
          {baixoEstoque.length > 0 ? (
            <div className="space-y-sm max-h-[200px] overflow-y-auto custom-scrollbar">
              {baixoEstoque.slice(0, 5).map((item) => (
                <div key={item.id} className="p-sm rounded-xl bg-[var(--color-surface-container-highest)]/50 border border-[rgba(var(--neutral-rgb),0.1)]">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-label-md text-[var(--color-on-surface)] truncate pr-2 flex-1">
                      {item.nome}
                    </span>
                    <span className="text-label-md text-[var(--color-secondary-container)] whitespace-nowrap">
                      {item.estoque_atual}/{item.estoque_minimo} {item.unidade_medida}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[var(--color-surface-lowest)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--color-secondary-container)] transition-all"
                      style={{ width: `${Math.min(100, (item.estoque_atual / item.estoque_minimo) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {baixoEstoque.length > 5 && (
                <p className="text-[11px] text-[var(--color-outline)] text-center pt-1">
                  +{baixoEstoque.length - 5} insumo(s) com estoque baixo
                </p>
              )}
            </div>
          ) : (
            <div className="p-md rounded-xl bg-[var(--color-surface-container-highest)]/50 border border-[rgba(var(--neutral-rgb),0.1)] flex items-center justify-center gap-2 text-[var(--color-outline)]">
              <Package size={18} />
              <span className="text-label-md">Nenhum item crítico</span>
            </div>
          )}
          <button
            onClick={() => setShowReposicao(true)}
            className="w-full bg-[rgba(var(--neutral-rgb),0.2)] text-[var(--color-on-surface)] text-label-md py-sm rounded-lg hover:bg-[rgba(var(--neutral-rgb),0.4)] transition-colors cursor-pointer flex items-center justify-center gap-2"
            disabled={baixoEstoque.length === 0}
          >
            <ClipboardList size={16} />
            {baixoEstoque.length > 0 ? `Ver ${baixoEstoque.length} Pendentes` : 'Nenhum Pendente'}
          </button>
        </div>
      </aside>

      {/* ─── Modal: Novo Insumo ─── */}
      <Modal open={showNewInsumo} onClose={() => setShowNewInsumo(false)} title="Novo Insumo" size="lg">
        <div className="space-y-4">
          <Input label="Nome" value={newInsumo.nome} onChange={(e) => setNewInsumo({ ...newInsumo, nome: e.target.value })} placeholder="Ex: Vodka Grey Goose" />
          <Input label="Categoria" value={newInsumo.categoria} onChange={(e) => setNewInsumo({ ...newInsumo, categoria: e.target.value })} placeholder="Ex: Destilados" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono tracking-wider uppercase text-[var(--color-on-surface-variant)] mb-1 block">Unidade</label>
              <select
                value={newInsumo.unidade_medida}
                onChange={(e) => setNewInsumo({ ...newInsumo, unidade_medida: e.target.value })}
                className="w-full rounded-lg bg-[var(--color-surface-low)] border border-[rgba(var(--overlay-rgb),0.1)] text-sm text-[var(--color-on-surface)] p-2.5 outline-none"
              >
                <option value="un">un</option>
                <option value="ml">ml</option>
                <option value="l">L</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="gar">garrafa</option>
              </select>
            </div>
            <Input label="Custo Unitário (R$)" type="number" step="0.01" value={newInsumo.custo_unitario} onChange={(e) => setNewInsumo({ ...newInsumo, custo_unitario: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Estoque Inicial" type="number" value={newInsumo.estoque_atual} onChange={(e) => setNewInsumo({ ...newInsumo, estoque_atual: Number(e.target.value) })} />
            <Input label="Estoque Mínimo" type="number" value={newInsumo.estoque_minimo} onChange={(e) => setNewInsumo({ ...newInsumo, estoque_minimo: Number(e.target.value) })} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowNewInsumo(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleCreateInsumo} disabled={!newInsumo.nome || !newInsumo.categoria}>Criar</Button>
          </div>
        </div>
      </Modal>

      {/* ─── Modal: Entrada ─── */}
      <Modal open={showEntrada} onClose={() => setShowEntrada(false)} title={`Entrada - ${selectedInsumo?.nome || ''}`} size="md">
        <div className="space-y-4">
          <Input label="Quantidade" type="number" value={entradaQty} onChange={(e) => setEntradaQty(Number(e.target.value))} />
          <Input label="Custo no momento (R$)" type="number" step="0.01" value={entradaCusto} onChange={(e) => setEntradaCusto(Number(e.target.value))} placeholder={`Atual: R$ ${selectedInsumo?.custo_unitario.toFixed(2) || '0'}`} />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowEntrada(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleEntrada} disabled={entradaQty <= 0}>Registrar</Button>
          </div>
        </div>
      </Modal>

      {/* ─── Modal: Perda ─── */}
      <Modal open={showPerda} onClose={() => setShowPerda(false)} title={`Perda - ${selectedInsumo?.nome || ''}`} size="md">
        <div className="space-y-4">
          <Input label="Quantidade" type="number" value={perdaQty} onChange={(e) => setPerdaQty(Number(e.target.value))} />
          <Input label="Motivo" value={perdaMotivo} onChange={(e) => setPerdaMotivo(e.target.value)} placeholder="Ex: Quebrou no transporte" />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowPerda(false)}>Cancelar</Button>
            <Button variant="danger" className="flex-1" onClick={handlePerda} disabled={perdaQty <= 0}>Registrar Perda</Button>
          </div>
        </div>
      </Modal>

      {/* ─── Modal: Editar Insumo ─── */}
      <Modal open={showEditInsumo} onClose={() => setShowEditInsumo(false)} title={`Editar - ${selectedInsumo?.nome || ''}`} size="md">
        <div className="space-y-4">
          <Input label="Nome" value={editInsumo.nome} onChange={(e) => setEditInsumo({ ...editInsumo, nome: e.target.value })} />
          <Input label="Categoria" value={editInsumo.categoria} onChange={(e) => setEditInsumo({ ...editInsumo, categoria: e.target.value })} placeholder="Ex: Destilados" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono tracking-wider uppercase text-[var(--color-on-surface-variant)] mb-1 block">Unidade</label>
              <select
                value={editInsumo.unidade_medida}
                onChange={(e) => setEditInsumo({ ...editInsumo, unidade_medida: e.target.value })}
                className="w-full rounded-lg bg-[var(--color-surface-low)] border border-[rgba(var(--overlay-rgb),0.1)] text-sm text-[var(--color-on-surface)] p-2.5 outline-none"
              >
                <option value="un">un</option>
                <option value="ml">ml</option>
                <option value="l">L</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
                <option value="gar">garrafa</option>
              </select>
            </div>
            <Input label="Custo Unitário (R$)" type="number" step="0.01" value={editInsumo.custo_unitario} onChange={(e) => setEditInsumo({ ...editInsumo, custo_unitario: Number(e.target.value) })} />
          </div>
          <Input label="Estoque Mínimo" type="number" value={editInsumo.estoque_minimo} onChange={(e) => setEditInsumo({ ...editInsumo, estoque_minimo: Number(e.target.value) })} />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowEditInsumo(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleEditInsumo} disabled={!editInsumo.nome}>
              <Save size={16} /> Salvar
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Modal: Confirmar Exclusão ─── */}
      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title={`Excluir - ${selectedInsumo?.nome || ''}`} size="md">
        <div className="space-y-4">
          <p className="text-[var(--color-on-surface-variant)] text-sm">
            Tem certeza que deseja excluir <strong className="text-[var(--color-on-surface)]">{selectedInsumo?.nome}</strong>?
            Esta ação é irreversível.
          </p>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>Cancelar</Button>
            <Button variant="danger" className="flex-1" onClick={handleDeleteInsumo} loading={deleting}>
              <Trash2 size={16} /> Excluir
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Modal: Ajuste de Estoque ─── */}
      <Modal open={showAjuste} onClose={() => setShowAjuste(false)} title={`Ajustar Estoque - ${selectedInsumo?.nome || ''}`} size="md">
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-[var(--color-surface-container-high)] text-sm">
            <span className="text-[var(--color-on-surface-variant)]">Estoque atual: </span>
            <span className="text-[var(--color-primary)] font-bold">{selectedInsumo?.estoque_atual}</span>
            <span className="text-[var(--color-on-surface-variant)]"> {selectedInsumo?.unidade_medida}</span>
          </div>
          <Input label="Novo valor do estoque" type="number" value={ajusteEstoque} onChange={(e) => setAjusteEstoque(Number(e.target.value))} />
          <Input label="Motivo do ajuste" value={ajusteMotivo} onChange={(e) => setAjusteMotivo(e.target.value)} placeholder="Ex: Inventário físico" />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowAjuste(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleAjuste} disabled={ajusteEstoque < 0 || !ajusteMotivo.trim()}>
              <Save size={16} /> Aplicar Ajuste
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Modal: Auto-Reposição (Itens Pendentes) ─── */}
      <Modal open={showReposicao} onClose={() => setShowReposicao(false)} title="Itens para Reposição" size="lg">
        <div className="space-y-4">
          {baixoEstoque.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-[var(--color-outline)] gap-2">
              <Package size={32} className="opacity-40" />
              <p className="text-sm">Nenhum item precisa de reposição no momento</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-[var(--color-on-surface-variant)] font-mono uppercase tracking-wider px-1">
                <span>{baixoEstoque.length} item(ns) abaixo do estoque mínimo</span>
                <span>Atual / Mínimo</span>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {baixoEstoque.map((item) => {
                  const ratio = item.estoque_minimo > 0 ? item.estoque_atual / item.estoque_minimo : 1;
                  const needToOrder = Math.max(0, item.estoque_minimo - item.estoque_atual);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-container-high)]/50 border border-[rgba(var(--neutral-rgb),0.1)]"
                    >
                      <div className="w-9 h-9 rounded-lg bg-[var(--color-secondary-container)]/15 flex items-center justify-center shrink-0">
                        <Package size={18} className="text-[var(--color-secondary-container)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-md text-[var(--color-on-surface)] truncate">{item.nome}</p>
                        <div className="w-full max-w-[120px] h-1.5 rounded-full bg-[var(--color-surface-lowest)] overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full transition-all ${
                              ratio <= 0.5 ? 'bg-[var(--color-error)]' : 'bg-[var(--color-secondary-container)]'
                            }`}
                            style={{ width: `${Math.min(100, ratio * 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-data-display text-[var(--color-on-surface)]">
                          {item.estoque_atual} <span className="text-[11px] text-[var(--color-on-surface-variant)]">/{item.estoque_minimo} {item.unidade_medida}</span>
                        </p>
                        {needToOrder > 0 && (
                          <p className="text-[11px] text-[var(--color-error)] mt-0.5">
                            Faltam {needToOrder} {item.unidade_medida}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="ghost" className="flex-1" onClick={() => setShowReposicao(false)}>Fechar</Button>
                <Button className="flex-1" onClick={() => { setShowReposicao(false); }}>
                  <RefreshCw size={16} /> Atualizar
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
