import { useNavigate } from 'react-router-dom';
import {
  Store,
  CookingPot,
  Utensils,
  BookOpen,
  TrendingUp,
  Tag,
  BarChart3,
  DollarSign,
  Calculator,
  Truck,
  ClipboardList,
  Settings,
  X,
  ShoppingCart,
  Package,
  Users,
  LogOut,
} from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
}

const menuSections = [
  {
    title: 'Operação',
    color: 'text-[var(--color-primary-container)]',
    items: [
      { to: '/pdv', icon: ShoppingCart, label: 'PDV', color: 'text-[var(--color-primary-container)]', bg: 'bg-[var(--color-primary-container)]/20' },
      { to: '/sala', icon: Store, label: 'Salão', color: 'text-[var(--color-primary-container)]', bg: 'bg-[var(--color-primary-container)]/20' },
      { to: '/comandas', icon: ClipboardList, label: 'Pedidos', color: 'text-[var(--color-primary-container)]', bg: 'bg-[var(--color-primary-container)]/20' },
      { to: '/fila-preparo', icon: CookingPot, label: 'Fila de Preparo', color: 'text-amber-400', bg: 'bg-amber-400/20' },
      { to: '/cardapio', icon: Utensils, label: 'Cardápio Digital', color: 'text-emerald-400', bg: 'bg-emerald-400/20' },
    ],
  },
  {
    title: 'Gestão',
    color: 'text-[var(--color-secondary-container)]',
    items: [
      { to: '/estoque', icon: Package, label: 'Estoque', color: 'text-[var(--color-secondary-container)]', bg: 'bg-[var(--color-secondary-container)]/20' },
      { to: '/fichas-tecnicas', icon: BookOpen, label: 'Fichas Técnicas', color: 'text-purple-400', bg: 'bg-purple-400/20' },
      { to: '/precificacao', icon: TrendingUp, label: 'Precificação', color: 'text-emerald-400', bg: 'bg-emerald-400/20' },
      { to: '/etiquetas', icon: Tag, label: 'Etiquetas', color: 'text-pink-400', bg: 'bg-pink-400/20' },
      { to: '/fornecedores', icon: Truck, label: 'Fornecedores', color: 'text-blue-400', bg: 'bg-blue-400/20' },
    ],
  },
  {
    title: 'Financeiro',
    color: 'text-emerald-400',
    items: [
      { to: '/caixa', icon: DollarSign, label: 'Caixa', color: 'text-emerald-400', bg: 'bg-emerald-400/20' },
      { to: '/financeiro', icon: TrendingUp, label: 'Financeiro', color: 'text-[var(--color-secondary-container)]', bg: 'bg-[var(--color-secondary-container)]/20' },
      { to: '/cmv', icon: Calculator, label: 'CMV', color: 'text-amber-400', bg: 'bg-amber-400/20' },
      { to: '/dre', icon: BarChart3, label: 'DRE', color: 'text-purple-400', bg: 'bg-purple-400/20' },
      { to: '/relatorios', icon: BarChart3, label: 'Relatórios', color: 'text-[var(--color-primary-container)]', bg: 'bg-[var(--color-primary-container)]/20' },
    ],
  },
  {
    title: 'Sistema',
    color: 'text-[var(--color-on-surface-variant)]',
    items: [
      { to: '/admin', icon: Settings, label: 'Administração', color: 'text-[var(--color-on-surface-variant)]', bg: 'bg-[var(--color-on-surface-variant)]/20' },
      { to: '/analise-estoque', icon: BarChart3, label: 'Análise Estoque', color: 'text-[var(--color-primary-container)]', bg: 'bg-[var(--color-primary-container)]/20' },
      { to: '/pops', icon: ClipboardList, label: 'Checklist', color: 'text-amber-400', bg: 'bg-amber-400/20' },
      { to: '/garcom', icon: Users, label: 'Garçom App', color: 'text-emerald-400', bg: 'bg-emerald-400/20' },
    ],
  },
];

export default function Drawer({ open, onClose }: DrawerProps) {
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 left-0 w-80 bg-[var(--color-surface)] z-50 flex flex-col animate-slide-in-left shadow-2xl">
        <div className="relative p-6 pb-4 bg-gradient-to-br from-[#004f58] to-[#001f24]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-[var(--color-primary-container)]/20 hover:bg-[var(--color-primary-container)]/30 transition-colors"
          >
            <X size={18} className="text-[var(--color-primary-container)]" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">B</span>
            </div>
            <div>
              <div className="font-bold text-white text-lg">Barize</div>
              <div className="text-white/70 text-sm">Gestão de Bares</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {menuSections.map((section) => (
            <div key={section.title} className="mb-4">
              <div className={`px-6 py-2 text-xs font-bold ${section.color} uppercase tracking-widest`}>
                {section.title}
              </div>
              {section.items.map((item) => (
                <button
                  key={item.to}
                  onClick={() => {
                    navigate(item.to);
                    onClose();
                  }}
                  className="w-full flex items-center gap-4 px-6 py-3.5 text-left hover:bg-[#004f58]/30 active:bg-[#004f58]/50 transition-all duration-150"
                >
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center`}>
                    <item.icon size={20} className={item.color} />
                  </div>
                  <span className="text-sm font-medium text-[var(--color-on-surface)]">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--color-outline)]">
          <button
            onClick={() => {
              localStorage.removeItem('barize_token');
              navigate('/login');
            }}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-[var(--color-error)] hover:bg-[var(--color-error-container)]/15 active:bg-[var(--color-error-container)]/25 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--color-error-container)]/20 flex items-center justify-center">
              <LogOut size={20} className="text-[var(--color-error)]" />
            </div>
            <span className="text-sm font-medium">Sair do Sistema</span>
          </button>
        </div>
      </div>
    </>
  );
}
