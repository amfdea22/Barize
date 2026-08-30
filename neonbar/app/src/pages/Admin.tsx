import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Box, Users, Grid3x3, Printer, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { adminService } from '../services/api';
import Badge from '../components/Badge';

type AdminTab = 'monitoramento' | 'lotes' | 'funcionarios' | 'mesas' | 'impressoras';

export default function Admin() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>('monitoramento');
  const [_loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    if (!usuario || !['admin', 'gerente'].includes(usuario.role)) { navigate('/login'); return; }
    loadHealth();
  }, [usuario, navigate]);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const res = await adminService.healthEnhanced().catch(() => ({ data: null }));
      setHealth(res?.data);
    } catch {} finally { setLoading(false); }
  };

  const tabs: { id: AdminTab; label: string; icon: any }[] = [
    { id: 'monitoramento', label: 'Sistema', icon: Activity },
    { id: 'lotes', label: 'Lotes', icon: Box },
    { id: 'funcionarios', label: 'Equipe', icon: Users },
    { id: 'mesas', label: 'Mesas', icon: Grid3x3 },
    { id: 'impressoras', label: 'Impressoras', icon: Printer },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-on-surface)]">Administração</h1>
          <p className="text-xs text-[var(--color-on-surface-variant)]">{usuario?.nome} ({usuario?.role})</p>
        </div>
        <button onClick={loadHealth} className="p-2 rounded-lg bg-[var(--color-surface-container-high)]">
          <RefreshCw size={16} className="text-[var(--color-on-surface-variant)]" />
        </button>
      </div>

      {error && <div className="mx-4 mb-3 p-2 rounded-lg bg-[var(--color-error)]/10 text-xs text-[var(--color-error)] flex items-center justify-between"><span>{error}</span><button onClick={() => setError('')}><X size={14} /></button></div>}

      <div className="px-4 pb-3 flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${tab === t.id ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]' : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'}`}>
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {tab === 'monitoramento' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-[var(--color-surface-container)]">
                <p className="text-[10px] text-[var(--color-outline)] uppercase">Sistema</p>
                <Badge variant={health?.status === 'ok' ? 'success' : 'error'}>{health?.status || '---'}</Badge>
              </div>
              <div className="p-3 rounded-xl bg-[var(--color-surface-container)]">
                <p className="text-[10px] text-[var(--color-outline)] uppercase">Banco</p>
                <Badge variant={health?.banco?.status === 'conectado' ? 'success' : 'error'}>{health?.banco?.status || '---'}</Badge>
              </div>
            </div>
            <div className="rounded-xl bg-[var(--color-surface-container)] p-3">
              <p className="text-xs font-semibold text-[var(--color-on-surface-variant)] uppercase mb-2">Acesso Rápido</p>
              <div className="space-y-1.5">
                {[
                  { label: 'Gestão de Lotes', t: 'lotes' as AdminTab },
                  { label: 'Funcionários', t: 'funcionarios' as AdminTab },
                  { label: 'Mesas', t: 'mesas' as AdminTab },
                  { label: 'Impressoras', t: 'impressoras' as AdminTab },
                ].map(item => (
                  <button key={item.t} onClick={() => setTab(item.t)} className="w-full text-left px-3 py-2 rounded-lg bg-[var(--color-surface-container-high)] text-xs font-medium text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-highest)]">
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'lotes' && (
          <div className="rounded-xl bg-[var(--color-surface-container)] p-4 text-center text-sm text-[var(--color-outline)]">
            <Box size={28} className="mx-auto mb-2 opacity-30" />
            <p>Gestão de lotes disponível na versão web.</p>
            <p className="text-[10px] text-[var(--color-outline)]/60 mt-1">Acesse /admin ? Lotes para gerenciar.</p>
          </div>
        )}

        {tab === 'funcionarios' && (
          <div className="rounded-xl bg-[var(--color-surface-container)] p-4 text-center text-sm text-[var(--color-outline)]">
            <Users size={28} className="mx-auto mb-2 opacity-30" />
            <p>Gestão de funcionários disponível na versão web.</p>
          </div>
        )}

        {tab === 'mesas' && (
          <div className="rounded-xl bg-[var(--color-surface-container)] p-4 text-center text-sm text-[var(--color-outline)]">
            <Grid3x3 size={28} className="mx-auto mb-2 opacity-30" />
            <p>Gestão de mesas disponível na versão web.</p>
          </div>
        )}

        {tab === 'impressoras' && (
          <div className="rounded-xl bg-[var(--color-surface-container)] p-4 text-center text-sm text-[var(--color-outline)]">
            <Printer size={28} className="mx-auto mb-2 opacity-30" />
            <p>Configuração de impressoras disponível na versão web.</p>
          </div>
        )}
      </div>
    </div>
  );
}
