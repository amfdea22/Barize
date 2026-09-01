import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Receipt, CircleDollarSign, PlusCircle, LayoutGrid, LogOut, Menu, TrendingUp, Clock, Moon, Sun } from 'lucide-react';
import api from '../services/api';
import Drawer from '../components/Drawer';
import UserMenu from '../components/UserMenu';
import { useTheme } from '../hooks/useTheme';

interface DashboardStats {
  totalPedidos: number;
  faturamentoTurno: number;
  ativoRecente: { nome: string; valor: number }[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const userButtonRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const [stats, setStats] = useState<DashboardStats>({
    totalPedidos: 0,
    faturamentoTurno: 0,
    ativoRecente: [],
  });
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarStats() {
      try {
        const [pedidosRes, comandasRes] = await Promise.all([
          api.get('/pedidos/ativos'),
          api.get('/comandas'),
        ]);

        const pedidos = pedidosRes.data || [];
        const comandas = comandasRes.data || [];

        const totalPedidos = pedidos.length + comandas.length;

        let faturamento = 0;
        pedidos.forEach((p: any) => {
          faturamento += p.total || p.subtotal || 0;
        });
        comandas.forEach((c: any) => {
          faturamento += c.total || c.subtotal || 0;
        });

        const ativoRecente = pedidos.slice(0, 3).map((p: any) => ({
          nome: p.mesa ? `Mesa ${p.mesa.numero}` : p.comanda?.numero || 'Pedido',
          valor: p.total || p.subtotal || 0,
        }));

        setStats({
          totalPedidos,
          faturamentoTurno: faturamento,
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

  return (
    <div className="flex flex-col h-full bg-[var(--color-background)]">
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <UserMenu open={userMenuOpen} onClose={() => setUserMenuOpen(false)} anchorRef={userButtonRef} />

      <header className="sticky top-0 z-40 bg-gradient-to-r from-[#004f58] to-[#00363d] px-4 h-16 flex items-center justify-between shadow-lg shadow-[#004f58]/30">
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2.5 rounded-xl bg-[var(--color-primary-container)]/20 hover:bg-[var(--color-primary-container)]/30 transition-all"
        >
          <Menu size={20} className="text-[var(--color-primary-container)]" />
        </button>
        <div className="font-bold text-lg text-white tracking-tight">Barize</div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-[var(--color-primary-container)]/20 hover:bg-[var(--color-primary-container)]/30 transition-all"
          >
            {theme === 'dark' ? (
              <Sun size={20} className="text-[var(--color-primary-container)]" />
            ) : (
              <Moon size={20} className="text-[var(--color-primary-container)]" />
            )}
          </button>
          <div ref={userButtonRef}>
            <button
              onClick={() => setUserMenuOpen(true)}
              className="w-9 h-9 rounded-xl bg-[var(--color-primary-container)]/20 flex items-center justify-center hover:bg-[var(--color-primary-container)]/30 transition-all"
            >
              <span className="material-symbols-outlined text-[var(--color-primary-container)] text-lg">person</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-24">
        <section className="space-y-1">
          <h1 className="text-2xl font-bold text-white">Olá!</h1>
          <p className="text-sm text-white/70 flex items-center gap-1.5">
            <Clock size={14} />
            {diasSemana[hoje.getDay()]}, {hoje.getDate()} de {meses[hoje.getMonth()]}
          </p>
        </section>

        <section className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-[#004f58] to-[#001f24] rounded-2xl p-4 flex flex-col justify-between min-h-[110px] shadow-lg shadow-[#004f58]/40">
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-container)]/20 flex items-center justify-center">
                <Receipt size={18} className="text-[var(--color-primary-container)]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider">Pedidos</span>
            </div>
            <div className="text-3xl font-bold text-white font-mono mt-4">
              {carregando ? '—' : stats.totalPedidos}
            </div>
          </div>
          <div className="bg-gradient-to-br from-[#825500] to-[#452b00] rounded-2xl p-4 flex flex-col justify-between min-h-[110px] shadow-lg shadow-[#feaa00]/30">
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-secondary-container)]/20 flex items-center justify-center">
                <TrendingUp size={18} className="text-[var(--color-secondary-container)]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider">Faturamento</span>
            </div>
            <div className="text-2xl font-bold text-[var(--color-secondary-container)] font-mono mt-4">
              {carregando ? '—' : `R$ ${stats.faturamentoTurno.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--color-on-surface)]">Ações Rápidas</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/pdv')}
              className="bg-[#004f58]/80 backdrop-blur-md border border-white/20 text-white rounded-2xl p-5 flex flex-col items-start gap-4 min-h-[130px] hover:bg-[#004f58] active:brightness-90 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-container)]/25 flex items-center justify-center">
                <PlusCircle size={28} className="text-[var(--color-primary-container)]" />
              </div>
              <span className="text-base font-bold text-left mt-auto">Novo Pedido</span>
            </button>
            <button
              onClick={() => navigate('/sala')}
              className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl p-5 flex flex-col items-start gap-4 min-h-[130px] hover:bg-white/20 active:brightness-90 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-container)]/25 flex items-center justify-center">
                <LayoutGrid size={28} className="text-[var(--color-primary-container)]" />
              </div>
              <span className="text-base font-semibold text-left mt-auto">Mapa de Mesas</span>
            </button>
            <button
              onClick={() => navigate('/sala')}
              className="bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl p-5 flex flex-col items-start gap-4 min-h-[130px] hover:bg-white/20 active:brightness-90 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--color-secondary-container)]/25 flex items-center justify-center">
                <LogOut size={28} className="text-[var(--color-secondary-container)]" />
              </div>
              <span className="text-base font-semibold text-left mt-auto">Fechar Conta</span>
            </button>
          </div>
        </section>

        {stats.ativoRecente.length > 0 && (
          <section className="space-y-4 border-t border-white/10 pt-6">
            <h2 className="text-lg font-semibold text-[var(--color-on-surface)]">Atividade Recente</h2>
            <div className="flex flex-col bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
              {stats.ativoRecente.map((item, i) => (
                <div
                  key={i}
                  className={`flex justify-between items-center px-5 py-4 ${
                    i < stats.ativoRecente.length - 1 ? 'border-b border-white/10' : ''
                  } hover:bg-white/10 transition-colors`}
                >
                  <span className="text-sm font-medium text-white uppercase">{item.nome}</span>
                  <span className="text-sm font-bold font-mono text-[var(--color-secondary-container)]">
                    R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
