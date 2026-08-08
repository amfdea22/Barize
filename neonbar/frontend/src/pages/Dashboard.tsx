import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  Flame,
  Printer,
  SprayCan,
  Users,
  PlusCircle,
  X,
  Minus,
  Plus,
  CheckCircle,
} from 'lucide-react';
import type { DashboardData, Pedido, PedidoItem, PedidoStatus } from '../types';
import { relatoriosService, pedidosService } from '../services/api';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Input from '../components/Input';
import OrderCard from '../components/OrderCard';

/* ─── Main Dashboard ─── */
export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [rushMode, setRushMode] = useState(false);
  const [staffCalled, setStaffCalled] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showReimprimir, setShowReimprimir] = useState(false);

  // ─── Cancelar Pedido ───
  const [cancelarPedido, setCancelarPedido] = useState<Pedido | null>(null);
  const [motivoCancelamento, setMotivoCancelamento] = useState('');
  const [cancelando, setCancelando] = useState(false);

  // ─── Pedidos (KDS) ───
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [_pedidosLoading] = useState(false);
  const [showEntradaManual, setShowEntradaManual] = useState(false);
  const [novoPedido, setNovoPedido] = useState({
    mesa: '',
    cliente: '',
    observacao: '',
    itens: [{ nome: '', quantidade: 1, preco: 0, observacao: '' }] as PedidoItem[],
  });

  const showFeedback = useCallback((msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2500);
  }, []);

  // ─── Load Dashboard Data ───
  const load = async (isAuto?: boolean) => {
    if (isAuto) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');
    try {
      const res = await relatoriosService.dashboardExecutivo();
      setData(res.data);
      setLastUpdated(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: any) {
      if (!isAuto) {
        setError(err?.response?.data?.detail || 'Erro ao carregar dashboard');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ─── Load Pedidos ───
  const loadPedidos = useCallback(async () => {
    try {
      const res = await pedidosService.listarAtivos();
      setPedidos(res.data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    load();
    loadPedidos();
  }, [loadPedidos]);

  // Auto-polling dashboard + pedidos a cada 15s
  useEffect(() => {
    loadPedidos();
    const interval = setInterval(() => {
      load(true);
      loadPedidos();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadPedidos]);

  // ─── Atualizar Status ───
  const handleStatusChange = async (id: number, status: PedidoStatus) => {
    try {
      await pedidosService.atualizarStatus(id, status);
      const statusLabel: Record<string, string> = { Novo: 'Novo', Preparando: 'Preparando', Pronto: 'Pronto', Entregue: 'Entregue' };
      showFeedback(`✅ Pedido #${id} → ${statusLabel[status] || status}`);
      loadPedidos();
    } catch {
      showFeedback('❌ Erro ao atualizar status');
    }
  };

  // ─── Cancelar Pedido ───
  const handleCancelarPedido = async () => {
    if (!cancelarPedido) return;
    setCancelando(true);
    try {
      await pedidosService.atualizarStatus(cancelarPedido.id, 'Cancelado');
      showFeedback('🗑️ Pedido #' + cancelarPedido.id + ' cancelado' + (motivoCancelamento.trim() ? ' — ' + motivoCancelamento.trim() : ''));
      setCancelarPedido(null);
      setMotivoCancelamento('');
      loadPedidos();
    } catch {
      showFeedback('❌ Erro ao cancelar pedido');
    } finally {
      setCancelando(false);
    }
  };

  // ─── Criar Pedido (Entrada Manual) ───
  const handleCriarPedido = async () => {
    const itensValidos = novoPedido.itens.filter(i => i.nome.trim());
    if (itensValidos.length === 0) {
      showFeedback('⚠️ Adicione pelo menos um item');
      return;
    }
    try {
      await pedidosService.criar({
        mesa: novoPedido.mesa || undefined,
        cliente: novoPedido.cliente || undefined,
        observacao: novoPedido.observacao || undefined,
        itens: itensValidos,
      });
      showFeedback('📋 Pedido criado com sucesso!');
      setShowEntradaManual(false);
      setNovoPedido({ mesa: '', cliente: '', observacao: '', itens: [{ nome: '', quantidade: 1, preco: 0, observacao: '' }] });
      loadPedidos();
    } catch {
      showFeedback('❌ Erro ao criar pedido');
    }
  };

  const addItem = () => {
    setNovoPedido(prev => ({
      ...prev,
      itens: [...prev.itens, { nome: '', quantidade: 1, preco: 0, observacao: '' }],
    }));
  };

  const removeItem = (idx: number) => {
    setNovoPedido(prev => ({
      ...prev,
      itens: prev.itens.filter((_, i) => i !== idx),
    }));
  };

  const updateItem = (idx: number, field: keyof PedidoItem, value: any) => {
    setNovoPedido(prev => {
      const itens = [...prev.itens];
      itens[idx] = { ...itens[idx], [field]: value };
      return { ...prev, itens };
    });
  };

  const receitaMes = data?.indicadores?.receita_mes ?? 0;
  const alertas = data?.indicadores?.alertas_estoque ?? data?.indicadores?.insumos_criticos ?? 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={24} className="animate-spin text-[var(--color-primary-container)]" />
          <span className="text-sm text-[var(--color-outline)] font-mono">Carregando painel...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertTriangle size={32} className="text-[var(--color-error)]" />
        <p className="text-sm text-[var(--color-error)]">{error}</p>
        <button
          onClick={() => load()}
          className="px-4 py-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-lg text-sm font-medium hover:bg-[var(--color-primary)]/20 transition-colors cursor-pointer"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Feedback Toast */}
      {feedback && (
        <div className="fixed top-6 right-6 z-50 px-4 py-2.5 rounded-lg bg-[var(--color-surface-container-high)] border border-[var(--color-primary)]/30 shadow-2xl text-sm text-[var(--color-on-surface)] animate-fade-in backdrop-blur-[16px]">
          {feedback}
        </div>
      )}

      {/* Dashboard Header */}
      <div className="flex justify-between items-end mb-lg">
        <div className="flex items-end gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-headline-lg text-[var(--color-on-surface)]">PAINEL DE PEDIDOS</h2>
              {/* Badge Ao Vivo */}
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/30 text-[11px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse shadow-[0_0_6px_var(--color-primary)]/60" />
                Ao Vivo
              </span>
            </div>
            <p className="text-[var(--color-on-surface-variant)] text-body-md mt-1">
              Estação 01 • Salão Principal • Turno de Pico
            </p>
          </div>
          {lastUpdated && (
            <p className="text-[11px] text-[var(--color-outline)] font-mono mb-[3px] whitespace-nowrap">
              Última atualização: {lastUpdated}
            </p>
          )}
        </div>
        <div className="flex gap-sm">
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="px-md py-sm border border-[rgba(var(--neutral-rgb),0.3)] rounded-lg text-label-md flex items-center gap-sm bg-[var(--color-surface-container)] hover:bg-[var(--color-surface-container-high)] transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} /> Atualizar
          </button>
        </div>
      </div>

      {/* Grid: Quick Actions + Alerts | Active Orders */}
      <div className="grid grid-cols-12 gap-lg">
        {/* Left: Quick Actions + Alerts */}
        <section className="col-span-12 lg:col-span-3 space-y-lg">
          {/* Quick Actions */}
          <div className="bg-[var(--color-surface-container-high)] rounded-xl p-md border border-[rgba(var(--neutral-rgb),0.1)] shadow-lg">
            <h3 className="text-label-md text-[var(--color-primary)] tracking-widest uppercase mb-md opacity-80">
              Ações Rápidas
            </h3>
            <div className="grid grid-cols-2 gap-sm">
              <button
                onClick={() => { setRushMode((v) => !v); showFeedback(rushMode ? 'Modo Rush desativado' : '⚡ Modo Rush ativado!'); }}
                className={`flex flex-col items-center justify-center p-md rounded-lg border transition-all group cursor-pointer ${
                  rushMode
                    ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]/60 shadow-[0_0_12px_rgba(0,218,243,0.25)]'
                    : 'bg-[var(--color-surface-container-lowest)] border-[rgba(var(--overlay-rgb),0.05)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/5'
                }`}
              >
                <Flame size={24} className={`transition-all mb-xs ${rushMode ? 'text-[var(--color-primary)] scale-110 animate-pulse' : 'text-[var(--color-primary)] group-hover:scale-110'}`} />
                <span className={`text-label-md text-[10px] uppercase ${rushMode ? 'text-[var(--color-primary)]' : ''}`}>
                  {rushMode ? 'RUSH ATIVO' : 'MODO RUSH'}
                </span>
                <span className="text-[8px] text-[var(--color-outline)] mt-0.5 leading-tight">
                  {rushMode ? 'Alta demanda' : 'Acelerar serviço'}
                </span>
              </button>
              <button
                onClick={() => { setShowReimprimir(true); showFeedback('📄 Reimpressão disponível'); }}
                className="flex flex-col items-center justify-center p-md bg-[var(--color-surface-container-lowest)] rounded-lg border border-[rgba(var(--overlay-rgb),0.05)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/5 active:bg-[var(--color-primary)]/10 active:border-[var(--color-primary)]/30 transition-all group cursor-pointer"
              >
                <Printer size={24} className="text-[var(--color-primary)] group-hover:scale-110 transition-transform mb-xs" />
                <span className="text-label-md text-[10px] uppercase">REIMPRIMIR</span>
                <span className="text-[8px] text-[var(--color-outline)] mt-0.5 leading-tight">
                  Comandas pendentes
                </span>
              </button>
              <button
                onClick={() => { load(true); showFeedback('🔄 Painel atualizado'); }}
                className="flex flex-col items-center justify-center p-md bg-[var(--color-surface-container-lowest)] rounded-lg border border-[rgba(var(--overlay-rgb),0.05)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/5 active:bg-[var(--color-primary)]/10 active:border-[var(--color-primary)]/30 transition-all group cursor-pointer"
              >
                <SprayCan size={24} className="text-[var(--color-primary)] group-hover:scale-110 transition-transform mb-xs" />
                <span className="text-label-md text-[10px] uppercase">LIMPAR TELA</span>
                <span className="text-[8px] text-[var(--color-outline)] mt-0.5 leading-tight">
                  Reiniciar painel
                </span>
              </button>
              <button
                onClick={() => { setStaffCalled(true); showFeedback('📢 Staff notificado!'); }}
                className={`flex flex-col items-center justify-center p-md rounded-lg border transition-all group cursor-pointer ${
                  staffCalled
                    ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]/50'
                    : 'bg-[var(--color-surface-container-lowest)] border-[rgba(var(--overlay-rgb),0.05)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/5'
                }`}
              >
                <Users size={24} className={`transition-all mb-xs ${staffCalled ? 'text-[var(--color-primary)] scale-110' : 'text-[var(--color-primary)] group-hover:scale-110'}`} />
                <span className={`text-label-md text-[10px] uppercase ${staffCalled ? 'text-[var(--color-primary)]' : ''}`}>
                  {staffCalled ? 'STAFF NOTIFICADO' : 'CHAMAR STAFF'}
                </span>
                <span className={`text-[8px] mt-0.5 leading-tight ${staffCalled ? 'text-[var(--color-primary)]/70' : 'text-[var(--color-outline)]'}`}>
                  {staffCalled ? '✓ Notificação enviada' : 'Notificar garçons'}
                </span>
              </button>
            </div>
          </div>

          {/* Alertas de Estoque */}
          <div className="bg-[var(--color-surface-container-high)] rounded-xl p-md border border-[rgba(var(--neutral-rgb),0.1)]">
            <div className="flex justify-between items-center mb-md">
              <h3 className="text-label-md text-[var(--color-on-surface-variant)] uppercase tracking-widest">
                Alertas de Estoque
              </h3>
              <AlertTriangle size={20} className="text-[var(--color-secondary-container)] animate-pulse" />
            </div>
            <div className="space-y-sm">
              {alertas > 0 ? (
                <>
                  <div className="flex justify-between items-center bg-[var(--color-surface-container-lowest)] p-sm rounded-lg">
                    <span className="text-body-md text-[var(--color-on-surface)]">
                      {alertas} insumo(s) crítico(s)
                    </span>
                    <span className="text-label-md text-[var(--color-error)]">
                      {alertas} alertas
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-[var(--color-surface-container-lowest)] p-sm rounded-lg">
                    <span className="text-body-md text-[var(--color-on-surface)]">
                      Faturamento (mês)
                    </span>
                    <span className="text-label-md text-[var(--color-primary)]">
                      R$ {receitaMes.toFixed(2)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between items-center bg-[var(--color-surface-container-lowest)] p-sm rounded-lg">
                  <span className="text-body-md text-[var(--color-on-surface)]">
                    Nenhum alerta ativo
                  </span>
                  <span className="text-xs text-[var(--color-outline)]">OK</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right: Active Orders Grid */}
        <section className="col-span-12 lg:col-span-9 overflow-y-auto max-h-[calc(100vh-200px)] pr-1">
          {/* Rush Mode Alert */}
          {rushMode && (
            <div className="mb-md flex items-center gap-3 px-4 py-3 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/40 shadow-[0_0_16px_rgba(0,218,243,0.2)] animate-pulse">
              <Flame size={20} className="text-[var(--color-primary)]" />
              <div className="flex-1">
                <span className="text-label-md font-bold text-[var(--color-primary)] uppercase tracking-wider">⚡ MODO RUSH ATIVO</span>
                <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">Alta demanda — priorizar preparo dos pedidos em aberto</p>
              </div>
              <button
                onClick={() => setRushMode(false)}
                className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
            {pedidos.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle size={48} className="text-[var(--color-primary)]/30 mb-4" />
                <p className="text-body-lg text-[var(--color-on-surface-variant)] mb-1">
                  Nenhum pedido ativo no momento
                </p>
                <p className="text-sm text-[var(--color-outline)]">
                  Os novos pedidos aparecerão automaticamente aqui.
                </p>
              </div>
            )}

            {pedidos.map((pedido) => (
              <OrderCard
                key={pedido.id}
                pedido={pedido}
                onStatusChange={handleStatusChange}
                onCancel={setCancelarPedido}
              />
            ))}

            {/* Add New Order Tile */}
            <div
              onClick={() => { setShowEntradaManual(true); setNovoPedido({ mesa: '', cliente: '', observacao: '', itens: [{ nome: '', quantidade: 1, preco: 0, observacao: '' }] }); }}
              className="border-2 border-dashed border-[rgba(var(--neutral-rgb),0.2)] rounded-xl flex items-center justify-center min-h-[250px] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-primary)]/5 transition-all group cursor-pointer"
            >
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-[var(--color-surface-container-high)] flex items-center justify-center mx-auto mb-md group-hover:bg-[var(--color-primary)]/20 group-hover:text-[var(--color-primary)] transition-colors">
                  <PlusCircle size={32} />
                </div>
                <span className="text-label-md text-[var(--color-on-surface-variant)] uppercase tracking-widest">
                  Entrada Manual
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer Stats Bar */}
      <footer className="mt-xl border-t border-[rgba(var(--neutral-rgb),0.1)] pt-lg pb-xl flex flex-wrap gap-xl items-center justify-between text-[var(--color-on-surface-variant)]">
        <div className="flex gap-xl">
          <div className="flex flex-col">
            <span className="text-label-md text-[10px] uppercase tracking-widest opacity-60">
              Faturamento (Turno)
            </span>
            <span className="text-data-display text-[var(--color-on-surface)]">
              R$ {receitaMes.toFixed(2)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-label-md text-[10px] uppercase tracking-widest opacity-60">
              Pedidos Ativos
            </span>
            <span className="text-data-display text-[var(--color-on-surface)]">
              {pedidos.length}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-label-md text-[10px] uppercase tracking-widest opacity-60">
              Fila
            </span>
            <span className="text-data-display text-[var(--color-on-surface)]">
              {(() => {
                const ativos = pedidos.filter(p => p.status === 'Novo' || p.status === 'Preparando');
                const tempos = ativos.map(p => {
                  if (!p.created_at) return 0;
                  const d = new Date(p.created_at);
                  const ms = d.getTime();
                  if (isNaN(ms)) return 0;
                  return Math.floor((Date.now() - ms) / 60000);
                });
                if (tempos.length === 0) return '—';
                const avg = Math.round(tempos.reduce((a, b) => a + b, 0) / tempos.length);
                return `${avg}m méd`;
              })()}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-label-md text-[10px] uppercase tracking-widest opacity-60">
              Nível de Movimento
            </span>
            <div className="flex gap-1 mt-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={`w-4 h-1.5 rounded-full ${
                    i < Math.min(pedidos.length + 1, 5)
                      ? 'bg-[var(--color-primary)]'
                      : 'bg-[rgba(var(--neutral-rgb),0.3)]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
          <span className="text-label-md uppercase tracking-tighter">
            Sistemas Operantes • Terminal 01 Ativo
          </span>
        </div>
      </footer>

      {/* ════════════════════════════════════════ */}
      {/* MODAL: Reimprimir Comanda               */}
      {/* ════════════════════════════════════════ */}
      <Modal open={showReimprimir} onClose={() => setShowReimprimir(false)} title="Pré-visualização da Comanda" size="lg">
        <div className="space-y-4">
          <p className="text-xs text-[var(--color-on-surface-variant)] font-mono tracking-wider uppercase">
            Visualização do formato de impressão ESC/POS
          </p>

          {/* Comanda Preview */}
          <div className="bg-black/80 rounded-xl p-4 font-mono text-[10px] leading-relaxed text-center select-all border border-[rgba(var(--overlay-rgb),0.1)] shadow-[inset_0_0_30px_rgba(0,0,0,0.5)] max-h-[340px] overflow-y-auto">
            <div className="text-[var(--color-primary)] font-bold text-xs tracking-[0.2em] mb-0.5">
              ★ NEONBAR ★
            </div>
            <div className="text-[var(--color-on-surface)] text-[9px] uppercase tracking-wider mb-1">
              Comanda de Bar
            </div>
            <div className="border-t border-dashed border-[rgba(var(--overlay-rgb),0.15)] mb-1" />

            <div className="flex justify-between text-[var(--color-on-surface-variant)] text-[9px] mb-1">
              <span>#{Math.floor(800 + Math.random() * 200)}</span>
              <span>{new Date().toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: '2-digit' })}</span>
            </div>

            <div className="text-left space-y-0.5 mb-1">
              <div className="flex justify-between text-[var(--color-on-surface)] text-[10px]">
                <span>2x Dry Martini</span>
                <span>R$ 36,00</span>
              </div>
              <div className="text-[8px] text-[var(--color-on-surface-variant)] pl-3">
                Obs: Com azeitona extra
              </div>
              <div className="flex justify-between text-[var(--color-on-surface)] text-[10px]">
                <span>1x Negroni</span>
                <span>R$ 28,00</span>
              </div>
              <div className="flex justify-between text-[var(--color-on-surface)] text-[10px]">
                <span>3x Chopp Heineken</span>
                <span>R$ 45,00</span>
              </div>
            </div>

            <div className="border-t border-dashed border-[rgba(var(--overlay-rgb),0.15)] mb-1" />

            <div className="flex justify-between text-[var(--color-primary)] font-bold text-xs mb-0.5">
              <span>TOTAL</span>
              <span>R$ 109,00</span>
            </div>
            <div className="text-[var(--color-on-surface-variant)] text-[8px]">
              Taxa 8%: R$ 8,72
            </div>

            <div className="border-t border-dashed border-[rgba(var(--overlay-rgb),0.15)] my-1" />

            <div className="text-[var(--color-on-surface-variant)] text-[8px] space-y-0.5">
              <div>Atendente: Admin</div>
              <div>Mesa 12 • Cliente 1</div>
              <div className="text-[var(--color-primary)]/60 text-[9px] mt-0.5">Obrigado!</div>
            </div>
          </div>

          <div className="text-[10px] text-[var(--color-outline)] text-center">
            Esta é uma simulação. A formatação real depende do modelo da impressora.
          </div>

          <div className="flex gap-3 pt-1">
            <Button variant="ghost" className="flex-1" onClick={() => setShowReimprimir(false)}>
              Fechar
            </Button>
            <Button className="flex-1" onClick={() => { setShowReimprimir(false); showFeedback('📨 Comanda enviada para a fila de impressão'); }}>
              <Printer size={16} /> Reimprimir
            </Button>
          </div>
        </div>
      </Modal>

      {/* ════════════════════════════════════════ */}
      {/* MODAL: Entrada Manual (Novo Pedido)      */}
      {/* ════════════════════════════════════════ */}
      <Modal open={showEntradaManual} onClose={() => setShowEntradaManual(false)} title="Novo Pedido — Entrada Manual" size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Mesa + Cliente */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Mesa / Local"
              placeholder="Ex: Mesa 05, Balcão"
              value={novoPedido.mesa}
              onChange={e => setNovoPedido(prev => ({ ...prev, mesa: e.target.value }))}
            />
            <Input
              label="Cliente / Comanda"
              placeholder="Nome do cliente"
              value={novoPedido.cliente}
              onChange={e => setNovoPedido(prev => ({ ...prev, cliente: e.target.value }))}
            />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-[var(--color-outline)] uppercase tracking-wider">Itens do Pedido</label>
              <button
                onClick={addItem}
                className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 transition-colors cursor-pointer"
              >
                <Plus size={14} /> Adicionar Item
              </button>
            </div>

            <div className="space-y-2">
              {novoPedido.itens.map((item, idx) => (
                <div key={idx} className="bg-[var(--color-surface-container-lowest)] rounded-lg p-3 border border-[rgba(var(--overlay-rgb),0.06)]">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <input
                            type="text"
                            placeholder="Nome do item"
                            value={item.nome}
                            onChange={e => updateItem(idx, 'nome', e.target.value)}
                            className="w-full bg-transparent border border-[rgba(var(--overlay-rgb),0.1)] rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder-[var(--color-outline)] focus:outline-none focus:border-[var(--color-primary)]/50"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="R$"
                            value={item.preco || ''}
                            onChange={e => updateItem(idx, 'preco', Number(e.target.value))}
                            className="w-full bg-transparent border border-[rgba(var(--overlay-rgb),0.1)] rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder-[var(--color-outline)] focus:outline-none focus:border-[var(--color-primary)]/50"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1 bg-[var(--color-surface-container)] rounded-lg px-2 py-1">
                          <button
                            onClick={() => { if (item.quantidade > 1) updateItem(idx, 'quantidade', item.quantidade - 1); }}
                            className="p-0.5 text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] cursor-pointer"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="text-sm font-mono text-[var(--color-on-surface)] min-w-[20px] text-center">{item.quantidade}</span>
                          <button
                            onClick={() => updateItem(idx, 'quantidade', item.quantidade + 1)}
                            className="p-0.5 text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] cursor-pointer"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Obs (opcional)"
                          value={item.observacao || ''}
                          onChange={e => updateItem(idx, 'observacao', e.target.value)}
                          className="flex-1 bg-transparent border border-[rgba(var(--overlay-rgb),0.1)] rounded-lg px-3 py-1 text-xs text-[var(--color-on-surface)] placeholder-[var(--color-outline)] focus:outline-none focus:border-[var(--color-primary)]/50"
                        />
                      </div>
                    </div>
                    {novoPedido.itens.length > 1 && (
                      <button
                        onClick={() => removeItem(idx)}
                        className="p-1 text-[var(--color-error)] hover:bg-[var(--color-error)]/10 rounded transition-colors cursor-pointer"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Observação geral */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-outline)] uppercase tracking-wider mb-1">
              Observação Geral
            </label>
            <textarea
              placeholder="Observações para a cozinha/bar..."
              value={novoPedido.observacao}
              onChange={e => setNovoPedido(prev => ({ ...prev, observacao: e.target.value }))}
              rows={2}
              className="w-full bg-[var(--color-surface-container-lowest)] border border-[rgba(var(--overlay-rgb),0.1)] rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder-[var(--color-outline)] focus:outline-none focus:border-[var(--color-primary)]/50 resize-none"
            />
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-2 border-t border-[rgba(var(--overlay-rgb),0.06)]">
            <span className="text-sm text-[var(--color-on-surface-variant)]">
              {novoPedido.itens.filter(i => i.nome.trim()).length} item(ns)
            </span>
            <span className="text-data-display text-[var(--color-primary)]">
              R$ {novoPedido.itens.reduce((sum, i) => sum + i.quantidade * i.preco, 0).toFixed(2)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowEntradaManual(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleCriarPedido}>
              <PlusCircle size={16} /> Criar Pedido
            </Button>
          </div>
        </div>
      </Modal>

      {/* ════════════════════════════════════════ */}
      {/* MODAL: Cancelar Pedido                    */}
      {/* ════════════════════════════════════════ */}
      <Modal open={!!cancelarPedido} onClose={() => { setCancelarPedido(null); setMotivoCancelamento(''); }} title={`Cancelar Pedido #${cancelarPedido?.id || ''}`} size="md">
        <div className="space-y-4">
          <div className="flex items-start gap-3 px-md py-sm rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-body-md text-[var(--color-error)]">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span>
              Tem certeza que deseja cancelar o pedido #{cancelarPedido?.id}?
              {cancelarPedido?.mesa && <> (Mesa {cancelarPedido.mesa})</>}
              {cancelarPedido?.cliente && <> — {cancelarPedido.cliente}</>}
              {cancelarPedido?.itens?.length ? <> — {cancelarPedido.itens.reduce((s, i) => s + i.quantidade, 0)} item(ns)</> : null}
            </span>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">
              Motivo (opcional)
            </label>
            <textarea
              value={motivoCancelamento}
              onChange={e => setMotivoCancelamento(e.target.value)}
              placeholder="Motivo do cancelamento..."
              rows={2}
              className="w-full bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.1)] rounded-lg text-sm text-[var(--color-on-surface)] px-3 py-2 outline-none resize-none placeholder:text-[var(--color-on-surface-variant)]/40"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => { setCancelarPedido(null); setMotivoCancelamento(''); }}>
              Voltar
            </Button>
            <Button
              className="flex-1 bg-[var(--color-error)] hover:bg-[var(--color-error)]/80"
              loading={cancelando}
              onClick={handleCancelarPedido}
            >
              <X size={16} /> Confirmar Cancelamento
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

