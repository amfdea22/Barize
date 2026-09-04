import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, PlusCircle, LayoutGrid, LogOut, Menu, TrendingUp, Clock, Moon, Sun, Bike, Users, AlertTriangle, CheckCircle2, Timer, Package } from 'lucide-react';
import api, { financeiroService } from '../services/api';
import Drawer from '../components/Drawer';
import UserMenu from '../components/UserMenu';
import { useTheme } from '../hooks/useTheme';

interface DashboardStats {
  totalPedidos: number;
  pedidosNovos: number;
  pedidosPreparando: number;
  pedidosProntos: number;
  pedidosEntregues: number;
  mesasOcupadas: number;
  mesasLivres: number;
  faturamentoTurno: number;
  ativoRecente: { nome: string; valor: string; status: string }[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const userButtonRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState<DashboardStats>({
    totalPedidos: 0,
    pedidosNovos: 0,
    pedidosPreparando: 0,
    pedidosProntos: 0,
    pedidosEntregues: 0,
    mesasOcupadas: 0,
    mesasLivres: 0,
    faturamentoTurno: 0,
    ativoRecente: [],
  });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarStats() {
      try {
        const [pedidosRes, mesasRes, painelRes] = await Promise.allSettled([
          api.get('/pedidos/ativos'),
          api.get('/admin/mesas/?ativo=1'),
          financeiroService.carregarPainel(),
        ]);

        const pedidos = pedidosRes.status === 'fulfilled' ? (Array.isArray(pedidosRes.value.data) ? pedidosRes.value.data : []) : [];
        const mesas = mesasRes.status === 'fulfilled' ? (Array.isArray(mesasRes.value.data) ? mesasRes.value.data : []) : [];
        const painel = painelRes.status === 'fulfilled' ? (painelRes.value as any) : {};

        const pedidosNovos = pedidos.filter((p: any) => p.status === 'Novo').length;
        const pedidosPreparando = pedidos.filter((p: any) => p.status === 'Preparando').length;
        const pedidosProntos = pedidos.filter((p: any) => p.status === 'Pronto').length;
        const pedidosEntregues = pedidos.filter((p: any) => p.status === 'Entregue').length;

        const mesasComPedidos = new Set<string>();
        pedidos.forEach((p: any) => {
          if (p.mesa && ['Novo', 'Preparando', 'Pronto', 'Entregue'].includes(p.status)) {
            mesasComPedidos.add(p.mesa);
          }
        });
        const mesasOcupadas = mesasComPedidos.size;
        const mesasLivres = mesas.length - mesasOcupadas;

        const ativoRecente = pedidos.slice(0, 5).map((p: any) => ({
          nome: p.mesa || 'Pedido',
          valor: `R$ ${(p.total || 0).toFixed(2)}`,
          status: p.status,
        }));

        setStats({
          totalPedidos: pedidos.length,
          pedidosNovos,
          pedidosPreparando,
          pedidosProntos,
          pedidosEntregues,
          mesasOcupadas,
          mesasLivres,
          faturamentoTurno: painel.receitaHoje || 0,
          ativoRecente,
        });
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
      } finally {
        setCarregando(false);
      }
    }
    carregarStats();
    const interval = setInterval(carregarStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const hoje = new Date();
  const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  const statusColors: Record<string, string> = {
    Novo: 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/20',
    Preparando: 'bg-amber-400/15 text-amber-400 border border-amber-400/20',
    Pronto: 'bg-green-400/15 text-green-400 border border-green-400/20',
    Entregue: 'bg-gray-400/15 text-gray-400 border border-gray-400/20',
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-background)]">
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <UserMenu open={userMenuOpen} onClose={() => setUserMenuOpen(false)} anchorRef={userButtonRef} />

      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#004f58] to-[#00363d] px-4 h-16 flex items-center justify-between shadow-lg shadow-[#004f58]/30 rounded-b-3xl">
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
        >
          <Menu size={20} className="text-white" />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
          >
            {theme === 'dark' ? (
              <Sun size={20} className="text-white" />
            ) : (
              <Moon size={20} className="text-white" />
            )}
          </button>
          <div ref={userButtonRef}>
            <button
              onClick={() => setUserMenuOpen(true)}
              className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
            >
              <span className="material-symbols-outlined text-white text-lg">person</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-24">
        <section className="space-y-1">
          <h1 className="text-2xl font-bold text-on-surface">Olá!</h1>
          <p className="text-sm text-on-surface-variant flex items-center gap-1.5">
            <Clock size={14} />
            {diasSemana[hoje.getDay()]}, {hoje.getDate()} de {meses[hoje.getMonth()]}
          </p>
        </section>

        {/* Cards de Status */}
        <section className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-[#004f58] to-[#001f24] rounded-2xl p-4 flex flex-col justify-between min-h-[100px]">
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-container)]/20 flex items-center justify-center">
                <Receipt size={16} className="text-[var(--color-primary-container)]" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Pedidos</span>
            </div>
            <div className="text-3xl font-bold text-white font-mono mt-3">
              {carregando ? '—' : stats.totalPedidos}
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#825500] to-[#452b00] rounded-2xl p-4 flex flex-col justify-between min-h-[100px]">
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-secondary-container)]/20 flex items-center justify-center">
                <TrendingUp size={16} className="text-[var(--color-secondary-container)]" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider">Faturamento</span>
            </div>
            <div className="text-xl font-bold text-white font-mono mt-3">
              {carregando ? '—' : `R$ ${stats.faturamentoTurno.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </div>
          </div>
        </section>

        {/* Status dos Pedidos */}
        {!carregando && stats.totalPedidos > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--color-on-surface)] uppercase tracking-wider">Pedidos por Status</h2>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Novos', count: stats.pedidosNovos, color: 'text-cyan-400', bg: 'bg-cyan-400/10', icon: Timer },
                { label: 'Preparo', count: stats.pedidosPreparando, color: 'text-amber-400', bg: 'bg-amber-400/10', icon: AlertTriangle },
                { label: 'Prontos', count: stats.pedidosProntos, color: 'text-green-400', bg: 'bg-green-400/10', icon: CheckCircle2 },
                { label: 'Entregues', count: stats.pedidosEntregues, color: 'text-gray-400', bg: 'bg-gray-400/10', icon: Package },
              ].map((item) => (
                <div key={item.label} className={`${item.bg} rounded-xl p-3 text-center`}>
                  <item.icon size={16} className={`${item.color} mx-auto mb-1`} />
                  <div className={`text-lg font-bold font-mono ${item.color}`}>{item.count}</div>
                  <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--color-outline)]">{item.label}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Mesas */}
        {!carregando && (stats.mesasOcupadas + stats.mesasLivres) > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--color-on-surface)] uppercase tracking-wider">Mesas</h2>
            <div className="flex gap-3">
              <div className="flex-1 bg-amber-400/10 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-400/20 flex items-center justify-center">
                  <Users size={18} className="text-amber-400" />
                </div>
                <div>
                  <div className="text-lg font-bold font-mono text-amber-400">{stats.mesasOcupadas}</div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400/60">Ocupadas</span>
                </div>
              </div>
              <div className="flex-1 bg-emerald-400/10 rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-400/20 flex items-center justify-center">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                </div>
                <div>
                  <div className="text-lg font-bold font-mono text-emerald-400">{stats.mesasLivres}</div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400/60">Livres</span>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-on-surface)] uppercase tracking-wider">Ações Rápidas</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/pdv')}
              className="bg-[#004f58]/80 backdrop-blur-md border border-[var(--color-outline)]/20 text-on-surface rounded-2xl p-4 flex flex-col items-start gap-3 min-h-[110px] hover:bg-[#004f58] active:brightness-90 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-container)]/25 flex items-center justify-center">
                <PlusCircle size={22} className="text-[var(--color-primary-container)]" />
              </div>
              <span className="text-sm font-bold text-left mt-auto">Novo Pedido</span>
            </button>
            <button
              onClick={() => navigate('/sala')}
              className="bg-[var(--color-surface-container-high)] border border-[var(--color-outline)]/20 text-on-surface rounded-2xl p-4 flex flex-col items-start gap-3 min-h-[110px] hover:bg-[var(--color-surface-container-highest)] active:brightness-90 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-container)]/25 flex items-center justify-center">
                <LayoutGrid size={22} className="text-[var(--color-primary-container)]" />
              </div>
              <span className="text-sm font-semibold text-left mt-auto">Mapa de Mesas</span>
            </button>
            <button
              onClick={() => navigate('/sala')}
              className="bg-[var(--color-surface-container-high)] border border-[var(--color-outline)]/20 text-on-surface rounded-2xl p-4 flex flex-col items-start gap-3 min-h-[110px] hover:bg-[var(--color-surface-container-highest)] active:brightness-90 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--color-secondary-container)]/25 flex items-center justify-center">
                <LogOut size={22} className="text-[var(--color-secondary-container)]" />
              </div>
              <span className="text-sm font-semibold text-left mt-auto">Fechar Conta</span>
            </button>
            <button
              onClick={() => navigate('/delivery')}
              className="bg-[var(--color-surface-container-high)] border border-[var(--color-outline)]/20 text-on-surface rounded-2xl p-4 flex flex-col items-start gap-3 min-h-[110px] hover:bg-[var(--color-surface-container-highest)] active:brightness-90 transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/25 flex items-center justify-center">
                <Bike size={22} className="text-cyan-400" />
              </div>
              <span className="text-sm font-semibold text-left mt-auto">Delivery</span>
            </button>
          </div>
        </section>

        {stats.ativoRecente.length > 0 && (
          <section className="space-y-3 border-t border-[var(--color-outline)]/10 pt-6">
            <h2 className="text-sm font-semibold text-[var(--color-on-surface)] uppercase tracking-wider">Atividade Recente</h2>
            <div className="flex flex-col bg-[var(--color-surface-container)] border border-[var(--color-outline)]/20 rounded-2xl overflow-hidden">
              {stats.ativoRecente.map((item, i) => (
                <div
                  key={i}
                  className={`flex justify-between items-center px-4 py-3 ${
                    i < stats.ativoRecente.length - 1 ? 'border-b border-[var(--color-outline)]/10' : ''
                  } hover:bg-[var(--color-surface-container-high)] transition-colors`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-on-surface">{item.nome}</span>
                    <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${statusColors[item.status] || 'bg-gray-400/15 text-gray-400'}`}>
                      {item.status}
                    </span>
                  </div>
                  <span className="text-sm font-bold font-mono text-[var(--color-secondary-container)]">
                    {item.valor}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
