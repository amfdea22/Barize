import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Search, Bell, UserCircle } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../hooks/useAuth';
import { pedidosService } from '../services/api';

export default function MainLayout() {
  const { usuario, loading, logout, isAuthenticated } = useAuth();
  const [activeOrdersCount, setActiveOrdersCount] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await pedidosService.listarAtivos();
        if (!cancelled) setActiveOrdersCount(Array.isArray(res.data) ? res.data.length : 0);
      } catch {
        // silent — mantém último valor
      }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[var(--color-background)]">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-[var(--color-primary-container)]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-[var(--color-outline)] font-mono tracking-wider">Carregando...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !usuario) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen flex bg-[var(--color-background)]">
      <Sidebar usuario={usuario} onLogout={logout} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((v) => !v)} />

      {/* TopAppBar */}
      <header className={`fixed top-0 right-0 ${sidebarCollapsed ? 'w-[calc(100%-4rem)]' : 'w-[calc(100%-16rem)]'} h-16 z-40 bg-[var(--color-background)]/80 backdrop-blur-xl border-b border-[rgba(var(--neutral-rgb),0.1)]`}>
        <div className="flex justify-between items-center px-lg h-full">
          {/* Left: Search + Status */}
          <div className="flex items-center gap-lg">
            <div className="relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)]" />
              <input
                className="bg-[var(--color-surface-container-lowest)] border border-[rgba(var(--neutral-rgb),0.2)] rounded-full pl-10 pr-md py-1.5 text-body-md w-64 focus:outline-none focus:border-[var(--color-primary)]/50 transition-colors text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]/40"
                placeholder="Buscar pedidos ou itens..."
                type="text"
              />
            </div>
            <div className="flex gap-md">
              <span className="text-label-md text-[var(--color-primary)] font-bold">
                Pedidos Ativos ({activeOrdersCount})
              </span>
              <span className="text-label-md text-[var(--color-on-surface-variant)]">
                Fila: 4m méd
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-md">
            <button className="w-[48px] h-[48px] flex items-center justify-center text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-opacity cursor-pointer relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--color-secondary-container)] rounded-full border-2 border-[var(--color-background)]" />
            </button>
            <button className="w-[48px] h-[48px] flex items-center justify-center text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] transition-opacity cursor-pointer">
              <UserCircle size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`${sidebarCollapsed ? 'ml-16 w-[calc(100%-4rem)]' : 'ml-64 w-[calc(100%-16rem)]'} pt-16 h-[calc(100vh-4rem)] overflow-y-auto`}>
        <div className="p-lg animate-fade-in h-full min-h-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
