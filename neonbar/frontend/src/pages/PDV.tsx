import { useState, useEffect, useMemo } from 'react';
import { Search, Trash2, Plus, Minus, ShoppingCart, AlertCircle, CheckCircle2, Upload, X } from 'lucide-react';
import { pdvService, pedidosService, uploadService } from '../services/api';
import Modal from '../components/Modal';
import Button from '../components/Button';
import Input from '../components/Input';
import type { Produto, ProdutoCreate, PedidoCreate } from '../types';

export default function PDV() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('all');
  const [cart, setCart] = useState<{ produto: Produto; quantidade: number }[]>([]);
  const [saleOk, setSaleOk] = useState(false);

  // Create product modal
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

  useEffect(() => {
    pdvService.listarProdutos()
      .then(res => { setProdutos(res.data); setLoading(false); })
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

  const removeFromCart = (produtoId: number) => {
    setCart(prev => prev.filter(item => item.produto.id !== produtoId));
  };

  const changeQty = (produtoId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.produto.id !== produtoId) return item;
      const newQty = item.quantidade + delta;
      return newQty <= 0 ? null : { ...item, quantidade: newQty };
    }).filter(Boolean) as typeof cart);
  };

  const total = cart.reduce((sum, item) => sum + item.produto.preco_venda * item.quantidade, 0);

  const finalizeSale = async () => {
    try {
      setError('');
      const pedido: PedidoCreate = {
        itens: cart.map(item => ({
          nome: item.produto.nome,
          quantidade: item.quantidade,
          preco: item.produto.preco_venda
        })),
        observacao: 'Venda PDV'
      };
      await pedidosService.criar(pedido);
      setCart([]);
      setSaleOk(true);
      setTimeout(() => setSaleOk(false), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao finalizar venda');
    }
  };

  const resetForm = () => {
    setForm({ nome: '', descricao: '', categoria: '', preco_venda: 0, codigo_barras: '', imagem: '', foto_url: '', tempo_preparo: undefined });
    setIsNewCategory(false);
    setCustomCategory('');
    setCreateError('');
    setUploading(false);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    resetForm();
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

  const handleCreate = async () => {
    setCreateError('');
    if (!form.nome.trim()) { setCreateError('Nome é obrigatório'); return; }
    if (form.preco_venda <= 0) { setCreateError('Preço deve ser maior que zero'); return; }
    const categoria = isNewCategory ? customCategory.trim() : form.categoria;
    if (!categoria) { setCreateError('Selecione ou crie uma categoria'); return; }

    setCreating(true);
    try {
      await pdvService.criarProduto({ ...form, categoria });
      setShowCreateModal(false);
      resetForm();
      const res = await pdvService.listarProdutos();
      setProdutos(res.data);
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setCreateError('Já existe um produto com este nome');
      } else if (err?.response?.status === 403) {
        setCreateError('Você não tem permissão para criar produtos');
      } else {
        setCreateError(err?.response?.data?.detail || 'Erro ao criar produto');
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
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-md mb-lg flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search size={18} className="absolute left-sm top-1/2 -translate-y-1/2 text-[var(--color-outline)]" />
            <input type="text" placeholder="Buscar produto..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-[var(--color-surface-container-lowest)] border border-[rgba(255,255,255,0.1)] rounded-lg pl-xl pr-md py-xs text-body-md focus:border-[var(--color-primary)]/50 outline-none text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]/40 transition-colors" />
          </div>
          <div className="flex gap-1 flex-wrap">
            {categorias.map(cat => (
              <button key={cat} onClick={() => setCategoriaFilter(cat)}
                className={`px-md h-[36px] rounded-lg text-label-sm transition-all cursor-pointer ${
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
              <div key={p.id} onClick={() => addToCart(p)}
                className="group relative bg-[var(--color-surface-container)] rounded-xl border border-[rgba(255,255,255,0.06)] hover:border-[var(--color-primary)]/40 transition-all cursor-pointer active:scale-[0.97] overflow-hidden">
                <div className="aspect-[4/3] bg-[var(--color-surface-container-high)] overflow-hidden">
                  {p.foto_url ? (
                    <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : p.imagem ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl group-hover:scale-110 transition-transform duration-500">{p.imagem}</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingCart size={32} className="text-[var(--color-on-surface-variant)]/30" />
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <h3 className="text-body-md font-semibold text-[var(--color-on-surface)] truncate">{p.nome}</h3>
                  <p className="text-data-display text-[var(--color-primary)] font-bold">R$ {p.preco_venda.toFixed(2)}</p>
                  {p.categoria && (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                      {p.categoria}
                    </span>
                  )}
                </div>
              </div>
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

      <div className="w-80 shrink-0 bg-[var(--color-surface-container)] rounded-xl border border-[rgba(255,255,255,0.06)] flex flex-col">
        <div className="p-lg border-b border-[rgba(255,255,255,0.06)]">
          <h2 className="text-headline-md font-bold text-[var(--color-on-surface)] flex items-center gap-2">
            <ShoppingCart size={20} /> Carrinho
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-lg space-y-3 min-h-0">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-[var(--color-outline)] text-sm gap-2">
              <ShoppingCart size={28} className="opacity-30" />
              <span>Carrinho vazio</span>
            </div>
          ) : cart.map(item => (
            <div key={item.produto.id} className="flex items-center gap-3 p-3 bg-[var(--color-surface-container-high)] rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-body-md font-medium text-[var(--color-on-surface)] truncate">{item.produto.nome}</p>
                <p className="text-label-sm text-[var(--color-on-surface-variant)]">
                  R$ {item.produto.preco_venda.toFixed(2)} x {item.quantidade}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => changeQty(item.produto.id, -1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)] transition-colors cursor-pointer">
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center text-body-md font-mono text-[var(--color-on-surface)]">
                  {item.quantidade}
                </span>
                <button onClick={() => changeQty(item.produto.id, 1)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)] transition-colors cursor-pointer">
                  <Plus size={14} />
                </button>
              </div>
              <button onClick={() => removeFromCart(item.produto.id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors cursor-pointer">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="p-lg border-t border-[rgba(255,255,255,0.06)] space-y-3">
          {saleOk && (
            <div className="flex items-center gap-2 px-md py-sm rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
              <CheckCircle2 size={16} />
              <span>Venda finalizada com sucesso!</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-body-md text-[var(--color-on-surface-variant)]">Total</span>
            <span className="text-headline-md font-bold text-[var(--color-on-surface)]">R$ {total.toFixed(2)}</span>
          </div>
          <Button className="w-full" onClick={finalizeSale} disabled={cart.length === 0}>
            Finalizar Venda
          </Button>
        </div>
      </div>

      {/* Modal: Novo Produto */}
      <Modal open={showCreateModal} onClose={handleCloseModal} title="Novo Produto" size="lg">
        <div className="space-y-4">
          <Input label="Nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: Mojito" required />

          <div>
            <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-2">Descrição</label>
            <textarea value={form.descricao || ''} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Breve descrição do produto..." rows={2} className="w-full bg-[var(--color-surface-low)] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-[var(--color-on-surface)] px-3 py-2 outline-none resize-none placeholder:text-[var(--color-on-surface-variant)]/40" />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-2">Categoria</label>
            <select value={isNewCategory ? '__new__' : form.categoria || ''} onChange={e => { if (e.target.value === '__new__') { setIsNewCategory(true); setForm(f => ({ ...f, categoria: '' })); } else { setIsNewCategory(false); setForm(f => ({ ...f, categoria: e.target.value })); } }}
              className="w-full bg-[var(--color-surface-low)] border border-[rgba(255,255,255,0.1)] rounded-lg text-sm text-[var(--color-on-surface)] px-3 py-2 outline-none">
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
              <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-[rgba(255,255,255,0.1)] rounded-lg cursor-pointer hover:border-[var(--color-primary)]/50 transition-colors">
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

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.08)]">
            <Button variant="ghost" onClick={handleCloseModal}>Cancelar</Button>
            <Button onClick={handleCreate} loading={creating} disabled={creating || uploading}>
              Criar Produto
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
