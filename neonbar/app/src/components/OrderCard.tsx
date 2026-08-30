import { useEffect, useState } from 'react';
import { Clock, MessageSquare, X } from 'lucide-react';
import Badge from './Badge';

type PedidoStatus = 'Novo' | 'Preparando' | 'Pronto' | 'Entregue' | 'Cancelado';

interface Pedido {
  id: number;
  mesa?: string;
  cliente?: string;
  status: PedidoStatus;
  itens: Array<{ nome: string; quantidade: number; preco?: number; observacao?: string }>;
  observacao?: string;
  created_at?: string;
}

const STATUS_CONFIG: Record<PedidoStatus, { label: string; badgeVariant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral'; btnLabel: string; nextStatus: PedidoStatus | null }> = {
  Novo: { label: 'Novo', badgeVariant: 'primary', btnLabel: 'Iniciar Preparo', nextStatus: 'Preparando' },
  Preparando: { label: 'Preparando', badgeVariant: 'warning', btnLabel: 'Marcar Pronto', nextStatus: 'Pronto' },
  Pronto: { label: 'Pronto', badgeVariant: 'success', btnLabel: 'Entregar', nextStatus: 'Entregue' },
  Entregue: { label: 'Entregue', badgeVariant: 'neutral', btnLabel: 'Concluído', nextStatus: null },
  Cancelado: { label: 'Cancelado', badgeVariant: 'error', btnLabel: 'Cancelado', nextStatus: null },
};

interface OrderCardProps {
  pedido: Pedido;
  onStatusChange: (id: number, status: PedidoStatus) => void;
  onCancel?: (pedido: Pedido) => void;
}

export default function OrderCard({ pedido, onStatusChange, onCancel }: OrderCardProps) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const cfg = STATUS_CONFIG[pedido.status] || STATUS_CONFIG.Novo;
  const isNew = pedido.status === 'Novo';
  const borderColor = isNew ? 'border-[var(--color-primary)]/40' : 'border-[rgba(var(--overlay-rgb),0.1)]';
  const glowClass = isNew ? 'shadow-[0_0_8px_rgba(0,229,255,0.3)]' : '';
  const bgHeader = isNew ? 'bg-[var(--color-primary)]/10' : 'bg-[var(--color-surface-container-highest)]';

  const formatElapsed = (created?: string) => {
    if (!created) return '--:--';
    const d = new Date(created);
    const ms = isNaN(d.getTime()) ? 0 : d.getTime();
    const diff = Math.floor((now - ms) / 60000);
    if (diff <= 0) return 'agora';
    if (diff < 60) return `${diff} min`;
    return `${Math.floor(diff / 60)}h${diff % 60}m`;
  };

  return (
    <div className={`glass glass-border border ${borderColor} rounded-xl overflow-hidden flex flex-col ${glowClass} transition-transform active:scale-[0.98]`}>
      {/* Header */}
      <div className={`px-4 py-3 ${bgHeader} flex justify-between items-center border-b border-[rgba(var(--overlay-rgb),0.1)]`}>
        <span className="text-lg font-bold text-[var(--color-primary)]">#{pedido.id}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--color-on-surface-variant)] font-mono">MESA {pedido.mesa || '-'}</span>
          <span className="text-[10px] text-[var(--color-on-surface-variant)] font-mono">CLI {pedido.cliente || '-'}</span>
          <Badge variant={cfg.badgeVariant} className={isNew ? 'animate-pulse' : ''}>{cfg.label}</Badge>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 flex-1">
        <div className={`flex items-center gap-1.5 mb-3 ${isNew ? 'text-[var(--color-on-surface-variant)]' : 'text-[var(--color-secondary)]'}`}>
          <Clock size={16} />
          <span className="text-xs font-bold uppercase tracking-tighter">{formatElapsed(pedido.created_at)}</span>
        </div>
        <ul className="space-y-1.5">
          {pedido.itens.map((item, i) => (
            <li key={i} className="flex justify-between items-center text-sm">
              <span className="text-[var(--color-on-surface)]">{item.quantidade}x {item.nome}</span>
              {item.preco ? <span className="text-[var(--color-on-surface-variant)] text-xs">R$ {(item.quantidade * item.preco).toFixed(2)}</span> : null}
            </li>
          ))}
        </ul>
        {pedido.observacao && (
          <div className="flex items-start gap-1 text-[10px] text-[var(--color-secondary)] italic mt-2">
            <MessageSquare size={10} className="mt-0.5 shrink-0" />
            <span>{pedido.observacao}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-[var(--color-surface-container-high)] border-t border-[rgba(var(--overlay-rgb),0.1)] space-y-2">
        {cfg.nextStatus ? (
          <button
            onClick={() => onStatusChange(pedido.id, cfg.nextStatus!)}
            className="w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] py-2 rounded-lg font-bold text-[11px] uppercase tracking-widest hover:brightness-110 transition-all cursor-pointer"
          >
            {cfg.btnLabel}
          </button>
        ) : (
          <div className="w-full text-center text-[10px] text-[var(--color-outline)] uppercase tracking-wider py-2">
            {pedido.status === 'Cancelado' ? 'Pedido cancelado' : 'Pedido entregue'}
          </div>
        )}
        {(pedido.status === 'Novo' || pedido.status === 'Preparando' || pedido.status === 'Pronto') && onCancel && (
          <button
            onClick={() => onCancel(pedido)}
            className="w-full bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/30 py-2 rounded-lg font-bold text-[11px] uppercase tracking-widest hover:bg-[var(--color-error)]/20 transition-all cursor-pointer"
          >
            <X size={12} className="inline mr-1 -mt-0.5" /> Cancelar Pedido
          </button>
        )}
      </div>
    </div>
  );
}
