import { useEffect, useState } from 'react';
import { Clock, MessageSquare } from 'lucide-react';
import type { Pedido, PedidoStatus } from '../types';

const STATUS_CONFIG: Record<PedidoStatus, { label: string; badgeClass: string; btnLabel: string; nextStatus: PedidoStatus | null }> = {
  Novo: { label: 'Novo', badgeClass: 'bg-[var(--color-primary)] text-[var(--color-on-primary)]', btnLabel: 'Iniciar Preparo', nextStatus: 'Preparando' },
  Preparando: { label: 'Preparando', badgeClass: 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]', btnLabel: 'Marcar Pronto', nextStatus: 'Pronto' },
  Pronto: { label: 'Pronto', badgeClass: 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]', btnLabel: 'Entregar', nextStatus: 'Entregue' },
  Entregue: { label: 'Entregue', badgeClass: 'bg-[var(--color-surface-container-high)] text-[var(--color-outline)]', btnLabel: 'Concluído', nextStatus: null },
};

interface OrderCardProps {
  pedido: Pedido;
  onStatusChange: (id: number, status: PedidoStatus) => void;
}

export default function OrderCard({ pedido, onStatusChange }: OrderCardProps) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  const cfg = STATUS_CONFIG[pedido.status] || STATUS_CONFIG.Novo;
  const isNew = pedido.status === 'Novo';
  const borderColor = isNew
    ? 'border-[var(--color-primary)]/40'
    : 'border-[rgba(255,255,255,0.1)]';
  const glowClass = isNew ? 'shadow-[0_0_8px_rgba(0,218,243,0.3)]' : '';
  const bgHeader = isNew ? 'bg-[var(--color-primary)]/10' : 'bg-[var(--color-surface-container-highest)]';
  const borderHeader = isNew ? 'border-b border-[var(--color-primary)]/20' : 'border-b border-[rgba(255,255,255,0.1)]';
  const timeColor = isNew ? 'text-[var(--color-on-surface-variant)]' : 'text-[var(--color-secondary)]';

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
    if (isNaN(ms)) return '--:--';
    const diff = Math.floor((now - ms) / 60000);
    if (diff <= 0) return 'agora';
    if (diff < 60) return `${diff} min`;
    return `${Math.floor(diff / 60)}h${diff % 60}m`;
  };
  const elapsed = formatElapsed(pedido.created_at);

  return (
    <div
      className={`bg-[rgba(28,27,27,0.6)] backdrop-blur-[12px] border ${borderColor} rounded-xl overflow-hidden flex flex-col ${glowClass} transition-transform hover:scale-[1.02]`}
    >
      <div className={`p-md ${bgHeader} flex justify-between items-center ${borderHeader}`}>
        <span className="text-data-display text-[var(--color-primary)]">
          #{pedido.id}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[var(--color-on-surface-variant)] font-mono">
            MESA {pedido.mesa || '-'}
          </span>
          <span className="text-[10px] text-[var(--color-on-surface-variant)] font-mono">
            CLIENTE {pedido.cliente || '-'}
          </span>
          <span className={`px-xs py-1 text-label-md text-[10px] rounded uppercase font-black ${cfg.badgeClass} ${isNew ? 'animate-pulse' : ''}`}>
            {cfg.label}
          </span>
        </div>
      </div>

      <div className="p-md flex-1">
        <div className={`flex items-center gap-xs ${timeColor} mb-md`}>
          <Clock size={18} />
          <span className="text-label-md uppercase tracking-tighter">{elapsed}</span>
        </div>
        <ul className="space-y-sm mb-md">
          {pedido.itens.map((item, i) => (
            <li key={i} className="flex justify-between items-center text-body-md">
              <span className="text-[var(--color-on-surface)]">
                {item.quantidade}x {item.nome}
              </span>
              {item.preco > 0 && (
                <span className="text-[var(--color-on-surface-variant)] text-label-md">
                  R$ {(item.quantidade * item.preco).toFixed(2)}
                </span>
              )}
            </li>
          ))}
        </ul>
        {pedido.observacao && (
          <div className="flex items-start gap-1 text-[10px] text-[var(--color-secondary)] italic">
            <MessageSquare size={10} className="mt-0.5 shrink-0" />
            <span>{pedido.observacao}</span>
          </div>
        )}
      </div>

      <div className="p-md bg-[var(--color-surface-container-high)] border-t border-[rgba(255,255,255,0.1)] mt-auto">
        {cfg.nextStatus ? (
          <button
            onClick={() => onStatusChange(pedido.id, cfg.nextStatus!)}
            className="w-full bg-[var(--color-primary)] text-[var(--color-on-primary)] py-sm rounded-lg font-bold text-label-md uppercase tracking-widest text-[11px] hover:brightness-110 transition-all cursor-pointer"
          >
            {cfg.btnLabel}
          </button>
        ) : (
          <div className="w-full text-center text-[10px] text-[var(--color-outline)] uppercase tracking-wider py-sm">
            Pedido entregue
          </div>
        )}
      </div>
    </div>
  );
}
