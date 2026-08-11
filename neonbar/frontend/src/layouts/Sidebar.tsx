import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  Settings,
  HelpCircle,
  Plus,
  LogOut,
  ExternalLink,
  QrCode,
  FileText,
  Download,
  X,
  Tag,
  BookOpen,
  Shield,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Truck,
  ClipboardList,
  Calculator,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import type { Usuario } from '../types';
import ThemeToggle from '../components/ThemeToggle';

interface SidebarProps {
  usuario: Usuario;
  onLogout: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Painel' },
  { to: '/pdv', icon: ShoppingCart, label: 'PDV' },
  { to: '/comandas', icon: FileText, label: 'Comandas' },
  { to: '/fichas-tecnicas', icon: BookOpen, label: 'Ficha Técnica' },
  { to: '/precificacao', icon: TrendingUp, label: 'Precificação' },
  { to: '/etiquetas', icon: Tag, label: 'Etiquetas' },
  { to: '/estoque', icon: Package, label: 'Estoque' },
  { to: '/analise-estoque', icon: BarChart3, label: 'Análise Estoque' },
  { to: '/caixa', icon: DollarSign, label: 'Caixa' },
  { to: '/financeiro', icon: TrendingUp, label: 'Financeiro' },
  { to: '/cmv', icon: Calculator, label: 'CMV' },
  { to: '/dre', icon: BarChart3, label: 'DRE' },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
  { to: '/fornecedores', icon: Truck, label: 'Fornecedores' },
  { to: '/pops', icon: ClipboardList, label: 'Checklist' },
];

const adminNavItems = [
  { to: '/admin', icon: Shield, label: 'Administração' },
];

// Áreas acessíveis ao bartender (operacionais) — TC-025
const operacionalRoutes = [
  '/',
  '/pdv',
  '/comandas',
  '/fichas-tecnicas',
  '/precificacao',
  '/etiquetas',
  '/estoque',
  '/pops',
];

function podeAcessar(role: Usuario['role'], to: string) {
  if (role === 'admin' || role === 'gerente') return true;
  return operacionalRoutes.includes(to);
}

export default function Sidebar({ usuario, onLogout, collapsed, onToggle }: SidebarProps) {
  const navigate = useNavigate();
  const [showQR, setShowQR] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const qrUrl = `${window.location.origin}/cardapio`;

  const gerarQRCode = useCallback(async () => {
    try {
      const dataUrl = await QRCode.toDataURL(qrUrl, {
        width: 600,
        margin: 2,
        errorCorrectionLevel: 'M',
      });
      setQrDataUrl(dataUrl);
    } catch {
      setQrDataUrl('');
    }
  }, [qrUrl]);

  useEffect(() => {
    if (showQR) gerarQRCode();
  }, [showQR, gerarQRCode]);

  const baixarQRCode = async () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = 'qrcode-cardapio.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <aside className={`${collapsed ? 'w-16' : 'w-64'} h-screen fixed left-0 top-0 flex flex-col border-r border-[rgba(0,218,243,0.12)] bg-[rgba(var(--glass-rgb),0.85)] backdrop-blur-[16px] z-50 shadow-[2px_0_24px_rgba(0,218,243,0.06)] transition-all duration-300 group`}>
      {/* Discreet toggle button */}
      {onToggle && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-[rgba(var(--glass-rgb),0.9)] border border-[rgba(0,218,243,0.2)] text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]/40 cursor-pointer"
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      )}

      <div className="flex flex-col h-full py-lg overflow-y-auto">
        {/* Brand Header */}
        <div className={`${collapsed ? 'px-xs text-center' : 'px-lg'} mb-xl`}>
          <h1 className={`font-bold text-[var(--color-primary)] tracking-tight drop-shadow-[0_0_6px_rgba(0,218,243,0.3)] ${collapsed ? 'text-lg' : 'text-headline-md'}`}>
            {collapsed ? 'BZ' : 'BARIZE'}
          </h1>
          {!collapsed && (
            <p className="text-[var(--color-on-surface-variant)] text-label-md uppercase opacity-60">
              Terminal 01
            </p>
          )}
        </div>

        {/* CTA */}
        {!collapsed && (
          <div className="px-md mb-lg">
            <button
              onClick={() => navigate('/pdv')}
              className="w-full bg-[var(--color-primary-container)]/80 backdrop-blur-[8px] text-[var(--color-on-primary-container)] py-xs px-sm rounded-lg font-bold flex items-center justify-center gap-xs transition-all duration-300 active:scale-95 hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(0,218,243,0.4)] shadow-[0_0_12px_rgba(0,218,243,0.25)] border border-[rgba(0,218,243,0.15)] cursor-pointer"
            >
              <Plus size={16} />
              <span className="text-label-md">NOVO PEDIDO</span>
            </button>
          </div>
        )}

        {/* Primary Nav */}
        <nav className="flex-1 px-sm space-y-xs">
          {navItems.filter((item) => podeAcessar(usuario.role, item.to)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center ${collapsed ? 'justify-center px-0' : 'gap-md px-md'} py-sm rounded-lg transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'text-[var(--color-primary)] bg-[rgba(0,218,243,0.08)] backdrop-blur-[4px] border-l-2 border-[var(--color-primary)] shadow-[0_0_10px_rgba(0,218,243,0.2)] rounded-l-none'
                    : 'text-[var(--color-on-surface-variant)] hover:bg-[rgba(var(--overlay-rgb),0.04)] hover:backdrop-blur-[4px] hover:scale-[1.02] hover:shadow-[0_0_6px_rgba(0,218,243,0.08)]'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={20} />
              {!collapsed && <span className="text-label-md uppercase">{item.label}</span>}
            </NavLink>
          ))}
          {(usuario.role === 'admin' || usuario.role === 'gerente') && adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center ${collapsed ? 'justify-center px-0' : 'gap-md px-md'} py-sm rounded-lg transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'text-[var(--color-primary)] bg-[rgba(0,218,243,0.08)] backdrop-blur-[4px] border-l-2 border-[var(--color-primary)] shadow-[0_0_10px_rgba(0,218,243,0.2)] rounded-l-none'
                    : 'text-[var(--color-on-surface-variant)] hover:bg-[rgba(var(--overlay-rgb),0.04)] hover:backdrop-blur-[4px] hover:scale-[1.02] hover:shadow-[0_0_6px_rgba(0,218,243,0.08)]'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <item.icon size={20} />
              {!collapsed && <span className="text-label-md uppercase">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Cardápio Digital */}
        <div className={`px-sm mb-xs ${collapsed ? 'space-y-xs' : 'space-y-0.5'}`}>
          <a
            href="/cardapio"
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center ${collapsed ? 'justify-center px-0' : 'gap-md px-md'} py-sm rounded-lg text-[var(--color-primary)] hover:bg-[rgba(0,218,243,0.08)] hover:backdrop-blur-[4px] transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-[0_0_8px_rgba(0,218,243,0.12)]`}
            title={collapsed ? 'Cardápio Digital' : undefined}
          >
            <ExternalLink size={20} />
            {!collapsed && <span className="text-label-md font-medium uppercase">Cardápio Digital</span>}
          </a>
          <button
            onClick={() => setShowQR(true)}
            className={`w-full flex items-center ${collapsed ? 'justify-center px-0' : 'gap-md px-md'} py-sm rounded-lg text-[var(--color-on-surface-variant)] hover:bg-[rgba(var(--overlay-rgb),0.04)] hover:backdrop-blur-[4px] transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-[0_0_6px_rgba(0,218,243,0.08)]`}
            title={collapsed ? 'QR Code do Cardápio' : undefined}
          >
            <QrCode size={20} />
            {!collapsed && <span className="text-label-md uppercase">QR Code do Cardápio</span>}
          </button>
        </div>

        {/* Footer Nav */}
        <div className="mt-auto px-sm border-t border-[rgba(0,218,243,0.08)] pt-lg">
          {(usuario.role === 'admin' || usuario.role === 'gerente') && (
            <a
              className={`flex items-center ${collapsed ? 'justify-center px-0' : 'gap-md px-md'} py-sm text-[var(--color-on-surface-variant)] hover:bg-[rgba(var(--overlay-rgb),0.04)] hover:backdrop-blur-[4px] transition-all duration-200 rounded-lg cursor-pointer hover:scale-[1.02] hover:shadow-[0_0_6px_rgba(0,218,243,0.08)]`}
              onClick={(e) => { e.preventDefault(); navigate('/admin'); }}
              title={collapsed ? 'Configurações' : undefined}
            >
              <Settings size={20} />
              {!collapsed && <span className="text-label-md uppercase">Configurações</span>}
            </a>
          )}
          <a
            className={`flex items-center ${collapsed ? 'justify-center px-0' : 'gap-md px-md'} py-sm text-[var(--color-on-surface-variant)] hover:bg-[rgba(var(--overlay-rgb),0.04)] hover:backdrop-blur-[4px] transition-all duration-200 rounded-lg cursor-pointer hover:scale-[1.02] hover:shadow-[0_0_6px_rgba(0,218,243,0.08)]`}
            onClick={(e) => { e.preventDefault(); alert('Suporte: (11) 99999-0000'); }}
            title={collapsed ? 'Suporte' : undefined}
          >
            <HelpCircle size={20} />
            {!collapsed && <span className="text-label-md uppercase">Suporte</span>}
          </a>

          {/* Theme Toggle */}
          <div className="mt-sm">
            <ThemeToggle collapsed={collapsed} />
          </div>

          {/* User Profile */}
          <div className={`mt-lg ${collapsed ? 'px-xs flex flex-col items-center gap-xs' : 'px-md flex items-center gap-md'}`}>
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--color-surface-container-high)] border border-[rgba(0,218,243,0.2)] flex items-center justify-center text-[var(--color-on-surface-variant)] shadow-[0_0_6px_rgba(0,218,243,0.15)]">
              <span className="text-label-md font-bold">
                {usuario.nome?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            {!collapsed && (
              <>
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-label-md text-[var(--color-on-surface)] truncate">
                    {usuario.nome}
                  </span>
                  <span className="text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-widest truncate">
                    {usuario.role === 'admin' ? 'Administrador' : usuario.role === 'gerente' ? 'Gerente' : 'Bartender'}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="text-[var(--color-outline)] hover:text-[var(--color-error)] hover:scale-110 transition-all duration-200 flex-shrink-0 cursor-pointer"
                  title="Sair"
                >
                  <LogOut size={16} />
                </button>
              </>
            )}
            {collapsed && (
              <button
                onClick={onLogout}
                className="text-[var(--color-outline)] hover:text-[var(--color-error)] hover:scale-110 transition-all duration-200 cursor-pointer"
                title="Sair"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-[100] overflow-y-auto" onClick={() => setShowQR(false)}>
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
          <div className="flex min-h-full items-center justify-center p-4">
          <div className="bg-[rgba(var(--glass-rgb),0.9)] backdrop-blur-[16px] rounded-xl p-lg w-full min-w-0 border border-[rgba(0,218,243,0.15)] shadow-[0_0_30px_rgba(0,218,243,0.1)] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-md">
              <h2 className="text-headline-md font-bold text-[var(--color-primary)] drop-shadow-[0_0_4px_rgba(0,218,243,0.3)]">Cardápio Digital</h2>
              <button onClick={() => setShowQR(false)} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:scale-110 transition-all duration-200 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col items-center gap-md">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code Cardápio Digital"
                  className="w-48 h-48 rounded-xl bg-white p-2 shadow-[0_0_12px_rgba(0,218,243,0.15)]"
                />
              ) : (
                <div className="w-48 h-48 rounded-xl bg-white p-2 flex items-center justify-center">
                  <span className="text-label-md text-[var(--color-on-surface-variant)]">Gerando QR Code...</span>
                </div>
              )}
              <p className="text-label-md text-[var(--color-on-surface-variant)] text-center">
                Escaneie para acessar o cardápio digital
              </p>
              <a
                href={qrDataUrl || '#'}
                download="qrcode-cardapio.png"
                onClick={(e) => {
                  if (!qrDataUrl) {
                    e.preventDefault();
                    return;
                  }
                  e.preventDefault();
                  baixarQRCode();
                }}
                className={`flex items-center gap-2 px-lg py-sm rounded-lg bg-[rgba(0,218,243,0.1)] backdrop-blur-[4px] text-[var(--color-primary)] border border-[rgba(0,218,243,0.25)] hover:bg-[rgba(0,218,243,0.2)] hover:shadow-[0_0_12px_rgba(0,218,243,0.3)] transition-all duration-200 text-label-md cursor-pointer hover:scale-[1.02] ${!qrDataUrl ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <Download size={16} />
                Baixar QR Code
              </a>
            </div>
          </div>
          </div>
        </div>
      )}
    </aside>
  );
}
