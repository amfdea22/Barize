import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Trash2, Send, QrCode } from 'lucide-react';
import { useAppStore, type Item } from '../stores/appStore';
import { cardapioPublicService, comandasService } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import Button from '../components/Button';
import Modal from '../components/Modal';
import { toast } from '../components/Toast';

export default function MesaQR() {
  const { mesaId } = useParams<{ mesaId: string }>();
  const navigate = useNavigate();
  const { itensCardapio, setItensCardapio } = useAppStore();
  const [itens, setItens] = useState<Item[]>([]);
  const [showQR, setShowQR] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cardapioPublicService.listar().then((r: any) => setItensCardapio(r.data)).catch(() => {});
  }, []);

  const addItem = (item: Item) => {
    setItens((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => i.id === item.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...prev, { ...item, quantidade: 1 }];
    });
  };

  const updateQty = (id: number, delta: number) => {
    setItens((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const q = i.quantidade + delta;
        return q > 0 ? { ...i, quantidade: q } : i;
      }).filter((i) => i.quantidade > 0)
    );
  };

  const total = itens.reduce((s, i) => s + i.preco * i.quantidade, 0);

  const handleEnviar = async () => {
    if (itens.length === 0) return;
    setEnviando(true);
    try {
      await comandasService.criar({ mesa: mesaId || '', itens });
      setItens([]);
      toast.success('Pedido enviado!');
    } catch {
      toast.error('Erro ao enviar pedido');
    } finally {
      setEnviando(false);
    }
  };

  const itensFiltrados = itensCardapio.filter((i) =>
    !filtro || i.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    i.categoria?.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="flex flex-col h-dvh bg-[var(--color-background)]">
      {/* Header */}
      <header className="safe-top border-b border-[rgba(var(--overlay-rgb),0.1)] bg-[rgba(var(--glass-rgb),0.6)] backdrop-blur-[12px]">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-[var(--color-surface-container-high)] transition-colors cursor-pointer">
            <ArrowLeft size={20} className="text-[var(--color-on-surface)]" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-[var(--color-on-surface)] tracking-tight">Mesa {mesaId}</h1>
            <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[var(--color-on-surface-variant)]">CARDÁPIO DIGITAL</span>
          </div>
          <button onClick={() => setShowQR(true)} className="p-2 rounded-lg bg-[var(--color-primary-container)]/10 cursor-pointer">
            <QrCode size={18} className="text-[var(--color-primary-container)]" />
          </button>
        </div>
      </header>

      {/* Busca */}
      <div className="px-4 py-3">
        <input
          type="text"
          placeholder="Buscar item..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.1)] text-sm text-[var(--color-on-surface)] placeholder-[var(--color-outline)] focus:border-[var(--color-primary-container)]/50 outline-none transition-colors"
        />
      </div>

      {/* Cardápio */}
      <div className="flex-1 overflow-y-auto px-4 space-y-2">
        {itensFiltrados.map((item) => {
          const qty = itens.find((i) => i.id === item.id)?.quantidade || 0;
          return (
            <div
              key={item.id}
              className="glass glass-border border border-[rgba(var(--overlay-rgb),0.1)] rounded-xl p-4 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[var(--color-on-surface)] truncate">{item.nome}</p>
                <p className="text-xs text-[var(--color-primary-container)]">R$ {item.preco.toFixed(2)}</p>
              </div>
              {qty === 0 ? (
                <button
                  onClick={() => addItem(item)}
                  className="w-9 h-9 rounded-lg bg-[var(--color-primary-container)]/15 flex items-center justify-center cursor-pointer"
                >
                  <Plus size={16} className="text-[var(--color-primary-container)]" />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 rounded-lg bg-[var(--color-error)]/10 flex items-center justify-center cursor-pointer">
                    <Minus size={14} className="text-[var(--color-error)]" />
                  </button>
                  <span className="font-bold text-sm w-6 text-center text-[var(--color-on-surface)]">{qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 rounded-lg bg-[var(--color-primary-container)]/15 flex items-center justify-center cursor-pointer">
                    <Plus size={14} className="text-[var(--color-primary-container)]" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Carrinho */}
      {itens.length > 0 && (
        <div className="safe-bottom border-t border-[rgba(var(--overlay-rgb),0.1)] bg-[rgba(var(--glass-rgb),0.6)] backdrop-blur-[12px] p-4 space-y-3">
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {itens.map((i) => (
              <div key={i.id} className="flex items-center justify-between text-xs">
                <span className="text-[var(--color-on-surface)]">{i.quantidade}x {i.nome}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-primary-container)]">R$ {(i.preco * i.quantidade).toFixed(2)}</span>
                  <button onClick={() => updateQty(i.id, -i.quantidade)} className="p-1 cursor-pointer">
                    <Trash2 size={12} className="text-[var(--color-error)]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between font-bold">
            <span className="text-[var(--color-on-surface)]">Total</span>
            <span className="text-[var(--color-primary-container)]">R$ {total.toFixed(2)}</span>
          </div>
          <Button variant="primary" size="lg" className="w-full" disabled={enviando} onClick={handleEnviar}>
            <Send size={16} /> Enviar Pedido
          </Button>
        </div>
      )}

      {/* QR Code Modal */}
      <Modal open={showQR} onClose={() => setShowQR(false)} title="QR Code da Mesa">
        <div className="flex flex-col items-center gap-4 py-4">
          <QRCodeSVG value={`${window.location.origin}/mesa/${mesaId}`} size={180} bgColor="#201f1f" fgColor="#00e5ff" />
          <p className="text-xs text-[var(--color-on-surface-variant)] font-mono">Escaneie para ver o cardápio</p>
        </div>
      </Modal>
    </div>
  );
}
