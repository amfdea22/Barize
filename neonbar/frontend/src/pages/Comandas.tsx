import { useState, useEffect } from 'react';
import {
  Search,
  ShoppingCart,
  ChevronDown,

  Printer,
  FileText,

  Clock,
  CheckCircle2,
  CookingPot,
  X,
  Edit,
  Save,
} from 'lucide-react';
import { pedidosService, pdvService } from '../services/api';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Input from '../components/Input';
import type { Pedido } from '../types';

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  Novo: { label: 'Novo', color: 'var(--color-primary)', icon: Clock },
  Preparando: { label: 'Preparando', color: 'var(--color-secondary-container)', icon: CookingPot },
  Pronto: { label: 'Pronto', color: 'var(--color-tertiary)', icon: CheckCircle2 },
  Entregue: { label: 'Entregue', color: 'var(--color-outline)', icon: CheckCircle2 },
};

export default function Comandas() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editPedido, setEditPedido] = useState<Pedido | null>(null);
  const [editForm, setEditForm] = useState({ mesa: '', cliente: '', observacao: '', tempo_preparo_estimado: 0, itens: [] as { nome: string; quantidade: number; preco: number; observacao?: string }[] });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');
  const [produtos, setProdutos] = useState<{ id: number; nome: string; preco_venda: number }[]>([]);
  const [addItemMode, setAddItemMode] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<number | ''>('');

  // Timer de preparo — atualiza a cada 30s
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const parseDate = (s?: string | null): number => {
    if (!s) return NaN;
    const d = new Date(s);
    if (isNaN(d.getTime())) return NaN;
    if (!s.endsWith('Z') && !s.includes('+')) {
      return d.getTime() - d.getTimezoneOffset() * 60000;
    }
    return d.getTime();
  };

  const formatElapsed = (created?: string | null) => {
    const ms = parseDate(created);
    if (isNaN(ms)) return '—';
    const diff = Math.floor((now - ms) / 60000);
    if (diff <= 0) return 'agora';
    if (diff < 60) return `${diff} min`;
    const h = Math.floor(diff / 60);
    return `${h}h${diff % 60}m`;
  };

  const loadPedidos = () => {
    setLoading(true);
    pedidosService
      .listarTodos(statusFilter || undefined)
      .then((res) => setPedidos(Array.isArray(res.data) ? res.data : []))
      .catch(() => setPedidos([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPedidos(); }, [statusFilter]);

  useEffect(() => {
    pdvService.listarProdutos().then(res => {
      setProdutos(Array.isArray(res.data) ? res.data.map((p: any) => ({ id: p.id, nome: p.nome, preco_venda: p.preco_venda })) : []);
    }).catch(() => {});
  }, []);

  const filtered = pedidos.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(p.id).includes(q) ||
      (p.mesa || '').toLowerCase().includes(q) ||
      (p.cliente || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-lg">
        <div>
          <h1 className="text-headline-lg font-bold text-[var(--color-on-surface)]">Comandas</h1>
          <p className="text-label-md text-[var(--color-on-surface-variant)] mt-0.5">
            {pedidos.length} pedido(s) registrado(s)
          </p>
        </div>
        <button
          onClick={loadPedidos}
          className="px-lg h-[44px] rounded-lg bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] border border-[rgba(255,255,255,0.1)] hover:bg-[var(--color-surface-container-highest)] transition-colors text-label-md cursor-pointer"
        >
          Atualizar
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-md mb-lg">
        <div className="relative flex-1 max-w-sm">
          <Search size={18} className="absolute left-sm top-1/2 -translate-y-1/2 text-[var(--color-outline)]" />
          <input
            type="text"
            placeholder="Buscar por ID, mesa ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--color-surface-container-lowest)] border border-[rgba(255,255,255,0.1)] rounded-lg pl-xl pr-md py-xs text-body-md focus:border-[var(--color-primary)]/50 outline-none text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]/40 transition-colors"
          />
        </div>
        <div className="flex gap-1">
          {['', 'Novo', 'Preparando', 'Pronto', 'Entregue'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-md h-[36px] rounded-lg text-label-sm transition-all cursor-pointer ${
                statusFilter === s
                  ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]'
                  : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]'
              }`}
            >
              {s || 'Todos'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-32 text-[var(--color-outline)] text-sm">
          Carregando comandas...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-[var(--color-outline)] text-sm gap-2">
          <FileText size={32} className="opacity-30" />
          <span>Nenhuma comanda encontrada</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-sm min-h-0">
          {filtered.map((pedido) => {
            const StatusIcon = statusConfig[pedido.status]?.icon || Clock;
            const isExpanded = expandedId === pedido.id;
            return (
              <div
                key={pedido.id}
                className="rounded-xl overflow-hidden transition-all duration-300"
                style={{
                  background: pedido.status === 'Preparando'
                    ? 'rgba(255,200,0,0.06)'
                    : pedido.status === 'Pronto'
                    ? 'rgba(0,200,100,0.06)'
                    : 'var(--color-surface-container)',
                  backdropFilter: pedido.status === 'Preparando' || pedido.status === 'Pronto' ? 'blur(12px)' : undefined,
                  WebkitBackdropFilter: pedido.status === 'Preparando' || pedido.status === 'Pronto' ? 'blur(12px)' : undefined,
                  border: `1px solid ${
                    pedido.status === 'Preparando'
                      ? 'rgba(255,200,0,0.25)'
                      : pedido.status === 'Pronto'
                      ? 'rgba(0,200,100,0.25)'
                      : 'rgba(255,255,255,0.06)'
                  }`,
                  boxShadow: pedido.status === 'Preparando' || pedido.status === 'Pronto'
                    ? `0 4px 24px ${
                        pedido.status === 'Preparando'
                          ? 'rgba(255,200,0,0.08)'
                          : 'rgba(0,200,100,0.08)'
                      }`
                    : undefined,
                }}
              >
                {/* Summary row */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : pedido.id)}
                  className="flex items-center gap-md px-lg py-md cursor-pointer hover:bg-[var(--color-surface-container-high)]/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-container-high)] flex items-center justify-center shrink-0">
                    <ShoppingCart size={18} className="text-[var(--color-primary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-label-md font-semibold text-[var(--color-on-surface)]">
                        Comanda #{pedido.id}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${statusConfig[pedido.status]?.color} 20%, transparent)`,
                          color: statusConfig[pedido.status]?.color,
                        }}
                      >
                        <StatusIcon size={10} className="inline mr-0.5" />
                        {pedido.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-md mt-0.5 text-label-sm text-[var(--color-on-surface-variant)]">
                      {pedido.mesa && <span>Mesa {pedido.mesa}</span>}
                      {pedido.cliente && <span>• {pedido.cliente}</span>}
                      <span>• {pedido.itens?.length || 0} item(ns)</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-data-display text-[var(--color-primary)] font-bold">
                      R$ {pedido.total?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-[10px] text-[var(--color-outline)] font-mono">
                      {pedido.created_at ? new Date(pedido.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '�'}
                    </div>
                    {(pedido.status === 'Novo' || pedido.status === 'Preparando') && (
                      <div className="text-[10px] font-mono mt-0.5" style={{ color: 'var(--color-secondary-container)' }}>
                        ⏱ {formatElapsed(pedido.created_at)}
                        {pedido.tempo_preparo_estimado && <> • ~{pedido.tempo_preparo_estimado} min</>}
                      </div>
                    )}
                    {pedido.status === 'Pronto' && pedido.created_at && pedido.pronto_em && (
                      <div className="text-[10px] font-mono mt-0.5 text-[var(--color-tertiary)]">
                        ✅ Pronto em {formatElapsed(pedido.pronto_em)}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditPedido(pedido); setEditForm({ mesa: pedido.mesa || '', cliente: pedido.cliente || '', observacao: pedido.observacao || '', tempo_preparo_estimado: pedido.tempo_preparo_estimado || 5, itens: (pedido.itens || []).map(i => ({ ...i })) }); setAddItemMode(false); setSelectedProduto(''); }}
                    className="p-2 rounded-lg bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)] hover:text-[var(--color-secondary-container)] transition-all cursor-pointer shrink-0"
                    title="Editar comanda"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedPedido(pedido); }}
                    className="p-2 rounded-lg bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)] hover:text-[var(--color-primary)] transition-all cursor-pointer shrink-0"
                    title="Visualizar comanda"
                  >
                    <FileText size={16} />
                  </button>
                  <div className="text-[var(--color-on-surface-variant)] transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(180deg)' : '' }}>
                    <ChevronDown size={16} />
                  </div>
                </div>

                {/* Expanded items */}
                {isExpanded && (
                  <div className="px-lg pb-md border-t border-[rgba(255,255,255,0.06)]">
                    <div className="pt-md space-y-1">
                      {pedido.itens?.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-label-sm font-mono text-[var(--color-primary)] w-6 shrink-0">
                              {item.quantidade}x
                            </span>
                            <span className="text-body-md text-[var(--color-on-surface)] truncate">
                              {item.nome || item.produto_nome || 'Item'}
                            </span>
                          </div>
                          <span className="text-data-display text-[var(--color-on-surface-variant)] shrink-0 ml-2">
                            R$ {(item.preco * item.quantidade || 0).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {pedido.observacao && (
                      <div className="mt-2 text-[11px] text-[var(--color-secondary-container)] italic">
                        Obs: {pedido.observacao}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Modal (print-format vertical) */}
      <Modal open={!!selectedPedido} onClose={() => setSelectedPedido(null)} title={`Comanda #${selectedPedido?.id || ''}`} size="lg">
        {selectedPedido && (
          <div className="space-y-4">
            <div className="bg-white text-black rounded-sm p-4 text-xs leading-relaxed max-h-[420px] overflow-y-auto font-mono select-all">
              <div className="text-center font-bold text-sm tracking-widest mb-0.5">NEONBAR</div>
              <div className="text-center uppercase text-[10px] mb-2">Comanda de Bar</div>
              <div className="border-t border-dashed border-black/20 mb-1" />

              <div className="flex justify-between text-[10px] mb-1">
                <span>#{selectedPedido.id}</span>
                <span>{selectedPedido.created_at ? new Date(selectedPedido.created_at).toLocaleString('pt-BR') : '-'}</span>
              </div>

              {selectedPedido.mesa && <div className="text-[10px] mb-0.5">Mesa: {selectedPedido.mesa}</div>}
              {selectedPedido.cliente && <div className="text-[10px] mb-1">Cliente: {selectedPedido.cliente}</div>}

              <div className="border-t border-dashed border-black/20 mb-1" />

              <div className="space-y-0.5 mb-1">
                {selectedPedido.itens?.map((item: any, idx: number) => (
                  <div key={idx}>
                    <div className="flex justify-between text-[10px]">
                      <span>{item.quantidade}x {item.nome || item.produto_nome || 'Item'}</span>
                      <span>R$ {(item.preco * item.quantidade || 0).toFixed(2)}</span>
                    </div>
                    {item.nota && (
                      <div className="text-[9px] text-black/50 pl-4">Obs: {item.nota}</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-black/20 mb-1" />

              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL</span>
                <span>R$ {selectedPedido.total?.toFixed(2) || '0.00'}</span>
              </div>

              <div className="border-t border-dashed border-black/20 my-1" />

              <div className="text-center text-[9px] text-black/50 space-y-0.5">
                {selectedPedido.observacao && <div className="text-black/70">Obs: {selectedPedido.observacao}</div>}
                <div>Status: {selectedPedido.status}</div>
                <div className="text-black/30 mt-0.5">Obrigado!</div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setSelectedPedido(null)}>
                Fechar
              </Button>
              <Button className="flex-1" onClick={() => window.print()}>
                <Printer size={16} /> Imprimir
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editPedido} onClose={() => setEditPedido(null)} title={`Editar Comanda #${editPedido?.id || ''}`} size="md">
        {editPedido && (
          <div className="space-y-4">
            <Input label="Mesa" value={editForm.mesa} onChange={(e) => setEditForm({ ...editForm, mesa: e.target.value })} placeholder="Ex: 12" />
            <Input label="Cliente" value={editForm.cliente} onChange={(e) => setEditForm({ ...editForm, cliente: e.target.value })} placeholder="Nome do cliente" />
            <Input label="Tempo de Preparo (min)" type="number" min="0" value={editForm.tempo_preparo_estimado} onChange={(e) => setEditForm({ ...editForm, tempo_preparo_estimado: Number(e.target.value) })} />
            <div>
              <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-2">Observação</label>
              <textarea value={editForm.observacao} onChange={(e) => setEditForm({ ...editForm, observacao: e.target.value })} placeholder="Observação do pedido..." rows={3} className="w-full bg-[var(--color-surface-low)] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-[var(--color-on-surface)] px-3 py-2 outline-none resize-none placeholder:text-[var(--color-on-surface-variant)]/40" />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-2">Itens</label>
              <div className="space-y-1 mb-2">
                {editForm.itens.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-[var(--color-surface-low)] rounded-lg px-3 py-2">
                    <span className="flex-1 text-sm text-[var(--color-on-surface)] truncate">{item.nome}</span>
                    <input type="number" min={1} value={item.quantidade} onChange={(e) => { const newItens = [...editForm.itens]; newItens[idx] = { ...newItens[idx], quantidade: Number(e.target.value) }; setEditForm({ ...editForm, itens: newItens }); }} className="w-16 bg-[var(--color-surface-container-high)] border border-[rgba(255,255,255,0.1)] rounded text-sm text-center text-[var(--color-on-surface)] outline-none px-1 py-1" />
                    <span className="text-xs text-[var(--color-on-surface-variant)] font-mono w-20 text-right">R$ {(item.preco * item.quantidade).toFixed(2)}</span>
                    <button onClick={() => setEditForm({ ...editForm, itens: editForm.itens.filter((_, i) => i !== idx) })} className="p-1 rounded hover:bg-[var(--color-error)]/10 text-[var(--color-error)] transition-colors cursor-pointer"><X size={14} /></button>
                  </div>
                ))}
              </div>
              {addItemMode ? (
                <div className="flex items-center gap-2">
                  <select value={selectedProduto} onChange={(e) => setSelectedProduto(Number(e.target.value) || '')} className="flex-1 bg-[var(--color-surface-container-high)] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-[var(--color-on-surface)] px-3 py-2 outline-none">
                    <option value="">Selecione um produto...</option>
                    {produtos.map(p => <option key={p.id} value={p.id}>{p.nome} — R$ {p.preco_venda.toFixed(2)}</option>)}
                  </select>
                  <Button size="sm" disabled={selectedProduto === ''} onClick={() => { const prod = produtos.find(p => p.id === selectedProduto); if (prod) { setEditForm({ ...editForm, itens: [...editForm.itens, { nome: prod.nome, quantidade: 1, preco: prod.preco_venda }] }); setSelectedProduto(''); setAddItemMode(false); } }}>Adicionar</Button>
                  <button onClick={() => setAddItemMode(false)} className="p-2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] cursor-pointer"><X size={16} /></button>
                </div>
              ) : (
                <button onClick={() => setAddItemMode(true)} className="text-xs text-[var(--color-primary)] hover:underline cursor-pointer">+ Adicionar Item</button>
              )}
            </div>

            {editError && <p className="text-xs text-[var(--color-error)]">{editError}</p>}

            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setEditPedido(null)}>Cancelar</Button>
              <Button className="flex-1" loading={savingEdit} onClick={async () => { setSavingEdit(true); setEditError(''); try { await pedidosService.atualizar(editPedido.id, { mesa: editForm.mesa || undefined, cliente: editForm.cliente || undefined, observacao: editForm.observacao || undefined, tempo_preparo_estimado: editForm.tempo_preparo_estimado || undefined, itens: editForm.itens.length > 0 ? editForm.itens : undefined, }); setEditPedido(null); loadPedidos(); } catch { setEditError('Erro ao salvar alterações'); } finally { setSavingEdit(false); } }}><Save size={16} /> Salvar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
