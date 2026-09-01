import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Palette, Image, Type, Eye, Plus, Edit3, Trash2, X, Check, GripVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CardapioConfig {
  nomeBar: string;
  slogan: string;
  corPrimaria: string;
  corSecundaria: string;
  logoUrl: string;
  fundoEscuro: boolean;
}

interface CardapioItem {
  id: number;
  nome: string;
  descricao: string;
  categoria: string;
  preco: number;
  imagem: string;
  foto_url: string;
  ativo: boolean;
}

interface Categoria {
  id: string;
  nome: string;
  icon: string;
  ativo: boolean;
}

const defaultConfig: CardapioConfig = {
  nomeBar: 'BARIZE',
  slogan: 'Cardápio Digital',
  corPrimaria: '#00e5ff',
  corSecundaria: '#ffcf8f',
  logoUrl: '/barize-logo.png',
  fundoEscuro: true,
};

const defaultCategorias: Categoria[] = [
  { id: 'coqueteis', nome: 'Coquetéis', icon: 'local_bar', ativo: true },
  { id: 'vinhos', nome: 'Vinhos', icon: 'wine_bar', ativo: true },
  { id: 'cervejas', nome: 'Cervejas', icon: 'sports_bar', ativo: true },
  { id: 'petiscos', nome: 'Petiscos', icon: 'restaurant', ativo: true },
];

const defaultItems: CardapioItem[] = [
  { id: 1, nome: 'Negroni Clássico', descricao: 'Gin, Campari, Vermute tinto doce e twist de laranja.', categoria: 'coqueteis', preco: 32, imagem: '🍹', foto_url: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=300&fit=crop', ativo: true },
  { id: 2, nome: 'Moscow Mule', descricao: 'Vodka, espuma de gengibre, limão tahiti e xarope simples.', categoria: 'coqueteis', preco: 28, imagem: '🍹', foto_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=300&fit=crop', ativo: true },
  { id: 3, nome: 'Fritas Trufadas', descricao: 'Batatas fritas rústicas com azeite trufado e parmesão ralado.', categoria: 'petiscos', preco: 35, imagem: '🍟', foto_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop', ativo: true },
  { id: 4, nome: 'Old Fashioned', descricao: 'Bourbon premium, bitters de angostura, torrão de açúcar e casca de laranja.', categoria: 'coqueteis', preco: 35, imagem: '🥃', foto_url: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&h=300&fit=crop', ativo: true },
  { id: 5, nome: 'Dry Martini', descricao: 'Gin London Dry, Vermute seco e azeitona siciliana ou twist de limão.', categoria: 'coqueteis', preco: 30, imagem: '🍸', foto_url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop', ativo: true },
  { id: 6, nome: 'Cosmopolitan', descricao: 'Vodka, Cointreau, suco de cranberry e suco de limão fresco.', categoria: 'coqueteis', preco: 29, imagem: '🍹', foto_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop', ativo: true },
  { id: 7, nome: 'Whisky Sour', descricao: 'Bourbon, suco de limão, xarope de açúcar e clara de ovo pasteurizada.', categoria: 'coqueteis', preco: 33, imagem: '🥃', foto_url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop', ativo: true },
];

const coresPredefinidas = [
  { nome: 'Ciano Neon', primaria: '#00e5ff', secundaria: '#ffcf8f' },
  { nome: 'Verde Esmeralda', primaria: '#10b981', secundaria: '#fbbf24' },
  { nome: 'Roxo Violeta', primaria: '#8b5cf6', secundaria: '#f472b6' },
  { nome: 'Laranja Solar', primaria: '#f97316', secundaria: '#fbbf24' },
  { nome: 'Rosa Neon', primaria: '#ec4899', secundaria: '#8b5cf6' },
  { nome: 'Azul Profundo', primaria: '#3b82f6', secundaria: '#06b6d4' },
];

export default function PersonalizarCardapio() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<CardapioConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState<'cores' | 'logo' | 'info' | 'itens' | 'categorias'>('cores');
  const [salvando, setSalvando] = useState(false);
  const [itens, setItens] = useState<CardapioItem[]>(defaultItems);
  const [categorias, setCategorias] = useState<Categoria[]>(defaultCategorias);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [editandoItem, setEditandoItem] = useState<CardapioItem | null>(null);
  const [editandoCategoria, setEditandoCategoria] = useState<Categoria | null>(null);
  const [formItem, setFormItem] = useState({ nome: '', descricao: '', categoria: 'coqueteis', preco: 0, imagem: '🍹', foto_url: '' });
  const [formCategoria, setFormCategoria] = useState({ nome: '', icon: 'local_bar' });

  useEffect(() => {
    const savedConfig = localStorage.getItem('barize-cardapio-config');
    const savedItens = localStorage.getItem('barize-cardapio-itens');
    const savedCategorias = localStorage.getItem('barize-cardapio-categorias');
    
    if (savedConfig) {
      try { setConfig({ ...defaultConfig, ...JSON.parse(savedConfig) }); } catch {}
    }
    if (savedItens) {
      try { setItens(JSON.parse(savedItens)); } catch {}
    }
    if (savedCategorias) {
      try { setCategorias(JSON.parse(savedCategorias)); } catch {}
    }
  }, []);

  function aplicarCor(cor: { primaria: string; secundaria: string }) {
    setConfig({ ...config, corPrimaria: cor.primaria, corSecundaria: cor.secundaria });
  }

  function salvar() {
    setSalvando(true);
    try {
      localStorage.setItem('barize-cardapio-config', JSON.stringify(config));
      localStorage.setItem('barize-cardapio-itens', JSON.stringify(itens));
      localStorage.setItem('barize-cardapio-categorias', JSON.stringify(categorias));
      setTimeout(() => {
        setSalvando(false);
        alert('Configurações salvas com sucesso!');
      }, 500);
    } catch {
      setSalvando(false);
      alert('Erro ao salvar configurações');
    }
  }

  function abrirNovoItem() {
    setEditandoItem(null);
    setFormItem({ nome: '', descricao: '', categoria: 'coqueteis', preco: 0, imagem: '🍹', foto_url: '' });
    setShowItemModal(true);
  }

  function abrirEditarItem(item: CardapioItem) {
    setEditandoItem(item);
    setFormItem({ nome: item.nome, descricao: item.descricao, categoria: item.categoria, preco: item.preco, imagem: item.imagem, foto_url: item.foto_url });
    setShowItemModal(true);
  }

  function salvarItem() {
    if (editandoItem) {
      setItens(itens.map(i => i.id === editandoItem.id ? { ...i, ...formItem } : i));
    } else {
      const novoId = Math.max(...itens.map(i => i.id), 0) + 1;
      setItens([...itens, { ...formItem, id: novoId, ativo: true }]);
    }
    setShowItemModal(false);
  }

  function excluirItem(id: number) {
    if (confirm('Excluir este item?')) {
      setItens(itens.filter(i => i.id !== id));
    }
  }

  function toggleItemAtivo(id: number) {
    setItens(itens.map(i => i.id === id ? { ...i, ativo: !i.ativo } : i));
  }

  function abrirNovaCategoria() {
    setEditandoCategoria(null);
    setFormCategoria({ nome: '', icon: 'local_bar' });
    setShowCategoriaModal(true);
  }

  function abrirEditarCategoria(cat: Categoria) {
    setEditandoCategoria(cat);
    setFormCategoria({ nome: cat.nome, icon: cat.icon });
    setShowCategoriaModal(true);
  }

  function salvarCategoria() {
    if (editandoCategoria) {
      setCategorias(categorias.map(c => c.id === editandoCategoria.id ? { ...c, ...formCategoria } : c));
    } else {
      const novoId = formCategoria.nome.toLowerCase().replace(/\s+/g, '-');
      setCategorias([...categorias, { ...formCategoria, id: novoId, ativo: true }]);
    }
    setShowCategoriaModal(false);
  }

  function excluirCategoria(id: number) {
    if (confirm('Excluir esta categoria?')) {
      setCategorias(categorias.filter(c => c.id !== id));
    }
  }

  return (
    <div className="min-h-screen bg-background text-on-background">
      {/* Header */}
      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 h-14 border-b border-outline/20 bg-surface/95 backdrop-blur-sm">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-surface-container-high transition-colors">
          <ArrowLeft size={20} className="text-on-surface" />
        </button>
        <h1 className="text-lg font-semibold text-on-surface">Personalizar Cardápio</h1>
        <button onClick={salvar} disabled={salvando} className="ml-auto p-2 rounded-xl bg-primary-container/20 hover:bg-primary-container/30 transition-colors disabled:opacity-50">
          {salvando ? <div className="w-5 h-5 border-2 border-primary-container/30 border-t-primary-container rounded-full animate-spin" /> : <Save size={20} className="text-primary-container" />}
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 px-4 py-3 border-b border-outline/10 overflow-x-auto no-scrollbar">
        {[
          { id: 'cores' as const, label: 'Cores', icon: Palette },
          { id: 'logo' as const, label: 'Logo', icon: Image },
          { id: 'info' as const, label: 'Info', icon: Type },
          { id: 'itens' as const, label: 'Itens', icon: Edit3 },
          { id: 'categorias' as const, label: 'Categorias', icon: GripVertical },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-primary-container text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}>
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <main className="p-4 space-y-4">
        {/* Cores */}
        {activeTab === 'cores' && (
          <>
            <section>
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Cores Predefinidas</h3>
              <div className="grid grid-cols-2 gap-2">
                {coresPredefinidas.map((cor) => (
                  <button key={cor.nome} onClick={() => aplicarCor(cor)} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${config.corPrimaria === cor.primaria ? 'border-primary-container bg-primary-container/10' : 'border-outline/20 bg-surface-container hover:bg-surface-container-high'}`}>
                    <div className="flex gap-1">
                      <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: cor.primaria }} />
                      <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: cor.secundaria }} />
                    </div>
                    <span className="text-xs font-medium text-on-surface">{cor.nome}</span>
                  </button>
                ))}
              </div>
            </section>
            <section>
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Cor Personalizada</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="text-sm text-on-surface-variant w-24">Primária</label>
                  <div className="flex items-center gap-2 flex-1">
                    <input type="color" value={config.corPrimaria} onChange={(e) => setConfig({ ...config, corPrimaria: e.target.value })} className="w-10 h-10 rounded-lg border border-outline/20 cursor-pointer" />
                    <input type="text" value={config.corPrimaria} onChange={(e) => setConfig({ ...config, corPrimaria: e.target.value })} className="flex-1 px-3 py-2 rounded-xl bg-surface-container-high border border-outline/20 text-on-surface text-sm font-mono" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-on-surface-variant w-24">Secundária</label>
                  <div className="flex items-center gap-2 flex-1">
                    <input type="color" value={config.corSecundaria} onChange={(e) => setConfig({ ...config, corSecundaria: e.target.value })} className="w-10 h-10 rounded-lg border border-outline/20 cursor-pointer" />
                    <input type="text" value={config.corSecundaria} onChange={(e) => setConfig({ ...config, corSecundaria: e.target.value })} className="flex-1 px-3 py-2 rounded-xl bg-surface-container-high border border-outline/20 text-on-surface text-sm font-mono" />
                  </div>
                </div>
              </div>
            </section>
            <section>
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Tema</h3>
              <div className="flex gap-2">
                <button onClick={() => setConfig({ ...config, fundoEscuro: true })} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${config.fundoEscuro ? 'bg-primary-container text-on-primary' : 'bg-surface-container-high text-on-surface-variant border border-outline/20'}`}>Escuro</button>
                <button onClick={() => setConfig({ ...config, fundoEscuro: false })} className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${!config.fundoEscuro ? 'bg-primary-container text-on-primary' : 'bg-surface-container-high text-on-surface-variant border border-outline/20'}`}>Claro</button>
              </div>
            </section>
          </>
        )}

        {/* Logo */}
        {activeTab === 'logo' && (
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Logomarca</h3>
            <div className="flex flex-col items-center p-6 rounded-2xl bg-surface-container border border-outline/20">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 mb-4 flex items-center justify-center bg-black" style={{ borderColor: config.corPrimaria }}>
                <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <p className="text-sm text-on-surface-variant">Logo atual</p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">URL da Logo</label>
              <input type="text" value={config.logoUrl} onChange={(e) => setConfig({ ...config, logoUrl: e.target.value })} placeholder="https://exemplo.com/logo.png" className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-outline/20 text-on-surface text-sm" />
            </div>
          </section>
        )}

        {/* Info */}
        {activeTab === 'info' && (
          <section className="space-y-4">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Informações do Estabelecimento</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-on-surface-variant">Nome do Bar</label>
                <input type="text" value={config.nomeBar} onChange={(e) => setConfig({ ...config, nomeBar: e.target.value })} placeholder="Nome do estabelecimento" className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-outline/20 text-on-surface text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-on-surface-variant">Slogan</label>
                <input type="text" value={config.slogan} onChange={(e) => setConfig({ ...config, slogan: e.target.value })} placeholder="Ex: Cardápio Digital" className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-outline/20 text-on-surface text-sm" />
              </div>
            </div>
          </section>
        )}

        {/* Itens */}
        {activeTab === 'itens' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Itens do Cardápio</h3>
              <button onClick={abrirNovoItem} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-container/20 text-primary-container text-xs font-medium hover:bg-primary-container/30 transition-colors">
                <Plus size={14} /> Novo Item
              </button>
            </div>
            <div className="space-y-2">
              {itens.map((item) => (
                <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${item.ativo ? 'bg-surface-container border-outline/20' : 'bg-surface-container-low border-outline/10 opacity-60'}`}>
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0">
                    {item.foto_url ? <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">{item.imagem}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate">{item.nome}</p>
                    <p className="text-[10px] text-on-surface-variant truncate">{item.categoria} • R$ {item.preco.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => toggleItemAtivo(item.id)} className={`p-1.5 rounded-lg transition-colors ${item.ativo ? 'text-emerald-400 hover:bg-emerald-400/20' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
                      <Check size={14} />
                    </button>
                    <button onClick={() => abrirEditarItem(item)} className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-400/20 transition-colors">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => excluirItem(item.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/20 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Categorias */}
        {activeTab === 'categorias' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Categorias</h3>
              <button onClick={abrirNovaCategoria} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-container/20 text-primary-container text-xs font-medium hover:bg-primary-container/30 transition-colors">
                <Plus size={14} /> Nova
              </button>
            </div>
            <div className="space-y-2">
              {categorias.map((cat) => (
                <div key={cat.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${cat.ativo ? 'bg-surface-container border-outline/20' : 'bg-surface-container-low border-outline/10 opacity-60'}`}>
                  <span className="material-symbols-outlined text-primary-container">{cat.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-on-surface">{cat.nome}</p>
                    <p className="text-[10px] text-on-surface-variant">{cat.id}</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setCategorias(categorias.map(c => c.id === cat.id ? { ...c, ativo: !c.ativo } : c))} className={`p-1.5 rounded-lg transition-colors ${cat.ativo ? 'text-emerald-400 hover:bg-emerald-400/20' : 'text-on-surface-variant hover:bg-surface-container-high'}`}>
                      <Check size={14} />
                    </button>
                    <button onClick={() => abrirEditarCategoria(cat)} className="p-1.5 rounded-lg text-amber-400 hover:bg-amber-400/20 transition-colors">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => excluirCategoria(cat.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-400/20 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Modal Item */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowItemModal(false)}>
          <div className="w-full max-w-lg bg-surface rounded-t-3xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-on-surface">{editandoItem ? 'Editar Item' : 'Novo Item'}</h2>
              <button onClick={() => setShowItemModal(false)} className="p-2 rounded-xl hover:bg-surface-container-high"><X size={20} className="text-on-surface-variant" /></button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-on-surface-variant">Nome</label>
                <input type="text" value={formItem.nome} onChange={(e) => setFormItem({ ...formItem, nome: e.target.value })} placeholder="Nome do item" className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-outline/20 text-on-surface text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-on-surface-variant">Descrição</label>
                <textarea value={formItem.descricao} onChange={(e) => setFormItem({ ...formItem, descricao: e.target.value })} placeholder="Descrição do item" rows={2} className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-outline/20 text-on-surface text-sm resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-on-surface-variant">Categoria</label>
                  <select value={formItem.categoria} onChange={(e) => setFormItem({ ...formItem, categoria: e.target.value })} className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-outline/20 text-on-surface text-sm">
                    {categorias.filter(c => c.ativo).map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-on-surface-variant">Preço (R$)</label>
                  <input type="number" value={formItem.preco} onChange={(e) => setFormItem({ ...formItem, preco: Number(e.target.value) })} className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-outline/20 text-on-surface text-sm" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-on-surface-variant">URL da Imagem</label>
                <input type="text" value={formItem.foto_url} onChange={(e) => setFormItem({ ...formItem, foto_url: e.target.value })} placeholder="https://exemplo.com/imagem.jpg" className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-outline/20 text-on-surface text-sm" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowItemModal(false)} className="flex-1 py-3 rounded-xl border border-outline/20 text-on-surface text-sm font-medium hover:bg-surface-container-high transition-colors">Cancelar</button>
              <button onClick={salvarItem} disabled={!formItem.nome} className="flex-1 py-3 rounded-xl bg-primary-container text-on-primary text-sm font-medium hover:brightness-110 transition-all disabled:opacity-40 flex items-center justify-center gap-2"><Save size={16} /> Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Categoria */}
      {showCategoriaModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowCategoriaModal(false)}>
          <div className="w-full max-w-lg bg-surface rounded-t-3xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-on-surface">{editandoCategoria ? 'Editar Categoria' : 'Nova Categoria'}</h2>
              <button onClick={() => setShowCategoriaModal(false)} className="p-2 rounded-xl hover:bg-surface-container-high"><X size={20} className="text-on-surface-variant" /></button>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-on-surface-variant">Nome</label>
                <input type="text" value={formCategoria.nome} onChange={(e) => setFormCategoria({ ...formCategoria, nome: e.target.value })} placeholder="Nome da categoria" className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-outline/20 text-on-surface text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-on-surface-variant">Ícone (Material Symbols)</label>
                <input type="text" value={formCategoria.icon} onChange={(e) => setFormCategoria({ ...formCategoria, icon: e.target.value })} placeholder="local_bar" className="w-full px-4 py-3 rounded-xl bg-surface-container-high border border-outline/20 text-on-surface text-sm" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowCategoriaModal(false)} className="flex-1 py-3 rounded-xl border border-outline/20 text-on-surface text-sm font-medium hover:bg-surface-container-high transition-colors">Cancelar</button>
              <button onClick={salvarCategoria} disabled={!formCategoria.nome} className="flex-1 py-3 rounded-xl bg-primary-container text-on-primary text-sm font-medium hover:brightness-110 transition-all disabled:opacity-40 flex items-center justify-center gap-2"><Save size={16} /> Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
