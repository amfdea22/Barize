import { useState, useEffect, useCallback } from 'react';
import { CookingPot, Wine, ChefHat, Timer, MapPin, User, RefreshCw } from 'lucide-react';
import { pedidosService, pdvService } from '../services/api';
import Badge from '../components/Badge';
import type { Pedido } from '../types';

type Sector = 'todos' | 'bar' | 'cozinha';

const CATEGORIAS_BAR = [
  'bebida', 'bebidas', 'drink', 'drinks', 'coquetel', 'cerveja', 'destilado',
  'whisky', 'vinho', 'refrigerante', 'suco', '�gua', 'energ�tico', 'long neck',
];

function isBar(categoria?: string): boolean {
  if (!categoria) return false;
  const cat = categoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return CATEGORIAS_BAR.some(k => cat.includes(k));
}

function parseDate(s?: string | null): number {
  if (!s) return NaN;
  const d = new Date(s);
  if (isNaN(d.getTime())) return NaN;
  if (!s.endsWith('Z') && !s.includes('+')) return d.getTime() - d.getTimezoneOffset() * 60000;
  return d.getTime();
}

function formatElapsed(created?: string | null, now: number = Date.now()) {
  const ms = parseDate(created);
  if (isNaN(ms)) return '�';
  const diff = Math.floor((now - ms) / 60000);
  if (diff <= 0) return 'agora';
  if (diff < 60) return `${diff} min`;
  return `${Math.floor(diff / 60)}h${diff % 60}m`;
}

function getSetor(itens: { nome: string }[], produtos: { nome: string; categoria?: string }[]): Sector {
  for (const item of itens) {
    const prod = produtos.find(p => p.nome === item.nome);
    if (prod && isBar(prod.categoria)) return 'bar';
  }
  return 'cozinha';
}

export default function FilaPreparo() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [produtos, setProdutos] = useState<{ nome: string; categoria?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Sector>('todos');
  const [now, setNow] = useState(Date.now());

  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(id); }, []);

  const loadData = useCallback(async () => {
    try {
      const [pedidosRes, produtosRes] = await Promise.all([
        pedidosService.listarAtivos(),
        pdvService.listarProdutos(),
      ]);
      setPedidos(Array.isArray(pedidosRes.data) ? pedidosRes.data : []);
      setProdutos(Array.isArray(produtosRes.data) ? produtosRes.data.map((p: any) => ({ nome: p.nome, categoria: p.categoria })) : []);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { const interval = setInterval(loadData, 15000); return () => clearInterval(interval); }, [loadData]);

  const pedidosComSetor = pedidos.filter(p => p.status !== 'Entregue' && p.status !== 'Cancelado').map(p => ({ ...p, setor: getSetor(p.itens, produtos) }));
  const filtered = activeTab === 'todos' ? pedidosComSetor : pedidosComSetor.filter(p => p.setor === activeTab);
  const countBar = pedidosComSetor.filter(p => p.setor === 'bar').length;
  const countCozinha = pedidosComSetor.filter(p => p.setor === 'cozinha').length;

  const tabs: { key: Sector; label: string; icon: any; count: number }[] = [
    { key: 'todos', label: 'Todos', icon: CookingPot, count: pedidos.length },
    { key: 'bar', label: 'Bar', icon: Wine, count: countBar },
    { key: 'cozinha', label: 'Cozinha', icon: ChefHat, count: countCozinha },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={24} className="animate-spin text-[var(--color-primary-container)]" />
          <span className="text-xs text-[var(--color-outline)]">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CookingPot size={20} className="text-[var(--color-primary)]" />
          <div>
            <h1 className="text-lg font-bold text-[var(--color-on-surface)]">Fila de Preparo</h1>
            <p className="text-xs text-[var(--color-on-surface-variant)]">{pedidos.length} pedido(s)</p>
          </div>
        </div>
        <button onClick={loadData} className="p-2 rounded-lg bg-[var(--color-surface-container-high)]">
          <RefreshCw size={16} className="text-[var(--color-on-surface-variant)]" />
        </button>
      </div>

      <div className="px-4 pb-3 flex border-b border-[rgba(var(--overlay-rgb),0.06)]">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.key ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-on-surface-variant)]'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
            <Badge variant={activeTab === tab.key ? 'primary' : 'neutral'}>{tab.count}</Badge>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <CookingPot size={36} className="text-[var(--color-primary)]/20" />
            <p className="text-sm text-[var(--color-on-surface-variant)]">Nenhum pedido na fila</p>
          </div>
        ) : (
          filtered.map(pedido => {
            const elapsed = formatElapsed(pedido.created_at, now);
            const isNovo = pedido.status === 'Novo';
            const prepTime = pedido.tempo_preparo_estimado || 5;
            const elapsedMin = Math.floor((now - (parseDate(pedido.created_at) || now)) / 60000);
            const isOverdue = elapsedMin > prepTime;

            return (
              <div
                key={pedido.id}
                className={`bg-[rgba(var(--glass-rgb),0.6)] backdrop-blur-[12px] border rounded-xl overflow-hidden ${
                  isNovo ? 'border-[var(--color-primary)]/40 shadow-[0_0_8px_rgba(0,218,243,0.3)]' : 'border-[rgba(var(--overlay-rgb),0.1)]'
                }`}
              >
                <div className={`px-3 py-2 flex justify-between items-center border-b ${
                  isNovo ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/20' : 'bg-[var(--color-surface-container-highest)] border-[rgba(var(--overlay-rgb),0.1)]'
                }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--color-primary)]">#{pedido.id}</span>
                    <span className={`px-1.5 py-0.5 text-[9px] rounded uppercase font-bold ${pedido.setor === 'bar' ? 'bg-purple-500/20 text-purple-400' : 'bg-orange-500/20 text-orange-400'}`}>
                      {pedido.setor === 'bar' ? 'BAR' : 'COZINHA'}
                    </span>
                  </div>
                  <span className={`px-1.5 py-0.5 text-[9px] rounded uppercase font-bold ${isNovo ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] animate-pulse' : 'bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]'}`}>
                    {pedido.status}
                  </span>
                </div>

                <div className="px-3 py-2">
                  <div className="flex items-center gap-3 mb-2 text-[10px] text-[var(--color-on-surface-variant)]">
                    {pedido.mesa && <span className="flex items-center gap-0.5"><MapPin size={10} /> {pedido.mesa}</span>}
                    {pedido.cliente && <span className="flex items-center gap-0.5"><User size={10} /> {pedido.cliente}</span>}
                    <span className="flex items-center gap-0.5"><Timer size={10} /> {elapsed}</span>
                  </div>

                  <div className="space-y-1">
                    {pedido.itens.map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <span className="text-[var(--color-on-surface)]">{item.quantidade}x {item.nome}</span>
                        {item.observacao && <span className="text-[9px] text-[var(--color-secondary)] italic truncate max-w-[100px]">{item.observacao}</span>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`px-3 py-2 border-t flex items-center justify-between ${
                  isOverdue ? 'bg-[var(--color-error)]/10 border-[var(--color-error)]/30' : 'bg-[var(--color-surface-container-high)] border-[rgba(var(--overlay-rgb),0.1)]'
                }`}>
                  <span className={`text-[10px] ${isOverdue ? 'text-[var(--color-error)] font-bold' : 'text-[var(--color-on-surface-variant)]'}`}>
                    Est: {prepTime} min {isOverdue && '? Atrasado'}
                  </span>
                  <span className="text-sm font-bold text-[var(--color-primary)]">R$ {pedido.total.toFixed(2)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
