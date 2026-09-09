import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { financeiroService } from '../services/api';
import api from '../services/api';
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
  mesasTotal: number;
  faturamentoTurno: number;
  ativoRecente: { nome: string; valor: string; status: string; tempo: string }[];
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
    mesasTotal: 0,
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

        const ativoRecente = pedidos.slice(0, 3).map((p: any) => {
          const created = p.created_at ? new Date(p.created_at) : new Date();
          const diffMin = Math.floor((Date.now() - created.getTime()) / 60000);
          const tempo = diffMin < 60 ? `Há ${diffMin} min` : `Há ${Math.floor(diffMin / 60)}h`;
          return {
            nome: p.mesa || 'Pedido',
            valor: `R$ ${(p.total || 0).toFixed(2)}`,
            status: p.status,
            tempo,
          };
        });

        setStats({
          totalPedidos: pedidos.length,
          pedidosNovos,
          pedidosPreparando,
          pedidosProntos,
          pedidosEntregues,
          mesasOcupadas: mesasComPedidos.size,
          mesasTotal: mesas.length,
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

  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    Novo: { color: 'text-cyan-400', bg: 'bg-cyan-400/15', label: 'Novo' },
    Preparando: { color: 'text-amber-400', bg: 'bg-amber-400/15', label: 'Em preparo' },
    Pronto: { color: 'text-emerald-400', bg: 'bg-emerald-400/15', label: 'Pronto para servir' },
    Entregue: { color: 'text-gray-400', bg: 'bg-gray-400/15', label: 'Entregue' },
  };

  const horas = ['19h', '20h', '21h', '22h', '23h', '00h'];

  return (
    <div className="flex flex-col h-full bg-[#091422] relative overflow-hidden">
      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <UserMenu open={userMenuOpen} onClose={() => setUserMenuOpen(false)} anchorRef={userButtonRef} />

      {/* Blobs decorativos de fundo */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-24 right-[-10%] w-[380px] h-[380px] rounded-full bg-[#38bdf8]/15 blur-[96px]" />
        <div className="absolute top-[40%] -left-28 w-[320px] h-[320px] rounded-full bg-[#00e3fd]/10 blur-[110px]" />
        <div className="absolute -bottom-16 right-0 w-[260px] h-[260px] rounded-full bg-[#8ed5ff]/10 blur-[80px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#040f1c]/70 backdrop-blur-2xl shadow-[0_1px_16px_rgba(0,0,0,0.35)]">
        <div className="h-16 px-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-[#202b3a]/60 text-[#bdc8d1] hover:text-[#38bdf8] transition-colors flex-shrink-0"
            >
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#38bdf8] to-[#00e3fd] flex items-center justify-center flex-shrink-0">
              <span className="text-[#091422] font-bold text-xs">B</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[#38bdf8] text-[10px] font-semibold uppercase tracking-wider truncate">Barize OS</span>
              <h1 className="text-[#d8e3f7] text-sm font-semibold tracking-tight truncate">Pedidos</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="w-11 h-11 rounded-full flex items-center justify-center bg-[#202b3a]/60 text-[#bdc8d1] hover:text-[#38bdf8] transition-colors relative shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#00e3fd] shadow-[0_0_8px_#00e3fd]" />
            </button>
            <button
              onClick={toggleTheme}
              className="w-11 h-11 rounded-full flex items-center justify-center bg-[#202b3a]/60 text-[#bdc8d1] hover:text-[#38bdf8] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <div ref={userButtonRef}>
              <button
                onClick={() => setUserMenuOpen(true)}
                className="w-8 h-8 rounded-full bg-[#38bdf8] flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[#00354a] text-[18px]">person</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 overflow-y-auto relative z-10 pt-16 pb-32">
        <div className="flex flex-col w-full px-5 space-y-4">

          {/* Saudação */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00e3fd] animate-pulse shadow-[0_0_8px_#00e3fd]" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#bdf4ff]">
                  Turno Noite • PDV 01
                </span>
              </div>
              <p className="text-[#d8e3f7] text-lg font-semibold tracking-tight truncate mt-0.5">Olá!</p>
            </div>
            <span className="px-2 py-1 rounded-full bg-[#202b3a]/80 text-[#8ed5ff] text-[10px] font-semibold backdrop-blur-md">
              Bar Chefe
            </span>
          </div>

          {/* Hero Card: Faturamento */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#38bdf8] via-[#38bdf8]/80 to-[#1e40af] p-5 shadow-[0_16px_36px_-6px_rgba(56,189,248,0.32)] text-white">
            <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-white/20 blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-36 h-24 bg-[#00e3fd]/20 blur-xl pointer-events-none" />
            <div className="relative z-10 flex flex-col space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-white/80">Faturamento da Noite</span>
                  <span className="material-symbols-outlined text-[18px] text-white/70">auto_graph</span>
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base font-semibold text-white/90">R$</span>
                  <h2 className="text-4xl font-bold tracking-tight text-white drop-shadow-sm font-mono">
                    {carregando ? '—' : stats.faturamentoTurno.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h2>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/15 backdrop-blur-md text-white text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  <span>Pedidos Hoje</span>
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/15 backdrop-blur-md text-white/90 text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[14px]">flag</span>
                  <span>{stats.totalPedidos} ativos</span>
                </div>
              </div>
              {/* Ações rápidas translúcidas */}
              <div className="grid grid-cols-4 gap-3 pt-2">
                <button
                  onClick={() => navigate('/pdv')}
                  className="group flex flex-col items-center justify-center p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-md transition-all"
                >
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px] text-white">add_circle</span>
                  </div>
                  <span className="text-[10px] font-semibold text-center text-white/90 truncate">Novo</span>
                </button>
                <button
                  onClick={() => navigate('/sala')}
                  className="group flex flex-col items-center justify-center p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-md transition-all"
                >
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px] text-white">deck</span>
                  </div>
                  <span className="text-[10px] font-semibold text-center text-white/90 truncate">Mesa</span>
                </button>
                <button
                  onClick={() => navigate('/pedidos')}
                  className="group flex flex-col items-center justify-center p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-md transition-all"
                >
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px] text-white">receipt</span>
                  </div>
                  <span className="text-[10px] font-semibold text-center text-white/90 truncate">Comandas</span>
                </button>
                <button
                  onClick={() => navigate('/financeiro')}
                  className="group flex flex-col items-center justify-center p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 backdrop-blur-md transition-all"
                >
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[20px] text-white">payments</span>
                  </div>
                  <span className="text-[10px] font-semibold text-center text-white/90 truncate">Caixa</span>
                </button>
              </div>
            </div>
          </section>

          {/* Histograma Volume de Doses / Hora */}
          <section className="rounded-2xl bg-[#16202f]/70 backdrop-blur-xl p-5 shadow-lg flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#87929a]">Velocidade de Bar</span>
                <h3 className="text-base font-semibold text-[#d8e3f7]">Volume de Doses / Hora</h3>
              </div>
              <div className="flex items-center gap-1 bg-[#202b3a]/80 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00e3fd] animate-pulse" />
                <span className="text-[10px] font-semibold text-[#bdf4ff]">22h Pico</span>
              </div>
            </div>
            <div className="h-32 w-full flex items-end justify-between gap-2 pt-2 px-1">
              {horas.map((h, i) => {
                const heights = [40, 60, 80, 96, 72, 45];
                const innerPcts = [65, 70, 85, 100, 80, 60];
                const isPico = i === 3;
                return (
                  <div key={h} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <div className={`w-full rounded-t-md flex flex-col justify-end p-0.5 relative ${isPico ? 'bg-[#2b3545]/50' : 'bg-[#2b3545]/40'}`} style={{ height: `${heights[i]}%` }}>
                      {isPico && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-[#00e3fd] text-[#091422] px-1.5 py-0.5 rounded-full text-[10px] font-bold shadow-[0_0_10px_#00e3fd]">
                          {stats.pedidosNovos + stats.pedidosPreparando}
                        </div>
                      )}
                      <div
                        className={`w-full rounded-t-sm ${isPico ? 'bg-gradient-to-t from-[#38bdf8] to-[#00e3fd] shadow-[0_0_12px_rgba(0,227,253,0.5)]' : 'bg-[#38bdf8]/60'}`}
                        style={{ height: `${innerPcts[i]}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-semibold ${isPico ? 'text-[#bdf4ff]' : 'text-[#87929a]'}`}>{h}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Bento Grid: Métricas Operacionais */}
          <section className="grid grid-cols-2 gap-3">
            {/* Mesas Ocupadas */}
            <div className="rounded-2xl bg-[#16202f]/70 backdrop-blur-xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-[#38bdf8]/20 flex items-center justify-center text-[#8ed5ff]">
                  <span className="material-symbols-outlined text-[18px]">table_bar</span>
                </div>
                <span className="text-[10px] font-bold text-[#00e3fd] bg-[#00e3fd]/10 px-2 py-0.5 rounded-full">
                  {stats.mesasTotal > 0 ? Math.round((stats.mesasOcupadas / stats.mesasTotal) * 100) : 0}%
                </span>
              </div>
              <div className="mt-3">
                <p className="text-xl font-bold text-[#d8e3f7]">
                  {carregando ? '—' : stats.mesasOcupadas} <span className="text-sm text-[#87929a] font-normal">/ {stats.mesasTotal}</span>
                </p>
                <p className="text-[10px] font-semibold text-[#bdc8d1] uppercase mt-0.5">Mesas Ocupadas</p>
              </div>
            </div>

            {/* Fila de Preparo */}
            <div className="rounded-2xl bg-[#16202f]/70 backdrop-blur-xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-[#00e3fd]/20 flex items-center justify-center text-[#00e3fd]">
                  <span className="material-symbols-outlined text-[18px]">timelapse</span>
                </div>
                <span className="text-[10px] font-semibold text-[#bdc8d1] bg-[#2b3545] px-2 py-0.5 rounded-full">
                  ~7 min
                </span>
              </div>
              <div className="mt-3">
                <p className="text-xl font-bold text-[#d8e3f7]">
                  {carregando ? '—' : stats.pedidosPreparando + stats.pedidosNovos} <span className="text-sm text-[#00e3fd] font-normal">ativos</span>
                </p>
                <p className="text-[10px] font-semibold text-[#bdc8d1] uppercase mt-0.5">Fila de Preparo</p>
              </div>
            </div>

            {/* Ticket Médio */}
            <div className="rounded-2xl bg-[#16202f]/70 backdrop-blur-xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-[#8ed5ff]/20 flex items-center justify-center text-[#8ed5ff]">
                  <span className="material-symbols-outlined text-[18px]">credit_card</span>
                </div>
                <span className="text-[10px] font-bold text-[#8ed5ff]">
                  +8%
                </span>
              </div>
              <div className="mt-3">
                <p className="text-xl font-bold text-[#d8e3f7]">
                  R$ {stats.totalPedidos > 0 ? Math.round(stats.faturamentoTurno / stats.totalPedidos) : 0}<span className="text-sm text-[#87929a]">,00</span>
                </p>
                <p className="text-[10px] font-semibold text-[#bdc8d1] uppercase mt-0.5">Ticket Médio</p>
              </div>
            </div>

            {/* Pedidos Prontos */}
            <div className="rounded-2xl bg-[#16202f]/70 backdrop-blur-xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-full bg-[#d4e3ff]/20 flex items-center justify-center text-[#afcfff]">
                  <span className="material-symbols-outlined text-[18px]">local_bar</span>
                </div>
                <span className="text-[10px] font-bold text-[#38bdf8]">
                  Top 1
                </span>
              </div>
              <div className="mt-3 min-w-0">
                <p className="text-base font-bold text-[#d8e3f7] truncate">
                  {carregando ? '—' : stats.pedidosProntos} prontos
                </p>
                <p className="text-[10px] font-semibold text-[#00e3fd] mt-0.5">
                  {carregando ? '—' : stats.pedidosEntregues} servidos
                </p>
              </div>
            </div>
          </section>

          {/* Pedidos Recentes & Alertas */}
          <section className="flex flex-col space-y-3 pb-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#d8e3f7]">Pedidos Recentes</h3>
              <button
                onClick={() => navigate('/pedidos')}
                className="text-[#38bdf8] hover:text-[#00e3fd] transition-colors text-[11px] font-bold"
              >
                Ver Todos
              </button>
            </div>
            <div className="space-y-2">
              {stats.ativoRecente.map((item, i) => {
                const sc = statusConfig[item.status] || statusConfig.Novo;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#16202f]/80 backdrop-blur-xl shadow-sm hover:bg-[#202b3a] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${sc.bg} ${sc.color}`}>
                        {item.nome.slice(0, 3)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-[#d8e3f7] truncate">{item.status === 'Novo' ? 'Pedido' : item.nome}</span>
                        <span className={`text-[10px] font-semibold flex items-center gap-1 mt-0.5 ${sc.color}`}>
                          <span className="material-symbols-outlined text-[12px]">
                            {item.status === 'Pronto' ? 'check_circle' : item.status === 'Preparando' ? 'sync' : 'radio_button_checked'}
                          </span>
                          {sc.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0 pl-2">
                      <span className="text-sm font-semibold text-[#d8e3f7]">{item.valor}</span>
                      <span className="text-[10px] text-[#87929a]">{item.tempo}</span>
                    </div>
                  </div>
                );
              })}
              {stats.ativoRecente.length === 0 && !carregando && (
                <div className="flex items-center justify-center p-6 rounded-xl bg-[#16202f]/50 text-[#87929a] text-sm">
                  Nenhum pedido ativo
                </div>
              )}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
