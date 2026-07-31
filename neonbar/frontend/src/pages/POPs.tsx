import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Plus,
  ClipboardList,
  Clock,
  Pencil,
  Trash2,
} from 'lucide-react';
import Card from '../components/Card';
import StatsCard from '../components/StatsCard';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Badge from '../components/Badge';
import { popsService } from '../services/api';
import type { POPPendente as POPPendenteType, POP } from '../types';

type Tab = 'hoje' | 'gerenciar';

export default function POPs() {
  const [tab, setTab] = useState<Tab>('hoje');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [pendentes, setPendentes] = useState<POPPendenteType[]>([]);
  const [pops, setPops] = useState<POP[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<POP | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titulo: '', descricao: '', categoria: '', frequencia: 'diario', setor: '', passos: [] as any[],
  });

  const load = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const [pendRes, popsRes] = await Promise.all([
        popsService.pendentes(),
        popsService.listar(),
      ]);
      setPendentes(pendRes.data || []);
      setPops(popsRes.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao carregar POPs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleExecutar = async (id: number) => {
    try {
      await popsService.executar(id);
      load(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao executar POP');
    }
  };

  const openNovo = () => {
    setEditando(null);
    setForm({ titulo: '', descricao: '', categoria: '', frequencia: 'diario', setor: '', passos: [] });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) return;
    setSaving(true);
    try {
      if (editando) {
        await popsService.atualizar(editando.id, form);
      } else {
        await popsService.criar(form);
      }
      setShowModal(false);
      load(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao salvar POP');
    } finally {
      setSaving(false);
    }
  };

  const handleExcluir = async (id: number) => {
    try {
      await popsService.excluir(id);
      load(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao excluir');
    }
  };

  const pendentesHoje = pendentes.filter((p) => !p.concluido_hoje).length;
  const concluidosHoje = pendentes.filter((p) => p.concluido_hoje).length;

  const getFrequenciaBadge = (f: string) => {
    switch (f) {
      case 'diario': return 'info';
      case 'semanal': return 'warning';
      case 'mensal': return 'success';
      default: return 'primary';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-outline)] text-sm">
        Carregando POPs...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg font-bold text-[var(--color-on-surface)]">POP & CHECKLIST</h1>
          <p className="text-label-md text-[var(--color-outline)] mt-1 uppercase">Procedimentos Operacionais Padrão</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" icon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />} onClick={() => load(true)}>
            Atualizar
          </Button>
          <Button icon={<Plus size={16} />} onClick={openNovo}>
            Novo POP
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-sm text-[var(--color-error)] flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total POPs" value={pops.length} icon={<ClipboardList size={20} />} variant="primary" />
        <StatsCard title="Pendentes Hoje" value={pendentesHoje} icon={<Clock size={20} />} variant="warning" subtitle="Aguardando execução" />
        <StatsCard title="Concluídos Hoje" value={concluidosHoje} icon={<CheckCircle size={20} />} variant="success" />
      </div>

      <Card className="!p-1">
        <div className="flex gap-1">
          <button
            onClick={() => setTab('hoje')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              tab === 'hoje'
                ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] shadow-[0_0_8px_rgba(0,218,243,0.15)]'
                : 'text-[var(--color-on-surface-variant)] hover:bg-[rgba(255,255,255,0.04)]'
            }`}
          >
            <Clock size={14} />
            Pendentes Hoje
          </button>
          <button
            onClick={() => setTab('gerenciar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              tab === 'gerenciar'
                ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] shadow-[0_0_8px_rgba(0,218,243,0.15)]'
                : 'text-[var(--color-on-surface-variant)] hover:bg-[rgba(255,255,255,0.04)]'
            }`}
          >
            <ClipboardList size={14} />
            Gerenciar POPs
          </button>
        </div>
      </Card>

      {tab === 'hoje' && (
        <div className="space-y-4">
          {pendentes.length === 0 ? (
            <Card><p className="text-sm text-[var(--color-outline)] text-center py-4">Nenhum POP encontrado para hoje</p></Card>
          ) : (
            pendentes.map((pop) => (
              <Card key={pop.id} className={pop.concluido_hoje ? 'opacity-60' : ''}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-[var(--color-on-surface)]">{pop.titulo}</h3>
                      <Badge variant={getFrequenciaBadge(pop.frequencia)}>{pop.frequencia}</Badge>
                      {pop.categoria && <Badge variant="primary">{pop.categoria}</Badge>}
                    </div>
                    {pop.descricao && <p className="text-xs text-[var(--color-on-surface-variant)] mb-2">{pop.descricao}</p>}
                    {pop.passos.length > 0 && (
                      <div className="space-y-1 mt-2">
                        {pop.passos.map((passo, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-[var(--color-on-surface-variant)]">
                            <span className="w-4 h-4 rounded-full bg-[var(--color-surface-container-high)] flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                              {passo.ordem || i + 1}
                            </span>
                            <span>{passo.descricao}</span>
                            {passo.tempo_estimado && (
                              <span className="text-[10px] text-[var(--color-outline)] ml-auto">
                                ~{passo.tempo_estimado}s
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {pop.ultima_execucao && (
                      <p className="text-[10px] text-[var(--color-outline)] mt-2">
                        Última execução: {new Date(pop.ultima_execucao).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col items-center gap-2">
                    {pop.concluido_hoje ? (
                      <Badge variant="success">Concluído</Badge>
                    ) : (
                      <Button size="sm" onClick={() => handleExecutar(pop.id)} icon={<CheckCircle size={14} />}>
                        Concluir
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {tab === 'gerenciar' && (
        <div className="space-y-4">
          {pops.length === 0 ? (
            <Card><p className="text-sm text-[var(--color-outline)] text-center py-4">Nenhum POP cadastrado</p></Card>
          ) : (
            pops.map((pop) => (
              <Card key={pop.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-[var(--color-on-surface)]">{pop.titulo}</h3>
                      <Badge variant={getFrequenciaBadge(pop.frequencia)}>{pop.frequencia}</Badge>
                    </div>
                    {pop.descricao && <p className="text-xs text-[var(--color-on-surface-variant)]">{pop.descricao}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      {pop.categoria && <Badge variant="primary">{pop.categoria}</Badge>}
                      {pop.setor && <Badge variant="info">{pop.setor}</Badge>}
                      <span className="text-[10px] text-[var(--color-outline)]">{pop.passos?.length || 0} passo(s)</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <button onClick={() => { setEditando(pop); setForm({ titulo: pop.titulo, descricao: pop.descricao || '', categoria: pop.categoria || '', frequencia: pop.frequencia, setor: pop.setor || '', passos: pop.passos || [] }); setShowModal(true); }} className="p-1.5 rounded text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[rgba(0,218,243,0.1)] cursor-pointer">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleExcluir(pop.id)} className="p-1.5 rounded text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)] hover:bg-[rgba(255,0,0,0.1)] cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editando ? 'Editar POP' : 'Novo POP'} size="md">
        <div className="space-y-4">
          <Input label="Título *" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          <Input label="Descrição" value={form.descricao || ''} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--color-outline)] font-mono uppercase mb-1 block">Categoria</label>
              <input
                type="text"
                value={form.categoria || ''}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(255,255,255,0.08)] text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)]/50"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-outline)] font-mono uppercase mb-1 block">Frequência</label>
              <select
                value={form.frequencia}
                onChange={(e) => setForm({ ...form, frequencia: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(255,255,255,0.08)] text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)]/50"
              >
                <option value="diario">Diário</option>
                <option value="semanal">Semanal</option>
                <option value="mensal">Mensal</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--color-outline)] font-mono uppercase mb-1 block">Setor</label>
            <input
              type="text"
              value={form.setor || ''}
              onChange={(e) => setForm({ ...form, setor: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(255,255,255,0.08)] text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)]/50"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>
              {editando ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
