import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Clock,
  MessageSquare,
  RefreshCw,
  FileText,
  X,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { pedidosService } from '../services/api';
import { toast } from '../components/Toast';
import Modal from '../components/Modal';

type PedidoStatus = 'Novo' | 'Preparando' | 'Pronto' | 'Entregue' | 'Cancelado' | 'Arquivado';

interface PedidoItem {
  nome: string;
  quantidade: number;
  preco: number;
  observacao?: string;
}

interface Pedido {
  id: number;
  mesa?: string;
  cliente?: string;
  status: PedidoStatus;
  itens: PedidoItem[];
  total: number;
  observacao?: string;
  created_at?: string;
  pronto_em?: string;
  tempo_preparo_estimado?: number;
}

const STATUS_CONFIG: Record<
  PedidoStatus,
  { label: string; color: string; glow: string; bg: string; border: string; btnBg: string; btnLabel: string; nextStatus: PedidoStatus | null }
> = {
  Novo: { label: 'Novo', color: 'text-[var(--color-primary-container)]', glow: 'shadow-[0_0_12px_rgba(0,229,255,0.25)]', bg: 'bg-[rgba(0,229,255,0.08)]', border: 'border-[rgba(0,229,255,0.3)]', btnBg: 'bg-[var(--color-primary-container)] text-[var(--color-on-primary)]', btnLabel: 'Iniciar Preparo', nextStatus: 'Preparando' },
  Preparando: { label: 'Preparando', color: 'text-amber-400', glow: 'shadow-[0_0_8px_rgba(251,191,36,0.2)]', bg: 'bg-[rgba(251,191,36,0.06)]', border: 'border-[rgba(251,191,36,0.25)]', btnBg: 'bg-amber-400 text-black', btnLabel: 'Marcar Pronto', nextStatus: 'Pronto' },
  Pronto: { label: 'Pronto', color: 'text-emerald-400', glow: 'shadow-[0_0_8px_rgba(52,211,153,0.2)]', bg: 'bg-[rgba(52,211,153,0.06)]', border: 'border-[rgba(52,211,153,0.25)]', btnBg: 'bg-emerald-400 text-black', btnLabel: 'Entregar', nextStatus: 'Entregue' },
  Entregue: { label: 'Entregue', color: 'text-[var(--color-outline)]', glow: '', bg: 'bg-[var(--color-surface-container)]', border: 'border-[rgba(255,255,255,0.06)]', btnBg: '', btnLabel: 'Concluído', nextStatus: null },
  Cancelado: { label: 'Cancelado', color: 'text-[var(--color-error)]', glow: '', bg: 'bg-[var(--color-error)]/5', border: 'border-[var(--color-error)]/20', btnBg: '', btnLabel: 'Cancelado', nextStatus: null },
  Arquivado: { label: 'Arquivado', color: 'text-[var(--color-outline)]', glow: '', bg: 'bg-[var(--color-surface-container)]', border: 'border-[rgba(255,255,255,0.06)]', btnBg: '', btnLabel: 'Arquivado', nextStatus: null },
};

const STATUS_FILTERS: Array<{ key: string; label: string }> = [
  { key: 'ativo', label: 'Ativos' },
  { key: '', label: 'Todos' },
  { key: 'Novo', label: 'Novos' },
  { key: 'Preparando', label: 'Preparando' },
  { key: 'Pronto', label: 'Prontos' },
  { key: 'Entregue', label: 'Entregues' },
  { key: 'Arquivado', label: 'Arquivados' },
  { key: 'Cancelado', label: 'Cancelados' },
];

function parseDate(s?: string | null): number {
  if (!s) return NaN;
  const d = new Date(s);
  if (isNaN(d.getTime())) return NaN;
  if (!s.endsWith('Z') && !s.includes('+')) {
    return d.getTime() - d.getTimezoneOffset() * 60000;
  }
  return d.getTime();
}

function formatElapsed(created?: string | null, now = Date.now()): string {
  const ms = parseDate(created);
  if (isNaN(ms)) return '--:--';
  const diff = Math.floor((now - ms) / 60000);
  if (diff <= 0) return 'agora';
  if (diff < 60) return `${diff}min`;
  return `${Math.floor(diff / 60)}h${diff % 60}m`;
}

export default function Comandas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [cancelPedido, setCancelPedido] = useState<Pedido | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const loadPedidos = useCallback(() => {
    setLoading(true);
    const request = statusFilter === 'ativo'
      ? pedidosService.listarAtivos()
      : pedidosService.listarTodos(statusFilter || undefined);
    request
      .then((res) => setPedidos(Array.isArray(res.data) ? res.data : []))
      .catch(() => setPedidos([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    const urlStatus = searchParams.get('status');
    if (urlStatus !== statusFilter) setStatusFilter(urlStatus || '');
  }, [searchParams, statusFilter]);

  useEffect(() => {
    loadPedidos();
    const interval = setInterval(loadPedidos, 10000);
    return () => clearInterval(interval);
  }, [loadPedidos]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!showFilterDropdown) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-filter-dropdown]')) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showFilterDropdown]);

  const handleStatusChange = async (id: number, status: PedidoStatus) => {
    try {
      await pedidosService.atualizarStatus(id, status);
      toast.success(`Pedido #${id} → ${status}`);
      loadPedidos();
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  const handleCancel = async () => {
    if (!cancelPedido) return;
    setCancelling(true);
    try {
      await pedidosService.atualizarStatus(cancelPedido.id, 'Cancelado');
      toast.success(`Pedido #${cancelPedido.id} cancelado`);
      setCancelPedido(null);
      setMotivoCancelamento('');
      loadPedidos();
    } catch {
      toast.error('Erro ao cancelar pedido');
    } finally {
      setCancelling(false);
    }
  };

  const handleFilterChange = (key: string) => {
    setStatusFilter(key);
    if (key) {
      setSearchParams({ status: key });
    } else {
      setSearchParams({});
    }
  };

  const filtered = pedidos.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(p.id).includes(q) ||
      (p.mesa || '').toLowerCase().includes(q) ||
      (p.cliente || '').toLowerCase().includes(q)
    );
  });

  const activePedidos = pedidos.filter(
    (p) => p.status === 'Novo' || p.status === 'Preparando' || p.status === 'Pronto'
  );

  const avgTime = (() => {
    const tempos = activePedidos
      .map((p) => {
        const ms = parseDate(p.created_at);
        if (isNaN(ms)) return 0;
        return Math.floor((now - ms) / 60000);
      })
      .filter((t) => t > 0);
    if (tempos.length === 0) return null;
    return Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length);
  })();

  return (
    <div className="flex flex-col h-dvh bg-[var(--color-background)]">
      {/* Header */}
      <header className="safe-top border-b border-[rgba(255,255,255,0.06)] bg-[rgba(var(--glass-rgb),0.6)] backdrop-blur-[20px]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgba(0,229,255,0.2)] to-[rgba(0,218,243,0.08)] flex items-center justify-center border border-[rgba(0,229,255,0.2)] shadow-[0_0_12px_rgba(0,229,255,0.15)]">
              <FileText size={20} className="text-[var(--color-primary-container)]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[var(--color-on-surface)] tracking-tight">PEDIDOS</h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[rgba(0,229,255,0.1)] border border-[rgba(0,229,255,0.2)] text-[8px] font-mono font-bold uppercase tracking-wider text-[var(--color-primary-container)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-container)] animate-pulse shadow-[0_0_4px_rgba(0,229,255,0.6)]" />
                  Ao Vivo
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[9px] font-mono text-[var(--color-on-surface-variant)] uppercase tracking-wider">
                  {activePedidos.length} ativo(s)
                </span>
                {avgTime !== null && (
                  <>
                    <span className="text-[var(--color-outline)]">·</span>
                    <span className="text-[9px] font-mono text-amber-400 uppercase tracking-wider">
                      ~{avgTime}min méd.
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={loadPedidos}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--color-surface-container-high)] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,229,255,0.2)] transition-all cursor-pointer"
          >
            <RefreshCw size={16} className="text-[var(--color-on-surface-variant)]" />
          </button>
        </div>
      </header>

      {/* Search */}
      <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.04)]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" />
          <input
            type="text"
            placeholder="Buscar por ID, mesa ou cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-[var(--color-surface-container-high)] border border-[rgba(255,255,255,0.06)] text-xs font-mono text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:border-b-2 focus:border-b-[var(--color-primary-container)] transition-all"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-2 border-b border-[rgba(255,255,255,0.04)]">
        <div className="relative" data-filter-dropdown>
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="w-full h-10 px-4 rounded-xl bg-[var(--color-surface-container-high)] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(0,229,255,0.2)] text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-on-surface)] flex items-center justify-between transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-container)] shadow-[0_0_6px_rgba(0,229,255,0.5)]" />
              {STATUS_FILTERS.find(f => f.key === statusFilter)?.label || 'Todos'}
            </span>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`text-[var(--color-on-surface-variant)] transition-transform duration-200 ${showFilterDropdown ? 'rotate-180' : ''}`}>
              <path d="M2.5 3.75L5 6.25L7.5 3.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {showFilterDropdown && (
            <div className="absolute top-full left-0 right-0 mt-1 py-1 bg-[var(--color-surface-container)] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-[20px] z-50 overflow-hidden">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => { handleFilterChange(f.key); setShowFilterDropdown(false); }}
                  className={`w-full h-9 px-4 flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    statusFilter === f.key
                      ? 'bg-[rgba(0,229,255,0.1)] text-[var(--color-primary-container)]'
                      : 'text-[var(--color-on-surface-variant)] hover:bg-[rgba(255,255,255,0.04)]'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    statusFilter === f.key ? 'bg-[var(--color-primary-container)] shadow-[0_0_6px_rgba(0,229,255,0.5)]' : 'bg-transparent'
                  }`} />
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[var(--color-primary-container)] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-[var(--color-outline)] tracking-wider">Carregando pedidos...</span>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-[var(--color-outline)] gap-3">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-container)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center">
              <CheckCircle size={28} className="opacity-30 text-emerald-400" />
            </div>
            <span className="text-xs font-mono tracking-wider">
              {search ? 'Nenhum pedido encontrado' : 'Nenhum pedido nesta categoria'}
            </span>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((pedido) => {
              const cfg = STATUS_CONFIG[pedido.status] || STATUS_CONFIG.Novo;
              const isExpanded = expandedId === pedido.id;
              const isNew = pedido.status === 'Novo';
              const isActive = pedido.status === 'Novo' || pedido.status === 'Preparando' || pedido.status === 'Pronto';
              const elapsed = formatElapsed(pedido.created_at, now);

              return (
                <div
                  key={pedido.id}
                  className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
                    isNew
                      ? `${cfg.bg} ${cfg.border} ${cfg.glow}`
                      : `bg-[var(--color-surface-container)] border-[rgba(255,255,255,0.06)]`
                  }`}
                >
                  {/* Card Header */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : pedido.id)}
                    className="flex items-center justify-between px-4 py-3 cursor-pointer active:bg-[rgba(255,255,255,0.02)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-bold font-mono ${cfg.color}`}>
                        #{pedido.id}
                      </span>
                      {pedido.mesa && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-surface-container-high)] text-[8px] font-mono font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)]">
                          Mesa {pedido.mesa}
                        </span>
                      )}
                      {pedido.cliente && (
                        <span className="text-[9px] font-mono text-[var(--color-on-surface-variant)] hidden sm:inline">
                          {pedido.cliente}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-amber-400">
                        <Clock size={12} />
                        <span className="text-[10px] font-mono font-bold">{elapsed}</span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase tracking-wider ${
                        isNew ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary)] animate-pulse' :
                        pedido.status === 'Preparando' ? 'bg-amber-400/15 text-amber-400 border border-amber-400/20' :
                        pedido.status === 'Pronto' ? 'bg-emerald-400/15 text-emerald-400 border border-emerald-400/20' :
                        'bg-[var(--color-surface-container-high)] text-[var(--color-outline)]'
                      }`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-[rgba(255,255,255,0.04)]">
                      {/* Items */}
                      <div className="pt-3 space-y-1.5">
                        {pedido.itens?.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center py-1.5 border-b border-[rgba(255,255,255,0.03)] last:border-0">
                            <span className="text-xs text-[var(--color-on-surface)]">
                              <span className="font-mono font-bold text-[var(--color-primary-container)]">{item.quantidade}x</span>{' '}
                              {item.nome}
                            </span>
                            {item.preco > 0 && (
                              <span className="text-[10px] font-mono text-[var(--color-on-surface-variant)]">
                                R$ {(item.quantidade * item.preco).toFixed(2)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Observation */}
                      {pedido.observacao && (
                        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-400/5 border border-amber-400/15">
                          <MessageSquare size={12} className="text-amber-400 mt-0.5 shrink-0" />
                          <span className="text-[10px] font-mono text-amber-400/80 italic">{pedido.observacao}</span>
                        </div>
                      )}

                      {/* Total */}
                      {pedido.total > 0 && (
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)]">Total</span>
                          <span className="text-sm font-mono font-bold text-[var(--color-primary-container)]">R$ {pedido.total.toFixed(2)}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-1">
                        {cfg.nextStatus && isActive && (
                          <button
                            onClick={() => handleStatusChange(pedido.id, cfg.nextStatus!)}
                            className={`flex-1 h-11 rounded-xl ${cfg.btnBg} text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-[0_0_8px_rgba(0,229,255,0.15)]`}
                          >
                            {cfg.btnLabel}
                          </button>
                        )}
                        {isActive && (
                          <button
                            onClick={() => setCancelPedido(pedido)}
                            className="h-11 px-4 rounded-xl bg-[var(--color-error)]/8 text-[var(--color-error)] border border-[var(--color-error)]/15 text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1 hover:bg-[var(--color-error)]/15 active:scale-[0.98] transition-all cursor-pointer"
                          >
                            <X size={12} /> Cancelar
                          </button>
                        )}
                        {!isActive && (
                          <div className="flex-1 text-center text-[9px] font-mono text-[var(--color-outline)] uppercase tracking-wider py-3">
                            {pedido.status === 'Cancelado' ? 'Pedido cancelado' : 'Pedido entregue'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      <Modal open={!!cancelPedido} onClose={() => { setCancelPedido(null); setMotivoCancelamento(''); }}>
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-error)]/10 flex items-center justify-center border border-[var(--color-error)]/20">
              <AlertTriangle size={18} className="text-[var(--color-error)]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--color-on-surface)]">Cancelar Pedido</h2>
              <p className="text-xs font-mono text-[var(--color-on-surface-variant)]">Pedido #{cancelPedido?.id}</p>
            </div>
          </div>

          <p className="text-xs text-[var(--color-on-surface-variant)]">
            Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.
          </p>

          <div>
            <label className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-[var(--color-on-surface-variant)] mb-2 block">
              Motivo (opcional)
            </label>
            <input
              type="text"
              value={motivoCancelamento}
              onChange={(e) => setMotivoCancelamento(e.target.value)}
              placeholder="Ex: Cliente desistiu..."
              className="w-full h-10 px-4 rounded-xl bg-[var(--color-surface-container-high)] border border-[rgba(255,255,255,0.06)] text-xs font-mono text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:border-b-2 focus:border-b-[var(--color-primary-container)] transition-all"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setCancelPedido(null); setMotivoCancelamento(''); }}
              className="flex-1 h-11 rounded-xl border border-[rgba(255,255,255,0.1)] text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)] hover:bg-[rgba(255,255,255,0.04)] transition-all cursor-pointer"
            >
              Voltar
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 h-11 rounded-xl bg-[var(--color-error)] text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40"
            >
              {cancelling ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><X size={12} /> Confirmar Cancelamento</>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
