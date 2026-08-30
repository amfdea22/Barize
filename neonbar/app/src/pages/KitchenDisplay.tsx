import { useEffect, useState } from 'react';
import { ChefHat } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { comandasService } from '../services/api';
import { printService } from '../services/printService';
import { notifyPedidoPronto } from '../services/pushService';
import OrderCard from '../components/OrderCard';
import Badge from '../components/Badge';
import { toast } from '../components/Toast';

export default function KitchenDisplay() {
  const { comandas, setComandas, connected, setConnected } = useAppStore();
  const [filtro, setFiltro] = useState<'todos' | 'bar' | 'cozinha'>('todos');

  const load = async () => {
    try {
      const res = await comandasService.listar();
      setComandas(res.data);
      setConnected(true);
    } catch {
      setConnected(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await comandasService.atualizarStatus(id, status);
      await load();
      // Use fresh data from store after load
      if (status === 'Pronta') {
        const updated = useAppStore.getState().comandas.find((x) => x.id === id);
        if (updated) {
          printService.connect();
          printService.printComanda({ id: updated.id, mesa: updated.mesa, cliente: updated.cliente, itens: updated.itens, setor: 'BAR' });
          notifyPedidoPronto(updated.mesa, updated.id);
        }
      }
      toast.success(`Pedido #${id} → ${status}`);
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  const comandasFiltradas = comandas.filter((c) => c.status !== 'Fechada');

  return (
    <div className="flex flex-col h-dvh bg-[var(--color-background)]">
      {/* Header — idêntico ao web */}
      <header className="safe-top border-b border-[rgba(var(--overlay-rgb),0.1)] bg-[rgba(var(--glass-rgb),0.6)] backdrop-blur-[12px]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgba(0,229,255,0.2)] to-[rgba(0,218,243,0.1)] flex items-center justify-center border border-[var(--color-primary)]/30">
              <ChefHat size={20} className="text-[var(--color-primary-container)]" />
            </div>
            <div>
              <h1 className="text-lg font-black text-[var(--color-on-surface)] tracking-tight">COZINHA</h1>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[var(--color-on-surface-variant)]">
                  {connected ? 'AO VIVO' : 'OFFLINE'}
                </span>
              </div>
            </div>
          </div>
          <Badge variant={connected ? 'success' : 'error'}>{connected ? 'LIVE' : 'OFFLINE'}</Badge>
        </div>
      </header>

      {/* Filtros */}
      <div className="flex gap-2 px-4 py-3 border-b border-[rgba(var(--overlay-rgb),0.1)]">
        {(['todos', 'bar', 'cozinha'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
              filtro === f
                ? 'bg-[var(--color-primary-container)]/15 text-[var(--color-primary-container)] border border-[var(--color-primary-container)]/30'
                : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] border border-[rgba(var(--overlay-rgb),0.1)]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Pedidos Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {comandasFiltradas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--color-outline)] gap-3">
            <ChefHat size={48} className="opacity-20" />
            <p className="text-sm text-[var(--color-on-surface-variant)]">Nenhum pedido pendente</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {comandasFiltradas.map((c) => {
              // Map Comanda status to Pedido status for OrderCard
              const statusMap: Record<string, 'Novo' | 'Preparando' | 'Pronto' | 'Entregue' | 'Cancelado'> = {
                Aberta: 'Novo',
                Preparando: 'Preparando',
                Pronto: 'Pronto',
                Fechada: 'Entregue',
              };
              return (
                <OrderCard
                  key={c.id}
                  pedido={{
                    id: c.id,
                    mesa: c.mesa,
                    cliente: c.cliente,
                    status: statusMap[c.status] || 'Novo',
                    itens: c.itens.map((i) => ({ ...i, preco: i.preco || 0 })),
                    observacao: undefined,
                    created_at: typeof c.created_at === 'number' ? new Date(c.created_at).toISOString() : undefined,
                  }}
                  onStatusChange={(id, status) => handleStatusChange(id, status)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
