import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, Store } from 'lucide-react';
import type { Produto } from '../types';
import api from '../services/api';

const categoryNames: Record<string, string> = {
  Drinks: 'Drinks',
  Cervejas: 'Cervejas',
  Bebidas: 'Bebidas',
  Porções: 'Porções',
  Destilado: 'Destilados',
  Coquetel: 'Coquetéis',
  'Não Alcoólico': 'Não Alcoólicos',
  Vinhos: 'Vinhos',
  Chopps: 'Chopps',
};

function getCatName(cat: string) {
  return categoryNames[cat] || cat;
}

const categoryOrder = ['Drinks', 'Bebidas', 'Cervejas', 'Destilados', 'Coquetéis', 'Vinhos', 'Chopps', 'Porções', 'Não Alcoólicos'];

const catAccent: Record<string, string> = {
  Drinks: 'var(--color-primary-container)',
  Cervejas: 'var(--color-secondary-container)',
  Bebidas: 'var(--color-primary-container)',
  Porções: 'var(--color-tertiary-container)',
  Destilados: 'var(--color-secondary-container)',
  Coquetéis: 'var(--color-primary-container)',
  'Não Alcoólicos': 'var(--color-tertiary-container)',
  Vinhos: 'var(--color-secondary-container)',
  Chopps: 'var(--color-primary-container)',
};

function getCatAccent(cat: string) {
  return catAccent[cat] || 'var(--color-primary-container)';
}

export default function CardapioDigital() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const mainRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get('/cardapio/')
      .then((res) => setProdutos(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return produtos;
    const q = search.toLowerCase();
    return produtos.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        (p.descricao && p.descricao.toLowerCase().includes(q)) ||
        getCatName(p.categoria).toLowerCase().includes(q)
    );
  }, [produtos, search]);

  const grouped = useMemo(() => {
    const groups: Record<string, Produto[]> = {};
    for (const p of filtered) {
      const cat = p.categoria || 'Outros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    }
    return Object.entries(groups).sort(([a], [b]) => {
      const ia = categoryOrder.indexOf(getCatName(a));
      const ib = categoryOrder.indexOf(getCatName(b));
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  }, [filtered]);

  const categories = useMemo(() => grouped.map(([cat]) => cat), [grouped]);

  useEffect(() => {
    if (grouped.length > 0 && !activeCategory) {
      setActiveCategory(grouped[0][0]);
    }
  }, [grouped, activeCategory]);

  useEffect(() => {
    const main = mainRef.current;
    if (!main || grouped.length === 0) return;

    const handleScroll = () => {
      const scrollTop = main.scrollTop;
      const headerOffset = 140;

      let current = grouped[0][0];
      for (const [cat] of grouped) {
        const el = sectionRefs.current.get(cat);
        if (el && el.offsetTop - headerOffset <= scrollTop) {
          current = cat;
        }
      }
      setActiveCategory(current);
    };

    main.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => main.removeEventListener('scroll', handleScroll);
  }, [grouped]);

  const scrollToCategory = useCallback((cat: string) => {
    const el = sectionRefs.current.get(cat);
    const main = mainRef.current;
    if (el && main) {
      main.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
    }
  }, []);

  const setSectionRef = useCallback(
    (cat: string) => (el: HTMLElement | null) => {
      if (el) sectionRefs.current.set(cat, el);
      else sectionRefs.current.delete(cat);
    },
    []
  );

  return (
    <div className="h-screen flex flex-col bg-[var(--color-background)] text-[var(--color-on-surface)]">
      <header className="sticky top-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[rgba(var(--overlay-rgb),0.06)]">
        <div className="px-lg pt-md pb-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-container)] flex items-center justify-center shadow-[0_0_12px_rgba(0,229,255,0.2)]">
                <Store size={20} className="text-[var(--color-on-primary-container)]" />
              </div>
              <div>
                <h1 className="text-[18px] font-bold tracking-tight text-[var(--color-on-surface)] leading-tight">
                  BARIZE
                </h1>
                <p className="text-[10px] font-mono text-[var(--color-on-surface-variant)] uppercase tracking-[0.15em]">
                  Cardápio Digital
                </p>
                      </div>
                    </div>
            <span className="text-label-md text-[var(--color-outline)]">
              {filtered.length} {filtered.length === 1 ? 'item' : 'itens'}
            </span>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" />
            <input
              type="text"
              placeholder="Buscar no cardápio..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.06)] rounded-lg pl-9 pr-3 py-2 text-body-md outline-none text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]/40 transition-all duration-200 focus:border-[var(--color-primary-container)] focus:shadow-[0_0_0_1px_var(--color-primary-container)]"
            />
          </div>
        </div>

        {categories.length > 0 && (
          <nav
            ref={navRef}
            className="px-lg pb-2.5 overflow-x-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <style>{'nav::-webkit-scrollbar { display: none; }'}</style>
            <div className="flex gap-2 min-w-max">
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                const accent = getCatAccent(getCatName(cat));
                return (
                  <button
                    key={cat}
                    onClick={() => scrollToCategory(cat)}
                    className={[
                      'relative px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap',
                      'transition-all duration-300 ease-out select-none border',
                      isActive
                        ? 'text-[var(--color-on-primary-container)] border-transparent shadow-[0_0_16px_rgba(0,229,255,0.2)]'
                        : 'text-[var(--color-on-surface-variant)] border-[rgba(var(--overlay-rgb),0.08)] hover:text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)] hover:border-[rgba(var(--overlay-rgb),0.15)]',
                    ].join(' ')}
                    style={{
                      backgroundColor: isActive ? accent : 'var(--color-surface-container-high)',
                    }}
                  >
                    {getCatName(cat)}
                  </button>
                );
              })}
            </div>
          </nav>
        )}
      </header>

      <main
        ref={mainRef}
        className="flex-1 overflow-y-scroll"
        style={{ scrollbarGutter: 'stable' }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[var(--color-primary-container)] border-t-transparent rounded-full animate-spin" />
              <span className="text-label-md text-[var(--color-outline)]">Carregando cardápio...</span>
            </div>
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-lg">
            <div className="w-16 h-16 rounded-full bg-[var(--color-surface-container)] flex items-center justify-center">
              <Search size={28} className="text-[var(--color-outline)] opacity-40" />
            </div>
            <p className="text-body-md text-[var(--color-on-surface-variant)]">
              {search ? 'Nenhum item encontrado' : 'Cardápio vazio'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-label-md text-[var(--color-primary)] hover:underline focus:outline-none"
              >
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          <div className="px-lg py-md space-y-8">
            {grouped.map(([cat, items]) => (
              <section
                key={cat}
                ref={setSectionRef(cat)}
                data-category={cat}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-1 h-7 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getCatAccent(getCatName(cat)) }}
                  />
                  <h2 className="text-headline-md font-bold text-[var(--color-on-surface)]">
                    {getCatName(cat)}
                  </h2>
                  <span className="text-label-md text-[var(--color-outline)] ml-auto">
                    {items.length}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {items.map((produto, idx) => (
                    <div
                      key={produto.id}
                      className="group relative bg-[var(--color-surface-container)] rounded-xl border border-[rgba(var(--overlay-rgb),0.06)] hover:border-[var(--color-primary-container)]/30 transition-all duration-500 ease-out overflow-hidden"
                      style={{
                        animation: 'fadeIn 0.35s ease-out both',
                        animationDelay: `${(idx % 4) * 60}ms`,
                      }}
                    >
                      <div className="aspect-[16/10] w-full overflow-hidden relative bg-[var(--color-surface-container-high)]">
                        {produto.foto_url ? (
                          <img
                            src={produto.foto_url}
                            alt={produto.nome}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          />
                        ) : produto.imagem ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl transition-transform duration-500 group-hover:scale-110">
                              {produto.imagem}
                            </span>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-4xl opacity-20">???</span>
                          </div>
                        )}

                        <span
                          className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase tracking-wider border pointer-events-none"
                          style={{
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            borderColor: `color-mix(in srgb, ${getCatAccent(getCatName(cat))} 40%, transparent)`,
                            color: getCatAccent(getCatName(cat)),
                          }}
                        >
                          {getCatName(produto.categoria)}
                        </span>

                        <div
                          className="absolute top-0 left-2 right-2 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ backgroundColor: getCatAccent(getCatName(produto.categoria)) }}
                        />
                      </div>

                      <div className="p-3 space-y-1">
                        <h3 className="text-[13px] font-semibold leading-snug text-[var(--color-on-surface)] break-words">
                          {produto.nome}
                        </h3>
                        {produto.descricao && (
                          <p className="text-[11px] text-[var(--color-on-surface-variant)] leading-tight line-clamp-2">
                            {produto.descricao}
                          </p>
                        )}
                        <span
                          className="inline-block font-mono text-[15px] font-semibold tracking-tight"
                          style={{ color: getCatAccent(getCatName(produto.categoria)) }}
                        >
                          R$ {produto.preco_venda.toFixed(2)}
                        </span>
                      </div>

                      {produto.ingredientes && (
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-16px)] opacity-0 group-hover:opacity-100 translate-y-0 group-hover:-translate-y-full transition-all duration-300 ease-out pointer-events-none">
                          <div className="bg-[var(--color-surface-container-high)] text-[11px] leading-snug text-[var(--color-on-surface-variant)] px-3 py-2 rounded-lg border border-[rgba(var(--overlay-rgb),0.06)] shadow-xl backdrop-blur-sm">
                            <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--color-primary-container)] block mb-0.5">Ingredientes</span>
                            {produto.ingredientes}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {!loading && grouped.length > 0 && (
          <footer className="text-center py-6 px-lg">
            <div className="w-12 h-0.5 bg-[var(--color-surface-container-high)] mx-auto mb-4 rounded-full" />
            <p className="text-label-md text-[var(--color-outline)] mb-1">
              BARIZE — Cardápio Digital
            </p>
            <p className="text-[10px] font-mono text-[var(--color-outline)]/50 tracking-wider">
              &copy; {new Date().getFullYear()} Todos os direitos reservados
            </p>
          </footer>
        )}
      </main>
    </div>
  );
}

