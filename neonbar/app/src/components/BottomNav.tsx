import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Settings,
  Store,
  CookingPot,
  DollarSign,
  TrendingUp,
  Tag,
  BookOpen,
  Truck,
  ClipboardList,
  Calculator,
  BarChart3,
  Utensils,
} from 'lucide-react';

const mainTabs = [
  { to: '/', icon: LayoutDashboard, label: 'Início' },
  { to: '/comandas', icon: ClipboardList, label: 'Pedidos' },
  { to: '/pdv', icon: ShoppingCart, label: 'PDV' },
  { to: '/sala', icon: Store, label: 'Mesas' },
  { to: '/mais', icon: Settings, label: 'Mais' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="safe-bottom border-t border-[rgba(var(--overlay-rgb),0.1)] bg-[rgba(var(--glass-rgb),0.8)] backdrop-blur-[16px]">
      <div className="flex items-center justify-around px-2 py-1">
        {mainTabs.map((tab) => {
          const isActive = tab.to === '/'
            ? location.pathname === '/' || location.pathname === '/dashboard'
            : tab.to === '/comandas'
            ? location.pathname === '/comandas' || location.pathname.startsWith('/fila-preparo')
            : tab.to === '/sala'
            ? location.pathname === '/sala'
            : location.pathname.startsWith(tab.to);
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className="flex flex-col items-center gap-0.5 py-1.5 px-3 rounded-lg transition-colors"
              style={{
                color: isActive ? 'var(--color-primary-container)' : 'var(--color-outline)',
              }}
            >
              <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'text-[var(--color-primary-container)]' : ''}`}>
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

/** Full menu for "Mais" page */
export const moreMenuItems = [
  { to: '/sala', icon: Store, label: 'Salão', desc: 'Mesas e atendimento' },
  { to: '/fila-preparo', icon: CookingPot, label: 'Fila de Preparo', desc: 'Cozinha e bar' },
  { to: '/cardapio', icon: Utensils, label: 'Cardápio Digital', desc: 'Visualizar cardápio' },
  { to: '/fichas-tecnicas', icon: BookOpen, label: 'Ficha Técnica', desc: 'Receitas e insumos' },
  { to: '/precificacao', icon: TrendingUp, label: 'Precificação', desc: 'Margens e preços' },
  { to: '/etiquetas', icon: Tag, label: 'Etiquetas', desc: 'Impressão de etiquetas' },
  { to: '/analise-estoque', icon: BarChart3, label: 'Análise Estoque', desc: 'Relatórios de estoque' },
  { to: '/caixa', icon: DollarSign, label: 'Caixa', desc: 'Controle financeiro' },
  { to: '/financeiro', icon: TrendingUp, label: 'Financeiro', desc: 'Dashboard financeiro' },
  { to: '/cmv', icon: Calculator, label: 'CMV', desc: 'Custo da mercadoria' },
  { to: '/dre', icon: BarChart3, label: 'DRE', desc: 'Demonstração do resultado' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios', desc: 'Relatórios gerenciais' },
  { to: '/fornecedores', icon: Truck, label: 'Fornecedores', desc: 'Gestão de fornecedores' },
  { to: '/pops', icon: ClipboardList, label: 'Checklist', desc: 'Procedimentos operacionais' },
  { to: '/admin', icon: Settings, label: 'Administração', desc: 'Configurações do sistema' },
];
