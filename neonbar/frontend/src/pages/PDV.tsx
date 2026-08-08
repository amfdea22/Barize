import { useState, useEffect, useMemo } from 'react';
import { Search, ShoppingCart, Plus, X, CheckCircle2, AlertCircle, Upload, Printer } from 'lucide-react';
import { pdvService, uploadService } from '../services/api';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Input from '../components/Input';
import SegmentedControl from '../components/SegmentedControl';
import ProdutoCardPDV from '../components/pdv/ProdutoCardPDV';
import CarrinhoPDV from '../components/pdv/CarrinhoPDV';
import SeletorMesa, { MesaBadge } from '../components/pdv/SeletorMesa';
import SeletorVendedor from '../components/pdv/SeletorVendedor';
import PainelPagamento from '../components/pdv/PainelPagamento';
import { CupomPrintActions } from '../components/pdv/CupomPDV';
import Visualizador80mm from '../components/pdv/Visualizador80mm';
import type { CartItem, FormaPagamento } from '../components/pdv/types';
import { useAuth } from '../hooks/useAuth';
import { useMesas } from '../hooks/useMesas';
import type { Produto, ProdutoCreate } from '../types';

export default function PDV() {
  const { usuario } = useAuth();
  const { mesas } = useMesas();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Busca e filtro
  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');

  // Carrinho
  const [cart, setCart] = useState<CartItem[]>([]);

  // Parâmetros da venda
  const [mesa, setMesa] = useState('');
  const [cliente, setCliente] = useState('');
  const [vendedor, setVendedor] = useState('');
  const [descontoPercentual, setDescontoPercentual] = useState(0);
  const [taxaServicoPercentual, setTaxaServicoPercentual] = useState(0);
  const [observacao, setObservacao] = useState('');

  // Fluxo de pagamento
  const [showPagamento, setShowPagamento] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  // Resultado / cupom
  const [ultimoPagamento, setUltimoPagamento] = useState<{
    itens: CartItem[];
    subtotal: number;
    desconto: number;
    taxa: number;
    total: number;
    forma_pagamento: FormaPagamento;
    troco: number;
    mesa: string;
    cliente: string;
    vendedor: string;
    observacao: string;
  } | null>(null);

  // Modal produto (criar/editar)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [form, setForm] = useState<ProdutoCreate>({
    nome: '', descricao: '', categoria: '', preco_venda: 0,
    codigo_barras: '', imagem: '', foto_url: '', tempo_preparo: undefined,
  });
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Atalho de busca: tecla "/"
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target as HTMLElement)?.closest?.('input, textarea, select')) {
        e.preventDefault();
        document.getElementById('pdv-busca')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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

  const carregarProdutos = () => pdvService.listarProdutos().then(res => setProdutos(res.data));

  useEffect(() => {
    carregarProdutos()
      .then(() => setLoading(false))
      .catch(() => { setError('Erro ao carregar produtos'); setLoading(false); });
  }, []);

  const categorias = useMemo(() => {
    const cats = new Set(produtos.map(p => p.categoria).filter(Boolean));
    return ['all', ...Array.from(cats)] as string[];
  }, [produtos]);

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

  const addToCart = (produto: Produto) => {
    setCart(prev => {
      const existing = prev.find(item => item.produto.id === produto.id);
      if (existing) return prev.map(item => item.produto.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item);
      return [...prev, { produto, quantidade: 1 }];
    });
  };

  const removeFromCart = (produtoId: number) => setCart(prev => prev.filter(item => item.produto.id !== produtoId));

  const changeQty = (produtoId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.produto.id !== produtoId) return item;
      const newQty = item.quantidade + delta;
      return newQty <= 0 ? null : { ...item, quantidade: newQty };
    }).filter(Boolean) as typeof cart);
  };

  const qtyMap = useMemo(() => {
    const m: Record<number, number> = {};
    cart.forEach(item => { m[item.produto.id] = item.quantidade; });
    return m;
  }, [cart]);

  // ─── Cálculos ───
  const subtotal = cart.reduce((sum, item) => sum + item.produto.preco_venda * item.quantidade, 0);
  const desconto = subtotal * (descontoPercentual / 100);
  const taxa = subtotal * (taxaServicoPercentual / 100);
  const total = subtotal - desconto + taxa;

  const handleConfirmarPagamento = (payload: {
    forma_pagamento: FormaPagamento;
    valor_recebido: number;
    troco: number;
    parcelas: number;
  }) => {
    finalizeSale(payload);
  };

  const finalizeSale = async (payload: {
    forma_pagamento: FormaPagamento;
    valor_recebido: number;
    troco: number;
    parcelas: number;
  }) => {
    if (cart.length === 0) return;
    setFinalizando(true);
    setError('');
    try {
      const res = await pdvService.finalizarComanda(
        cart.map(item => ({ produto_id: item.produto.id, quantidade: item.quantidade })),
        {
          imprimir_comanda: true,
          observacao: observacao || undefined,
          mesa: mesa || undefined,
          cliente: cliente || undefined,
          desconto_percentual: descontoPercentual,
          taxa_servico_percentual: taxaServicoPercentual,
          forma_pagamento: payload.forma_pagamento,
          vendedor: vendedor || usuario?.nome || undefined,
        },
      );

      const resultado = res.data?.resultado || res.data;
      setUltimoPagamento({
        itens: cart,
        subtotal,
        desconto,
        taxa,
        total: resultado?.valor_final ?? total,
        forma_pagamento: payload.forma_pagamento,
        troco: payload.troco,
        mesa,
        cliente,
        vendedor: vendedor || usuario?.nome || '',
        observacao,
      });
      setCart([]);
      setMesa('');
      setCliente('');
      setDescontoPercentual(0);
      setTaxaServicoPercentual(0);
      setObservacao('');
      setShowPagamento(false);
    } catch (err: any) {
      setShowPagamento(false);
      setError(err?.response?.data?.detail || 'Erro ao finalizar venda');
    } finally {
      setFinalizando(false);
    }
  };

  // ─── Modal Produto (criar/editar) ───
  const resetForm = () => {
    setForm({ nome: '', descricao: '', categoria: '', preco_venda: 0, codigo_barras: '', imagem: '', foto_url: '', tempo_preparo: undefined });
    setIsNewCategory(false);
    setCustomCategory('');
    setCreateError('');
    setUploading(false);
    setEditingProduct(null);
    setConfirmDelete(false);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!editingProduct) return;
    setDeleting(true);
    try {
      await pdvService.excluirProduto(editingProduct.id);
      handleCloseModal();
      await carregarProdutos();
    } catch (err: any) {
      if (err?.response?.status === 404) {
        setCreateError('Produto foi removido por outro usuário. Atualize a lista.');
      } else if (err?.response?.status === 403) {
        setCreateError('Você não tem permissão para excluir produtos');
      } else {
        setCreateError(err?.response?.data?.detail || 'Erro ao excluir produto');
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setCreateError('');
    try {
      const res = await uploadService.uploadImagem(file);
      setForm(f => ({ ...f, foto_url: res.data.url }));
    } catch (err: any) {
      setCreateError('Falha no upload: ' + (err?.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setCreateError('');
    if (!form.nome.trim()) { setCreateError('Nome é obrigatório'); return; }
    if (form.preco_venda <= 0) { setCreateError('Preço deve ser maior que zero'); return; }
    const categoria = isNewCategory ? customCategory.trim() : form.categoria;
    if (!categoria) { setCreateError('Selecione ou crie uma categoria'); return; }

    setCreating(true);
    try {
      const data = { ...form, categoria };
      if (editingProduct) {
        await pdvService.atualizarProduto(editingProduct.id, data);
      } else {
        await pdvService.criarProduto(data);
      }
      setShowCreateModal(false);
      resetForm();
      await carregarProdutos();
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setCreateError(err?.response?.data?.detail || 'Já existe um produto com este nome ou código de barras');
      } else if (err?.response?.status === 403) {
        setCreateError(editingProduct ? 'Você não tem permissão para editar produtos' : 'Você não tem permissão para criar produtos');
      } else if (err?.response?.status === 404) {
        setCreateError('Produto foi removido por outro usuário. Atualize a lista.');
      } else {
        setCreateError(err?.response?.data?.detail || 'Erro ao salvar produto');
      }
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--color-primary-container)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[var(--color-outline)]">Carregando produtos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full gap-lg p-lg">
      {/* ─── Painel de Produtos ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-md mb-lg flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search size={18} className="absolute left-sm top-1/2 -translate-y-1/2 text-[var(--color-outline)]" />
            <input
              id="pdv-busca"
              type="text"
              placeholder="Buscar produto... ( / )"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[var(--color-surface-container-lowest)] border border-[rgba(var(--overlay-rgb),0.1)] rounded-lg pl-xl pr-md py-xs text-body-md focus:border-[var(--color-primary)]/50 outline-none text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]/40 transition-colors"
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {categorias.map(cat => (
              <button key={cat} onClick={() => setCategoriaFilter(cat)}
                className={`px-md h-[44px] rounded-lg text-label-sm transition-all cursor-pointer ${
                  categoriaFilter === cat
                    ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]'
                    : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]'
                }`}>
                {cat === 'all' ? 'Todos' : cat}
              </button>
            ))}
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)} icon={<Plus size={16} />}>
            Novo Produto
          </Button>
        </div>

        {error && (
          <div className="flex items-center gap-sm px-md py-sm rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-body-md text-[var(--color-error)] mb-lg" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-md">
            {filtered.map(p => (
              <ProdutoCardPDV key={p.id} produto={p} quantidade={qtyMap[p.id] || 0} onAdd={addToCart} onEdit={setEditingProduct} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-[var(--color-outline)] text-sm gap-2">
              <Search size={28} className="opacity-30" />
              <span>Nenhum produto encontrado</span>
            </div>
          )}
        </div>
      </div>

      {/* ─── Painel de Venda ─── */}
      <div className="w-[360px] xl:w-[400px] shrink-0 bg-[var(--color-surface-container)] rounded-xl border border-[rgba(var(--overlay-rgb),0.06)] flex flex-col">
        <div className="p-lg border-b border-[rgba(var(--overlay-rgb),0.06)] space-y-md">
          <h2 className="text-headline-md font-bold text-[var(--color-on-surface)] flex items-center gap-2">
            <ShoppingCart size={20} /> Venda
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <SeletorMesa mesas={mesas.map(m => m.nome)} value={mesa} onChange={setMesa} />
            <MesaBadge value={mesa} />
          </div>
          <SeletorVendedor value={vendedor} onChange={setVendedor} defaultName={usuario?.nome || ''} />
          <div>
            <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1.5">Cliente</label>
            <input
              type="text"
              value={cliente}
              onChange={e => setCliente(e.target.value)}
              placeholder="Nome do cliente (opcional)"
              className="w-full h-10 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] px-3 outline-none focus:border-[var(--color-primary-container)] transition-colors placeholder:text-[var(--color-outline)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-lg space-y-3 min-h-0">
          <CarrinhoPDV itens={cart} onIncrement={(id) => changeQty(id, 1)} onDecrement={(id) => changeQty(id, -1)} onRemove={removeFromCart} />
        </div>

        <div className="p-lg border-t border-[rgba(var(--overlay-rgb),0.06)] space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1">Desconto %</label>
              <input
                type="number"
                min={0}
                max={100}
                value={descontoPercentual || ''}
                onChange={e => setDescontoPercentual(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                placeholder="0"
                className="w-full h-10 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] px-3 outline-none focus:border-[var(--color-primary-container)] transition-colors placeholder:text-[var(--color-outline)]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1">Taxa Serv. %</label>
              <input
                type="number"
                min={0}
                max={30}
                value={taxaServicoPercentual || ''}
                onChange={e => setTaxaServicoPercentual(Math.max(0, Math.min(30, parseFloat(e.target.value) || 0)))}
                placeholder="0"
                className="w-full h-10 rounded-lg bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] px-3 outline-none focus:border-[var(--color-primary-container)] transition-colors placeholder:text-[var(--color-outline)]"
              />
            </div>
          </div>

          <SegmentedControl
            options={[
              { value: '0', label: 'Sem taxa' },
              { value: '8', label: '8%' },
              { value: '10', label: '10%' },
            ]}
            value={String(taxaServicoPercentual)}
            onChange={v => setTaxaServicoPercentual(Number(v))}
          />

          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-body-md text-[var(--color-on-surface-variant)]">
              <span>Subtotal</span>
              <span className="font-mono">R$ {subtotal.toFixed(2)}</span>
            </div>
            {desconto > 0 && (
              <div className="flex items-center justify-between text-body-md text-green-400">
                <span>Desconto</span>
                <span className="font-mono">- R$ {desconto.toFixed(2)}</span>
              </div>
            )}
            {taxa > 0 && (
              <div className="flex items-center justify-between text-body-md text-[var(--color-on-surface-variant)]">
                <span>Taxa de serviço</span>
                <span className="font-mono">+ R$ {taxa.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-headline-md font-bold text-[var(--color-on-surface)]">Total</span>
              <span className="text-data-display font-bold text-[var(--color-primary)]">R$ {total.toFixed(2)}</span>
            </div>
          </div>

          <Button className="w-full h-12" onClick={() => setShowPagamento(true)} disabled={cart.length === 0}>
            Finalizar Venda
          </Button>
        </div>
      </div>

      {/* ─── Modal: Pagamento ─── */}
      <Modal open={showPagamento} onClose={() => setShowPagamento(false)} title="Pagamento" size="lg">
        <PainelPagamento
          total={subtotal}
          desconto={desconto}
          taxa={taxa}
          valorFinal={total}
          onConfirm={handleConfirmarPagamento}
          onCancel={() => setShowPagamento(false)}
        />
        {finalizando && (
          <div className="mt-3 flex items-center justify-center gap-2 text-label-md text-[var(--color-on-surface-variant)]">
            <div className="w-4 h-4 border-2 border-[var(--color-primary-container)] border-t-transparent rounded-full animate-spin" />
            Finalizando venda...
          </div>
        )}
      </Modal>

      {/* ─── Modal: Cupom (sucesso) ─── */}
      <Modal open={!!ultimoPagamento} onClose={() => setUltimoPagamento(null)} title="Venda Finalizada" size="lg">
        {ultimoPagamento && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
            <div className="space-y-md">
              <div className="flex items-center gap-2 px-md py-sm rounded-lg bg-green-500/10 border border-green-500/30 text-body-md text-green-400">
                <CheckCircle2 size={16} />
                <span>Venda finalizada com sucesso!</span>
              </div>
              <div className="space-y-1 bg-[var(--color-surface-container-lowest)] rounded-xl p-4">
                <div className="flex justify-between text-body-md text-[var(--color-on-surface-variant)]">
                  <span>Subtotal</span>
                  <span className="font-mono">R$ {ultimoPagamento.subtotal.toFixed(2)}</span>
                </div>
                {ultimoPagamento.desconto > 0 && (
                  <div className="flex justify-between text-body-md text-green-400">
                    <span>Desconto</span>
                    <span className="font-mono">- R$ {ultimoPagamento.desconto.toFixed(2)}</span>
                  </div>
                )}
                {ultimoPagamento.taxa > 0 && (
                  <div className="flex justify-between text-body-md text-[var(--color-on-surface-variant)]">
                    <span>Taxa</span>
                    <span className="font-mono">+ R$ {ultimoPagamento.taxa.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-[rgba(var(--overlay-rgb),0.08)]">
                  <span className="text-headline-md font-bold text-[var(--color-on-surface)]">Total</span>
                  <span className="text-data-display font-bold text-[var(--color-primary)]">R$ {ultimoPagamento.total.toFixed(2)}</span>
                </div>
              </div>
              <CupomPrintActions
                onPrint={() => window.print()}
                onClose={() => setUltimoPagamento(null)}
              />
              <p className="text-[10px] font-mono text-[var(--color-outline)] text-center">Dica: Ctrl+P imprime o cupom 80mm</p>
            </div>

            <div className="bg-[var(--color-surface-container-lowest)] rounded-xl p-md">
              <div className="flex items-center justify-between mb-sm">
                <span className="text-label-md text-[var(--color-on-surface-variant)] uppercase">Preview Cupom 80mm</span>
                <Printer size={16} className="text-[var(--color-outline)]" />
              </div>
              <div className="overflow-x-auto flex justify-center">
                <Visualizador80mm {...ultimoPagamento} data={new Date().toISOString()} />
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Modal: Novo Produto / Editar Produto ─── */}
      <Modal open={showCreateModal || !!editingProduct} onClose={handleCloseModal} title={editingProduct ? 'Editar Produto' : 'Novo Produto'} size="lg">
        <div className="space-y-4">
          <Input label="Nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Mojito" required />

          <div>
            <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-2">Descrição</label>
            <textarea value={form.descricao || ''} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Breve descrição do produto..." rows={2} className="w-full bg-[var(--color-surface-low)] border border-[rgba(var(--overlay-rgb),0.1)] rounded-lg text-sm text-[var(--color-on-surface)] px-3 py-2 outline-none resize-none placeholder:text-[var(--color-on-surface-variant)]/40" />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-2">Categoria</label>
            <select value={isNewCategory ? '__new__' : form.categoria || ''} onChange={e => { if (e.target.value === '__new__') { setIsNewCategory(true); setForm(f => ({ ...f, categoria: '' })); } else { setIsNewCategory(false); setForm(f => ({ ...f, categoria: e.target.value })); } }}
              className="w-full bg-[var(--color-surface-low)] border border-[rgba(var(--overlay-rgb),0.1)] rounded-lg text-sm text-[var(--color-on-surface)] px-3 py-2 outline-none">
              <option value="">Selecione...</option>
              {categorias.filter(c => c !== 'all').map(cat => (<option key={cat} value={cat}>{cat}</option>))}
              <option value="__new__">+ Nova Categoria</option>
            </select>
            {isNewCategory && (
              <Input placeholder="Nome da nova categoria" value={customCategory} onChange={e => setCustomCategory(e.target.value)} className="mt-2" />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input label="Preço de Venda (R$)" type="number" step="0.01" min="0" value={form.preco_venda || ''} onChange={e => setForm(f => ({ ...f, preco_venda: parseFloat(e.target.value) || 0 }))} required />
            <Input label="Tempo de Preparo (min)" type="number" min="0" value={form.tempo_preparo || ''} onChange={e => setForm(f => ({ ...f, tempo_preparo: parseInt(e.target.value) || undefined }))} />
          </div>

          <Input label="Código de Barras" value={form.codigo_barras || ''} onChange={e => setForm(f => ({ ...f, codigo_barras: e.target.value }))} placeholder="Opcional" />

          <Input label="Emoji (fallback)" value={form.imagem || ''} onChange={e => setForm(f => ({ ...f, imagem: e.target.value }))} placeholder="Ex: 🍹" maxLength={10} />

          <div>
            <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-2">Foto do Produto</label>
            {form.foto_url ? (
              <div className="relative w-32 h-32">
                <img src={form.foto_url} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                <button onClick={() => setForm(f => ({ ...f, foto_url: '' }))}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-[var(--color-error)] rounded-full flex items-center justify-center text-white hover:bg-[var(--color-error)]/80 transition-colors cursor-pointer">
                  <X size={12} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-[rgba(var(--overlay-rgb),0.1)] rounded-lg cursor-pointer hover:border-[var(--color-primary)]/50 transition-colors">
                <Upload size={24} className="text-[var(--color-outline)]" />
                <span className="text-sm text-[var(--color-outline)]">
                  {uploading ? 'Enviando...' : 'Clique para fazer upload da imagem'}
                </span>
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={handleFileSelect} />
              </label>
            )}
          </div>

          {createError && (
            <div className="flex items-center gap-sm px-md py-sm rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-sm text-[var(--color-error)]" role="alert">
              <AlertCircle size={14} />
              <span>{createError}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-[rgba(var(--overlay-rgb),0.08)]">
            <div>
              {editingProduct && !confirmDelete && (
                <Button variant="ghost" onClick={() => setConfirmDelete(true)} className="text-[var(--color-error)] hover:bg-[var(--color-error)]/10">
                  Excluir
                </Button>
              )}
              {confirmDelete && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-error)]">Confirmar exclusão?</span>
                  <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
                  <Button size="sm" onClick={handleDelete} loading={deleting} className="bg-[var(--color-error)] hover:bg-[var(--color-error)]/80">Sim, Excluir</Button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" onClick={handleCloseModal}>Cancelar</Button>
              <Button onClick={handleSave} loading={creating} disabled={creating || uploading}>
                {editingProduct ? 'Salvar' : 'Criar Produto'}
              </Button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
