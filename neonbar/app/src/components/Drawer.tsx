import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Receipt,
  ShoppingCart,
  Grid3X3,
  BookOpen,
  Package,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../services/api';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
}

interface UserInfo {
  nome: string;
  cargo: string;
  initials: string;
}

const menuItems = [
  { to: '/', icon: LayoutDashboard, label: 'Painel Geral', badge: null as string | null, badgeColor: '' },
  { to: '/pedidos', icon: Receipt, label: 'Pedidos Ativos', badge: null as string | null, badgeColor: 'bg-[#38bdf8] text-[#091422]' },
  { to: '/pdv', icon: ShoppingCart, label: 'Terminal PDV', badge: null as string | null, badgeColor: '' },
  { to: '/sala', icon: Grid3X3, label: 'Mapa de Mesas', badge: null as string | null, badgeColor: 'bg-[#38bdf8]/20 text-[#38bdf8]' },
  { to: '/cardapio', icon: BookOpen, label: 'Cardápio Digital', badge: null as string | null, badgeColor: '' },
  { to: '/estoque', icon: Package, label: 'Estoque & Insumos', badge: null as string | null, badgeColor: 'bg-amber-500/20 text-amber-400' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios & Vendas', badge: null as string | null, badgeColor: '' },
];

export default function Drawer({ open, onClose }: DrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState<UserInfo>({
    nome: 'Admin',
    cargo: 'Administrador',
    initials: 'AD',
  });
  const [badges, setBadges] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      loadUserInfo();
      loadBadges();
    }
  }, [open]);

  const loadUserInfo = async () => {
    try {
      const res = await api.get('/auth/me');
      const user = res.data;
      const nome = user.nome || user.username || 'Admin';
      const cargo = user.cargo || user.role || 'Administrador';
      const initials = nome.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
      setUserInfo({ nome, cargo, initials });
    } catch {
      // Keep default
    }
  };

  const loadBadges = async () => {
    try {
      const [pedidosRes, mesasRes, estoqueRes] = await Promise.allSettled([
        api.get('/pedidos/ativos'),
        api.get('/admin/mesas/?ativo=1'),
        api.get('/estoque/'),
      ]);

      const newBadges: Record<string, string> = {};

      if (pedidosRes.status === 'fulfilled') {
        const pedidos = Array.isArray(pedidosRes.value.data) ? pedidosRes.value.data : [];
        const ativos = pedidos.filter((p: any) => ['Novo', 'Preparando', 'Pronto'].includes(p.status)).length;
        if (ativos > 0) newBadges['/pedidos'] = String(ativos);
      }

      if (mesasRes.status === 'fulfilled') {
        const mesas = Array.isArray(mesasRes.value.data) ? mesasRes.value.data : [];
        const pedidosRes2 = await api.get('/pedidos/ativos').catch(() => ({ data: [] }));
        const pedidos = Array.isArray(pedidosRes2.data) ? pedidosRes2.data : [];
        const ocupadas = new Set<string>();
        pedidos.forEach((p: any) => {
          if (p.mesa && ['Novo', 'Preparando', 'Pronto', 'Entregue'].includes(p.status)) {
            ocupadas.add(p.mesa);
          }
        });
        const livres = mesas.length - ocupadas.size;
        if (livres > 0) newBadges['/sala'] = `${livres} abertas`;
      }

      if (estoqueRes.status === 'fulfilled') {
        const itens = Array.isArray(estoqueRes.value.data) ? estoqueRes.value.data : [];
        const criticos = itens.filter((i: any) => i.quantidade <= (i.estoque_minimo || 0)).length;
        if (criticos > 0) newBadges['/estoque'] = `${criticos}`;
      }

      setBadges(newBadges);
    } catch {
      // Silently ignore
    }
  };

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 left-0 w-80 bg-[#091422] z-50 flex flex-col animate-slide-in-left shadow-2xl border-r border-white/5">
        {/* Header */}
        <div className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#38bdf8] to-[#00e3fd] flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.3)]">
                <span className="material-symbols-outlined text-[#091422] text-[24px]">local_bar</span>
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-lg tracking-tight">BARIZE</span>
                <div className="flex items-center gap-1">
                  <span className="text-[#38bdf8] text-[9px] font-bold tracking-widest">OS</span>
                  <span className="text-[#00e3fd]/60 text-[8px] font-semibold tracking-wider">NEXORA</span>
                </div>
                <span className="text-[#87929a] text-[7px] font-semibold tracking-[0.2em] uppercase">Edition</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-[#202b3a]/60 text-[#87929a] hover:text-white hover:bg-[#202b3a] transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Perfil do Usuário */}
        <div className="mx-4 mb-4 p-4 rounded-2xl bg-[#16202f]/80 border border-white/5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#38bdf8] to-[#00e3fd] flex items-center justify-center text-[#091422] font-bold text-sm">
                {userInfo.initials}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#00e3fd] border-2 border-[#16202f] shadow-[0_0_8px_#00e3fd]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{userInfo.nome}</p>
              <p className="text-[#87929a] text-xs truncate">{userInfo.cargo}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e3fd] animate-pulse shadow-[0_0_6px_#00e3fd]" />
                <span className="text-[#38bdf8] text-[9px] font-bold uppercase tracking-wider">Turno Noite • PDV 01</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navegação Principal */}
        <div className="flex-1 overflow-y-auto px-4">
          <p className="text-[#87929a] text-[9px] font-bold uppercase tracking-[0.15em] mb-3 px-1">Navegação Principal</p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.to;
              const badgeValue = badges[item.to];
              return (
                <button
                  key={item.to}
                  onClick={() => {
                    navigate(item.to);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 group ${
                    isActive
                      ? 'bg-gradient-to-r from-[#38bdf8]/20 to-[#38bdf8]/10 border border-[#38bdf8]/20'
                      : 'hover:bg-[#202b3a]/50 border border-transparent'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-[#38bdf8]/20 text-[#38bdf8]'
                      : 'bg-[#202b3a]/60 text-[#87929a] group-hover:text-[#d8e3f7]'
                  }`}>
                    <item.icon size={20} />
                  </div>
                  <span className={`flex-1 text-left text-sm font-medium ${
                    isActive ? 'text-[#38bdf8]' : 'text-[#d8e3f7] group-hover:text-white'
                  }`}>
                    {item.label}
                  </span>
                  {badgeValue && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.badgeColor || 'bg-[#38bdf8]/20 text-[#38bdf8]'
                    }`}>
                      {badgeValue}
                    </span>
                  )}
                  {isActive && (
                    <div className="w-1 h-6 rounded-full bg-[#38bdf8] shadow-[0_0_8px_#38bdf8]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => {
                navigate('/configuracoes');
                onClose();
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#202b3a]/60 text-[#87929a] hover:text-[#d8e3f7] hover:bg-[#202b3a] transition-all text-xs font-medium"
            >
              <Settings size={14} />
              Ajustes
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#202b3a]/60 text-[#87929a] hover:text-[#d8e3f7] hover:bg-[#202b3a] transition-all text-xs font-medium">
              <HelpCircle size={14} />
              Suporte
            </button>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('barize_token');
              navigate('/login');
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#ffb4ab]/10 border border-[#ffb4ab]/20 text-[#ffb4ab] hover:bg-[#ffb4ab]/20 transition-all text-sm font-semibold"
          >
            <LogOut size={16} />
            Encerrar Turno / Logout
          </button>
          <p className="text-center text-[#87929a]/50 text-[8px] font-semibold tracking-wider">
            Barize OS v2.4 • Nexora Edition
          </p>
        </div>
      </div>
    </>
  );
}
