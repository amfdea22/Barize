import { useState, useEffect, useMemo } from 'react';
import type { Produto } from '../types';
import api from '../services/api';

const demoItems = [
  {
    id: 1,
    nome: 'Negroni Clássico',
    descricao: 'Gin, Campari, Vermute tinto doce e twist de laranja.',
    categoria: 'Drinks',
    preco: 32,
    imagem: '🍹',
    foto_url: 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=400&h=300&fit=crop'
  },
  {
    id: 2,
    nome: 'Moscow Mule',
    descricao: 'Vodka, espuma de gengibre, limão tahiti e xarope simples.',
    categoria: 'Drinks',
    preco: 28,
    imagem: '🍹',
    foto_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&h=300&fit=crop'
  },
  {
    id: 3,
    nome: 'Fritas Trufadas',
    descricao: 'Batatas fritas rústicas com azeite trufado e parmesão ralado.',
    categoria: 'Porções',
    preco: 35,
    imagem: '🍟',
    foto_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop'
  },
  {
    id: 4,
    nome: 'Old Fashioned',
    descricao: 'Bourbon premium, bitters de angostura, torrão de açúcar e casca de laranja.',
    categoria: 'Drinks',
    preco: 35,
    imagem: '🥃',
    foto_url: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&h=300&fit=crop'
  },
  {
    id: 5,
    nome: 'Dry Martini',
    descricao: 'Gin London Dry, Vermute seco e azeitona siciliana ou twist de limão.',
    categoria: 'Drinks',
    preco: 30,
    imagem: '🍸',
    foto_url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop'
  },
  {
    id: 6,
    nome: 'Cosmopolitan',
    descricao: 'Vodka, Cointreau, suco de cranberry e suco de limão fresco.',
    categoria: 'Drinks',
    preco: 29,
    imagem: '🍹',
    foto_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop'
  },
  {
    id: 7,
    nome: 'Whisky Sour',
    descricao: 'Bourbon, suco de limão, xarope de açúcar e clara de ovo pasteurizada.',
    categoria: 'Drinks',
    preco: 33,
    imagem: '🥃',
    foto_url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=300&fit=crop'
  }
];

const categories = [
  { id: 'coqueteis', label: 'Coquetéis', icon: 'local_bar', filter: ['Drinks', 'Coquetéis'] },
  { id: 'vinhos', label: 'Vinhos', icon: 'wine_bar', filter: ['Vinhos'] },
  { id: 'cervejas', label: 'Cervejas', icon: 'sports_bar', filter: ['Cervejas', 'Chopps'] },
  { id: 'petiscos', label: 'Petiscos', icon: 'restaurant', filter: ['Porções'] },
];

function getCategoryForProduct(cat: string): string {
  const lower = cat.toLowerCase();
  if (lower.includes('drink') || lower.includes('coquetel')) return 'coqueteis';
  if (lower.includes('vinho')) return 'vinhos';
  if (lower.includes('cerveja') || lower.includes('chopp')) return 'cervejas';
  if (lower.includes('porção') || lower.includes('petisco')) return 'petiscos';
  return 'coqueteis';
}

function getBadge(produto: Produto): { text: string; color: string } | null {
  if ((produto as any).novidade) return { text: 'Novo', color: 'bg-primary-container text-on-primary-fixed' };
  if ((produto as any).popular) return { text: 'Popular', color: 'bg-surface-container-highest text-on-surface border border-outline/30' };
  return null;
}

const smartDescriptions: Record<string, string> = {
  // Drinks
  'mojito': 'Refrescante combinação de rum branco, hortelã fresca, limão tahiti e açúcar. Servido com água sanitária.',
  'caipirinha': 'A clássica brasileira com cachaça artesanal, limão tahiti fresco e açúcar. Perfecção em cada gole.',
  'piña colada': 'Rum, leite de coco e abacaxi fresco. Uma fuga tropical para o paraíso.',
  'margarita': 'Tequila premium, licor de laranja e suco de limão fresco. Bordas de sal opcional.',
  'mojito de frutas': 'Rum branco com frutas frescas da estação, hortelã e limão. Refrescante e vibrante.',
  'gin tonic': 'Gin artesanal com água tônica premium e botanicals frescos. Elegância em cada gole.',
  'vodka tonic': 'Vodka premium com água tônica e frutas cítricas. Simplicidade sofisticada.',
  'rum and coke': 'Rum escuro com cola artesanal e uma pitada de limão. Clássico atemporal.',
  'whiskey cola': 'Whiskey bourbon com cola artesanal e gelo. Tradição e sabor.',
  'café martini': 'Vodka, licor de café espresso e xarope de açúcar. Energia e sofisticação.',
  
  // Cervejas
  'lager': 'Cerveja lager refrescante com notas de malte e lúpulo equilibrados. Perfeita para os dias quentes.',
  'ipa': 'India Pale Ale com notas cítricas e florais. Amargor marcante e final persistente.',
  'stout': 'Cerveja escura e encorpada com notas de café e chocolate. Perfeita para noites frias.',
  'pilsner': 'Cerveja clara e refrescante com amargor sutil. Equilíbrio perfeito.',
  'weiss': 'Cerveja de trigo alemã com notas de banana e cravo. Suave e refrescante.',
  'amber': 'Cerveja ámbar com notas de caramelo e malte tostado. Sabor equilibrado.',
  'ale': 'Cerveja artesanal com notas frutadas e especiadas. Caráter único.',
  
  // Vinhos
  'tinto': 'Vinho tinto encorpado com notas de frutas escuras e especiadas. Perfeito com carnes vermelhas.',
  'branco': 'Vinho branco fresco com notas cítricas e florais. Ideal com peixes e frutos do mar.',
  'rosé': 'Vinho rosé refrescante com notas de frutas vermelhas. Perfeito para dias quentes.',
  'espumante': 'Espumante elegante com bolhas finas e persistentes. Celebre os momentos especiais.',
  'champagne': 'Champagne autêntico com notas de pão torrado e frutas secas. Luxo em cada gole.',
  
  // Porções
  'batata frita': 'Batatas crocantes por fora e macias por dentro. Temperadas com sal e ervas finas.',
  'onion rings': 'Anéis de cebola empanados e crocantes. Acompanham molho especial da casa.',
  'nachos': 'Tortilhas crocantes com queijo derretido, guacamole e sour cream. Perfeito para compartilhar.',
  'bolinho de bacalhau': 'Bolinhos crocantes com bacalhau fresco e ervas. Tradição portuguesa.',
  'espetinho': 'Espetinhos grelhados com carne suculenta e temperos especiais.',
  'porção de frios': 'Seleção de queijos, presuntos e azeitonas. Perfeito para acompanhar vinhos.',
};

function getSmartDescription(nome: string, categoria: string, descricaoOriginal?: string): string {
  if (descricaoOriginal && descricaoOriginal.trim()) {
    return descricaoOriginal;
  }
  
  const nomeLower = nome.toLowerCase();
  
  // Procura por correspondência exata
  for (const [key, desc] of Object.entries(smartDescriptions)) {
    if (nomeLower.includes(key)) {
      return desc;
    }
  }
  
  // Descrições genéricas por categoria
  const genericByCategory: Record<string, string> = {
    'Drinks': `Coquetel artesanal ${nome} preparado com ingredientes selecionados e técnicas Premium.`,
    'Cervejas': `Cerveja ${nome} com sabor único e personalidade marcante.`,
    'Vinhos': `Vinho ${nome} com notas complexas e final elegante.`,
    'Porções': `Porção ${nome} preparada na hora com ingredientes frescos.`,
    'Destilados': `Destilado ${nome} de qualidade premium.`,
    'Não Alcoólicos': `Bebida ${nome} refrescante e saborosa.`,
  };
  
  return genericByCategory[categoria] || `Produto ${nome} com qualidade garantida.`;
}

export default function CardapioDigital() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('coqueteis');

  useEffect(() => {
    api.get('/cardapio/')
      .then((res) => setProdutos(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const allItems = [...demoItems, ...produtos];
    return allItems.filter((p) => getCategoryForProduct(p.categoria) === activeCategory);
  }, [produtos, activeCategory]);

  return (
    <div className="min-h-screen bg-background text-on-background pb-[100px] pt-[220px]">
      {/* Header - Glassmorphism */}
      <header className="glassmorphism fixed top-0 w-full z-50 border-b border-outline/20 flex flex-col items-center justify-center py-4 px-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-primary-container shadow-[0_0_15px_rgba(0,229,255,0.4)] mb-3 flex items-center justify-center bg-black mx-auto">
          <img
            src="/barize-logo.png"
            alt="Barize Logo"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
          <span className="material-symbols-outlined text-primary-container text-5xl hidden" data-weight="fill">local_bar</span>
        </div>
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl tracking-[0.2em] text-on-surface font-light uppercase">
            Barize
          </h1>
          <span className="text-[10px] text-primary/80 uppercase tracking-[0.3em] mt-2 font-medium">
            Cardápio Digital
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1200px] mx-auto px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-2 border-primary-container/30 border-t-primary-container rounded-full animate-spin mb-4" />
            <p className="text-on-surface-variant text-sm">Carregando cardápio...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4">local_bar</span>
            <p className="text-on-surface-variant text-sm">Nenhum item encontrado</p>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((produto) => {
              const badge = getBadge(produto);
              return (
                <article
                  key={produto.id}
                  className="bg-[#2a2a2a] rounded-2xl overflow-hidden flex md:flex-col hover:shadow-lg hover:shadow-primary-container/20 hover:border-primary-container/50 transition-all duration-300 group border border-outline/20"
                >
                  {/* Image */}
                  <div className="w-[130px] md:w-full md:h-[220px] flex-shrink-0 bg-surface-container relative overflow-hidden">
                    {produto.foto_url ? (
                      <img
                        src={produto.foto_url}
                        alt={produto.nome}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-5xl">{produto.imagem || '🍹'}</span>
                      </div>
                    )}
                    {badge && (
                      <div className={`absolute top-2 right-2 ${badge.color} px-2 py-0.5 rounded text-[10px] uppercase shadow-sm font-medium`}>
                        {badge.text}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col justify-between flex-1">
                    <div>
                      <h3 className="text-headline-md text-on-surface line-clamp-1 group-hover:text-primary transition-colors">
                        {produto.nome}
                      </h3>
                      <p className="text-body-md text-on-surface-variant line-clamp-2 mt-1">
                        {getSmartDescription(produto.nome, produto.categoria, produto.descricao)}
                      </p>
                      {produto.preco > 0 && (
                        <div className="flex items-baseline gap-1 mt-3">
                          <span className="text-[10px] text-primary/60 font-medium">R$</span>
                          <span className="text-primary-container font-semibold text-lg tracking-tight">
                            {produto.preco.toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {/* Bottom Navigation - Material Symbols */}
      <nav className="glassmorphism fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 py-4 border-t border-outline/30 md:hidden">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex flex-col items-center justify-center transition-all active:scale-90 duration-150 ${
                isActive ? 'text-primary-container' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[28px] ${isActive ? 'font-semibold' : ''}`}
                {...(isActive ? { 'data-weight': 'fill' } : {})}
              >
                {cat.icon}
              </span>
              <span className="text-[10px] mt-1 font-medium">
                {cat.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
