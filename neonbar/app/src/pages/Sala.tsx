import { useState, useEffect } from 'react';
import { Store, Plus, X, Pencil, Trash2, Power, CreditCard, Check, Banknote, QrCode, ArrowLeft, Receipt, Users, AlertCircle, CheckCircle2, Calculator } from 'lucide-react';
import { mesasService, pedidosService, pagamentosService, pdvService } from '../services/api';
import { toast } from '../components/Toast';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Visualizador80mm from '../components/pdv/Visualizador80mm';
import { CupomPrintActions } from '../components/pdv/CupomPDV';

type Mesa = {
  id: number;
  nome: string;
  local?: string;
  ativo: number;
  created_at?: string;
};

type Tab = 'mesas' | 'balcao';

export default function Sala() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('mesas');
  const [selecionadaId, setSelecionadaId] = useState<number | null>(null);
  const [mesasOcupadas, setMesasOcupadas] = useState<Set<string>>(new Set());

  const [showModal, setShowModal] = useState(false);
  const [editingMesa, setEditingMesa] = useState<{ id?: number; nome: string; local: string } | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formLocal, setFormLocal] = useState('');
  const [saving, setSaving] = useState(false);

  const [showDetail, setShowDetail] = useState(false);
  const [detailMesa, setDetailMesa] = useState<Mesa | null>(null);
  const [showPagamento, setShowPagamento] = useState(false);
  const [pagamentoMesa, setPagamentoMesa] = useState<Mesa | null>(null);
  const [pedidosMesa, setPedidosMesa] = useState<any[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<string>('dinheiro');
  const [finalizandoPagamento, setFinalizandoPagamento] = useState(false);
  const [valorRecebido, setValorRecebido] = useState('');
  const [parcelas, setParcelas] = useState(1);
  const [dividirConta, setDividirConta] = useState(false);
  const [qtdPessoas, setQtdPessoas] = useState(2);
  const [valorCustom, setValorCustom] = useState('');
  const [chargeServiceFee, setChargeServiceFee] = useState(true);
  const [chargeCover, setChargeCover] = useState(true);
  const [isencaoMotivo, setIsencaoMotivo] = useState('');
  const [showCalc, setShowCalc] = useState(false);
  const [ultimoPagamento, setUltimoPagamento] = useState<{
    itens: any[]; subtotal: number; desconto: number; taxa: number;
    total: number; forma_pagamento: string; troco: number;
    mesa: string; cliente: string; vendedor: string; observacao: string;
  } | null>(null);

  const loadMesas = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await mesasService.listar();
      setMesas(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao carregar mesas');
    } finally {
      setLoading(false);
    }
  };

  const loadOcupadas = async () => {
    try {
      const res = await pedidosService.listarAtivos();
      const data = res.data;
      const pedidos = Array.isArray(data) ? data : [];
      const ocupadas = new Set<string>();
      pedidos.forEach((p: any) => {
        if (p.mesa && ['Novo', 'Preparando', 'Pronto', 'Entregue'].includes(p.status)) {
          ocupadas.add(p.mesa);
        }
      });
      setMesasOcupadas(ocupadas);
    } catch {
      // Silently ignore
    }
  };

  useEffect(() => {
    loadMesas();
    loadOcupadas();
    const interval = setInterval(loadOcupadas, 30000);
    return () => clearInterval(interval);
  }, []);

  const isBalcao = (m: Mesa) => {
    const l = (m.local || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return l.includes('balcao');
  };

  const mesasTab = mesas.filter((m) => m.ativo === 1 && !isBalcao(m));
  const balcaoTab = mesas.filter((m) => m.ativo === 1 && isBalcao(m));
  const inativas = mesas.filter((m) => m.ativo !== 1);

  const currentList = activeTab === 'mesas' ? mesasTab : balcaoTab;
  const currentLabel = activeTab === 'mesas' ? 'Mesa' : 'Balcão';

  const openModal = (mesa?: { id?: number; nome: string; local: string }) => {
    if (mesa) {
      setEditingMesa(mesa);
      setFormNome(mesa.nome);
      setFormLocal(mesa.local || '');
    } else {
      setEditingMesa(null);
      setFormNome('');
      setFormLocal(activeTab === 'balcao' ? 'Balcão' : 'Mesa');
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formNome.trim()) return;
    setSaving(true);
    try {
      if (editingMesa?.id) {
        await mesasService.atualizar(editingMesa.id, { nome: formNome.trim(), local: formLocal.trim() || undefined });
        toast.success('Mesa atualizada!');
      } else {
        await mesasService.criar({ nome: formNome.trim(), local: formLocal.trim() || undefined });
        toast.success(`${currentLabel} criada!`);
      }
      setShowModal(false);
      loadMesas();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDesativar = async (id: number) => {
    try {
      await mesasService.desativar(id);
      toast.success(`${currentLabel} desativada!`);
      setShowModal(false);
      setShowDetail(false);
      setSelecionadaId(null);
      loadMesas();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erro ao desativar');
    }
  };

  const handleReativar = async (id: number) => {
    try {
      await mesasService.atualizar(id, { ativo: 1 });
      toast.success(`${currentLabel} reativada!`);
      loadMesas();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erro ao reativar');
    }
  };

  const handleMesaClick = async (mesa: Mesa) => {
    if (selecionadaId === mesa.id) {
      setSelecionadaId(null);
      setShowDetail(false);
      setPedidosMesa([]);
    } else {
      setSelecionadaId(mesa.id);
      setDetailMesa(mesa);
      setShowDetail(true);
      setLoadingPedidos(true);
      try {
        const res = await pedidosService.listarTodos();
        const data = res.data;
        const pedidos = Array.isArray(data) ? data.filter((p: any) =>
          p.mesa === mesa.nome && ['Novo', 'Preparando', 'Pronto', 'Entregue'].includes(p.status)
        ) : [];
        setPedidosMesa(pedidos);
      } catch {
        setPedidosMesa([]);
      } finally {
        setLoadingPedidos(false);
      }
    }
  };

  const handleAbrirPagamento = async (mesa: Mesa) => {
    setPagamentoMesa(mesa);
    setShowDetail(false);
    setLoadingPedidos(true);
    try {
      const res = await pedidosService.listarTodos();
      const data = res.data;
      const pedidos = Array.isArray(data) ? data.filter((p: any) => 
        p.mesa === mesa.nome && ['Novo', 'Preparando', 'Pronto', 'Entregue'].includes(p.status)
      ) : [];
      setPedidosMesa(pedidos);
      setShowPagamento(true);
    } catch (err: any) {
      toast.error('Erro ao carregar pedidos da mesa');
      setPedidosMesa([]);
    } finally {
      setLoadingPedidos(false);
    }
  };

  const handleConfirmarPagamento = async () => {
    if (!pagamentoMesa || pedidosMesa.length === 0) return;
    setFinalizandoPagamento(true);
    try {
      const subtotal = pedidosMesa.reduce((sum, p) => sum + (p.total || 0), 0);
      const taxaServico = chargeServiceFee ? subtotal * 0.10 : 0;
      const valorCouvert = chargeCover ? 15.00 : 0;
      const total = subtotal + taxaServico + valorCouvert;
      
      await pagamentosService.criar({
        forma_pagamento: formaPagamento,
        valor: total,
        valor_servico_pago: taxaServico,
        valor_couvert_pago: valorCouvert,
        isencao_servico: !chargeServiceFee,
        isencao_couvert: !chargeCover,
        motivo_isencao: isencaoMotivo || undefined,
      });
      
      // Arquivar pedidos automaticamente após pagamento
      for (const pedido of pedidosMesa) {
        await pedidosService.atualizarStatus(pedido.id, 'Arquivado');
      }

      setUltimoPagamento({
        itens: pedidosMesa.map(p => ({ nome: `Pedido #${p.id}`, quantidade: 1, preco: p.total || 0 })),
        subtotal: subtotal,
        desconto: 0,
        taxa: taxaServico,
        total: total,
        forma_pagamento: formaPagamento,
        troco: ehDinheiro ? troco : 0,
        mesa: pagamentoMesa.nome,
        cliente: pedidosMesa[0]?.cliente || '',
        vendedor: '',
        observacao: '',
      });
      setShowPagamento(false);
      setFormaPagamento('dinheiro');
      setValorRecebido('');
      setParcelas(1);
      setDividirConta(false);
      setQtdPessoas(2);
      setValorCustom('');
      setChargeServiceFee(true);
      setChargeCover(true);
      setIsencaoMotivo('');
      loadOcupadas();
      toast.success('Pagamento registrado e pedido fechado!');
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erro ao processar pagamento');
    } finally {
      setFinalizandoPagamento(false);
    }
  };

  const subtotal = pedidosMesa.reduce((sum, p) => sum + (p.total || 0), 0);
  const taxaServico = chargeServiceFee ? subtotal * 0.10 : 0;
  const valorCouvert = chargeCover ? 15.00 : 0; // Valor fixo do couvert artístico
  const total = subtotal + taxaServico + valorCouvert;
  const valorCustomNum = parseFloat(valorCustom) || 0;
  const valorPorPessoa = valorCustomNum > 0 ? valorCustomNum : (dividirConta ? total / qtdPessoas : total);

  const handleDigit = (digit: string) => {
    if (digit === '00x') {
      setValorRecebido(v => (v ? (v + '00').slice(0, 8) : v));
      return;
    }
    setValorRecebido(v => {
      const next = (v || '') + digit;
      return next.length > 8 ? v : next;
    });
  };
  const handleBackspace = () => setValorRecebido(v => v.slice(0, -1));
  const handleClear = () => setValorRecebido('');

  const recebido = parseInt(valorRecebido || '0', 10) / 100;
  const troco = recebido >= total ? recebido - total : 0;
  const ehDinheiro = formaPagamento === 'dinheiro';
  const podeConfirmar = !ehDinheiro || (recebido >= total && recebido > 0);

  const fmtValor = (cents: number) => {
    const str = String(cents).padStart(3, '0');
    return `R$ ${str.slice(0, -2)},${str.slice(-2)}`;
  };

  const totalOcupadas = mesasOcupadas.size;
  const totalLivres = currentList.length - currentList.filter(m => mesasOcupadas.has(m.nome)).length;

  return (
    <div className="flex flex-col h-dvh bg-[var(--color-background)]">
      {/* Header */}
      <header className="safe-top border-b border-[rgba(255,255,255,0.06)] bg-[rgba(var(--glass-rgb),0.6)] backdrop-blur-[20px]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgba(0,229,255,0.2)] to-[rgba(0,218,243,0.08)] flex items-center justify-center border border-[rgba(0,229,255,0.2)] shadow-[0_0_12px_rgba(0,229,255,0.15)]">
              <Store size={20} className="text-[var(--color-primary-container)]" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[var(--color-on-surface)] tracking-tight">SALÃO</h1>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-medium uppercase tracking-wider text-[var(--color-on-surface-variant)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
                  {totalLivres} livre(s)
                </span>
                <span className="text-[var(--color-outline)]">·</span>
                <span className="inline-flex items-center gap-1 text-[9px] font-mono font-medium uppercase tracking-wider text-[var(--color-on-surface-variant)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
                  {totalOcupadas} ocup.
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[var(--color-primary-container)] text-[var(--color-on-primary)] font-bold text-[11px] uppercase tracking-wider active:scale-95 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,229,255,0.25)]"
          >
            <Plus size={14} /> Novo
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-[rgba(255,255,255,0.06)]">
        {([
          { key: 'mesas' as Tab, label: 'Mesas', count: mesasTab.length },
          { key: 'balcao' as Tab, label: 'Balcão', count: balcaoTab.length },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 h-12 text-[10px] font-mono font-bold uppercase tracking-widest transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'text-[var(--color-primary-container)] border-b-2 border-[var(--color-primary-container)] shadow-[0_-2px_8px_rgba(0,229,255,0.15)]'
                : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] hover:bg-[rgba(255,255,255,0.02)]'
            }`}
          >
            {tab.label}
            <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[9px] font-bold ${
              activeTab === tab.key
                ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary)]'
                : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[var(--color-primary-container)] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-mono text-[var(--color-outline)] tracking-wider">Carregando...</span>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--color-error)]/10 flex items-center justify-center">
                <X size={20} className="text-[var(--color-error)]" />
              </div>
              <span className="text-xs font-mono text-[var(--color-error)]">{error}</span>
              <button onClick={loadMesas} className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-primary-container)] hover:underline cursor-pointer">
                Tentar novamente
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Grid */}
            {currentList.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
                {currentList.map((mesa) => {
                  const isSelected = selecionadaId === mesa.id;
                  const isOcupada = mesasOcupadas.has(mesa.nome);
                  return (
                    <button
                      key={mesa.id}
                      onClick={() => handleMesaClick(mesa)}
                      className={`relative aspect-square flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 transition-all duration-200 cursor-pointer active:scale-[0.96] min-h-[80px] ${
                        isSelected
                          ? 'bg-[rgba(0,229,255,0.15)] border-[var(--color-primary-container)] shadow-[0_0_20px_rgba(0,229,255,0.35),inset_0_0_16px_rgba(0,229,255,0.08)] scale-[1.03]'
                          : isOcupada
                            ? 'bg-[rgba(255,191,36,0.06)] border-[rgba(255,191,36,0.25)] shadow-[0_0_8px_rgba(255,191,36,0.1)]'
                            : 'bg-[var(--color-surface-container)] border-[rgba(255,255,255,0.06)] hover:border-[rgba(0,229,255,0.2)] hover:shadow-[0_0_8px_rgba(0,229,255,0.08)]'
                      }`}
                    >
                      {/* Selected check */}
                      {isSelected && (
                        <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-[var(--color-primary-container)] flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        </span>
                      )}

                      {/* Status dot */}
                      <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                        isOcupada
                          ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                          : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                      }`} />

                      <span className={`text-lg font-bold font-mono transition-all ${
                        isSelected
                          ? 'text-[var(--color-primary-container)] text-xl'
                          : isOcupada
                            ? 'text-amber-400'
                            : 'text-[var(--color-on-surface)]'
                      }`}>
                        {mesa.nome}
                      </span>

                      {/* Status pill */}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-mono font-bold uppercase tracking-wider ${
                        isOcupada
                          ? 'bg-amber-400/15 text-amber-400 border border-amber-400/20'
                          : 'bg-emerald-400/15 text-emerald-400 border border-emerald-400/20'
                      }`}>
                        {isOcupada ? 'Ocupada' : 'Livre'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentList.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-[var(--color-outline)] gap-3">
                <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-container)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center">
                  <Store size={28} className="opacity-30" />
                </div>
                <span className="text-xs font-mono tracking-wider">
                  Nenhum{(activeTab === 'balcao' ? ' balcão' : 'a mesa')} cadastrad{(activeTab === 'balcao' ? 'o' : 'a')}
                </span>
                <button
                  onClick={() => openModal()}
                  className="flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[var(--color-primary-container)]/10 text-[var(--color-primary-container)] text-[10px] font-mono font-bold uppercase tracking-wider border border-[rgba(0,229,255,0.2)] hover:bg-[var(--color-primary-container)]/20 transition-all cursor-pointer"
                >
                  <Plus size={12} /> Criar {currentLabel.toLowerCase()}
                </button>
              </div>
            )}

            {/* Inativas */}
            {inativas.filter((m) => activeTab === 'mesas' ? !isBalcao(m) : isBalcao(m)).length > 0 && (
              <>
                <h3 className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-[var(--color-on-surface-variant)] mb-3 opacity-50">
                  Inativas
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {inativas
                    .filter((m) => activeTab === 'mesas' ? !isBalcao(m) : isBalcao(m))
                    .map((mesa) => (
                      <button
                        key={mesa.id}
                        onClick={() => handleReativar(mesa.id)}
                        className="aspect-square flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-[var(--color-surface-container)] border border-[rgba(255,255,255,0.04)] opacity-30 hover:opacity-60 transition-all duration-200 cursor-pointer min-h-[80px]"
                        title={`Reativar ${currentLabel.toLowerCase()} ${mesa.nome}`}
                      >
                        <Power size={14} className="text-[var(--color-outline)]" />
                        <span className="text-sm font-bold font-mono text-[var(--color-on-surface)] line-through decoration-1">
                          {mesa.nome}
                        </span>
                      </button>
                    ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <Modal open={showDetail} onClose={() => { setShowDetail(false); setSelecionadaId(null); }}>
        {detailMesa && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-mono text-xl font-bold ${
                mesasOcupadas.has(detailMesa.nome)
                  ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
                  : 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 shadow-[0_0_12px_rgba(52,211,153,0.15)]'
              }`}>
                {detailMesa.nome}
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-[var(--color-on-surface)]">{currentLabel} {detailMesa.nome}</h2>
                <p className="text-xs font-mono text-[var(--color-on-surface-variant)] mt-0.5">
                  {detailMesa.local || 'Sem local definido'}
                </p>
              </div>
            </div>

            {/* Pedidos da Mesa */}
            {mesasOcupadas.has(detailMesa.nome) && (
              <div>
                <p className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-[var(--color-on-surface-variant)] mb-2">Pedidos</p>
                {loadingPedidos ? (
                  <div className="text-xs text-[var(--color-on-surface-variant)] font-mono py-4 text-center">Carregando...</div>
                ) : pedidosMesa.length === 0 ? (
                  <div className="text-xs text-[var(--color-on-surface-variant)] font-mono py-4 text-center">Nenhum pedido encontrado</div>
                ) : (
                  <div className="space-y-2">
                    {pedidosMesa.map((p: any) => (
                      <div key={p.id} className="p-3 rounded-xl bg-[var(--color-surface-container-high)] border border-[rgba(255,255,255,0.04)]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-mono font-bold text-[var(--color-on-surface)]">Pedido #{p.id}</span>
                          <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${
                            p.status === 'Pronto' ? 'bg-emerald-400/15 text-emerald-400' :
                            p.status === 'Preparando' ? 'bg-amber-400/15 text-amber-400' :
                            'bg-blue-400/15 text-blue-400'
                          }`}>{p.status}</span>
                        </div>
                        {p.itens && p.itens.length > 0 && (
                          <div className="space-y-1.5 mt-2">
                            {p.itens.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <span className="text-[11px] font-bold text-[var(--color-on-surface)]">{item.quantidade}x</span>
                                  <span className="text-[11px] text-[var(--color-on-surface)] ml-1.5">{item.nome || item.nome_produto || item.produto}</span>
                                  {item.observacao && (
                                    <p className="text-[9px] text-[var(--color-on-surface-variant)] mt-0.5 italic">Obs: {item.observacao}</p>
                                  )}
                                </div>
                                <span className="text-[10px] font-mono text-[var(--color-on-surface-variant)]">
                                  R$ {((item.preco || item.preco_unitario || 0) * item.quantidade).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="text-[11px] font-mono font-bold text-[var(--color-primary-container)] mt-2">
                          R$ {(p.total || 0).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDetail(false); setSelecionadaId(null); }}
                className="flex-1 h-11 rounded-xl border border-[rgba(255,255,255,0.1)] text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)] hover:bg-[rgba(255,255,255,0.04)] transition-all cursor-pointer"
              >
                Fechar
              </button>
              {mesasOcupadas.has(detailMesa.nome) && (
                <button
                  onClick={() => handleAbrirPagamento(detailMesa)}
                  className="flex-1 h-11 rounded-xl bg-emerald-500 text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                >
                  <CreditCard size={14} /> Pagamento
                </button>
              )}
              {!mesasOcupadas.has(detailMesa.nome) && (
                <>
                  <button
                    onClick={() => {
                      openModal({ id: detailMesa.id, nome: detailMesa.nome, local: detailMesa.local || '' });
                      setShowDetail(false);
                    }}
                    className="flex-1 h-11 rounded-xl bg-[var(--color-primary-container)] text-[var(--color-on-primary)] text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer shadow-[0_0_12px_rgba(0,229,255,0.2)]"
                  >
                    <Pencil size={12} /> Editar
                  </button>
                  <button
                    onClick={() => handleDesativar(detailMesa.id)}
                    className="h-11 px-3 rounded-xl bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/20 flex items-center justify-center hover:bg-[var(--color-error)]/20 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[var(--color-on-surface)]">
              {editingMesa ? `Editar ${currentLabel}` : `Nov${activeTab === 'balcao' ? 'o' : 'a'} ${currentLabel}`}
            </h2>
            <button
              onClick={() => setShowModal(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[rgba(255,255,255,0.06)] text-[var(--color-on-surface-variant)] cursor-pointer transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-[var(--color-on-surface-variant)] mb-2 block">
                Nome *
              </label>
              <input
                type="text"
                value={formNome}
                onChange={(e) => setFormNome(e.target.value)}
                placeholder={activeTab === 'balcao' ? 'Ex: B1, B2...' : 'Ex: M1, M2...'}
                className="w-full h-12 px-4 rounded-xl bg-[var(--color-surface-container-lowest)] border border-[rgba(255,255,255,0.06)] text-sm font-mono text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:border-b-2 focus:border-b-[var(--color-primary-container)] transition-all"
                autoFocus
              />
            </div>
            <div>
              <label className="text-[9px] font-mono font-bold uppercase tracking-[0.15em] text-[var(--color-on-surface-variant)] mb-2 block">
                Tipo
              </label>
              <select
                value={formLocal}
                onChange={(e) => setFormLocal(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-[var(--color-surface-container-lowest)] border border-[rgba(255,255,255,0.06)] text-sm font-mono text-[var(--color-on-surface)] outline-none focus:border-b-2 focus:border-b-[var(--color-primary-container)] transition-all appearance-none cursor-pointer"
              >
                <option value="Mesa">Mesa</option>
                <option value="Balcão">Balcão</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 h-11 rounded-xl border border-[rgba(255,255,255,0.1)] text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)] hover:bg-[rgba(255,255,255,0.04)] transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!formNome.trim() || saving}
              className="flex-1 h-11 rounded-xl bg-[var(--color-primary-container)] text-[var(--color-on-primary)] text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(0,229,255,0.2)]"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-[var(--color-on-primary)] border-t-transparent rounded-full animate-spin" />
              ) : (
                editingMesa ? 'Salvar' : 'Criar'
              )}
            </button>
          </div>

          {editingMesa && (
            <button
              onClick={() => handleDesativar(editingMesa.id!)}
              className="w-full h-9 rounded-xl bg-[var(--color-error)]/8 text-[var(--color-error)] text-[10px] font-mono font-bold uppercase tracking-wider border border-[var(--color-error)]/15 hover:bg-[var(--color-error)]/15 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Trash2 size={12} /> Desativar {currentLabel.toLowerCase()}
            </button>
          )}
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal open={showPagamento} onClose={() => !finalizandoPagamento && setShowPagamento(false)} title="Pagamento"
        footer={
          <div className="space-y-3">
            {/* Forma de Pagamento */}
            <div>
              <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-2">Forma de Pagamento</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { key: 'dinheiro', label: 'Dinheiro', icon: Banknote },
                  { key: 'cartao_credito', label: 'Credito', icon: CreditCard },
                  { key: 'cartao_debito', label: 'Debito', icon: CreditCard },
                  { key: 'pix', label: 'Pix', icon: QrCode },
                ].map((f) => {
                  const Icon = f.icon;
                  const active = formaPagamento === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => { setFormaPagamento(f.key); setValorRecebido(''); }}
                      className={`flex flex-col items-center gap-1.5 py-2 rounded-xl border transition-all cursor-pointer ${
                        active
                          ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] border-[var(--color-primary)]'
                          : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] border-transparent'
                      }`}
                    >
                      <Icon size={16} />
                      <span className="text-[9px] font-medium">{f.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dinheiro: teclado + troco */}
            {ehDinheiro && (
              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1">Valor Recebido</label>
                  <div className="bg-[var(--color-surface-container-lowest)] rounded-xl px-4 py-2 text-right text-lg font-bold font-mono text-[var(--color-on-surface)] h-10 flex items-center justify-end">
                    {valorRecebido ? fmtValor(parseInt(valorRecebido, 10)) : 'R$ 0,00'}
                  </div>
                </div>
                {recebido > 0 && recebido < total && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400">
                    <AlertCircle size={12} />
                    <span>Faltam R$ {(total - recebido).toFixed(2)}</span>
                  </div>
                )}
                {troco > 0 && (
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
                    <span className="text-xs text-green-400 uppercase font-medium">Troco</span>
                    <span className="text-sm font-bold text-green-400 font-mono">R$ {troco.toFixed(2)}</span>
                  </div>
                )}
                <button type="button" onClick={() => setShowCalc(!showCalc)}
                  className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--color-primary-container)] hover:text-[var(--color-primary-container)]/80 transition-colors cursor-pointer">
                  <Calculator size={14} />
                  {showCalc ? 'Fechar Calculadora' : 'Abrir Calculadora'}
                </button>
                {showCalc && (
                  <div className="grid grid-cols-3 gap-1.5">
                    {['1','2','3','4','5','6','7','8','9','00','0','00x'].map((k) => (
                      <button key={k} type="button" onClick={() => handleDigit(k)}
                        className="h-9 rounded-lg bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] font-mono text-sm font-bold flex items-center justify-center active:scale-95 transition-transform cursor-pointer border border-[rgba(var(--overlay-rgb),0.1)]">
                        {k === '00x' ? '00' : k}
                      </button>
                    ))}
                    <button type="button" onClick={handleBackspace}
                      className="h-9 rounded-lg bg-[var(--color-error-container)]/15 text-[var(--color-error)] font-mono text-sm font-bold flex items-center justify-center active:scale-95 transition-transform cursor-pointer">
                      {'\u232B'}
                    </button>
                    <button type="button" onClick={handleClear}
                      className="h-9 rounded-lg bg-[var(--color-error-container)]/15 text-[var(--color-error)] font-mono text-xs font-bold flex items-center justify-center active:scale-95 transition-transform cursor-pointer">
                      C
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* PIX */}
            {formaPagamento === 'pix' && (
              <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-3 text-center">
                <QrCode size={36} className="mx-auto text-[var(--color-primary-container)] mb-1" />
                <p className="text-xs text-[var(--color-on-surface-variant)]">Aguardando pagamento via PIX</p>
                <p className="text-[10px] text-[var(--color-outline)] mt-0.5">Valor: R$ {total.toFixed(2)}</p>
              </div>
            )}

            {/* Parcelamento Cartão Crédito */}
            {formaPagamento === 'cartao_credito' && (
              <div>
                <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1">Parcelamento</label>
                <div className="flex gap-1 flex-wrap">
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(v => (
                    <button key={v} onClick={() => setParcelas(v)}
                      className={`px-2 h-8 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        parcelas === v
                          ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]'
                          : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'
                      }`}>
                      {v === 1 ? 'A vista' : `${v}x`}
                    </button>
                  ))}
                </div>
                {parcelas > 1 && (
                  <p className="mt-1 text-[10px] text-[var(--color-on-surface-variant)] font-mono">{parcelas}x de R$ {(total / parcelas).toFixed(2)}</p>
                )}
              </div>
            )}

            {/* Recebido */}
            {podeConfirmar && (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
                <span className="text-xs text-green-400 uppercase font-medium flex items-center gap-2"><Check size={12} /> Recebido</span>
                <span className="text-sm font-bold text-green-400 font-mono">R$ {(ehDinheiro ? recebido : total).toFixed(2)}</span>
              </div>
            )}

            {/* Botoes */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setShowPagamento(false)}
                disabled={finalizandoPagamento}
                className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-[rgba(var(--overlay-rgb),0.15)] text-[var(--color-on-surface-variant)] transition-colors cursor-pointer text-sm shrink-0 disabled:opacity-40"
              >
                <ArrowLeft size={16} /> Voltar
              </button>
              <button
                onClick={handleConfirmarPagamento}
                disabled={!podeConfirmar || finalizandoPagamento}
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg bg-[var(--color-primary-container)] text-[var(--color-on-primary)] font-bold text-sm uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {finalizandoPagamento ? (
                  <div className="w-4 h-4 border-2 border-[var(--color-on-primary)] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Receipt size={16} /> Confirmar</>
                )}
              </button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {loadingPedidos ? (
            <div className="flex items-center justify-center h-32">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[var(--color-primary-container)] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono text-[var(--color-outline)]">Carregando pedidos...</span>
              </div>
            </div>
          ) : pedidosMesa.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-[var(--color-outline)] text-sm gap-2">
              <CreditCard size={28} className="opacity-30" />
              <span>Nenhum pedido encontrado</span>
            </div>
          ) : (
            <>
              {/* Resumo */}
              <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)]">
                    Mesa {pagamentoMesa?.nome}
                  </span>
                  <span className="text-xs font-mono text-[var(--color-on-surface-variant)]">
                    {pedidosMesa.length} pedido(s)
                  </span>
                </div>
                {pedidosMesa.map((pedido) => (
                  <div key={pedido.id} className="flex justify-between items-center text-sm">
                    <span className="text-[var(--color-on-surface-variant)]">Pedido #{pedido.id}</span>
                    <span className="font-mono text-[var(--color-on-surface)]">R$ {pedido.total?.toFixed(2) || '0.00'}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-[rgba(255,255,255,0.06)]">
                  <span className="text-base font-bold text-[var(--color-on-surface)]">Total</span>
                  <span className="text-xl font-bold text-[var(--color-primary-container)] font-mono">R$ {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Dividir Conta */}
              <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 space-y-3">
                <button
                  type="button"
                  onClick={() => { setDividirConta(!dividirConta); setValorCustom(''); }}
                  className={`w-full flex items-center justify-between h-11 px-4 rounded-lg border transition-all cursor-pointer ${
                    dividirConta
                      ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] border-[var(--color-primary)]'
                      : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] border-[rgba(var(--overlay-rgb),0.08)] hover:bg-[var(--color-surface-container-highest)]'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium">
                    <Users size={16} /> Dividir Conta
                  </span>
                  <span className="text-[11px] font-mono">{dividirConta ? 'ON' : 'OFF'}</span>
                </button>

                {dividirConta && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1">Pessoas</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQtdPessoas(Math.max(2, qtdPessoas - 1))}
                          className="w-10 h-10 rounded-lg bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] font-bold text-lg flex items-center justify-center hover:bg-[var(--color-surface-container-highest)] transition-colors cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min={2}
                          max={20}
                          value={qtdPessoas}
                          onChange={e => setQtdPessoas(Math.max(2, Math.min(20, parseInt(e.target.value) || 2)))}
                          className="flex-1 h-10 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] text-center font-mono font-bold outline-none focus:border-[var(--color-primary-container)] transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setQtdPessoas(Math.min(20, qtdPessoas + 1))}
                          className="w-10 h-10 rounded-lg bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] font-bold text-lg flex items-center justify-center hover:bg-[var(--color-surface-container-highest)] transition-colors cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <span className="text-sm text-amber-400 uppercase font-medium">Por pessoa</span>
                      <span className="text-base font-bold text-amber-400 font-mono">R$ {valorPorPessoa.toFixed(2)}</span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1">Valor customizado por pessoa (opcional)</label>
                      <input
                        type="number"
                        min={0}
                        step="0.50"
                        value={valorCustom}
                        onChange={e => setValorCustom(e.target.value)}
                        placeholder="R$ 0,00"
                        className="w-full h-10 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] px-3 outline-none focus:border-[var(--color-primary-container)] transition-colors placeholder:text-[var(--color-outline)]"
                      />
                      {valorCustomNum > 0 && (
                        <p className="mt-1 text-[11px] text-[var(--color-on-surface-variant)] font-mono">
                          {Math.ceil(total / valorCustomNum)} pessoa(s) × R$ {valorCustomNum.toFixed(2)}
                        </p>
                      )}
                    </div>
</div>
            )}
          </div>

          {/* Taxas Opcionais */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-on-surface)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={chargeServiceFee}
                  onChange={(e) => { setChargeServiceFee(e.target.checked); if (!e.target.checked) setIsencaoMotivo(''); }}
                  className="w-5 h-5 rounded border-[rgba(255,255,255,0.2)] bg-[var(--color-surface-container-high)] text-[var(--color-primary-container)] focus:ring-2 focus:ring-[var(--color-primary-container)] cursor-pointer"
                />
                <span>Taxa de Serviço (10%)</span>
              </label>
              <span className="text-base font-bold text-[var(--color-primary-container)] font-mono">
                R$ {taxaServico.toFixed(2)}
              </span>
            </div>
            {!chargeServiceFee && (
              <input
                type="text"
                placeholder="Motivo da isenção (ex: Insatisfação, Gerência liberou)"
                value={isencaoMotivo}
                onChange={(e) => setIsencaoMotivo(e.target.value)}
                className="w-full h-10 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] px-3 outline-none focus:border-[var(--color-primary-container)] transition-colors placeholder:text-[var(--color-outline)]"
              />
            )}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-on-surface)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={chargeCover}
                  onChange={(e) => { setChargeCover(e.target.checked); if (!e.target.checked) setIsencaoMotivo(''); }}
                  className="w-5 h-5 rounded border-[rgba(255,255,255,0.2)] bg-[var(--color-surface-container-high)] text-[var(--color-primary-container)] focus:ring-2 focus:ring-[var(--color-primary-container)] cursor-pointer"
                />
                <span>Couvert Artístico</span>
              </label>
              <span className="text-base font-bold text-[var(--color-primary-container)] font-mono">
                R$ {valorCouvert.toFixed(2)}
              </span>
            </div>
            {!chargeCover && (
              <input
                type="text"
                placeholder="Motivo da isenção (ex: Chegou após o show, Não assistiu)"
                value={isencaoMotivo}
                onChange={(e) => setIsencaoMotivo(e.target.value)}
                className="w-full h-10 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] px-3 outline-none focus:border-[var(--color-primary-container)] transition-colors placeholder:text-[var(--color-outline)]"
              />
            )}
          </div>

          {/* Resumo Atualizado */}
          <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm text-[var(--color-on-surface-variant)]">
              <span>Subtotal</span><span className="font-mono">R$ {subtotal.toFixed(2)}</span>
            </div>
            {chargeServiceFee && (
              <div className="flex justify-between text-sm text-[var(--color-on-surface-variant)]">
                <span>Taxa de Serviço (10%)</span><span className="font-mono">+ R$ {taxaServico.toFixed(2)}</span>
              </div>
            )}
            {chargeCover && (
              <div className="flex justify-between text-sm text-[var(--color-on-surface-variant)]">
                <span>Couvert Artístico</span><span className="font-mono">+ R$ {valorCouvert.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-[rgba(255,255,255,0.06)]">
              <span className="text-base font-bold text-[var(--color-on-surface)]">Total a Pagar</span>
              <span className="text-xl font-bold text-[var(--color-primary)] font-mono">R$ {total.toFixed(2)}</span>
            </div>
          </div>
          </>
        )}
        </div>
      </Modal>

      {/* Modal Sucesso - Preview Cupom */}
      <Modal open={!!ultimoPagamento} onClose={() => setUltimoPagamento(null)} title="Pagamento Confirmado">
        {ultimoPagamento && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm text-green-400">
              <CheckCircle2 size={16} />
              <span>Pagamento registrado com sucesso!</span>
            </div>
            <div className="space-y-2 bg-[var(--color-surface-container-lowest)] rounded-xl p-4">
              <div className="flex justify-between items-center pt-2 border-t border-[rgba(var(--overlay-rgb),0.08)]">
                <span className="text-base font-bold text-[var(--color-on-surface)]">Total</span>
                <span className="text-xl font-bold text-[var(--color-primary)] font-mono">R$ {ultimoPagamento.total.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-[var(--color-on-surface-variant)]">Pagamento:</span>
                <Badge variant="primary">
                  {ultimoPagamento.forma_pagamento === 'dinheiro' ? 'DINHEIRO' :
                   ultimoPagamento.forma_pagamento === 'cartao_credito' ? 'CARTÃO DE CRÉDITO' :
                   ultimoPagamento.forma_pagamento === 'cartao_debito' ? 'CARTÃO DE DÉBITO' : 'PIX'}
                </Badge>
              </div>
            </div>

            {/* Preview do Cupom */}
            <div className="overflow-x-auto flex justify-center py-2">
              <Visualizador80mm
                itens={ultimoPagamento.itens.map((p: any) => ({ nome: `Pedido #${p.id}`, quantidade: 1, preco: p.total || 0 }))}
                subtotal={ultimoPagamento.subtotal}
                desconto={ultimoPagamento.desconto}
                taxa={ultimoPagamento.taxa}
                total={ultimoPagamento.total}
                forma_pagamento={ultimoPagamento.forma_pagamento}
                troco={ultimoPagamento.troco}
                mesa={ultimoPagamento.mesa}
                cliente={ultimoPagamento.cliente}
                vendedor={ultimoPagamento.vendedor}
                data={new Date().toISOString()}
                observacao={ultimoPagamento.observacao}
              />
            </div>

            <div className="pt-2">
              <CupomPrintActions
                onPrint={async () => {
                  if (!ultimoPagamento) return;
                  try {
                    await pdvService.imprimirCupom({
                      itens: ultimoPagamento.itens,
                      subtotal: ultimoPagamento.subtotal,
                      desconto: ultimoPagamento.desconto,
                      taxa: ultimoPagamento.taxa,
                      valor_final: ultimoPagamento.total,
                      forma_pagamento: ultimoPagamento.forma_pagamento,
                      mesa: ultimoPagamento.mesa,
                      cliente: ultimoPagamento.cliente,
                      vendedor: ultimoPagamento.vendedor,
                      observacao: ultimoPagamento.observacao,
                    });
                    toast.success('Cupom enviado para impressão!');
                  } catch {
                    toast.error('Erro ao enviar cupom para impressão');
                  }
                }}
                onClose={() => setUltimoPagamento(null)}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
