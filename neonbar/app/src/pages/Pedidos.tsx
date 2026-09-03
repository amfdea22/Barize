import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Clock,
  MessageSquare,
  RefreshCw,
  X,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { pedidosService } from '../services/api';
import { toast } from '../components/Toast';
import Modal from '../components/Modal';
import BottomNav from '../components/BottomNav';
import type { Pedido } from '../types';

type PedidoStatus = 'Novo' | 'Preparando' | 'Pronto' | 'Entregue' | 'Cancelado' | 'Arquivado';
type StatusFilter = 'ativos' | '' | 'Novo' | 'Preparando' | 'Pronto' | 'Entregue' | 'Cancelado' | 'Arquivado';

const STATUS_CONFIG: Record<
  PedidoStatus,
  { label: string; color: string; glow: string; bg: string; border: string; btnBg: string; btnLabel: string; nextStatus: PedidoStatus | null }
> = {
  Novo: { label: 'Novo', color: 'text-cyan-400', glow: 'shadow-[0px_0px_8px_rgba(0,218,243,0.3)]', bg: 'bg-cyan-400/10', border: 'border-cyan-400/30', btnBg: 'bg-cyan-400 text-black', btnLabel: 'Iniciar Preparo', nextStatus: 'Preparando' },
  Preparando: { label: 'Preparando', color: 'text-amber-400', glow: 'shadow-[0px_0px_8px_rgba(254,170,0,0.3)]', bg: 'bg-amber-400/10', border: 'border-amber-400/30', btnBg: 'bg-amber-400 text-black', btnLabel: 'Marcar Pronto', nextStatus: 'Pronto' },
  Pronto: { label: 'Pronto', color: 'text-green-400', glow: 'shadow-[0px_0px_8px_rgba(0,200,83,0.3)]', bg: 'bg-green-400/10', border: 'border-green-400/30', btnBg: 'bg-purple-500 text-white', btnLabel: 'Servir Agora', nextStatus: 'Entregue' },
  Entregue: { label: 'Entregue', color: 'text-gray-400', glow: '', bg: 'bg-white/5', border: 'border-white/10', btnBg: 'bg-[#2a2a2a] text-gray-500', btnLabel: 'Concluído', nextStatus: null },
  Cancelado: { label: 'Cancelado', color: 'text-red-400', glow: '', bg: 'bg-red-400/10', border: 'border-red-400/20', btnBg: '', btnLabel: 'Cancelado', nextStatus: null },
  Arquivado: { label: 'Arquivado', color: 'text-gray-500', glow: '', bg: 'bg-white/5', border: 'border-white/10', btnBg: '', btnLabel: 'Arquivado', nextStatus: null },
};

const STATUS_FILTERS: Array<{ key: StatusFilter; label: string }> = [
  { key: 'ativos', label: 'Ativos' },
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
  if (!s.endsWith('Z') && !s.includes('+')) return d.getTime() - d.getTimezoneOffset() * 60000;
  return d.getTime();
}

function formatTimer(created?: string | null, now: number = Date.now()) {
  const ms = parseDate(created);
  if (isNaN(ms)) return '--:--';
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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ativos');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [cancelPedido, setCancelPedido] = useState<Pedido | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

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

  const tempoMedio = activePedidos.length > 0
    ? Math.round(activePedidos.reduce((acc, p) => acc + getMinutesElapsed(p.created_at, now), 0) / activePedidos.length)
    : 0;

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
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 h-12 bg-[#131313] border-b border-white/10">
        <div className="flex items-center gap-2">
          <img 
            className="w-8 h-8 rounded-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbCrx3Mg8po9xJhaWT8Jsu0LeY7TUO_KuKO91JJRAXQRYnbUK5yBf8y6V7gF_cnOqHGBDqx4C-rFNASl_o_JduSQ06oCid68qghk-ZIyBdBxBvXqJ98k9GsmvotPPaNzfMTHGs4UQLMlF-E3kmA9E29GA74vQ7jsA78Rs2sF4kyJ6Hy_QmFKsZvGHGaiqJAb5Vwbty_eNSsWw6uMJ3bBD8gSdv4QNtgW2kP8q4Upo3qNJg7cEDtbaQ"
            alt="Barize" 
          />
          <span className="text-base font-bold text-cyan-400 tracking-tighter">BARIZE</span>
        </div>
        <button onClick={loadData} className="p-2 text-cyan-400 active:scale-95 transition-transform">
          <RefreshCw size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="px-4 md:px-6 max-w-7xl mx-auto py-6 pt-[72px] pb-[90px]">
        {/* Header Section */}
        <div className="mb-6 flex flex-col gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#e5e2e1] mb-1 tracking-tight">Pedidos Ativos</h1>
            <p className="text-sm text-[#bac9cc]">{activePedidos.length} ativo(s) • Tempo médio: {tempoMedio}min</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por ID, mesa ou cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-[#1c1b1b] border border-white/10 text-xs font-mono text-[#e5e2e1] placeholder:text-gray-500 focus:outline-none focus:border-cyan-400/50 transition-all"
            />
          </div>
          
          {/* Filters */}
          <div className="relative" data-filter-dropdown>
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="w-full h-10 px-4 rounded-xl bg-[#1c1b1b] border border-white/10 text-[10px] font-mono font-bold uppercase tracking-wider text-[#e5e2e1] flex items-center justify-between transition-all cursor-pointer hover:border-cyan-400/30"
            >
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                {STATUS_FILTERS.find(f => f.key === statusFilter)?.label || 'Todos'}
              </span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className={`text-gray-400 transition-transform duration-200 ${showFilterDropdown ? 'rotate-180' : ''}`}>
                <path d="M2.5 3.75L5 6.25L7.5 3.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {showFilterDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 py-1 bg-[#1c1b1b] border border-white/10 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-[20px] z-50 overflow-hidden">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => { setStatusFilter(f.key); setShowFilterDropdown(false); }}
                    className={`w-full h-9 px-4 flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      statusFilter === f.key
                        ? 'bg-cyan-400/10 text-cyan-400'
                        : 'text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      statusFilter === f.key ? 'bg-cyan-400' : 'bg-transparent'
                    }`} />
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-2 gap-3">
          {filtered.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3">
              <CheckCircle size={48} className="text-gray-600" />
              <p className="text-gray-500 text-sm">{search ? 'Nenhum pedido encontrado' : 'Nenhum pedido nesta categoria'}</p>
            </div>
          ) : (
            filtered.map(pedido => {
              const cfg = STATUS_CONFIG[pedido.status as PedidoStatus] || STATUS_CONFIG.Novo;
              const timer = formatTimer(pedido.created_at, now);
              const isExpanded = expandedId === pedido.id;
              const isActive = pedido.status === 'Novo' || pedido.status === 'Preparando' || pedido.status === 'Pronto';
              const isEntregue = pedido.status === 'Entregue';
              const isCancelado = pedido.status === 'Cancelado';
              
              return (
                <div
                  key={pedido.id}
                  className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
                    pedido.status === 'Novo'
                      ? `bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,218,243,0.15)]`
                      : `bg-[#1a1a1a] border border-white/5`
                  } ${isEntregue || isCancelado ? 'opacity-50' : ''}`}
                >
                  {/* Color Accent Bar */}
                  <div className={`absolute top-0 left-0 w-1 h-full ${
                    pedido.status === 'Novo' ? 'bg-cyan-400' :
                    pedido.status === 'Preparando' ? 'bg-amber-400' :
                    pedido.status === 'Pronto' ? 'bg-green-400' :
                    pedido.status === 'Entregue' ? 'bg-gray-500' :
                    'bg-red-400'
                  }`} />

                  {/* Card Content */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : pedido.id)}
                    className="p-4 pl-5 cursor-pointer active:bg-white/5 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-xl font-black font-mono ${cfg.color}`}>
                          #{pedido.id}
                        </span>
                        {pedido.mesa && (
                          <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/15 px-2 py-0.5 rounded-full">
                            Mesa {pedido.mesa}
                          </span>
                        )}
                      </div>
                      {isActive && (
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-400/15 text-amber-400">
                          <Clock size={12} />
                          <span className="text-[11px] font-mono font-bold">{timer}</span>
                        </div>
                      )}
                    </div>

                    {/* Client Name */}
                    <p className={`text-sm font-semibold mb-3 ${isEntregue || isCancelado ? 'text-gray-500' : 'text-white'}`}>
                      {pedido.cliente || `Pedido #${pedido.id}`}
                    </p>

                    {/* Items */}
                    <div className="space-y-1.5 mb-3">
                      {pedido.itens.slice(0, 3).map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-cyan-400 bg-cyan-400/10 w-6 h-5 flex items-center justify-center rounded">
                            {item.quantidade}x
                          </span>
                          <span className={`text-[12px] truncate ${isEntregue || isCancelado ? 'text-gray-500' : 'text-gray-200'}`}>
                            {item.nome}
                          </span>
                        </div>
                      ))}
                      {pedido.itens.length > 3 && (
                        <p className="text-[10px] text-gray-500 pl-8">+{pedido.itens.length - 3} mais itens</p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        pedido.status === 'Novo' ? 'bg-cyan-400/20 text-cyan-400 animate-pulse' :
                        pedido.status === 'Preparando' ? 'bg-amber-400/20 text-amber-400' :
                        pedido.status === 'Pronto' ? 'bg-green-400/20 text-green-400' :
                        pedido.status === 'Entregue' ? 'bg-gray-500/20 text-gray-400' :
                        'bg-red-400/20 text-red-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          pedido.status === 'Novo' ? 'bg-cyan-400' :
                          pedido.status === 'Preparando' ? 'bg-amber-400' :
                          pedido.status === 'Pronto' ? 'bg-green-400' :
                          pedido.status === 'Entregue' ? 'bg-gray-400' :
                          'bg-red-400'
                        }`} />
                        {cfg.label}
                      </div>
                      {pedido.total > 0 && (
                        <span className="text-[11px] font-mono font-bold text-gray-400">
                          R$ {pedido.total.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-5 pb-4 space-y-3 border-t border-white/10">
                      {/* All Items */}
                      <div className="pt-3 space-y-2">
                        {pedido.itens.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-cyan-400 bg-cyan-400/10 w-6 h-5 flex items-center justify-center rounded">
                                {item.quantidade}x
                              </span>
                              <div className="flex flex-col">
                                <span className="text-[12px] text-gray-200">{item.nome}</span>
                                {item.observacao && (
                                  <span className="text-[9px] text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded mt-0.5 w-fit">
                                    {item.observacao}
                                  </span>
                                )}
                              </div>
                            </div>
                            {item.preco > 0 && (
                              <span className="text-[11px] font-mono text-gray-400">
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
                          <span className="text-[10px] text-amber-400/80 italic">{pedido.observacao}</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        {cfg.nextStatus && isActive && (
                          <button
                            onClick={() => handleStatusChange(pedido.id, cfg.nextStatus!)}
                            className={`flex-1 h-11 rounded-xl ${cfg.btnBg} text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer`}
                          >
                            {cfg.btnLabel}
                          </button>
                        )}
                        {isActive && (
                          <button
                            onClick={() => setCancelPedido(pedido)}
                            className="h-11 px-4 rounded-xl bg-red-400/10 text-red-400 border border-red-400/20 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 active:scale-[0.98] transition-all cursor-pointer"
                          >
                            <X size={12} /> Cancelar
                          </button>
                        )}
                        {!isActive && (
                          <div className="flex-1 text-center text-[10px] font-mono text-gray-500 uppercase tracking-wider py-3">
                            {isCancelado ? 'Pedido cancelado' : 'Pedido entregue'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />

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
