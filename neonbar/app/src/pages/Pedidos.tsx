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
  { label: string; color: string; borderColor: string; btnBg: string; btnLabel: string; nextStatus: PedidoStatus | null }
> = {
  Novo: { label: 'Novo', color: 'text-cyan-400', borderColor: 'border-t-cyan-400', btnBg: 'bg-cyan-400 text-black', btnLabel: 'Iniciar Preparo', nextStatus: 'Preparando' },
  Preparando: { label: 'Em Preparo', color: 'text-cyan-400', borderColor: 'border-t-cyan-400', btnBg: 'bg-amber-400 text-black', btnLabel: 'Finalizar', nextStatus: 'Pronto' },
  Pronto: { label: 'Pronto', color: 'text-green-400', borderColor: 'border-t-green-400', btnBg: 'bg-[#2a2a2a] text-gray-400', btnLabel: 'Servido', nextStatus: 'Entregue' },
  Entregue: { label: 'Entregue', color: 'text-gray-400', borderColor: 'border-t-gray-500', btnBg: '', btnLabel: 'Concluído', nextStatus: null },
  Cancelado: { label: 'Cancelado', color: 'text-red-400', borderColor: 'border-t-red-400', btnBg: '', btnLabel: 'Cancelado', nextStatus: null },
  Arquivado: { label: 'Arquivado', color: 'text-gray-500', borderColor: 'border-t-gray-600', btnBg: '', btnLabel: 'Arquivado', nextStatus: null },
};

const STATUS_FILTERS: Array<{ key: StatusFilter; label: string; icon: string }> = [
  { key: 'ativos', label: 'Todos', icon: 'list' },
  { key: 'Preparando', label: 'Em Preparo', icon: 'pending' },
  { key: 'Pronto', label: 'Aguardando', icon: 'schedule' },
];

function parseDate(s?: string | null): number {
  if (!s) return NaN;
  const d = new Date(s);
  if (isNaN(d.getTime())) return NaN;
  if (!s.endsWith('Z') && !s.includes('+')) return d.getTime() - d.getTimezoneOffset() * 60000;
  return d.getTime();
}

function formatElapsed(created?: string | null, now: number = Date.now()) {
  const ms = parseDate(created);
  if (isNaN(ms)) return '00 min';
  const diff = Math.floor((now - ms) / 60000);
  if (diff < 1) return 'agora';
  if (diff === 1) return '1 min';
  return `${diff} min`;
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

  const atrasados = activePedidos.filter(p => getMinutesElapsed(p.created_at, now) > 10).length;

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
    <div className="min-h-screen bg-[#131313]">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-12 bg-[#131313] border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-cyan-400 text-[24px]">local_bar</span>
          <span className="text-lg font-bold text-cyan-400 tracking-tight">Barize</span>
        </div>
        <button onClick={loadData} className="p-2 text-cyan-400 active:scale-95 transition-transform">
          <RefreshCw size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="px-4 md:px-6 max-w-2xl mx-auto py-6 pt-[72px] pb-[90px]">
        {/* Title Section */}
        <div className="mb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-[#e5e2e1] mb-1 tracking-tight">Pedidos Ativos</h1>
          <p className="text-sm text-[#bac9cc]">{activePedidos.length} pedidos na fila{atrasados > 0 ? ` • ${atrasados} em atraso` : ''}</p>
        </div>
          
        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-4">
          {STATUS_FILTERS.map(filter => {
            const count = getCount(filter.key);
            const isActive = statusFilter === filter.key;
            return (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={`h-10 px-4 rounded-full font-medium text-[13px] whitespace-nowrap active:scale-95 transition-all flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'bg-[#00e5ff] text-black shadow-[0px_0px_8px_rgba(0,218,243,0.3)]'
                    : 'bg-[#2a2a2a] text-[#e5e2e1] border border-white/10 hover:bg-[#393939]'
                }`}
              >
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                {filter.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <CheckCircle size={48} className="text-gray-600" />
              <p className="text-gray-500 text-sm">Nenhum pedido nesta categoria</p>
            </div>
          ) : (
            filtered.map(pedido => {
              const cfg = STATUS_CONFIG[pedido.status as PedidoStatus] || STATUS_CONFIG.Novo;
              const timer = formatElapsed(pedido.created_at, now);
              const isActive = pedido.status === 'Novo' || pedido.status === 'Preparando' || pedido.status === 'Pronto';
              const isEntregue = pedido.status === 'Entregue';
              const isCancelado = pedido.status === 'Cancelado';
              const isPronto = pedido.status === 'Pronto';
              
              return (
                <div
                  key={pedido.id}
                  className={`bg-[#1c1b1b] rounded-xl border border-t-4 ${cfg.borderColor} overflow-hidden transition-all duration-200 ${
                    isEntregue || isCancelado ? 'opacity-50' : ''
                  }`}
                >
                  {/* Card Header */}
                  <div className="px-4 pt-4 pb-3">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        {pedido.mesa && (
                          <h3 className="text-lg font-bold text-[#e5e2e1] mb-0.5">
                            {pedido.mesa.includes('BALC') ? `BALCÃO ${pedido.mesa}` : `MESA ${pedido.mesa}`}
                          </h3>
                        )}
                        <p className="text-sm text-gray-400">
                          {pedido.cliente || 'Walk-in'} • #{String(pedido.id).padStart(4, '0')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          pedido.status === 'Novo' ? 'bg-cyan-400/20 text-cyan-400' :
                          pedido.status === 'Preparando' ? 'bg-amber-400/20 text-amber-400' :
                          pedido.status === 'Pronto' ? 'bg-green-400/20 text-green-400' :
                          pedido.status === 'Entregue' ? 'bg-gray-500/20 text-gray-400' :
                          'bg-red-400/20 text-red-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            pedido.status === 'Novo' ? 'bg-cyan-400 animate-pulse' :
                            pedido.status === 'Preparando' ? 'bg-amber-400' :
                            pedido.status === 'Pronto' ? 'bg-green-400' :
                            pedido.status === 'Entregue' ? 'bg-gray-400' :
                            'bg-red-400'
                          }`} />
                          {cfg.label}
                        </div>
                        {isActive && (
                          <div className="flex items-center gap-1 text-amber-400">
                            <Clock size={12} />
                            <span className="text-[11px] font-mono font-bold">{timer}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2 mb-4">
                      {pedido.itens.map((item, i) => (
                        <div key={i} className="flex flex-col">
                          <div className="flex justify-between items-center">
                            <span className={`text-[13px] ${isEntregue || isCancelado ? 'text-gray-500' : 'text-[#e5e2e1]'}`}>
                              {item.quantidade}x {item.nome}
                            </span>
                            {item.preco > 0 && (
                              <span className={`text-[12px] font-mono ${isEntregue || isCancelado ? 'text-gray-600' : 'text-gray-400'}`}>
                                R$ {(item.quantidade * item.preco).toFixed(0)}
                              </span>
                            )}
                          </div>
                          {item.observacao && (
                            <span className="text-[10px] text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2 py-0.5 rounded-full inline-block w-fit mt-1">
                              {item.observacao}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="px-4 pb-4">
                    {cfg.nextStatus && isActive ? (
                      <button
                        onClick={() => handleStatusChange(pedido.id, cfg.nextStatus!)}
                        className={`w-full h-12 rounded-xl ${cfg.btnBg} text-[13px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer`}
                      >
                        {isPronto ? (
                          <span className="material-symbols-outlined text-[18px]">restaurant</span>
                        ) : (
                          <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                        )}
                        {cfg.btnLabel}
                      </button>
                    ) : isActive ? (
                      <button
                        onClick={() => setCancelPedido(pedido)}
                        className="w-full h-12 rounded-xl bg-red-400/10 text-red-400 border border-red-400/20 text-[13px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <X size={16} /> Cancelar
                      </button>
                    ) : (
                      <div className="text-center text-[11px] font-mono text-gray-500 uppercase tracking-wider py-3">
                        {isCancelado ? 'Pedido cancelado' : 'Pedido entregue'}
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
            <div className="w-10 h-10 rounded-xl bg-red-400/10 flex items-center justify-center border border-red-400/20">
              <AlertTriangle size={18} className="text-red-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#e5e2e1]">Cancelar Pedido</h2>
              <p className="text-xs font-mono text-gray-400">Pedido #{cancelPedido?.id}</p>
            </div>
          </div>

          <p className="text-xs text-gray-400">
            Tem certeza que deseja cancelar este pedido? Esta ação não pode ser desfeita.
          </p>

          <div>
            <label className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-gray-400 mb-2 block">
              Motivo (opcional)
            </label>
            <input
              type="text"
              value={motivoCancelamento}
              onChange={(e) => setMotivoCancelamento(e.target.value)}
              placeholder="Ex: Cliente desistiu..."
              className="w-full h-10 px-4 rounded-xl bg-[#1c1b1b] border border-white/10 text-xs font-mono text-[#e5e2e1] placeholder:text-gray-500 focus:outline-none focus:border-cyan-400/50 transition-all"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => { setCancelPedido(null); setMotivoCancelamento(''); }}
              className="flex-1 h-11 rounded-xl border border-white/10 text-xs font-mono font-bold uppercase tracking-wider text-gray-400 hover:bg-white/5 transition-all cursor-pointer"
            >
              Voltar
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 h-11 rounded-xl bg-red-500 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40"
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
