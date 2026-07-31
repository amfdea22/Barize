import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Filter,
  X,
  Tag,
  AlertTriangle,
  ChefHat,
  Wine,
  Coffee,
  Leaf,
  Flame,
  
  BookOpen,
  Printer,
  
  Eye,
  Grid,
  List,
  
  
  Info,
  
  Droplet,
  WheatOff,
  HeartPulse,
  Scale,
  Clock,
  Thermometer,
  Package,
  
  RotateCcw,
  
} from 'lucide-react';
import { fichasTecnicasService } from '../services/api';
import type { FichaTecnicaItem, FichaTecnicaFilter } from '../types';
import Modal from '../components/Modal';
import Button from '../components/Button';

const DIFICULDADE_LABELS: Record<string, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
};

const TAG_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  classico: { label: 'Clássico', icon: Wine, color: 'text-amber-400' },
  signature: { label: 'Signature', icon: Flame, color: 'text-orange-400' },
  sem_alcool: { label: 'Sem Álcool', icon: Droplet, color: 'text-blue-400' },
  vegano: { label: 'Vegano', icon: Leaf, color: 'text-green-400' },
  sem_gluten: { label: 'Sem Glúten', icon: WheatOff, color: 'text-yellow-400' },
  baixo_calorico: { label: 'Baixo Calórico', icon: HeartPulse, color: 'text-pink-400' },
  organico: { label: 'Orgânico', icon: Leaf, color: 'text-emerald-400' },
  baixo_teor: { label: 'Baixo Teor', icon: Wine, color: 'text-cyan-400' },
  alto_teor: { label: 'Alto Teor', icon: Flame, color: 'text-red-400' },
};

const ALERGENO_LABELS: Record<string, { label: string; color: string }> = {
  gluten: { label: 'Glúten', color: 'bg-amber-100 text-amber-800' },
  lactose: { label: 'Lactose', color: 'bg-blue-100 text-blue-800' },
  soja: { label: 'Soja', color: 'bg-green-100 text-green-800' },
  nozes: { label: 'Nozes', color: 'bg-amber-200 text-amber-900' },
  crustaceos: { label: 'Crustáceos', color: 'bg-red-100 text-red-800' },
  ovos: { label: 'Ovos', color: 'bg-yellow-100 text-yellow-800' },
};

const DIFICULDADE_COLORS: Record<string, string> = {
  facil: 'bg-green-100 text-green-800',
  medio: 'bg-yellow-100 text-yellow-800',
  dificil: 'bg-red-100 text-red-800',
};

export default function FichaTecnica() {
  const [fichas, setFichas] = useState<FichaTecnicaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<FichaTecnicaFilter>({
    categoria: '',
    tag: '',
    alergeno_excluir: '',
    dificuldade: '',
    teor_alcoolico_max: undefined,
    preco_max: undefined,
    apenas_ativos: true,
  });
  const [selectedFicha, setSelectedFicha] = useState<FichaTecnicaItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [tagsDisponiveis, setTagsDisponiveis] = useState<string[]>([]);
  const [alergenosDisponiveis, setAlergenosDisponiveis] = useState<string[]>([]);

  const loadFichas = async () => {
    setLoading(true);
    try {
      const res = await fichasTecnicasService.listar(filters);
      setFichas(Array.isArray(res.data) ? res.data : []);
      
      // Extrair categorias, tags e alérgenos únicos
      const cats = new Set<string>();
      const tags = new Set<string>();
      const alergs = new Set<string>();
      
      res.data.forEach((f: FichaTecnicaItem) => {
        if (f.categoria) cats.add(f.categoria);
        f.tags.forEach(t => tags.add(t));
        f.alergenos.forEach(a => alergs.add(a));
      });
      
      setCategorias(Array.from(cats).sort());
      setTagsDisponiveis(Array.from(tags).sort());
      setAlergenosDisponiveis(Array.from(alergs).sort());
    } catch (err) {
      console.error('Erro ao carregar fichas técnicas:', err);
      setFichas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFichas(); }, [filters]);

  const filtered = useMemo(() => {
    return fichas.filter(f => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        f.nome.toLowerCase().includes(q) ||
        f.categoria?.toLowerCase().includes(q) ||
        f.descricao?.toLowerCase().includes(q) ||
        f.ingredientes.some(i => i.nome.toLowerCase().includes(q))
      );
    });
  }, [fichas, search]);

  const handleFilterChange = (key: keyof FichaTecnicaFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      categoria: '',
      tag: '',
      alergeno_excluir: '',
      dificuldade: '',
      teor_alcoolico_max: undefined,
      preco_max: undefined,
      apenas_ativos: true,
    });
    setSearch('');
  };

  const hasActiveFilters = filters.categoria || filters.tag || filters.alergeno_excluir || 
    filters.dificuldade || filters.teor_alcoolico_max || filters.preco_max || search;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md mb-lg">
        <div>
          <h1 className="text-headline-lg font-bold text-[var(--color-on-surface)]">FICHA TÉCNICA</h1>
          <p className="text-label-md text-[var(--color-on-surface-variant)] mt-0.5">
            {fichas.length} receita(s) cadastrada(s) — gestão inteligente de preparo, custos e harmonização
          </p>
        </div>
        <div className="flex items-center gap-sm flex-wrap">
          <Button variant="ghost" onClick={() => setShowFilters(!showFilters)} className="h-[44px]">
            <Filter size={18} /> Filtros
          </Button>
          <Button variant="ghost" onClick={loadFichas} className="h-[44px]">
            <RotateCcw size={18} /> Atualizar
          </Button>
          <Button className="h-[44px]" onClick={() => window.print()}>
            <Printer size={18} /> Imprimir Todas
          </Button>
        </div>
      </div>

      {/* Active Filters Bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-sm mb-lg px-sm py-sm bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-lg">
          <span className="text-xs text-[var(--color-primary)] font-medium">Filtros ativos:</span>
          {filters.categoria && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs rounded-full">
              {filters.categoria}
              <button onClick={() => handleFilterChange('categoria', '')} className="ml-1 hover:opacity-70"><X size={10} /></button>
            </span>
          )}
          {filters.tag && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs rounded-full">
              {TAG_LABELS[filters.tag]?.label || filters.tag}
              <button onClick={() => handleFilterChange('tag', '')} className="ml-1 hover:opacity-70"><X size={10} /></button>
            </span>
          )}
          {filters.alergeno_excluir && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
              Sem {ALERGENO_LABELS[filters.alergeno_excluir]?.label || filters.alergeno_excluir}
              <button onClick={() => handleFilterChange('alergeno_excluir', '')} className="ml-1 hover:opacity-70"><X size={10} /></button>
            </span>
          )}
          {filters.dificuldade && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs rounded-full">
              {DIFICULDADE_LABELS[filters.dificuldade]}
              <button onClick={() => handleFilterChange('dificuldade', '')} className="ml-1 hover:opacity-70"><X size={10} /></button>
            </span>
          )}
          {search && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs rounded-full">
              Busca: "{search}"
              <button onClick={() => setSearch('')} className="ml-1 hover:opacity-70"><X size={10} /></button>
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 px-2">
            <X size={12} /> Limpar tudo
          </Button>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-lg p-lg bg-[var(--color-surface-container)] rounded-xl border border-[rgba(255,255,255,0.06)] animate-slide-in">
          <div className="flex items-center justify-between mb-md">
            <h3 className="text-title-md font-semibold text-[var(--color-on-surface)]">Filtros Avançados</h3>
            <Button variant="ghost" size="sm" onClick={clearFilters}><X size={16} /> Limpar</Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md">
            <div>
              <label className="block text-xs font-medium text-[var(--color-on-surface-variant)] mb-1">Categoria</label>
              <select
                value={filters.categoria}
                onChange={e => handleFilterChange('categoria', e.target.value || '')}
                className="w-full bg-[var(--color-surface-container-lowest)] border border-[rgba(255,255,255,0.1)] rounded-lg px-md py-xs text-body-md focus:border-[var(--color-primary)]/50 outline-none text-[var(--color-on-surface)]"
              >
                <option value="">Todas</option>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-on-surface-variant)] mb-1">Tag</label>
              <select
                value={filters.tag}
                onChange={e => handleFilterChange('tag', e.target.value || '')}
                className="w-full bg-[var(--color-surface-container-lowest)] border border-[rgba(255,255,255,0.1)] rounded-lg px-md py-xs text-body-md focus:border-[var(--color-primary)]/50 outline-none text-[var(--color-on-surface)]"
              >
                <option value="">Todas</option>
                {tagsDisponiveis.map(t => <option key={t} value={t}>{TAG_LABELS[t]?.label || t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-on-surface-variant)] mb-1">Excluir Alérgeno</label>
              <select
                value={filters.alergeno_excluir}
                onChange={e => handleFilterChange('alergeno_excluir', e.target.value || '')}
                className="w-full bg-[var(--color-surface-container-lowest)] border border-[rgba(255,255,255,0.1)] rounded-lg px-md py-xs text-body-md focus:border-[var(--color-primary)]/50 outline-none text-[var(--color-on-surface)]"
              >
                <option value="">Nenhum</option>
                {alergenosDisponiveis.map(a => <option key={a} value={a}>{ALERGENO_LABELS[a]?.label || a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-on-surface-variant)] mb-1">Dificuldade</label>
              <select
                value={filters.dificuldade}
                onChange={e => handleFilterChange('dificuldade', e.target.value || '')}
                className="w-full bg-[var(--color-surface-container-lowest)] border border-[rgba(255,255,255,0.1)] rounded-lg px-md py-xs text-body-md focus:border-[var(--color-primary)]/50 outline-none text-[var(--color-on-surface)]"
              >
                <option value="">Todas</option>
                <option value="facil">Fácil</option>
                <option value="medio">Médio</option>
                <option value="dificil">Difícil</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[var(--color-on-surface-variant)] mb-1">Teor Alcoólico Máx. (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={filters.teor_alcoolico_max || ''}
                onChange={e => handleFilterChange('teor_alcoolico_max', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full bg-[var(--color-surface-container-lowest)] border border-[rgba(255,255,255,0.1)] rounded-lg px-md py-xs text-body-md focus:border-[var(--color-primary)]/50 outline-none text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]/40"
                placeholder="Ex: 20"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[var(--color-on-surface-variant)] mb-1">Preço Máx. (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={filters.preco_max || ''}
                onChange={e => handleFilterChange('preco_max', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="w-full bg-[var(--color-surface-container-lowest)] border border-[rgba(255,255,255,0.1)] rounded-lg px-md py-xs text-body-md focus:border-[var(--color-primary)]/50 outline-none text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]/40"
                placeholder="Ex: 50.00"
              />
            </div>
          </div>
        </div>
      )}

      {/* Search + View Toggle */}
      <div className="flex flex-col sm:flex-row gap-md mb-lg">
        <div className="relative flex-1 max-w-sm">
          <Search size={18} className="absolute left-sm top-1/2 -translate-y-1/2 text-[var(--color-outline)]" />
          <input
            type="text"
            placeholder="Buscar por nome, categoria, ingrediente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[var(--color-surface-container-lowest)] border border-[rgba(255,255,255,0.1)] rounded-lg pl-xl pr-md py-xs text-body-md focus:border-[var(--color-primary)]/50 outline-none text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]/40"
          />
        </div>
        <div className="flex items-center gap-sm">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-[36px]"
            aria-label="Visualização em grade"
          >
            <Grid size={16} />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-[36px]"
            aria-label="Visualização em lista"
          >
            <List size={16} />
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-32 text-[var(--color-outline)] text-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-primary)] border-t-transparent" />
            Carregando fichas técnicas...
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-[var(--color-outline)] text-sm gap-2">
          <BookOpen size={32} className="opacity-30" />
          <span>Nenhuma ficha técnica encontrada</span>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X size={14} /> Limpar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto min-h-0">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-md">
              {filtered.map(ficha => (
                <FichaCard key={ficha.produto_id} ficha={ficha} onClick={() => setSelectedFicha(ficha)} />
              ))}
            </div>
          ) : (
            <div className="space-y-sm">
              {filtered.map(ficha => (
                <FichaListItem key={ficha.produto_id} ficha={ficha} onClick={() => setSelectedFicha(ficha)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <Modal open={!!selectedFicha} onClose={() => setSelectedFicha(null)} title="" size="xl">
        {selectedFicha && <FichaDetailModal ficha={selectedFicha} onClose={() => setSelectedFicha(null)} />}
      </Modal>
    </div>
  );
}

// ─── Components ───

function FichaCard({ ficha, onClick }: { ficha: FichaTecnicaItem; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group relative bg-[var(--color-surface-container)] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-hidden hover:border-[var(--color-primary)]/50 hover:shadow-[0_0_16px_rgba(0,229,255,0.15)] transition-all cursor-pointer active:scale-[0.98]"
    >
      {/* Image/Placeholder */}
      <div className="aspect-square relative overflow-hidden bg-[var(--color-surface-container-high)]">
        {ficha.foto_url ? (
          <img
            src={ficha.foto_url}
            alt={ficha.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : ficha.imagem ? (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl">{ficha.imagem}</span>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Wine size={32} className="text-[var(--color-on-surface-variant)]/30" />
          </div>
        )}
        {/* Difficulty badge */}
        <div className="absolute top-2 left-2">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider ${DIFICULDADE_COLORS[ficha.dificuldade || 'medio']}`}>
            {DIFICULDADE_LABELS[ficha.dificuldade || 'medio']}
          </span>
        </div>
        {/* Alcohol badge */}
        {ficha.teor_alcoolico !== null && ficha.teor_alcoolico !== undefined && (
          <div className="absolute top-2 right-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-black/70 text-white/90 backdrop-blur-sm">
              {ficha.teor_alcoolico.toFixed(1)}% ABV
            </span>
          </div>
        )}
        {/* Tags */}
        <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1">
          {ficha.tags.slice(0, 2).map(tag => (
            <span key={tag} className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${TAG_LABELS[tag]?.color || 'text-[var(--color-primary)]'}`}>
              {TAG_LABELS[tag]?.label || tag}
            </span>
          ))}
          {ficha.tags.length > 2 && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-[var(--color-outline)]">
              +{ficha.tags.length - 2}
            </span>
          )}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-md space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-body-md font-semibold text-[var(--color-on-surface)] truncate">{ficha.nome}</h3>
          <span className="text-data-display text-[var(--color-primary)] font-bold shrink-0">
            R$ {ficha.preco_venda.toFixed(2)}
          </span>
        </div>
        
        {ficha.categoria && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] border border-[rgba(255,255,255,0.06)]">
            {ficha.categoria}
          </span>
        )}
        
        {/* Stats row */}
        <div className="flex items-center gap-md text-[11px] text-[var(--color-on-surface-variant)]">
          {ficha.teor_alcoolico !== null && ficha.teor_alcoolico !== undefined && (
            <span className="flex items-center gap-1">
              <Wine size={10} /> {ficha.teor_alcoolico.toFixed(1)}%
            </span>
          )}
          {ficha.calorias_estimadas && (
            <span className="flex items-center gap-1">
              <Flame size={10} /> {ficha.calorias_estimadas} kcal
            </span>
          )}
          <span className="flex items-center gap-1">
            <Scale size={10} /> {ficha.margem_lucro?.toFixed(1) || '—'}% margem
          </span>
        </div>
        
        {/* Tags & Allergens */}
        <div className="flex flex-wrap gap-1">
          {ficha.tags.slice(0, 4).map(tag => (
            <span key={tag} className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${TAG_LABELS[tag]?.color || 'text-[var(--color-primary)]'}`}>
              {TAG_LABELS[tag]?.label || tag}
            </span>
          ))}
          {ficha.tags.length > 4 && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-[var(--color-outline)]">
              +{ficha.tags.length - 4}
            </span>
          )}
          {ficha.alergenos.length > 0 && (
            <>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-red-100/20 text-red-400 border border-red-400/30">
                <AlertTriangle size={8} className="inline mr-0.5" /> Alérgenos
              </span>
              {ficha.alergenos.slice(0, 2).map(a => (
                <span key={a} className={`px-1.5 py-0.5 rounded text-[9px] font-mono ${ALERGENO_LABELS[a]?.color || 'bg-gray-100 text-gray-800'}`}>
                  {ALERGENO_LABELS[a]?.label || a}
                </span>
              ))}
              {ficha.alergenos.length > 2 && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-[var(--color-outline)]">
                  +{ficha.alergenos.length - 2}
                </span>
              )}
            </>
          )}
        </div>
        
        {/* Quick actions */}
        <div className="flex gap-1 pt-1 border-t border-[rgba(255,255,255,0.06)]">
          <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors">
            <Eye size={12} /> Ver
          </button>
          <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors">
            <Printer size={12} /> Imprimir
          </button>
        </div>
      </div>
    </div>
  );
}

function FichaListItem({ ficha, onClick }: { ficha: FichaTecnicaItem; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-md px-lg py-md bg-[var(--color-surface-container)] rounded-xl border border-[rgba(255,255,255,0.06)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface-container-high)] transition-all cursor-pointer"
    >
      <div className="w-16 h-16 rounded-lg bg-[var(--color-surface-container-high)] flex items-center justify-center shrink-0 overflow-hidden">
        {ficha.foto_url ? (
          <img src={ficha.foto_url} alt={ficha.nome} className="w-full h-full object-cover" />
        ) : ficha.imagem ? (
          <span className="text-3xl">{ficha.imagem}</span>
        ) : (
          <Wine size={24} className="text-[var(--color-on-surface-variant)]/30" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="text-body-md font-semibold text-[var(--color-on-surface)] truncate">{ficha.nome}</h4>
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono font-semibold uppercase tracking-wider ${DIFICULDADE_COLORS[ficha.dificuldade || 'medio']}`}>
            {DIFICULDADE_LABELS[ficha.dificuldade || 'medio']}
          </span>
        </div>
        <div className="flex items-center gap-md text-label-sm text-[var(--color-on-surface-variant)] flex-wrap">
          {ficha.categoria && <span>{ficha.categoria}</span>}
          {ficha.teor_alcoolico !== null && ficha.teor_alcoolico !== undefined && (
            <span className="flex items-center gap-1"><Wine size={10} /> {ficha.teor_alcoolico.toFixed(1)}%</span>
          )}
          <span className="flex items-center gap-1"><Scale size={10} /> {ficha.margem_lucro?.toFixed(1) || '—'}%</span>
          {ficha.calorias_estimadas && <span className="flex items-center gap-1"><Flame size={10} /> {ficha.calorias_estimadas} kcal</span>}
        </div>
        <div className="flex flex-wrap gap-1 mt-1">
          {ficha.tags.slice(0, 3).map(tag => (
            <span key={tag} className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider ${TAG_LABELS[tag]?.color || 'text-[var(--color-primary)]'}`}>
              {TAG_LABELS[tag]?.label || tag}
            </span>
          ))}
          {ficha.tags.length > 3 && <span className="px-1.5 py-0.5 rounded text-[9px] font-mono text-[var(--color-outline)]">+{ficha.tags.length - 3}</span>}
          {ficha.alergenos.length > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-red-100/20 text-red-400 border border-red-400/30">
              <AlertTriangle size={8} className="inline mr-0.5" /> {ficha.alergenos.length} alérgeno(s)
            </span>
          )}
        </div>
      </div>
      
      <div className="text-right shrink-0">
        <div className="text-data-display text-[var(--color-primary)] font-bold">R$ {ficha.preco_venda.toFixed(2)}</div>
        <div className="text-[10px] text-[var(--color-outline)] font-mono">Custo: R$ {ficha.custo_total?.toFixed(2) || '—'}</div>
      </div>
    </div>
  );
}

function FichaDetailModal({ ficha, onClose }: { ficha: FichaTecnicaItem; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<string>('visao-geral');
  
  const tabs = [
    { id: 'visao-geral', label: 'Visão Geral', icon: BookOpen },
    { id: 'ingredientes', label: 'Ingredientes', icon: Package },
    { id: 'preparo', label: 'Modo de Preparo', icon: ChefHat },
    { id: 'armazenamento', label: 'Armazenamento', icon: Thermometer },
    { id: 'harmonizacao', label: 'Harmonização', icon: Wine },
    { id: 'nutricional', label: 'Nutricional', icon: HeartPulse },
  ];

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-md pb-md border-b border-[rgba(255,255,255,0.06)]">
        <div>
          <div className="flex items-center gap-md mb-1">
            <h2 className="text-headline-md font-bold text-[var(--color-on-surface)]">{ficha.nome}</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider ${DIFICULDADE_COLORS[ficha.dificuldade || 'medio']}`}>
              {DIFICULDADE_LABELS[ficha.dificuldade || 'medio']}
            </span>
            {ficha.teor_alcoolico !== null && ficha.teor_alcoolico !== undefined && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-black/70 text-white/90 backdrop-blur-sm">
                {ficha.teor_alcoolico.toFixed(1)}% ABV
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-sm text-label-sm text-[var(--color-on-surface-variant)]">
            {ficha.categoria && <span className="px-2 py-0.5 rounded-full bg-[var(--color-surface-container-high)] border border-[rgba(255,255,255,0.06)]">{ficha.categoria}</span>}
            <span className="flex items-center gap-1"><Scale size={12} /> Margem: {ficha.margem_lucro?.toFixed(1) || '—'}%</span>
            {ficha.calorias_estimadas && <span className="flex items-center gap-1"><Flame size={12} /> {ficha.calorias_estimadas} kcal</span>}
            <span className="flex items-center gap-1"><Clock size={12} /> Preço: R$ {ficha.preco_venda.toFixed(2)}</span>
          </div>
        </div>
        <div className="flex items-center gap-sm">
          <Button variant="ghost" onClick={onClose} className="h-[44px]">
            <X size={18} /> Fechar
          </Button>
          <Button onClick={() => window.print()} className="h-[44px]">
            <Printer size={18} /> Imprimir Ficha
          </Button>
        </div>
      </div>

      {/* Tags & Allergens */}
      <div className="flex flex-wrap gap-2 mb-md">
        {ficha.tags.map(tag => (
          <span key={tag} className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider ${TAG_LABELS[tag]?.color || 'text-[var(--color-primary)]'}`}>
            {TAG_LABELS[tag]?.label || tag}
          </span>
        ))}
{ficha.alergenos.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono bg-red-100/20 text-red-400 border border-red-400/30 flex items-center gap-1">
              <AlertTriangle size={10} /> Alérgenos
            </span>
            {ficha.alergenos.map(a => (
              <span key={a} className={`px-2.5 py-1 rounded-full text-[10px] font-mono ${ALERGENO_LABELS[a]?.color || 'bg-gray-100 text-gray-800'}`}>
                {ALERGENO_LABELS[a]?.label || a}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 mb-md border-b border-[rgba(255,255,255,0.06)] pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-md py-sm rounded-t-lg text-label-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)]'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'visao-geral' && <VisaoGeralTab ficha={ficha} />}
        {activeTab === 'ingredientes' && <IngredientesTab ficha={ficha} />}
        {activeTab === 'preparo' && <PreparoTab ficha={ficha} />}
        {activeTab === 'armazenamento' && <ArmazenamentoTab ficha={ficha} />}
        {activeTab === 'harmonizacao' && <HarmonizacaoTab ficha={ficha} />}
        {activeTab === 'nutricional' && <NutricionalTab ficha={ficha} />}
      </div>
    </div>
  );
}

function VisaoGeralTab({ ficha }: { ficha: FichaTecnicaItem }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
      <div className="space-y-4">
        <h3 className="text-title-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
          <Info size={18} className="text-[var(--color-primary)]" /> Informações Principais
        </h3>
        <dl className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><dt className="text-label-sm text-[var(--color-on-surface-variant)]">Categoria</dt><dd className="text-body-md font-medium">{ficha.categoria || '—'}</dd></div>
            <div><dt className="text-label-sm text-[var(--color-on-surface-variant)]">Dificuldade</dt><dd className="text-body-md font-medium">{DIFICULDADE_LABELS[ficha.dificuldade || 'medio']}</dd></div>
            <div><dt className="text-label-sm text-[var(--color-on-surface-variant)]">Teor Alcoólico</dt><dd className="text-body-md font-medium">{ficha.teor_alcoolico?.toFixed(1) || '—'}%</dd></div>
            <div><dt className="text-label-sm text-[var(--color-on-surface-variant)]">Preço de Venda</dt><dd className="text-body-md font-bold text-[var(--color-primary)]">R$ {ficha.preco_venda.toFixed(2)}</dd></div>
            <div><dt className="text-label-sm text-[var(--color-on-surface-variant)]">Custo Estimado</dt><dd className="text-body-md">R$ {ficha.custo_total?.toFixed(2) || '—'}</dd></div>
            <div><dt className="text-label-sm text-[var(--color-on-surface-variant)]">Margem de Lucro</dt><dd className="text-body-md font-bold text-[var(--color-tertiary)]">{ficha.margem_lucro?.toFixed(1) || '—'}%</dd></div>
          </div>
        </dl>
        
        {ficha.descricao && (
          <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
            <dt className="text-label-sm text-[var(--color-on-surface-variant)] mb-1">Descrição</dt>
            <dd className="text-body-md text-[var(--color-on-surface)]">{ficha.descricao}</dd>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <h3 className="text-title-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
          <Tag size={18} className="text-[var(--color-primary)]" /> Tags & Classificação
        </h3>
        <div className="flex flex-wrap gap-2">
          {ficha.tags.map(tag => (
            <span key={tag} className={`px-3 py-1.5 rounded-lg text-[11px] font-mono uppercase tracking-wider ${TAG_LABELS[tag]?.color || 'text-[var(--color-primary)]'}`}>
              {TAG_LABELS[tag]?.label || tag}
            </span>
          ))}
        </div>
        
        {ficha.alergenos.length > 0 && (
          <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
            <h4 className="text-label-md font-medium text-red-400 flex items-center gap-2 mb-2">
              <AlertTriangle size={16} /> Alérgenos Presentes
            </h4>
            <div className="flex flex-wrap gap-2">
              {ficha.alergenos.map(a => (
                <span key={a} className={`px-3 py-1.5 rounded-lg text-[11px] font-mono ${ALERGENO_LABELS[a]?.color || 'bg-gray-100 text-gray-800'}`}>
                  {ALERGENO_LABELS[a]?.label || a}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
          <h4 className="text-label-md font-medium text-[var(--color-on-surface-variant)] mb-2">Informações Nutricionais (estimadas por porção)</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--color-surface-container-high)] rounded-lg p-3 text-center">
              <dt className="text-[10px] text-[var(--color-outline)] uppercase tracking-wider">Calorias</dt>
              <dd className="text-2xl font-bold text-[var(--color-on-surface)]">{ficha.calorias_estimadas || '—'} kcal</dd>
            </div>
            <div className="bg-[var(--color-surface-container-high)] rounded-lg p-3 text-center">
              <dt className="text-[10px] text-[var(--color-outline)] uppercase tracking-wider">Carboidratos</dt>
              <dd className="text-2xl font-bold text-[var(--color-primary)]">{ficha.carboidratos_g || '—'} g</dd>
            </div>
            <div className="bg-[var(--color-surface-container-high)] rounded-lg p-3 text-center">
              <dt className="text-[10px] text-[var(--color-outline)] uppercase tracking-wider">Proteínas</dt>
              <dd className="text-2xl font-bold text-[var(--color-tertiary)]">{ficha.proteinas_g || '—'} g</dd>
            </div>
            <div className="bg-[var(--color-surface-container-high)] rounded-lg p-3 text-center">
              <dt className="text-[10px] text-[var(--color-outline)] uppercase tracking-wider">Gorduras</dt>
              <dd className="text-2xl font-bold text-[var(--color-secondary-container)]">{ficha.gorduras_g || '—'} g</dd>
            </div>
          </div>
          <p className="text-[10px] text-[var(--color-outline)] text-center mt-2">
            Valores estimados baseados na composição da receita. Podem variar conforme preparo e marcas dos insumos.
          </p>
        </div>
      </div>
    </div>
  );
}

function IngredientesTab({ ficha }: { ficha: FichaTecnicaItem }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-title-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
          <Package size={18} className="text-[var(--color-primary)]" /> Ingredientes da Receita
        </h3>
        <div className="text-label-sm text-[var(--color-on-surface-variant)]">
          {ficha.ingredientes.length} item(ns) • Custo total: R$ {ficha.custo_total?.toFixed(2) || '0.00'}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[var(--color-on-surface-variant)] border-b border-[rgba(255,255,255,0.06)]">
              <th className="pb-2 font-medium">Insumo</th>
              <th className="pb-2 font-medium text-center">Qtd.</th>
              <th className="pb-2 font-medium text-center">Un.</th>
              <th className="pb-2 font-medium text-right">Custo Unit.</th>
              <th className="pb-2 font-medium text-right">Subtotal</th>
              <th className="pb-2 font-medium text-center">% do Custo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(255,255,255,0.03)]">
            {ficha.ingredientes.map((ing, idx) => {
              const subtotal = ing.quantidade * (ing.custo_unitario || 0);
              const pct = ficha.custo_total ? (subtotal / ficha.custo_total) * 100 : 0;
              return (
                <tr key={idx} className="hover:bg-[var(--color-surface-container-high)]/50">
                  <td className="py-2 font-medium text-[var(--color-on-surface)]">{ing.nome}</td>
                  <td className="py-2 text-center font-mono text-[var(--color-on-surface)]">{ing.quantidade}</td>
                  <td className="py-2 text-center text-[var(--color-on-surface-variant)]">{ing.unidade_medida}</td>
                  <td className="py-2 text-right text-[var(--color-on-surface-variant)]">R$ {(ing.custo_unitario || 0).toFixed(2)}</td>
                  <td className="py-2 text-right font-mono text-[var(--color-on-surface)]">R$ {subtotal.toFixed(2)}</td>
                  <td className="py-2 text-center">
                    <div className="w-full h-1.5 bg-[var(--color-surface-container-high)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--color-primary)] transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-[var(--color-outline)] mt-0.5 block">{pct.toFixed(1)}%</span>
                  </td>
                </tr>
              );
            })}
            <tr className="bg-[var(--color-primary)]/5 border-t-2 border-[var(--color-primary)]">
              <td className="py-2 font-semibold text-[var(--color-primary)]">TOTAL</td>
              <td className="py-2 text-center font-mono text-[var(--color-primary)]">{ficha.ingredientes.reduce((s, i) => s + i.quantidade, 0).toFixed(2)}</td>
              <td></td>
              <td></td>
              <td className="py-2 text-right font-bold text-[var(--color-primary)]">R$ {ficha.custo_total?.toFixed(2) || '0.00'}</td>
              <td className="py-2 text-center text-[var(--color-primary)]">100%</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
        <h4 className="text-label-md font-medium text-[var(--color-on-surface-variant)] mb-2">Observações sobre Ingredientes</h4>
        <ul className="space-y-1 text-sm text-[var(--color-on-surface-variant)]">
          <li>• Use sempre insumos frescos e de qualidade para melhor resultado</li>
          <li>• Ajuste quantidades de xarope/doçura conforme preferência do cliente</li>
          <li>• Gelo deve ser abundante e de boa qualidade (gelo seco derrete mais devagar)</li>
          <li>• Guarnições frescas elevam a experiência sensorial do drink</li>
        </ul>
      </div>
    </div>
  );
}

function PreparoTab({ ficha }: { ficha: FichaTecnicaItem }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-title-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
          <ChefHat size={18} className="text-[var(--color-primary)]" /> Modo de Preparo
        </h3>
        <span className="text-label-sm text-[var(--color-on-surface-variant)]">{ficha.preparo.length} etapa(s)</span>
      </div>
      
      <div className="space-y-3">
        {ficha.preparo.map((passo, idx) => (
          <div key={idx} className="flex gap-md p-md bg-[var(--color-surface-container-high)]/50 rounded-xl border border-[rgba(255,255,255,0.06)]">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-bold text-lg">
              {passo.ordem}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-body-md font-semibold text-[var(--color-on-surface)]">{passo.descricao}</h4>
                {passo.tecnica && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-wider bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                    {passo.tecnica.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-md text-sm text-[var(--color-on-surface-variant)]">
                {passo.tempo_segundos && (
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {passo.tempo_segundos}s
                  </span>
                )}
                {passo.observacao && (
                  <span className="flex items-center gap-1">
                    <Info size={12} /> {passo.observacao}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
        <h4 className="text-label-md font-medium text-[var(--color-on-surface-variant)] mb-2">Dicas do Bartender</h4>
        <ul className="space-y-1 text-sm text-[var(--color-on-surface-variant)]">
          <li>• Respeite a ordem dos ingredientes para melhor integração</li>
          <li>• Use gelo abundante e de qualidade — diluição controlada é essencial</li>
          <li>• Prove antes de servir — ajuste doçura/acidez se necessário</li>
          <li>• A guarnição não é apenas decorativa: complementa aroma e sabor</li>
          <li>• Sirva imediatamente após o preparo para melhor experiência</li>
        </ul>
      </div>
    </div>
  );
}

function ArmazenamentoTab({ ficha }: { ficha: FichaTecnicaItem }) {
  return (
    <div className="space-y-4">
      <h3 className="text-title-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
        <Thermometer size={18} className="text-[var(--color-primary)]" /> Armazenamento e Validade
      </h3>
      
      <div className="space-y-3">
        {ficha.armazenamento.map((item, idx) => (
          <div key={idx} className="p-md bg-[var(--color-surface-container-high)]/50 rounded-xl border border-[rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-md mb-2">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                <Package size={20} />
              </div>
              <div>
                <h4 className="font-semibold text-[var(--color-on-surface)] capitalize">{item.tipo}</h4>
                <p className="text-sm text-[var(--color-on-surface-variant)]">
                  {item.temperatura_min !== null && item.temperatura_max !== null && (
                    <span className="flex items-center gap-1"><Thermometer size={12} /> {item.temperatura_min}°C a {item.temperatura_max}°C</span>
                  )}
                  {item.tempo_maximo_dias && (
                    <span className="flex items-center gap-1 ml-2"><Clock size={12} /> Validade: {item.tempo_maximo_dias} dia(s)</span>
                  )}
                </p>
              </div>
            </div>
            {item.observacao && (
              <p className="text-sm text-[var(--color-on-surface-variant)] ml-10">{item.observacao}</p>
            )}
          </div>
        ))}
      </div>
      
      <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
        <h4 className="text-label-md font-medium text-[var(--color-on-surface-variant)] mb-2">Boas Práticas</h4>
        <ul className="space-y-1 text-sm text-[var(--color-on-surface-variant)]">
          <li>• Mantenha recipientes sempre bem fechados para evitar oxidação</li>
          <li>• Rotule com data de preparo e validade</li>
          <li>• Armazene destilados em pé para evitar contato da rolha com o líquido</li>
          <li>• Xaropes e sucos frescos: consumir em até 48h</li>
          <li>• Verifique temperatura da geladeira diariamente (ideal: 2-8°C)</li>
        </ul>
      </div>
    </div>
  );
}

function HarmonizacaoTab({ ficha }: { ficha: FichaTecnicaItem }) {
  return (
    <div className="space-y-4">
      <h3 className="text-title-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
        <Wine size={18} className="text-[var(--color-primary)]" /> Sugestões de Harmonização
      </h3>
      
      {ficha.harmonizacao.length > 0 ? (
        <div className="space-y-3">
          {ficha.harmonizacao.map((item, idx) => (
            <div key={idx} className="p-md bg-[var(--color-surface-container-high)]/50 rounded-xl border border-[rgba(255,255,255,0.06)] flex items-start gap-md">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)]">
                {item.tipo === 'entrada' && <Coffee size={20} />}
                {item.tipo === 'prato_principal' && <Flame size={20} />}
                {item.tipo === 'sobremesa' && <HeartPulse size={20} />}
                {item.tipo === 'petisco' && <Package size={20} />}
                {!['entrada', 'prato_principal', 'sobremesa', 'petisco'].includes(item.tipo || '') && <Wine size={20} />}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-[var(--color-on-surface)]">{item.descricao}</h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]">
                  {item.tipo || 'Geral'}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-lg text-[var(--color-on-surface-variant)]">
          <Wine size={32} className="mx-auto mb-2 opacity-30" />
          <p>Nenhuma harmonização cadastrada para este item.</p>
          <p className="text-sm mt-1">Consulte o bartender para sugestões personalizadas.</p>
        </div>
      )}
      
      <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
        <h4 className="text-label-md font-medium text-[var(--color-on-surface-variant)] mb-2">Princípios de Harmonização</h4>
        <ul className="space-y-1 text-sm text-[var(--color-on-surface-variant)]">
          <li>• <strong>Semelhança:</strong> Sabores que se complementam (cítrico + peixe, doce + sobremesa)</li>
          <li>• <strong>Contraste:</strong> Sabores que se equilibram (ácido + gorduroso, doce + salgado)</li>
          <li>• <strong>Intensidade:</strong> Drinks leves com pratos leves; drinks fortes com pratos robustos</li>
          <li>• <strong>Regionalidade:</strong> Combine bebidas e comidas da mesma origem cultural</li>
        </ul>
      </div>
    </div>
  );
}

function NutricionalTab({ ficha }: { ficha: FichaTecnicaItem }) {
  return (
    <div className="space-y-4">
      <h3 className="text-title-sm font-semibold text-[var(--color-on-surface)] flex items-center gap-2">
        <HeartPulse size={18} className="text-[var(--color-primary)]" /> Informações Nutricionais
      </h3>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md">
        <NutrientCard label="Calorias" value={`${ficha.calorias_estimadas || '—'} kcal`} icon={Flame} color="text-red-400" />
        <NutrientCard label="Carboidratos" value={`${ficha.carboidratos_g || '—'} g`} icon={WheatOff} color="text-amber-400" />
        <NutrientCard label="Proteínas" value={`${ficha.proteinas_g || '—'} g`} icon={Scale} color="text-blue-400" />
        <NutrientCard label="Gorduras" value={`${ficha.gorduras_g || '—'} g`} icon={Droplet} color="text-green-400" />
      </div>
      
      <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
        <h4 className="text-label-md font-medium text-[var(--color-on-surface-variant)] mb-2">Observações Importantes</h4>
        <ul className="space-y-1 text-sm text-[var(--color-on-surface-variant)]">
          <li>• Valores <strong>estimados</strong> baseados na composição padrão dos insumos da receita</li>
          <li>• Podem variar conforme marcas, safras e modo de preparo</li>
          <li>• Não substitui análise laboratorial oficial para fins regulatórios</li>
          <li>• Considere variações de ±15% nas estimativas</li>
          <li>• Para informações precisas, consulte fichas técnicas dos fabricantes dos insumos</li>
        </ul>
      </div>
      
      {ficha.alergenos.length > 0 && (
        <div className="pt-4 border-t border-[rgba(255,255,255,0.06)]">
          <h4 className="text-label-md font-medium text-red-400 flex items-center gap-2 mb-2">
            <AlertTriangle size={16} /> Alérgenos Identificados
          </h4>
          <div className="flex flex-wrap gap-2">
            {ficha.alergenos.map(a => (
              <span key={a} className={`px-3 py-1.5 rounded-lg text-[11px] font-mono ${ALERGENO_LABELS[a]?.color || 'bg-gray-100 text-gray-800'}`}>
                {ALERGENO_LABELS[a]?.label || a}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NutrientCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="bg-[var(--color-surface-container-high)]/50 rounded-xl p-md border border-[rgba(255,255,255,0.06)] text-center">
      <Icon size={24} className={`mx-auto mb-2 ${color}`} />
      <dt className="text-[10px] text-[var(--color-outline)] uppercase tracking-wider mb-1">{label}</dt>
      <dd className="text-2xl font-bold text-[var(--color-on-surface)]">{value}</dd>
    </div>
  );
}


