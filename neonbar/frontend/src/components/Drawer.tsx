import { useNavigate } from 'react-router-dom';
import { X, Home, Receipt, LayoutGrid, Truck, Users, BarChart3, Settings, Printer, Package } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
}

const menuItems = [
  { label: 'Dashboard', icon: Home, path: '/' },
  { label: 'Pedidos', icon: Receipt, path: '/pedidos' },
  { label: 'Sala', icon: LayoutGrid, path: '/sala' },
  { label: 'PDV', icon: Receipt, path: '/pdv' },
  { label: 'Delivery', icon: Truck, path: '/delivery' },
  { label: 'Equipe', icon: Users, path: '/equipe' },
  { label: 'Relatórios', icon: BarChart3, path: '/relatorios' },
  { label: 'Estoque', icon: Package, path: '/estoque' },
  { label: 'Impressoras', icon: Printer, path: '/impressoras' },
  { label: 'Configurações', icon: Settings, path: '/configuracoes' },
];

export default function Drawer({ open, onClose }: DrawerProps) {
  const navigate = useNavigate();

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed left-0 top-0 h-full w-72 bg-[var(--color-surface)] z-50 shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-outline)]/20">
          <span className="text-lg font-bold text-[var(--color-on-surface)]">BARIZE</span>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--color-surface-container)]">
            <X size={20} className="text-[var(--color-on-surface)]" />
          </button>
        </div>
        <nav className="p-2">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => { navigate(item.path); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container)] transition-colors"
            >
              <item.icon size={20} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  );
}
