import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wine, Plus, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { comandasService } from '../services/api';
import { useOffline } from '../hooks/useOffline';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { toast } from '../components/Toast';

const STATUS_CONFIG: Record<string, { badgeVariant: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral'; label: string }> = {
  Aberta: { badgeVariant: 'primary', label: 'Aberta' },
  Preparando: { badgeVariant: 'warning', label: 'Preparando' },
  Pronta: { badgeVariant: 'success', label: 'Pronta' },
  Fechada: { badgeVariant: 'neutral', label: 'Fechada' },
};

export default function GarcomApp() {
  const navigate = useNavigate();
  const { comandas, setComandas, connected, setConnected } = useAppStore();
  const { isOnline, pendingCount, syncing, manualSync } = useOffline();
  const [showNova, setShowNova] = useState(false);
  const [novaMesa, setNovaMesa] = useState('');
  const [novaCliente, setNovaCliente] = useState('');

  const loadComandas = async () => {
    try {
      const res = await comandasService.listar();
      setComandas(res.data);
      setConnected(true);
    } catch {
      setConnected(false);
    }
  };

  useEffect(() => {
    loadComandas();
    const interval = setInterval(loadComandas, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleNovaComanda = async () => {
    if (!novaMesa.trim()) return;
    try {
      await comandasService.criar({ mesa: novaMesa, cliente: novaCliente || undefined, itens: [] });
      toast.success('Comanda criada!');
      setShowNova(false);
      setNovaMesa('');
      setNovaCliente('');
      loadComandas();
    } catch {
      toast.error('Erro ao criar comanda');
    }
  };

  return (
    <div className="flex flex-col h-dvh bg-[var(--color-background)]">
      {/* Header — idêntico ao web */}
      <header className="safe-top border-b border-[rgba(var(--overlay-rgb),0.1)] bg-[rgba(var(--glass-rgb),0.6)] backdrop-blur-[12px]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgba(0,229,255,0.2)] to-[rgba(0,218,243,0.1)] flex items-center justify-center border border-[var(--color-primary)]/30">
              <Wine size={20} className="text-[var(--color-primary-container)]" />
            </div>
            <div>
              <h1 className="text-lg font-black text-[var(--color-on-surface)] tracking-tight">BARIZE</h1>
              <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[var(--color-on-surface-variant)]">
                  {connected ? 'LIVE' : 'OFFLINE'}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isOnline && (
              <Badge variant="warning" className="text-[9px]">
                OFFLINE {pendingCount > 0 && `(${pendingCount})`}
              </Badge>
            )}
            {syncing && <RefreshCw size={14} className="text-[var(--color-primary-container)] animate-spin" />}
            {isOnline && pendingCount > 0 && !syncing && (
              <button onClick={manualSync} className="p-2 rounded-lg bg-[var(--color-primary-container)]/10">
                <RefreshCw size={14} className="text-[var(--color-primary-container)]" />
              </button>
            )}
            <button
              onClick={() => navigate('/kitchen')}
              className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-container-high)] text-[10px] font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)]"
            >
              Cozinha
            </button>
            <button
              onClick={() => navigate('/caixa')}
              className="px-3 py-1.5 rounded-lg bg-[var(--color-primary-container)]/10 text-[var(--color-primary-container)] text-[10px] font-bold uppercase tracking-wider"
            >
              Caixa
            </button>
            {connected ? (
              <Wifi size={14} className="text-emerald-400" />
            ) : (
              <WifiOff size={14} className="text-red-400" />
            )}
          </div>
        </div>
      </header>

      {/* Comandas */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {comandas.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--color-outline)] gap-4">
            <Wine size={48} className="opacity-20" />
            <p className="text-sm text-[var(--color-on-surface-variant)]">Nenhuma comanda aberta</p>
            <Button variant="primary" onClick={() => setShowNova(true)}>
              <Plus size={16} /> Nova Comanda
            </Button>
          </div>
        ) : (
          comandas.map((c) => {
            const cfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.Aberta;
            const isNew = c.status === 'Aberta';
            return (
              <div
                key={c.id}
                onClick={() => navigate(`/mesa/${c.mesa}`)}
                className={`glass glass-border border ${isNew ? 'border-[var(--color-primary)]/40 shadow-[0_0_8px_rgba(0,229,255,0.3)]' : 'border-[rgba(var(--overlay-rgb),0.1)]'} rounded-xl overflow-hidden active:scale-[0.98] transition-transform cursor-pointer`}
              >
                <div className={`px-4 py-3 ${isNew ? 'bg-[var(--color-primary)]/10' : 'bg-[var(--color-surface-container-highest)]'} flex justify-between items-center border-b border-[rgba(var(--overlay-rgb),0.1)]`}>
                  <span className="text-lg font-bold text-[var(--color-primary)]">#{c.id}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[var(--color-on-surface-variant)] font-mono">MESA {c.mesa || '-'}</span>
                    {c.cliente && <span className="text-[10px] text-[var(--color-on-surface-variant)] font-mono">CLI {c.cliente}</span>}
                    <Badge variant={cfg.badgeVariant} className={isNew ? 'animate-pulse' : ''}>{cfg.label}</Badge>
                  </div>
                </div>
                <div className="px-4 py-3">
                  <span className="text-xs text-[var(--color-on-surface-variant)]">{c.itens.length} item(s)</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FAB */}
      <div className="safe-bottom p-4 border-t border-[rgba(var(--overlay-rgb),0.1)] bg-[rgba(var(--glass-rgb),0.6)] backdrop-blur-[12px]">
        <Button variant="primary" size="lg" className="w-full" onClick={() => setShowNova(true)}>
          <Plus size={18} /> Nova Comanda
        </Button>
      </div>

      {/* Modal Nova Comanda */}
      <Modal open={showNova} onClose={() => setShowNova(false)} title="Nova Comanda">
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Mesa / Local"
            value={novaMesa}
            onChange={(e) => setNovaMesa(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-container-lowest)] border border-[rgba(var(--overlay-rgb),0.1)] text-sm text-[var(--color-on-surface)] placeholder-[var(--color-outline)] focus:border-[var(--color-primary-container)]/50 outline-none transition-colors"
            autoFocus
          />
          <input
            type="text"
            placeholder="Cliente (opcional)"
            value={novaCliente}
            onChange={(e) => setNovaCliente(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-container-lowest)] border border-[rgba(var(--overlay-rgb),0.1)] text-sm text-[var(--color-on-surface)] placeholder-[var(--color-outline)] focus:border-[var(--color-primary-container)]/50 outline-none transition-colors"
          />
          <Button variant="primary" size="lg" className="w-full" disabled={!novaMesa.trim()} onClick={handleNovaComanda}>
            Criar Comanda
          </Button>
        </div>
      </Modal>
    </div>
  );
}
