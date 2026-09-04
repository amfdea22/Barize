import { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  RefreshCw,
  X,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { pedidosService } from '../services/api';
import { toast } from '../components/Toast';
import Modal from '../components/Modal';
import type { Pedido } from '../types';

type PedidoStatus = 'Novo' | 'Preparando' | 'Pronto' | 'Entregue' | 'Cancelado' | 'Arquivado';
type StatusFilter = 'ativos' | '' | 'Novo' | 'Preparando' | 'Pronto' | 'Entregue' | 'Cancelado' | 'Arquivado';

const STATUS_CONFIG: Record<
  PedidoStatus,
  { label: string; color: string; borderClass: string; badgeBg: string; btnBg: string; btnLabel: string; nextStatus: PedidoStatus | null }
> = {
  Novo: { label: 'Em Preparo', color: 'text-cyan-400', borderClass: 'border-l-cyan-400', badgeBg: 'bg-cyan-400/20', btnBg: 'bg-amber-400 text-black', btnLabel: 'Iniciar Preparo', nextStatus: 'Preparando' },
  Preparando: { label: 'Em Preparo', color: 'text-cyan-400', borderClass: 'border-l-cyan-400', badgeBg: 'bg-cyan-400/20', btnBg: 'bg-green-500 text-white', btnLabel: 'Marcar Pronto', nextStatus: 'Pronto' },
  Pronto: { label: 'Pronto', color: 'text-green-400', borderClass: 'border-l-green-400', badgeBg: 'bg-green-400/20', btnBg: 'bg-cyan-400 text-black', btnLabel: 'Servido', nextStatus: 'Entregue' },
  Entregue: { label: 'Entregue', color: 'text-gray-400', borderClass: 'border-l-gray-500', badgeBg: 'bg-gray-500/20', btnBg: '', btnLabel: 'Concluído', nextStatus: null },
  Cancelado: { label: 'Cancelado', color: 'text-red-400', borderClass: 'border-l-red-400', badgeBg: 'bg-red-400/20', btnBg: '', btnLabel: 'Cancelado', nextStatus: null },
  Arquivado: { label: 'Arquivado', color: 'text-gray-500', borderClass: 'border-l-gray-600', badgeBg: 'bg-gray-600/20', btnBg: '', btnLabel: 'Arquivado', nextStatus: null },
};

const STATUS_FILTERS: Array<{ key: StatusFilter; label: string; icon: string }> = [
  { key: 'ativos', label: 'Todos', icon: 'list' },
  { key: 'Preparando', label: 'Em Preparo', icon: 'pending' },
  { key: 'Pronto', label: 'Prontos', icon: 'check_circle' },
  { key: 'Entregue', label: 'Entregues', icon: 'done_all' },
  { key: 'Cancelado', label: 'Cancelados', icon: 'cancel' },
];

function parseDate(s?: string | null): number {
  if (!s) return NaN;
  const d = new Date(s);
  if (isNaN(d.getTime())) return NaN;
  if (!s.endsWith('Z') && !s.includes('+')) return d.getTime() - d.getTimezoneOffset() * 60000;
  return d.getTime();
}

function formatTimer(created?: string | null, now: number = Date.now()) {
  const ms = parseDate(created);
  if (isNaN(ms)) return '00:00';
  const diff = Math.floor((now - ms) / 1000);
  const mins = Math.floor(diff / 60);
  const secs = diff % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function getMinutesElapsed(created?: string | null, now: number = Date.now()) {
  const ms = parseDate(created);
  if (isNaN(ms)) return 0;
  return Math.floor((now - ms) / 60000);
}

export default function Pedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ativos');
  const [cancelPedido, setCancelPedido] = useState<Pedido | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);

  const loadData = useCallback(async () => {
    try {
      const request = statusFilter === 'ativos'
        ? pedidosService.listarAtivos()
        : pedidosService.listarTodos(statusFilter || undefined);
      const res = await request;
      setPedidos(Array.isArray(res.data) ? res.data : []);
    } catch {} finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { const interval = setInterval(loadData, 10000); return () => clearInterval(interval); }, [loadData]);

  const handleStatusChange = async (id: number, status: PedidoStatus) => {
    try {
      await pedidosService.atualizarStatus(id, status);
      toast.success(`Pedido #${id} → ${status}`);
      loadData();
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
      loadData();
    } catch {
      toast.error('Erro ao cancelar pedido');
    } finally {
      setCancelling(false);
    }
  };

  const filtered = pedidos;

  const activePedidos = pedidos.filter(
    (p) => p.status === 'Novo' || p.status === 'Preparando' || p.status === 'Pronto'
  );

  const tempoMedio = activePedidos.length > 0
    ? Math.round(activePedidos.reduce((acc, p) => acc + getMinutesElapsed(p.created_at, now), 0) / activePedidos.length)
    : 0;

  const getCount = (filter: StatusFilter) => {
    if (filter === 'ativos') return activePedidos.length;
    if (filter === '') return pedidos.length;
    return pedidos.filter(p => p.status === filter).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={24} className="animate-spin text-cyan-400" />
          <span className="text-xs text-gray-500">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-12 bg-[var(--color-background)] border-b border-[rgba(var(--overlay-rgb),0.1)]">
        <div className="flex items-center gap-2">
          <img 
            className="w-8 h-8 rounded-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbCrx3Mg8po9xJhaWT8Jsu0LeY7TUO_KuKO91JJRAXQRYnbUK5yBf8y6V7gF_cnOqHGBDqx4C-rFNASl_o_JduSQ06oCid68qghk-ZIyBdBxBvXqJ98k9GsmvotPPaNzfMTHGs4UQLMlF-E3kmA9E29GA74vQ7jsA78Rs2sF4kyJ6Hy_QmFKsZvGHGaiqJAb5Vwbty_eNSsWw6uMJ3bBD8gSdv4QNtgW2kP8q4Upo3qNJg7cEDtbaQ"
            alt="Barize" 
          />
          <span className="text-base font-bold text-[var(--color-primary-container)] tracking-tighter">BARIZE</span>
        </div>
        <button onClick={loadData} className="p-2 text-[var(--color-primary-container)] active:scale-95 transition-transform">
          <RefreshCw size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="px-4 md:px-6 max-w-7xl mx-auto py-6 pt-[72px] pb-[90px]">
        {/* Title Section */}
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-on-surface)] mb-1 tracking-tight">Pedidos Ativos</h1>
          <p className="text-sm text-[var(--color-on-surface-variant)]">{activePedidos.length} pedidos na fila • Tempo médio: {tempoMedio}min</p>
        </div>
          
        {/* Filters - Horizontal Buttons */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-4">
          {STATUS_FILTERS.map(filter => {
            const count = getCount(filter.key);
            const isActive = statusFilter === filter.key;
            return (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={`h-8 px-3 rounded-lg font-medium text-[11px] whitespace-nowrap active:scale-95 transition-all flex items-center justify-center gap-1 ${
                  isActive
                    ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary)] shadow-[0px_0px_8px_rgba(0,218,243,0.3)]'
                    : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] border border-[rgba(var(--overlay-rgb),0.1)] hover:bg-[var(--color-surface-container-highest)]'
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">{filter.icon}</span>
                {filter.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Orders Grid - 2 Columns */}
        <div className="grid grid-cols-2 gap-3">
          {filtered.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3">
              <CheckCircle size={48} className="text-[var(--color-outline)]" />
              <p className="text-[var(--color-outline)] text-sm">Nenhum pedido nesta categoria</p>
            </div>
          ) : (
            filtered.map(pedido => {
              const cfg = STATUS_CONFIG[pedido.status as PedidoStatus] || STATUS_CONFIG.Novo;
              const timer = formatTimer(pedido.created_at, now);
              const isActive = pedido.status === 'Novo' || pedido.status === 'Preparando' || pedido.status === 'Pronto';
              const isEntregue = pedido.status === 'Entregue';
              const isCancelado = pedido.status === 'Cancelado';
              
              return (
                <div
                  key={pedido.id}
                  className={`bg-[var(--color-surface-container)] rounded-xl border-l-4 ${cfg.borderClass} overflow-hidden transition-all duration-200 ${
                    isEntregue || isCancelado ? 'opacity-50' : ''
                  }`}
                >
                  {/* Card Header */}
                  <div className="px-3 pt-3 pb-2">
                    <div className="flex justify-between items-center mb-3">
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.badgeBg} ${cfg.color}`}>
                        <span className="material-symbols-outlined text-[12px]">
                          {pedido.status === 'Novo' || pedido.status === 'Preparando' ? 'pending' : 
                           pedido.status === 'Pronto' ? 'check_circle' : 'done_all'}
                        </span>
                        {cfg.label}
                      </div>
                      {isActive && (
                        <div className="flex items-center gap-1 text-[var(--color-secondary-container)]">
                          <Clock size={12} />
                          <span className="text-[11px] font-mono font-bold">{timer}</span>
                        </div>
                      )}
                    </div>

                    {/* Mesa/Balcão + Cliente */}
                    <div className="mb-2">
                      {pedido.mesa && (
                        <h3 className="text-[13px] font-bold text-[var(--color-on-surface)]">
                          {pedido.mesa.includes('BALC') ? `BALC ${pedido.mesa}` : `MESA ${pedido.mesa}`}
                        </h3>
                      )}
                      {pedido.cliente && (
                        <p className="text-[12px] text-[var(--color-on-surface-variant)]">{pedido.cliente}</p>
                      )}
                    </div>

                    {/* Items */}
                    <div className="space-y-1 mb-3">
                      {pedido.itens.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex flex-col">
                          <div className="flex justify-between items-start">
                            <span className={`text-[12px] ${isEntregue || isCancelado ? 'text-[var(--color-outline)]' : 'text-[var(--color-on-surface)]'}`}>
                              {item.quantidade}x {item.nome}
                            </span>
                            {item.preco > 0 && (
                              <span className={`text-[11px] font-mono ${isEntregue || isCancelado ? 'text-[var(--color-outline)]' : 'text-[var(--color-on-surface-variant)]'}`}>
                                R$ {(item.quantidade * item.preco).toFixed(2)}
                              </span>
                            )}
                          </div>
                          {item.observacao && (
                            <span className="text-[9px] text-[var(--color-secondary-container)] bg-[var(--color-secondary-container)]/10 border border-[var(--color-secondary-container)]/20 px-1.5 py-0.5 rounded inline-block w-fit mt-0.5">
                              {item.observacao}
                            </span>
                          )}
                        </div>
                      ))}
                      {pedido.itens.length > 3 && (
                        <p className="text-[9px] text-[var(--color-outline)]">+{pedido.itens.length - 3} mais itens</p>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="px-3 pb-3">
                    {cfg.nextStatus && isActive ? (
                      <button
                        onClick={() => handleStatusChange(pedido.id, cfg.nextStatus!)}
                        className={`w-full h-10 rounded-lg ${cfg.btnBg} text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 active:scale-[0.98] transition-all cursor-pointer shadow-lg`}
                      >
                        {cfg.btnLabel}
                      </button>
                    ) : isActive ? (
                      <button
                        onClick={() => setCancelPedido(pedido)}
                        className="w-full h-10 rounded-lg bg-[var(--color-error)] text-[var(--color-on-error)] text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 active:scale-[0.98] transition-all cursor-pointer shadow-lg"
                      >
                        <X size={12} /> Cancelar
                      </button>
                    ) : (
                      <div className="text-center text-[10px] font-mono text-[var(--color-outline)] uppercase tracking-wider py-2">
                        {isCancelado ? 'Cancelado' : 'Entregue'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Cancel Modal */}
      <Modal open={!!cancelPedido} onClose={() => { setCancelPedido(null); setMotivoCancelamento(''); }}>
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-error-container)] flex items-center justify-center border border-[var(--color-error)]/20">
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
              className="w-full h-10 px-4 rounded-xl bg-[var(--color-surface-container)] border border-[rgba(var(--overlay-rgb),0.1)] text-xs font-mono text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:border-[var(--color-primary-container)]/50 transition-all"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setCancelPedido(null); setMotivoCancelamento(''); }}
              className="flex-1 h-11 rounded-xl border border-[rgba(var(--overlay-rgb),0.1)] text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)] hover:bg-[rgba(var(--overlay-rgb),0.05)] transition-all cursor-pointer"
            >
              Voltar
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 h-11 rounded-xl bg-[var(--color-error)] text-[var(--color-on-error)] text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40"
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
