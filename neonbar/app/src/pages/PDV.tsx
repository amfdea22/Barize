import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Search, ShoppingCart, Plus, X, CheckCircle2, AlertCircle,
  Minus, Trash2, Banknote, CreditCard, QrCode, ArrowLeft, Check, Receipt,
  ChevronDown, ChevronUp, Users, Calculator, Bluetooth, Printer, Upload,
} from 'lucide-react';
import { toast } from '../components/Toast';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import Visualizador58mm from '../components/pdv/Visualizador58mm';
import { CupomPrintActions } from '../components/pdv/CupomPDV';
import { pdvService, mesasService, pedidosService, comandasNovoService, uploadService } from '../services/api';
import { bluetoothPrinter } from '../services/bluetoothPrinter';

interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  preco_venda: number;
  categoria: string;
  codigo_barras?: string;
  imagem?: string;
  foto_url?: string;
  ativo: boolean;
  tempo_preparo?: number;
}


interface ProdutoCreate {
  nome: string;
  descricao?: string;
  categoria: string;
  preco_venda: number;
  codigo_barras?: string;
  imagem?: string;
  foto_url?: string;
  tempo_preparo?: number;
}
interface CartItem {
  produto: Produto;
  quantidade: number;
}

type FormaPagamento = 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix';
type TipoPedido = 'consumo' | 'delivery' | 'levar' | 'retirada';

const TIPOS_PEDIDO: { key: TipoPedido; label: string; icon: string }[] = [
  { key: 'consumo', label: 'Consumo', icon: '\uD83C\uDF7D\uFE0F' },
  { key: 'delivery', label: 'Delivery', icon: '\uD83D\uDEF5' },
  { key: 'levar', label: 'Levar', icon: '\uD83D\uDECD\uFE0F' },
  { key: 'retirada', label: 'Retirada', icon: '\uD83D\uDCE6' },
];

const FORMAS_PAGAMENTO: { key: FormaPagamento; label: string; icon: typeof Banknote }[] = [
  { key: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { key: 'cartao_credito', label: 'CrÃ©dito', icon: CreditCard },
  { key: 'cartao_debito', label: 'DÃ©bito', icon: CreditCard },
  { key: 'pix', label: 'Pix', icon: QrCode },
];

function fmtValor(cents: number) {
  const str = String(cents).padStart(3, '0');
  return `R$ ${str.slice(0, -2)},${str.slice(-2)}`;
}

function TecladoNumerico({ onDigit, onBackspace, onClear }: { onDigit: (d: string) => void; onBackspace: () => void; onClear: () => void }) {
  const keys = ['1','2','3','4','5','6','7','8','9','00','0','00x'];
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {keys.map((k) => (
        <button key={k} type="button" onClick={() => onDigit(k)}
          className="h-11 rounded-lg bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] font-mono text-sm font-bold flex items-center justify-center active:scale-95 transition-transform cursor-pointer border border-[rgba(var(--overlay-rgb),0.1)]">
          {k === '00x' ? '00' : k}
        </button>
      ))}
      <button type="button" onClick={onBackspace}
        className="h-11 rounded-lg bg-[var(--color-error-container)]/15 text-[var(--color-error)] font-mono text-sm font-bold flex items-center justify-center active:scale-95 transition-transform cursor-pointer">
        {'\u232B'}
      </button>
      <button type="button" onClick={onClear}
        className="h-11 rounded-lg bg-[var(--color-error-container)]/15 text-[var(--color-error)] font-mono text-xs font-bold flex items-center justify-center active:scale-95 transition-transform cursor-pointer">
        C
      </button>
    </div>
  );
}
export default function PDV() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mesaParam = searchParams.get('mesa');
  const comandaParam = searchParams.get('comanda');
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categoriasSistema, setCategoriasSistema] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
  const [showCats, setShowCats] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [pedidoNome, setPedidoNome] = useState('');
  const [localPedido, setLocalPedido] = useState('');
  const [showNovoPedido, setShowNovoPedido] = useState(true);
  const [minimizedNovoPedido, setMinimizedNovoPedido] = useState(false);
  const [cliente, setCliente] = useState('');
  const [vendedor, setVendedor] = useState('');
  const [descontoPercentual, setDescontoPercentual] = useState(0);
  const [descontoTipo, setDescontoTipo] = useState<'percentual' | 'fixo'>('percentual');
  const [descontoValor, setDescontoValor] = useState(0);
  const [taxaServicoPercentual, setTaxaServicoPercentual] = useState(0);
  const [gorjetaPercentual, setGorjetaPercentual] = useState(0);
  const [couverValor, setCouverValor] = useState(0);
  const [tipoPedido, setTipoPedido] = useState<TipoPedido>('consumo');
  const [observacao, setObservacao] = useState('');
  const [mesas, setMesas] = useState<{ id: number; nome: string; ativo: boolean; local?: string }[]>([]);
  const [showPagamento, setShowPagamento] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('dinheiro');
  const [valorRecebido, setValorRecebido] = useState('');
  const [finalizando, setFinalizando] = useState(false);
  const [dividirConta, setDividirConta] = useState(false);
  const [qtdPessoas, setQtdPessoas] = useState(2);
  const [valorCustom, setValorCustom] = useState('');
  const [chargeServiceFee, setChargeServiceFee] = useState(true);
  const [chargeCover, setChargeCover] = useState(true);
  const [isencaoMotivo, setIsencaoMotivo] = useState('');
  const [mesasOcupadas, setMesasOcupadas] = useState<Set<string>>(new Set());
  const [ultimoPagamento, setUltimoPagamento] = useState<{
    itens: CartItem[]; subtotal: number; desconto: number; taxa: number;
    total: number; forma_pagamento: FormaPagamento; troco: number;
    mesa: string; cliente: string; vendedor: string; observacao: string;
  } | null>(null);
  const [showCalc, setShowCalc] = useState(false);
  const selectionAreaRef = useRef<HTMLDivElement>(null);
  const [highlightSelection, setHighlightSelection] = useState(false);
  const [pedidosExistentes, setPedidosExistentes] = useState<any[]>([]);
  const [showSelecionarPedido, setShowSelecionarPedido] = useState(false);
  const [mesaParamProcessada, setMesaParamProcessada] = useState(false);
  const [mesaParamLocal, setMesaParamLocal] = useState('');
  const [comandaAtiva, setComandaAtiva] = useState<{ id: number; numero: string } | null>(null);
  const [bluetoothConectado, setBluetoothConectado] = useState(false);
  const [nomeImpressora, setNomeImpressora] = useState('');

  const { usuario } = useAuth();
  const isAdminOrGerente = usuario ? ['admin', 'gerente'].includes(usuario.role) : false;

  // --- Product CRUD state ---
  const [showCrudModal, setShowCrudModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [crudSearch, setCrudSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState<ProdutoCreate>({
    nome: '', descricao: '', categoria: '', preco_venda: 0,
    codigo_barras: '', imagem: '', foto_url: '', tempo_preparo: undefined,
  });


  // --- Product CRUD handlers ---
  const resetCrudForm = () => {
    setForm({ nome: '', descricao: '', categoria: '', preco_venda: 0, codigo_barras: '', imagem: '', foto_url: '', tempo_preparo: undefined });
    setIsNewCategory(false);
    setCustomCategory('');
    setCreateError('');
    setUploading(false);
    setEditingProduct(null);
    setConfirmDelete(false);
    setShowCreateForm(false);
  };

  const handleCloseCrudModal = () => {
    setShowCrudModal(false);
    setShowCreateForm(false);
    resetCrudForm();
  };

  const handleCrudFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setCreateError('');
    try {
      const res = await uploadService.upload(file, 'produto');
      setForm(f => ({ ...f, foto_url: res.data.url }));
    } catch (err: any) {
      setCreateError('Falha no upload: ' + (err?.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleCrudSave = async () => {
    setCreateError('');
    if (!form.nome.trim()) { setCreateError('Nome e obrigatorio'); return; }
    if (form.preco_venda <= 0) { setCreateError('Preco deve ser maior que zero'); return; }
    const categoria = isNewCategory ? customCategory.trim() : form.categoria;
    if (!categoria) { setCreateError('Selecione ou crie uma categoria'); return; }
    setCreating(true);
    try {
      const data = { ...form, categoria };
      if (editingProduct) {
        await pdvService.atualizarProduto(editingProduct.id, data);
        toast.success('Produto atualizado!');
      } else {
        await pdvService.criarProduto(data);
        toast.success('Produto criado!');
      }
      handleCloseCrudModal();
      await carregarProdutos();
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setCreateError(err?.response?.data?.detail || 'Ja existe um produto com este nome ou codigo de barras');
      } else if (err?.response?.status === 403) {
        setCreateError(editingProduct ? 'Voce nao tem permissao para editar produtos' : 'Voce nao tem permissao para criar produtos');
      } else if (err?.response?.status === 404) {
        setCreateError('Produto foi removido por outro usuario. Atualize a lista.');
      } else {
        setCreateError(err?.response?.data?.detail || 'Erro ao salvar produto');
      }
    } finally {
      setCreating(false);
    }
  };

  const handleCrudDelete = async () => {
    if (!editingProduct) return;
    setDeleting(true);
    try {
      await pdvService.excluirProduto(editingProduct.id);
      toast.success('Produto excluido!');
      handleCloseCrudModal();
      await carregarProdutos();
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setCreateError('Produto foi removido por outro usuario.');
      } else if (err?.response?.status === 403) {
        setCreateError('Voce nao tem permissao para excluir produtos');
      } else {
        setCreateError(err?.response?.data?.detail || 'Erro ao excluir produto');
      }
    } finally {
      setDeleting(false);
    }
  };

  const conectarBluetooth = async () => {
    try {
      const conectou = await bluetoothPrinter.connect();
      if (conectou) {
        setBluetoothConectado(true);
        setNomeImpressora(bluetoothPrinter.getDeviceName());
        toast.success(`Impressora conectada: ${bluetoothPrinter.getDeviceName()}`);
      } else {
        toast.error('NÃ£o foi possÃ­vel conectar Ã  impressora');
      }
    } catch (err) {
      toast.error('Erro ao conectar Bluetooth');
    }
  };

  const desconectarBluetooth = () => {
    bluetoothPrinter.disconnect();
    setBluetoothConectado(false);
    setNomeImpressora('');
    toast.info('Impressora desconectada');
  };

  useEffect(() => {
    if (editingProduct) {
      setForm({
        nome: editingProduct.nome,
        descricao: editingProduct.descricao || '',
        categoria: editingProduct.categoria || '',
        preco_venda: editingProduct.preco_venda,
        codigo_barras: editingProduct.codigo_barras || '',
        imagem: editingProduct.imagem || '',
        foto_url: editingProduct.foto_url || '',
        tempo_preparo: editingProduct.tempo_preparo,
      });
      setIsNewCategory(false);
      setCreateError('');
    }
  }, [editingProduct]);

  const crudFiltered = useMemo(() => {
    if (!crudSearch) return produtos;
    const q = crudSearch.toLowerCase();
    return produtos.filter(p => p.nome.toLowerCase().includes(q) || (p.categoria || '').toLowerCase().includes(q));
  }, [produtos, crudSearch]);

  const carregarProdutos = async () => {
    try {
      const res = await pdvService.listarProdutos();
      setProdutos(res.data);
    } catch { setError('Erro ao carregar produtos'); }
  };

  useEffect(() => {
    Promise.all([
      carregarProdutos().catch(() => {}),
      pdvService.categorias().then((r: any) => setCategoriasSistema(r.data)).catch(() => {}),
      mesasService.listar({ ativo: 1 }).then((r: any) => setMesas(r.data?.mesas || r.data || [])).catch(() => {}),
      pedidosService.listarAtivos().then((r: any) => {
        const data = r.data;
        const pedidos = Array.isArray(data) ? data : [];
        const ocupadas = new Set<string>();
        pedidos.forEach((p: any) => {
          if (p.mesa && ['Novo', 'Preparando', 'Pronto', 'Entregue'].includes(p.status)) {
            ocupadas.add(p.mesa);
          }
        });
        setMesasOcupadas(ocupadas);
      }).catch(() => {}),
    ]).finally(() => setLoading(false));

    const interval = setInterval(() => {
      carregarProdutos().catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (mesaParam && !mesaParamProcessada && !loading) {
      setMesaParamProcessada(true);

      if (comandaParam) {
        setLocalPedido(mesaParam);
        setPedidoNome(`Comanda #${comandaParam}`);
        setShowNovoPedido(true);
        setMinimizedNovoPedido(false);
        setSearchParams({});
        return;
      }

      const buscarPedidosExistentes = async () => {
        try {
          const res = await pedidosService.listarAtivos();
          const pedidos = Array.isArray(res.data) ? res.data : [];
          const pedidosMesa = pedidos.filter((p: any) =>
            p.mesa === mesaParam && ['Novo', 'Preparando', 'Pronto', 'Entregue'].includes(p.status)
          );
          if (pedidosMesa.length > 0) {
            setPedidosExistentes(pedidosMesa);
            setShowSelecionarPedido(true);
          } else {
            setLocalPedido(mesaParam);
            setShowNovoPedido(true);
            setMinimizedNovoPedido(false);
          }
        } catch {
          setLocalPedido(mesaParam);
          setShowNovoPedido(true);
          setMinimizedNovoPedido(false);
        }
      };
      buscarPedidosExistentes();
    }
  }, [mesaParam, comandaParam, loading, mesaParamProcessada]);
  const isBalcao = (local: string) => {
    const l = (local || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/gu, '');
    return l.includes('balcao');
  };

  const mesasAtivas = mesas.filter(m => m.ativo);
  const mesasSalao = mesasAtivas.filter(m => !isBalcao(m.local || ''));
  const balcacoes = mesasAtivas.filter(m => isBalcao(m.local || ''));

  const categorias = useMemo(() => {
    const cats = new Set<string>();
    produtos.forEach(p => { if (p.categoria) cats.add(p.categoria); });
    categoriasSistema.forEach(c => cats.add(c));
    return ['all', ...Array.from(cats)];
  }, [produtos, categoriasSistema]);

  const filtered = useMemo(() => {
    return produtos.filter(p => {
      if (categoriaFilter !== 'all' && p.categoria !== categoriaFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return p.nome.toLowerCase().includes(q) || (p.categoria || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [produtos, categoriaFilter, search]);

  const addToCart = useCallback((produto: Produto) => {
    setCart(prev => {
      const existing = prev.find(item => item.produto.id === produto.id);
      if (existing) return prev.map(item => item.produto.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item);
      return [...prev, { produto, quantidade: 1 }];
    });
    toast.success(`${produto.nome} adicionado`);
  }, []);

  const handleProductClick = useCallback((produto: Produto) => {
    if (!localPedido) {
      selectionAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightSelection(true);
      setTimeout(() => setHighlightSelection(false), 3000);
      toast.info('Selecione a Mesa/BalcÃ£o e o Tipo de Pedido');
      return;
    }
    addToCart(produto);
  }, [localPedido, addToCart]);

  const removeFromCart = useCallback((produtoId: number) => {
    setCart(prev => prev.filter(item => item.produto.id !== produtoId));
  }, []);

  const changeQty = useCallback((produtoId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.produto.id !== produtoId) return item;
      const newQty = item.quantidade + delta;
      return newQty <= 0 ? null : { ...item, quantidade: newQty };
    }).filter(Boolean) as typeof prev);
  }, []);

  const qtyMap = useMemo(() => {
    const m: Record<number, number> = {};
    cart.forEach(item => { m[item.produto.id] = item.quantidade; });
    return m;
  }, [cart]);

  const subtotal = cart.reduce((sum, item) => sum + item.produto.preco_venda * item.quantidade, 0);
  const desconto = descontoTipo === 'percentual' ? subtotal * (descontoPercentual / 100) : descontoValor;
  const taxa = subtotal * (taxaServicoPercentual / 100);
  const gorjeta = subtotal * (gorjetaPercentual / 100);
  const taxaServicoAuto = chargeServiceFee ? subtotal * 0.10 : 0;
  const valorCouvertAuto = chargeCover ? 15.00 : 0;
  const total = subtotal + couverValor + gorjeta - desconto + taxa + taxaServicoAuto + valorCouvertAuto;
  const valorCustomNum = parseFloat(valorCustom) || 0;
  const valorPorPessoa = valorCustomNum > 0 ? valorCustomNum : (dividirConta ? total / qtdPessoas : total);

  const handleNovoPedido = () => {
    const tipoLabel = TIPOS_PEDIDO.find(t => t.key === tipoPedido)?.label || 'Pedido';
    setPedidoNome(tipoLabel);
    setShowNovoPedido(false);
  };

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

  const finalizeSale = async () => {
    if (cart.length === 0) return;
    setFinalizando(true); setError('');
    try {
      if (localPedido && tipoPedido === 'consumo') {
        let comandaId = comandaAtiva?.id;
        let numeroComanda = comandaAtiva?.numero;
        if (!comandaId) {
          const resComanda = await comandasNovoService.abrir({
            mesa: localPedido, cliente: cliente || undefined
          });
          comandaId = resComanda.data.id;
          numeroComanda = resComanda.data.numero;
          setComandaAtiva({ id: comandaId!, numero: resComanda.data.numero });
        }
        if (comandaId) {
          await comandasNovoService.adicionarItem(comandaId, cart.map(item => ({
            nome: item.produto.nome, quantidade: item.quantidade,
            preco: item.produto.preco_venda, observacao: undefined,
            categoria: item.produto.categoria
          })));
          await comandasNovoService.fechar(comandaId, {
            forma_pagamento: formaPagamento,
            desconto: descontoTipo === 'percentual' ? (subtotal * descontoPercentual / 100) : descontoValor,
            taxa_servico: taxaServicoPercentual > 0 ? (subtotal * taxaServicoPercentual / 100) : 0,
          });

          // ImpressÃ£o Bluetooth
          if (bluetoothConectado) {
            try {
              await bluetoothPrinter.imprimirComanda({
                comanda_numero: numeroComanda || '',
                mesa: localPedido,
                cliente: cliente || undefined,
                garcom: vendedor || undefined,
                itens: cart.map(item => ({
                  nome: item.produto.nome,
                  quantidade: item.quantidade,
                  observacao: undefined,
                })),
              });
              await bluetoothPrinter.imprimirFechamento({
                comanda_numero: numeroComanda || '',
                mesa: localPedido,
                cliente: cliente || undefined,
                atendente: vendedor || undefined,
                itens: cart.map(item => ({
                  nome: item.produto.nome,
                  quantidade: item.quantidade,
                  preco: item.produto.preco_venda,
                })),
                valor_bruto: subtotal,
                desconto: descontoTipo === 'percentual' ? (subtotal * descontoPercentual / 100) : descontoValor,
                taxa: taxaServicoPercentual > 0 ? (subtotal * taxaServicoPercentual / 100) : 0,
                valor_final: total,
                forma_pagamento: formaPagamento,
              });
            } catch (printErr) {
              console.error('Erro na impressÃ£o Bluetooth:', printErr);
            }
          }
        }
        toast.success('Comanda finalizada com sucesso!');
      } else {
        await pdvService.finalizarComanda(
          cart.map(item => ({ produto_id: item.produto.id, quantidade: item.quantidade })),
          { imprimir_comanda: true, observacao: observacao || undefined,
            mesa: localPedido || undefined, cliente: cliente || undefined,
            desconto_percentual: descontoTipo === 'percentual' ? descontoPercentual : 0,
            desconto_fixo: descontoTipo === 'fixo' ? descontoValor : 0,
            taxa_servico_percentual: taxaServicoPercentual,
            gorjeta_percentual: gorjetaPercentual, couver_valor: couverValor,
            tipo_pedido: tipoPedido, forma_pagamento: formaPagamento,
            vendedor: vendedor || undefined, },
        );
        toast.success('Venda finalizada com sucesso!');

        // Impressao direta via Bluetooth (se conectado)
        if (bluetoothPrinter.getConnectionStatus()) {
          try {
            await bluetoothPrinter.imprimirFechamento({
              comanda_numero: 'PDV',
              mesa: localPedido || 'BALCAO',
              cliente: cliente || undefined,
              atendente: vendedor || undefined,
              itens: cart.map(i => ({
                nome: i.produto.nome,
                quantidade: i.quantidade,
                preco: i.produto.preco_venda,
              })),
              valor_bruto: subtotal,
              desconto: desconto,
              taxa: taxa,
              valor_final: total,
              forma_pagamento: formaPagamento,
            });
            toast.success('Cupom impresso!');
          } catch (e) { console.error('Erro ao imprimir cupom:', e); }
        }
      }
      const taxaServicoAuto = chargeServiceFee ? subtotal * 0.10 : 0;
      setUltimoPagamento({ itens: [...cart], subtotal, desconto, taxa: taxa + taxaServicoAuto,
        total, forma_pagamento: formaPagamento,
        troco: ehDinheiro ? troco : 0, mesa: localPedido || '', cliente: cliente || '',
        vendedor: vendedor || '', observacao: observacao || '' });
      setCart([]); setPedidoNome(''); setLocalPedido(''); setCliente('');
      setDescontoPercentual(0); setDescontoValor(0); setTaxaServicoPercentual(0);
      setGorjetaPercentual(0); setCouverValor(0); setTipoPedido('consumo');
      setObservacao(''); setFormaPagamento('dinheiro'); setValorRecebido('');
      setShowPagamento(false); setComandaAtiva(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erro ao finalizar venda');
    } finally { setFinalizando(false); }
  };

  const handleAdicionarPedido = async () => {
    if (cart.length === 0) return;
    setFinalizando(true); setError('');
    try {
      if (localPedido && tipoPedido === 'consumo') {
        let comandaId = comandaAtiva?.id;
        if (!comandaId) {
          const resComanda = await comandasNovoService.abrir({
            mesa: localPedido, cliente: cliente || undefined
          });
          comandaId = resComanda.data.id;
          setComandaAtiva({ id: comandaId!, numero: resComanda.data.numero });
        }
        if (comandaId) {
          await comandasNovoService.adicionarItem(comandaId, cart.map(item => ({
            nome: item.produto.nome, quantidade: item.quantidade,
            preco: item.produto.preco_venda, observacao: undefined,
            categoria: item.produto.categoria
          })));
          toast.success(`Itens adicionados Ã  Comanda #${comandaAtiva?.numero || ''}`);
        }
      } else {
        await pdvService.finalizarComanda(
          cart.map(item => ({ produto_id: item.produto.id, quantidade: item.quantidade })),
          { imprimir_comanda: true, observacao: observacao || undefined,
            mesa: localPedido || undefined, cliente: cliente || undefined,
            desconto_percentual: 0, desconto_fixo: 0,
            taxa_servico_percentual: 0, gorjeta_percentual: 0, couver_valor: 0,
            tipo_pedido: tipoPedido, forma_pagamento: 'pendente',
            vendedor: vendedor || undefined, },
        );
        toast.success('Pedido adicionado com sucesso!');
      }
      setCart([]); setPedidoNome(''); setCliente('');
      setDescontoPercentual(0); setDescontoValor(0); setTaxaServicoPercentual(0);
      setGorjetaPercentual(0); setCouverValor(0); setTipoPedido('consumo');
      setObservacao(''); setFormaPagamento('dinheiro'); setValorRecebido('');
      setShowCart(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erro ao adicionar pedido');
    } finally { setFinalizando(false); }
  };

  const cartCount = cart.reduce((s, i) => s + i.quantidade, 0);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--color-primary-container)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[var(--color-outline)]">Carregando produtos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-[var(--color-background)]">
      <header className="safe-top border-b border-[rgba(var(--overlay-rgb),0.1)] bg-[rgba(var(--glass-rgb),0.6)] backdrop-blur-[12px]">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[rgba(0,229,255,0.2)] to-[rgba(0,218,243,0.1)] flex items-center justify-center border border-[var(--color-primary)]/30">
              <ShoppingCart size={20} className="text-[var(--color-primary-container)]" />
            </div>
            <div>
              <h1 className="text-lg font-black text-[var(--color-on-surface)] tracking-tight">PDV</h1>
              <div className="flex items-center gap-2">
                {pedidoNome && <span className="text-[8px] font-black uppercase tracking-[0.15em] text-[var(--color-on-surface-variant)]">{pedidoNome}</span>}
                {localPedido && (
                  <span className="text-[8px] font-mono text-[var(--color-primary-container)]">{isBalcao(localPedido) ? 'Balc' : 'Mesa'} {localPedido}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={bluetoothConectado ? desconectarBluetooth : conectarBluetooth}
              className={`p-2 rounded-lg transition-colors ${
                bluetoothConectado
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'
              }`}
              title={bluetoothConectado ? `Conectado: ${nomeImpressora}` : 'Conectar impressora Bluetooth'}
            >
              {bluetoothConectado ? <Printer size={18} /> : <Bluetooth size={18} />}
            </button>
            {isAdminOrGerente && (
            <button onClick={() => { resetCrudForm(); setShowCrudModal(true); }}
              className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-container-high)] text-[10px] font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)] cursor-pointer">
              Produtos
            </button>
            )}
            <button onClick={() => setShowNovoPedido(true)}
              className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-container-high)] text-[10px] font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)] cursor-pointer">
              Novo
            </button>
          </div>
        </div>
      </header>
      <div className="px-4 py-3 space-y-2 border-b border-[rgba(var(--overlay-rgb),0.06)] bg-[var(--color-surface)]/50">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" />
          <input type="text" placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full h-11 bg-[var(--color-surface-container-lowest)] border border-[rgba(var(--overlay-rgb),0.1)] rounded-lg pl-10 pr-4 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]/40 outline-none focus:border-[var(--color-primary-container)]/50 transition-colors" />
        </div>
        <button onClick={() => setShowCats(!showCats)}
          className="flex items-center justify-between w-full h-9 px-3 rounded-lg bg-[var(--color-surface-container-high)] text-[10px] font-bold uppercase tracking-wider text-[var(--color-on-surface-variant)] cursor-pointer">
          <span>Categorias {categoriaFilter !== 'all' ? `\u2022 ${categoriaFilter}` : ''}</span>
          {showCats ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {showCats && (
          <div className="flex gap-1.5 flex-wrap animate-fade-in">
            {categorias.map(cat => (
              <button key={cat} onClick={() => setCategoriaFilter(cat)}
                className={`px-3 h-8 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                  categoriaFilter === cat
                    ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]'
                    : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'
                }`}>
                {cat === 'all' ? 'Todos' : cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 mx-4 mt-3 px-3 py-2 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-sm text-[var(--color-error)]">
          <AlertCircle size={14} />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} className="cursor-pointer"><X size={14} /></button>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 pb-24 min-h-0">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-[var(--color-outline)] text-sm gap-2">
            <Search size={28} className="opacity-30" />
            <span>Nenhum produto encontrado</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(p => (
              <div key={p.id} onClick={() => handleProductClick(p)}
                className="group relative bg-[var(--color-surface-container)] border border-[rgba(var(--overlay-rgb),0.06)] active:scale-[0.96] transition-all cursor-pointer overflow-hidden">
                <div className="aspect-[4/3] bg-[var(--color-surface-container-high)] overflow-hidden">
                  {p.foto_url ? (
                    <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover group-active:scale-105 transition-transform duration-300" />
                  ) : p.imagem ? (
                    <div className="w-full h-full flex items-center justify-center text-3xl group-active:scale-110 transition-transform duration-300">{p.imagem}</div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingCart size={24} className="text-[var(--color-on-surface-variant)]/20" />
                    </div>
                  )}
                  {qtyMap[p.id] && qtyMap[p.id] > 0 && (
                    <div className="absolute top-2 left-2 min-w-[24px] h-6 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] flex items-center justify-center text-xs font-bold shadow-lg animate-fade-in px-1.5">
                      {qtyMap[p.id]}
                    </div>
                  )}
                </div>
                <div className="p-2.5 space-y-0.5">
                  <h3 className="text-sm font-semibold text-[var(--color-on-surface)] break-words leading-snug line-clamp-2">{p.nome}</h3>
                  <p className="text-sm font-bold text-[var(--color-primary)] font-mono">R$ {p.preco_venda.toFixed(2)}</p>
                  {p.categoria && (
                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-mono bg-[var(--color-primary)]/10 text-[var(--color-primary)]">{p.categoria}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-30 safe-bottom border-t border-[rgba(var(--overlay-rgb),0.1)] bg-[var(--color-surface)]">
        {cart.length > 0 ? (
          <div className="px-4 py-3">
            <button onClick={() => setShowCart(true)}
              className="w-full flex items-center justify-between h-12 px-4 rounded-xl bg-[var(--color-primary-container)] text-[var(--color-on-primary)] font-bold cursor-pointer active:scale-[0.98] transition-transform">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} />
                <span className="text-sm">{cartCount} {cartCount === 1 ? 'item' : 'itens'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono">R$ {total.toFixed(2)}</span>
                <ChevronUp size={16} />
              </div>
            </button>
          </div>
        ) : (
          <div className="px-4 py-3">
            <div className="flex items-center justify-center h-12 bg-[var(--color-surface-container-high)] text-[var(--color-outline)] text-sm gap-2">
              <ShoppingCart size={16} />
              <span>Carrinho vazio</span>
            </div>
          </div>
        )}
      </div>
      <Modal open={showCart} onClose={() => setShowCart(false)} title="Carrinho">
        <div className="space-y-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-[var(--color-outline)] text-sm gap-2">
              <ShoppingCart size={28} className="opacity-30" />
              <span>Carrinho vazio</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-[40vh] overflow-y-auto">
              {cart.map(item => (
                <div key={item.produto.id} className="flex items-center gap-3 p-3 bg-[var(--color-surface-container-high)] rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-on-surface)] break-words leading-snug">{item.produto.nome}</p>
                    <p className="text-xs text-[var(--color-on-surface-variant)] font-mono">R$ {item.produto.preco_venda.toFixed(2)} x {item.quantidade}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => changeQty(item.produto.id, -1)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] active:scale-95 transition-transform cursor-pointer">
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-mono text-[var(--color-on-surface)] font-bold">{item.quantidade}</span>
                    <button onClick={() => changeQty(item.produto.id, 1)}
                      className="w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] active:scale-95 transition-transform cursor-pointer">
                      <Plus size={14} />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.produto.id)}
                    className="w-9 h-9 flex items-center justify-center rounded-lg text-[var(--color-error)] active:scale-95 transition-transform cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-3 pt-2 border-t border-[rgba(var(--overlay-rgb),0.08)]">
            <div>
              <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1">Observacao</label>
              <input type="text" value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Observacao (opcional)"
                className="w-full h-10 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] px-3 outline-none focus:border-[var(--color-primary-container)] transition-colors placeholder:text-[var(--color-outline)]" />
            </div>
          </div>
          <div className="space-y-1 pt-2 border-t border-[rgba(var(--overlay-rgb),0.08)]">
            <div className="flex justify-between text-sm text-[var(--color-on-surface-variant)]">
              <span>Subtotal</span><span className="font-mono">R$ {subtotal.toFixed(2)}</span>
            </div>
            {couverValor > 0 && (
              <div className="flex justify-between text-sm text-[var(--color-on-surface-variant)]">
                <span>Couver</span><span className="font-mono">+ R$ {couverValor.toFixed(2)}</span>
              </div>
            )}
            {gorjeta > 0 && (
              <div className="flex justify-between text-sm text-amber-400">
                <span>Garcom ({gorjetaPercentual}%)</span><span className="font-mono">+ R$ {gorjeta.toFixed(2)}</span>
              </div>
            )}
            {desconto > 0 && (
              <div className="flex justify-between text-sm text-green-400">
                <span>Desconto</span><span className="font-mono">- R$ {desconto.toFixed(2)}</span>
              </div>
            )}
            {taxa > 0 && (
              <div className="flex justify-between text-sm text-[var(--color-on-surface-variant)]">
                <span>Taxa de servico</span><span className="font-mono">+ R$ {taxa.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2">
              <span className="text-base font-bold text-[var(--color-on-surface)]">Total</span>
              <span className="text-xl font-bold text-[var(--color-primary)] font-mono">R$ {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="pt-2">
            <button type="button"
              onClick={async () => {
                if (cart.length === 0) return;
                try {
                  // Tenta imprimir via Bluetooth
                  let btOk = bluetoothPrinter.getConnectionStatus();
                  if (!btOk) {
                    try {
                      btOk = await bluetoothPrinter.connect();
                    } catch { btOk = false; }
                  }
                  if (btOk) {
                    await bluetoothPrinter.imprimirFechamento({
                      comanda_numero: 'PDV',
                      mesa: localPedido || 'BALCAO',
                      cliente: cliente || undefined,
                      atendente: vendedor || undefined,
                      itens: cart.map(i => ({
                        nome: i.produto.nome,
                        quantidade: i.quantidade,
                        preco: i.produto.preco_venda,
                      })),
                      valor_bruto: subtotal,
                      desconto: desconto,
                      taxa: taxa,
                      valor_final: total,
                      forma_pagamento: 'A definir',
                    });
                    toast.success('Cupom impresso!');
                  } else {
                    toast.error('Impressora nao conectada');
                  }
                } catch (e) {
                  console.error('Erro ao imprimir cupom:', e);
                  toast.error('Erro ao imprimir cupom');
                }
              }}
              disabled={cart.length === 0}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] font-bold text-sm uppercase tracking-wider transition-all cursor-pointer active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed mb-2">
              <Printer size={16} />
              Imprimir Cupom
            </button>
            <button type="button"
              onClick={() => { setShowCart(false); setShowPagamento(true); }}
              disabled={cart.length === 0 || finalizando}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-[var(--color-primary-container)] text-[var(--color-on-primary)] font-bold text-sm uppercase tracking-wider transition-all cursor-pointer active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed">
              <Receipt size={16} />
              Pagamento
            </button>
            <button type="button"
              onClick={handleAdicionarPedido}
              disabled={cart.length === 0 || finalizando}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] font-bold text-sm uppercase tracking-wider transition-all cursor-pointer active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed mt-2">
              Adicionar Pedido
            </button>
          </div>
        </div>
      </Modal>
      <Modal open={showNovoPedido && !minimizedNovoPedido} onClose={() => setMinimizedNovoPedido(true)} onMinimize={() => setMinimizedNovoPedido(true)} title="Novo Pedido" minimizable>
        <div ref={selectionAreaRef} className={`space-y-5 pb-4 transition-all duration-300 ${highlightSelection ? 'ring-2 ring-[var(--color-primary-container)]/50 rounded-xl p-2 -m-2 bg-[var(--color-primary-container)]/5' : ''}`}>
          {highlightSelection && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-primary-container)]/10 border border-[var(--color-primary-container)]/30">
              <AlertCircle size={14} className="text-[var(--color-primary-container)] shrink-0" />
              <span className="text-[11px] font-mono text-[var(--color-primary-container)]">Selecione a Mesa/BalcÃ£o e o Tipo de Pedido antes de adicionar itens</span>
            </div>
          )}
          {mesasSalao.length > 0 && (
            <div>
              <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-2">Mesa</label>
              <div className="grid grid-cols-5 gap-1.5">
                {mesasSalao.map(m => {
                  const isOcupada = mesasOcupadas.has(m.nome);
                  return (
                    <button key={m.id} onClick={async () => {
                      if (isOcupada) {
                        try {
                          const res = await pedidosService.listarAtivos();
                          const pedidos = Array.isArray(res.data) ? res.data : [];
                          const pedidosMesa = pedidos.filter((p: any) =>
                            p.mesa === m.nome && ['Novo', 'Preparando', 'Pronto', 'Entregue'].includes(p.status)
                          );
                          if (pedidosMesa.length > 0) {
                            setPedidosExistentes(pedidosMesa);
                            setMesaParamLocal(m.nome);
                            setShowSelecionarPedido(true);
                          }
                        } catch {}
                        return;
                      }
                      setLocalPedido(localPedido === m.nome ? '' : m.nome);
                    }}
                      className={`aspect-square flex flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                        localPedido === m.nome
                          ? 'bg-[var(--color-primary-container)]/10 text-[var(--color-primary-container)] border border-[var(--color-primary)]/40'
                          : isOcupada
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] border border-transparent'
                      }`}>
                      {m.nome}
                      {isOcupada && <span className="text-[7px] text-amber-400/70">ocupada</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {balcacoes.length > 0 && (
            <div>
              <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-2">Balcao</label>
              <div className="grid grid-cols-5 gap-1.5">
                {balcacoes.map(m => (
                  <button key={m.id} onClick={() => setLocalPedido(localPedido === m.nome ? '' : m.nome)}
                    className={`aspect-square flex flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                      localPedido === m.nome
                        ? 'bg-[var(--color-primary-container)]/10 text-[var(--color-primary-container)] border border-[var(--color-primary)]/40'
                        : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] border border-transparent'
                    }`}>
                    {m.nome}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-2">Tipo de Pedido</label>
            <div className="grid grid-cols-4 gap-2">
              {TIPOS_PEDIDO.map(t => (
                <button key={t.key} type="button" onClick={() => {
                  if (t.key === 'delivery') {
                    navigate('/delivery');
                    setShowNovoPedido(false);
                    return;
                  }
                  setTipoPedido(t.key);
                }}
                  className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-all cursor-pointer ${
                    tipoPedido === t.key
                      ? 'bg-[var(--color-primary-container)]/10 text-[var(--color-primary-container)] border-[var(--color-primary)]/40'
                      : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] border-transparent'
                  }`}>
                  <span className="text-xl">{t.icon}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="pt-2">
            <button type="button" onClick={handleNovoPedido}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-xl bg-[var(--color-primary-container)] text-[var(--color-on-primary)] font-bold text-sm uppercase tracking-wider transition-all cursor-pointer active:scale-[0.98]">
              <Check size={18} />
              Iniciar Pedido
            </button>
          </div>
        </div>
      </Modal>
      <Modal open={showPagamento} onClose={() => !finalizando && setShowPagamento(false)} title="Pagamento"
        footer={
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-2">Forma de Pagamento</label>
              <div className="grid grid-cols-4 gap-2">
                {FORMAS_PAGAMENTO.map(f => {
                  const Icon = f.icon;
                  const active = formaPagamento === f.key;
                  return (
                    <button key={f.key} type="button"
                      onClick={() => { setFormaPagamento(f.key); setValorRecebido(''); }}
                      className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all cursor-pointer ${
                        active
                          ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] border-[var(--color-primary)]'
                          : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] border-transparent'
                      }`}>
                      <Icon size={20} />
                      <span className="text-[10px] font-medium">{f.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="bg-[var(--color-surface-container-lowest)] p-4 space-y-3">
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
                      <button type="button" onClick={() => setQtdPessoas(Math.max(2, qtdPessoas - 1))}
                        className="w-10 h-10 rounded-lg bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] font-bold text-lg flex items-center justify-center hover:bg-[var(--color-surface-container-highest)] transition-colors cursor-pointer">-</button>
                      <input type="number" min={2} max={20} value={qtdPessoas}
                        onChange={e => setQtdPessoas(Math.max(2, Math.min(20, parseInt(e.target.value) || 2)))}
                        className="flex-1 h-10 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] text-center font-mono font-bold outline-none focus:border-[var(--color-primary-container)] transition-colors" />
                      <button type="button" onClick={() => setQtdPessoas(Math.min(20, qtdPessoas + 1))}
                        className="w-10 h-10 rounded-lg bg-[var(--color-surface-container-high)] text-[var(--color-on-surface)] font-bold text-lg flex items-center justify-center hover:bg-[var(--color-surface-container-highest)] transition-colors cursor-pointer">+</button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
                    <span className="text-sm text-amber-400 uppercase font-medium">Por pessoa</span>
                    <span className="text-base font-bold text-amber-400 font-mono">R$ {valorPorPessoa.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
            {ehDinheiro && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-2">Valor Recebido</label>
                  <div className="bg-[var(--color-surface-container-lowest)] px-4 py-3 text-right text-lg font-bold font-mono text-[var(--color-on-surface)] h-12 flex items-center justify-end">
                    {valorRecebido ? fmtValor(parseInt(valorRecebido, 10)) : 'R$ 0,00'}
                  </div>
                </div>
                {troco > 0 && (
                  <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-green-500/10 border border-green-500/30">
                    <span className="text-sm text-green-400 uppercase font-medium">Troco</span>
                    <span className="text-base font-bold text-green-400 font-mono">R$ {troco.toFixed(2)}</span>
                  </div>
                )}
                <button type="button" onClick={() => setShowCalc(!showCalc)}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] text-xs font-medium cursor-pointer hover:bg-[var(--color-surface-container-highest)] transition-colors">
                  <Calculator size={14} />
                  {showCalc ? 'Fechar Calculadora' : 'Abrir Calculadora'}
                </button>
                {showCalc && <TecladoNumerico onDigit={handleDigit} onBackspace={handleBackspace} onClear={handleClear} />}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowPagamento(false)} disabled={finalizando}
                className="flex items-center justify-center gap-2 h-11 px-4 rounded-lg border border-[rgba(var(--overlay-rgb),0.15)] text-[var(--color-on-surface-variant)] transition-colors cursor-pointer text-sm shrink-0 disabled:opacity-40">
                <ArrowLeft size={16} /> Voltar
              </button>
              <button type="button" onClick={finalizeSale} disabled={!podeConfirmar || finalizando}
                className="flex-1 flex items-center justify-center gap-2 h-11 rounded-lg bg-[var(--color-primary-container)] text-[var(--color-on-primary)] font-bold text-sm uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                {finalizando ? (<><div className="w-4 h-4 border-2 border-[var(--color-on-primary)] border-t-transparent rounded-full animate-spin" /> Finalizando...</>) : (<><Receipt size={16} /> Confirmar</>)}
              </button>
            </div>
          </div>
        }>
        <div className="space-y-5">
          <div className="bg-[var(--color-surface-container-lowest)] p-4 space-y-2">
            <div className="flex justify-between text-sm text-[var(--color-on-surface-variant)]">
              <span>Subtotal</span><span className="font-mono">R$ {subtotal.toFixed(2)}</span>
            </div>
            {couverValor > 0 && (
              <div className="flex justify-between text-sm text-[var(--color-on-surface-variant)]">
                <span>Couver</span><span className="font-mono">+ R$ {couverValor.toFixed(2)}</span>
              </div>
            )}
            {gorjeta > 0 && (
              <div className="flex justify-between text-sm text-amber-400">
                <span>Garcom</span><span className="font-mono">+ R$ {gorjeta.toFixed(2)}</span>
              </div>
            )}
            {desconto > 0 && (
              <div className="flex justify-between text-sm text-green-400">
                <span>Desconto</span><span className="font-mono">- R$ {desconto.toFixed(2)}</span>
              </div>
            )}
            {taxa > 0 && (
              <div className="flex justify-between text-sm text-[var(--color-on-surface-variant)]">
                <span>Taxa de servico</span><span className="font-mono">+ R$ {taxa.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-[rgba(var(--overlay-rgb),0.08)]">
              <span className="text-base font-bold text-[var(--color-on-surface)]">Total</span>
              <span className="text-xl font-bold text-[var(--color-primary)] font-mono">R$ {total.toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">Vendedor</label>
                <input type="text" value={vendedor} onChange={e => setVendedor(e.target.value)} placeholder="Nome do vendedor"
                  className="w-full h-10 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] px-3 outline-none focus:border-[var(--color-primary-container)] transition-colors placeholder:text-[var(--color-outline)]" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">Cliente</label>
                <input type="text" value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Opcional"
                  className="w-full h-10 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] px-3 outline-none focus:border-[var(--color-primary-container)] transition-colors placeholder:text-[var(--color-outline)]" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase">Desconto</label>
                <button onClick={() => setDescontoTipo(descontoTipo === 'percentual' ? 'fixo' : 'percentual')}
                  className="text-[10px] font-mono text-[var(--color-primary-container)] hover:underline cursor-pointer flex items-center gap-1">
                  {descontoTipo === 'percentual' ? <>%</> : <>R$</>}
                </button>
              </div>
              <input type="number" min={0} max={descontoTipo === 'percentual' ? 100 : subtotal}
                value={descontoTipo === 'percentual' ? (descontoPercentual || '') : (descontoValor || '')}
                onChange={e => {
                  const val = parseFloat(e.target.value) || 0;
                  if (descontoTipo === 'percentual') setDescontoPercentual(Math.max(0, Math.min(100, val)));
                  else setDescontoValor(Math.max(0, Math.min(subtotal, val)));
                }}
                placeholder={descontoTipo === 'percentual' ? '0%' : 'R$ 0,00'}
                className="w-full h-10 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] px-3 outline-none focus:border-[var(--color-primary-container)] transition-colors placeholder:text-[var(--color-outline)]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1">Garcom %</label>
                <input type="number" min={0} max={50} value={gorjetaPercentual || ''}
                  onChange={e => setGorjetaPercentual(Math.max(0, Math.min(50, parseFloat(e.target.value) || 0)))}
                  placeholder="0%"
                  className="w-full h-10 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] px-3 outline-none focus:border-[var(--color-primary-container)] transition-colors placeholder:text-[var(--color-outline)]" />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1">Couver R$</label>
                <input type="number" min={0} step="0.50" value={couverValor || ''}
                  onChange={e => setCouverValor(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="R$ 0,00"
                  className="w-full h-10 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] px-3 outline-none focus:border-[var(--color-primary-container)] transition-colors placeholder:text-[var(--color-outline)]" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1">Taxa Servico %</label>
              <div className="flex gap-1.5">
                {[0, 8, 10].map(v => (
                  <button key={v} onClick={() => setTaxaServicoPercentual(v)}
                    className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      taxaServicoPercentual === v
                        ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]'
                        : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'
                    }`}>
                    {v === 0 ? 'Sem taxa' : `${v}%`}
                  </button>
))}
              </div>
            </div>
          </div>
          <div className="bg-[var(--color-surface-container-lowest)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-on-surface)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={chargeServiceFee}
                  onChange={(e) => { setChargeServiceFee(e.target.checked); if (!e.target.checked) setIsencaoMotivo(''); }}
                  className="w-5 h-5 rounded border-[rgba(255,255,255,0.2)] bg-[var(--color-surface-container-high)] text-[var(--color-primary-container)] focus:ring-2 focus:ring-[var(--color-primary-container)] cursor-pointer"
                />
                <span>Taxa de ServiÃ§o (10%)</span>
              </label>
              <span className="text-base font-bold text-[var(--color-primary-container)] font-mono">
                R$ {taxaServicoAuto.toFixed(2)}
              </span>
            </div>
            {!chargeServiceFee && (
              <input
                type="text"
                placeholder="Motivo da isenÃ§Ã£o (ex: InsatisfaÃ§Ã£o, GerÃªncia liberou)"
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
                <span>Couvert ArtÃ­stico</span>
              </label>
              <span className="text-base font-bold text-[var(--color-primary-container)] font-mono">
                R$ {valorCouvertAuto.toFixed(2)}
              </span>
            </div>
            {!chargeCover && (
              <input
                type="text"
                placeholder="Motivo da isenÃ§Ã£o (ex: Chegou apÃ³s o show, NÃ£o assistiu)"
                value={isencaoMotivo}
                onChange={(e) => setIsencaoMotivo(e.target.value)}
                className="w-full h-10 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] px-3 outline-none focus:border-[var(--color-primary-container)] transition-colors placeholder:text-[var(--color-outline)]"
              />
            )}
          </div>

          {/* Resumo Atualizado */}
          <div className="bg-[var(--color-surface-container-lowest)] p-4 space-y-2">
            <div className="flex justify-between text-sm text-[var(--color-on-surface-variant)]">
              <span>Subtotal</span><span className="font-mono">R$ {subtotal.toFixed(2)}</span>
            </div>
            {chargeServiceFee && (
              <div className="flex justify-between text-sm text-[var(--color-on-surface-variant)]">
                <span>Taxa de ServiÃ§o (10%)</span><span className="font-mono">+ R$ {taxaServicoAuto.toFixed(2)}</span>
              </div>
            )}
            {chargeCover && (
              <div className="flex justify-between text-sm text-[var(--color-on-surface-variant)]">
                <span>Couvert ArtÃ­stico</span><span className="font-mono">+ R$ {valorCouvertAuto.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-[rgba(255,255,255,0.06)]">
              <span className="text-base font-bold text-[var(--color-on-surface)]">Total a Pagar</span>
              <span className="text-xl font-bold text-[var(--color-primary)] font-mono">R$ {total.toFixed(2)}</span>
            </div>
        </div>
        </div>
      </Modal>
      <Modal open={!!ultimoPagamento} onClose={() => setUltimoPagamento(null)} title="Venda Finalizada">
        {ultimoPagamento && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm text-green-400">
              <CheckCircle2 size={16} />
              <span>Venda finalizada com sucesso!</span>
            </div>
            <div className="space-y-2 bg-[var(--color-surface-container-lowest)] p-4">
              <div className="flex justify-between text-sm text-[var(--color-on-surface-variant)]">
                <span>Subtotal</span><span className="font-mono">R$ {ultimoPagamento.subtotal.toFixed(2)}</span>
              </div>
              {ultimoPagamento.desconto > 0 && (
                <div className="flex justify-between text-sm text-green-400">
                  <span>Desconto</span><span className="font-mono">- R$ {ultimoPagamento.desconto.toFixed(2)}</span>
                </div>
              )}
              {ultimoPagamento.taxa > 0 && (
                <div className="flex justify-between text-sm text-[var(--color-on-surface-variant)]">
                  <span>Taxa</span><span className="font-mono">+ R$ {ultimoPagamento.taxa.toFixed(2)}</span>
                </div>
              )}
              {ultimoPagamento.troco > 0 && (
                <div className="flex justify-between text-sm text-amber-400">
                  <span>Troco</span><span className="font-mono">R$ {ultimoPagamento.troco.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-[rgba(var(--overlay-rgb),0.08)]">
                <span className="text-base font-bold text-[var(--color-on-surface)]">Total</span>
                <span className="text-xl font-bold text-[var(--color-primary)] font-mono">R$ {ultimoPagamento.total.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-[var(--color-on-surface-variant)]">Pagamento:</span>
                <Badge variant="primary">
                  {FORMAS_PAGAMENTO.find(f => f.key === ultimoPagamento.forma_pagamento)?.label || ultimoPagamento.forma_pagamento}
                </Badge>
              </div>
            </div>

            {/* Preview do Cupom */}
            <div className="overflow-x-auto flex justify-center py-2">
              <Visualizador58mm
                itens={ultimoPagamento.itens.map(i => ({ nome: i.produto.nome, quantidade: i.quantidade, preco: i.produto.preco_venda }))}
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
                    // Verifica/conecta Bluetooth automaticamente
                    let btOk = bluetoothPrinter.getConnectionStatus();
                    if (!btOk) {
                      // Tenta autoConnect (reconecta dispositivo ja autorizado)
                      btOk = await bluetoothPrinter.autoConnect();
                      if (!btOk) {
                        // Abre picker do navegador para novo pareamento
                        try {
                          btOk = await bluetoothPrinter.connect();
                        } catch (e) {
                          // Usuario cancelou ou erro no picker
                          console.log('[PDV] Connect cancelado ou falhou:', e);
                          btOk = false;
                        }
                      }
                      if (btOk) {
                        setBluetoothConectado(true);
                        setNomeImpressora(bluetoothPrinter.getDeviceName());
                      }
                    }

                    if (btOk) {
                      // Impressao direta via Bluetooth
                      await bluetoothPrinter.imprimirFechamento({
                        comanda_numero: 'PDV',
                        mesa: ultimoPagamento.mesa || 'BALCAO',
                        cliente: ultimoPagamento.cliente || undefined,
                        atendente: ultimoPagamento.vendedor || undefined,
                        itens: ultimoPagamento.itens.map(i => ({
                          nome: i.produto.nome,
                          quantidade: i.quantidade,
                          preco: i.produto.preco_venda,
                        })),
                        valor_bruto: ultimoPagamento.subtotal,
                        desconto: ultimoPagamento.desconto,
                        taxa: ultimoPagamento.taxa,
                        valor_final: ultimoPagamento.total,
                        forma_pagamento: ultimoPagamento.forma_pagamento,
                      });
                      toast.success('Cupom impresso!');
                    } else {
                      // Fallback: envia para API do servidor
                      await pdvService.imprimirCupom({
                        itens: ultimoPagamento.itens.map(i => ({
                          produto: i.produto.nome,
                          quantidade: i.quantidade,
                          preco_total: i.produto.preco_venda * i.quantidade,
                        })),
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
                      toast.success('Cupom enviado para impressao!');
                    }
                  } catch (err) {
                    console.error('Erro ao imprimir cupom:', err);
                    toast.error('Erro ao imprimir cupom');
                  }
                }}
                onClose={() => setUltimoPagamento(null)}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Selecionar Pedido Existente */}
      <Modal open={showSelecionarPedido} onClose={() => { setShowSelecionarPedido(false); setMesaParamLocal(''); setSearchParams({}); }} title={`Pedidos ativos â€” Mesa ${mesaParamLocal || mesaParam}`}>
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            Esta mesa ja possui pedido(s) ativo(s). O que deseja fazer?
          </p>
          {pedidosExistentes.map((p: any) => (
            <button
              key={p.id}
              onClick={() => {
                setShowSelecionarPedido(false);
                const mesa = mesaParamLocal || mesaParam || '';
                setMesaParamLocal('');
                setSearchParams({});
                setLocalPedido(mesa);
                setPedidoNome(p.numero_comanda || `Pedido #${p.id}`);
                setShowNovoPedido(false);
                setMinimizedNovoPedido(false);
                toast.info(`Adicionando itens ao Pedido #${p.id}`);
              }}
              className="w-full flex items-center justify-between p-4 rounded-xl bg-[var(--color-surface-container)] border border-[rgba(var(--overlay-rgb),0.06)] hover:bg-[var(--color-surface-container-high)] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  p.status === 'Novo' ? 'bg-cyan-400/15 text-cyan-400' :
                  p.status === 'Preparando' ? 'bg-amber-400/15 text-amber-400' :
                  p.status === 'Pronto' ? 'bg-emerald-400/15 text-emerald-400' :
                  'bg-gray-400/15 text-gray-400'
                }`}>
                  <Receipt size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-on-surface)]">
                    Pedido #{p.id}
                  </p>
                  <p className="text-[11px] text-[var(--color-on-surface-variant)]">
                    {p.numero_comanda ? `Comanda #${p.numero_comanda}` : 'Sem comanda'} â€” {p.status}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-[var(--color-primary-container)] bg-[var(--color-primary-container)]/10 px-2 py-1 rounded-full">
                + Itens
              </span>
            </button>
          ))}
          <button
            onClick={() => {
              setShowSelecionarPedido(false);
              const mesa = mesaParamLocal || mesaParam || '';
              setMesaParamLocal('');
              setSearchParams({});
              setLocalPedido(mesa);
              setPedidoNome('');
              setTipoPedido('consumo');
              setCliente('');
              setVendedor('');
              setObservacao('');
              setCart([]);
              setShowNovoPedido(true);
              setMinimizedNovoPedido(false);
            }}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-[var(--color-primary-container)]/30 text-[var(--color-primary-container)] hover:bg-[var(--color-primary-container)]/5 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            Novo pedido para esta mesa
          </button>
        </div>
      </Modal>

      {/* Floating button to reopen minimized Novo Pedido */}
      {minimizedNovoPedido && (
        <button
          onClick={() => setMinimizedNovoPedido(false)}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-3 rounded-2xl bg-[var(--color-primary-container)] text-[var(--color-on-primary)] font-bold text-sm shadow-lg hover:shadow-xl active:scale-95 transition-all cursor-pointer"
        >
          <ShoppingCart size={18} />
          Novo Pedido
        </button>
      )}

      {/* --- Modal: Gerenciar Produtos --- */}
      <Modal open={showCrudModal && !showCreateForm && !editingProduct} onClose={handleCloseCrudModal} title="Gerenciar Produtos">
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" />
            <input type="text" placeholder="Buscar produto..." value={crudSearch} onChange={e => setCrudSearch(e.target.value)}
              className="w-full h-10 bg-[var(--color-surface-container-lowest)] border border-[rgba(var(--overlay-rgb),0.1)] rounded-lg pl-10 pr-4 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]/40 outline-none focus:border-[var(--color-primary-container)]/50 transition-colors" />
          </div>

          {/* Product list */}
          <div className="max-h-[40vh] overflow-y-auto space-y-2">
            {crudFiltered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-24 text-[var(--color-outline)] text-sm gap-2">
                <ShoppingCart size={24} className="opacity-30" />
                <span>Nenhum produto encontrado</span>
              </div>
            ) : (
              crudFiltered.map(p => (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-[var(--color-surface-container-high)] rounded-lg">
                  <div className="flex-shrink-0 w-10 h-10 bg-[var(--color-surface-container)] rounded-lg overflow-hidden flex items-center justify-center">
                    {p.foto_url ? (
                      <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover" />
                    ) : p.imagem ? (
                      <span className="text-xl">{p.imagem}</span>
                    ) : (
                      <ShoppingCart size={16} className="text-[var(--color-on-surface-variant)]/20" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-on-surface)] truncate">{p.nome}</p>
                    <p className="text-xs text-[var(--color-on-surface-variant)] font-mono">R$ {p.preco_venda.toFixed(2)} {p.categoria ? "- " + p.categoria : ""}</p>
                  </div>
                  <button onClick={() => { setEditingProduct(p); setCrudSearch(''); setConfirmDelete(false); setCreateError(''); }}
                    className="px-3 py-1.5 rounded-lg bg-[var(--color-primary-container)]/15 text-[var(--color-primary-container)] text-xs font-bold cursor-pointer">
                    Editar
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Create new button */}
          <button onClick={() => { resetCrudForm(); setEditingProduct(null); setShowCreateForm(true); }}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-lg border border-dashed border-[var(--color-primary-container)]/30 text-[var(--color-primary-container)] text-sm font-medium cursor-pointer hover:bg-[var(--color-primary-container)]/5 transition-colors">
            <Plus size={16} />
            Novo Produto
          </button>
        </div>
      </Modal>

      {/* --- Modal: Criar/Editar Produto --- */}
      <Modal open={showCreateForm || !!editingProduct} onClose={handleCloseCrudModal}
        title={editingProduct ? 'Editar Produto' : 'Novo Produto'}>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">Nome</label>
            <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Mojito" required
              className="w-full h-10 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] px-3 outline-none focus:border-[var(--color-primary-container)] transition-colors placeholder:text-[var(--color-outline)]" />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">Descricao</label>
            <textarea value={form.descricao || ''} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Breve descricao..." rows={2}
              className="w-full rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] px-3 py-2 outline-none resize-none placeholder:text-[var(--color-on-surface-variant)]/40" />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">Categoria</label>
            <select value={isNewCategory ? '__new__' : form.categoria || ''} onChange={e => { if (e.target.value === '__new__') { setIsNewCategory(true); setForm(f => ({ ...f, categoria: '' })); } else { setIsNewCategory(false); setForm(f => ({ ...f, categoria: e.target.value })); } }}
              className="w-full h-10 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] px-3 outline-none">
              <option value="">Selecione...</option>
              {categorias.filter(c => c !== 'all').map(cat => (<option key={cat} value={cat}>{cat}</option>))}
              <option value="__new__">+ Nova Categoria</option>
            </select>
            {isNewCategory && (
              <input type="text" placeholder="Nome da nova categoria" value={customCategory} onChange={e => setCustomCategory(e.target.value)}
                className="w-full h-10 mt-2 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] px-3 outline-none focus:border-[var(--color-primary-container)] transition-colors placeholder:text-[var(--color-outline)]" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">Preco de Venda (R$)</label>
              <input type="number" step="0.01" min="0" value={form.preco_venda || ''} onChange={e => setForm(f => ({ ...f, preco_venda: parseFloat(e.target.value) || 0 }))} required
                className="w-full h-10 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] px-3 outline-none focus:border-[var(--color-primary-container)] transition-colors" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">Tempo de Preparo (min)</label>
              <input type="number" min="0" value={form.tempo_preparo || ''} onChange={e => setForm(f => ({ ...f, tempo_preparo: parseInt(e.target.value) || undefined }))}
                className="w-full h-10 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] px-3 outline-none focus:border-[var(--color-primary-container)] transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">Codigo de Barras</label>
            <input type="text" value={form.codigo_barras || ''} onChange={e => setForm(f => ({ ...f, codigo_barras: e.target.value }))} placeholder="Opcional"
              className="w-full h-10 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] px-3 outline-none focus:border-[var(--color-primary-container)] transition-colors placeholder:text-[var(--color-outline)]" />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">Emoji (fallback)</label>
            <input type="text" value={form.imagem || ''} onChange={e => setForm(f => ({ ...f, imagem: e.target.value }))} placeholder="Ex: {0x1F379}" maxLength={10}
              className="w-full h-10 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] px-3 outline-none focus:border-[var(--color-primary-container)] transition-colors placeholder:text-[var(--color-outline)]" />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">Foto do Produto</label>
            {form.foto_url ? (
              <div className="relative w-24 h-24">
                <img src={form.foto_url} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                <button onClick={() => setForm(f => ({ ...f, foto_url: '' }))}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--color-error)] rounded-full flex items-center justify-center text-white cursor-pointer">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-[rgba(var(--overlay-rgb),0.1)] rounded-lg cursor-pointer hover:border-[var(--color-primary)]/50 transition-colors">
                <Upload size={24} className="text-[var(--color-outline)]" />
                <span className="text-sm text-[var(--color-outline)]">{uploading ? 'Enviando...' : 'Clique para fazer upload'}</span>
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleCrudFileSelect} />
              </label>
            )}
          </div>

          {createError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-sm text-[var(--color-error)]">
              <AlertCircle size={14} />
              <span>{createError}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-[rgba(var(--overlay-rgb),0.08)]">
            <div>
              {editingProduct && !confirmDelete && (
                <button onClick={() => setConfirmDelete(true)} className="text-sm text-[var(--color-error)] hover:underline cursor-pointer">Excluir</button>
              )}
              {confirmDelete && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-error)]">Confirmar exclusao?</span>
                  <button onClick={() => setConfirmDelete(false)} className="text-xs text-[var(--color-on-surface-variant)] hover:underline cursor-pointer">Cancelar</button>
                  <button onClick={handleCrudDelete} disabled={deleting} className="text-xs text-white bg-[var(--color-error)] px-3 py-1 rounded-lg cursor-pointer disabled:opacity-50">
                    {deleting ? 'Excluindo...' : 'Sim, Excluir'}
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleCloseCrudModal} className="text-sm text-[var(--color-on-surface-variant)] hover:underline cursor-pointer">Cancelar</button>
              <button onClick={handleCrudSave} disabled={creating || uploading}
                className="h-10 px-4 rounded-lg bg-[var(--color-primary-container)] text-[var(--color-on-primary)] font-bold text-sm cursor-pointer disabled:opacity-50">
                {creating ? 'Salvando...' : (editingProduct ? 'Salvar' : 'Criar Produto')}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

