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
  Sun,
  Sunrise,
  Moon,
  Flame,
  CalendarDays,
  CalendarRange,
  Gauge,
} from 'lucide-react';
import Card from '../components/Card';
import StatsCard from '../components/StatsCard';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Badge from '../components/Badge';
import { popsService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { POPPendente as POPPendenteType, POP, FluxoEstabelecimento, PeriodoChecklist } from '../types';

type Tab = PeriodoChecklist | 'gerenciar';

const SETORES = ['Bar', 'Cozinha', 'Salão', 'Estoque', 'Caixa', 'Higiene', 'Segurança', 'Compras', 'Financeiro', 'Manutenção', 'Gestão', 'Barback'];

const MOMENTOS: Record<string, { label: string; icon: any }> = {
  abertura: { label: 'Abertura', icon: Sunrise },
  durante: { label: 'Durante o Serviço', icon: Flame },
  fechamento: { label: 'Fechamento', icon: Moon },
};

const PERIODO_LABEL: Record<PeriodoChecklist, string> = {
  diario: 'Diário',
  semanal: 'Semanal',
  mensal: 'Mensal',
};

const FLUXO_LABEL: Record<FluxoEstabelecimento, string> = {
  baixo: 'Baixo Movimento',
  medio: 'Médio Movimento',
  alto: 'Alto Movimento',
};

const FLUXO_KEY = 'barize_fluxo';

export default function POPs() {
  const { usuario } = useAuth();
  const [tab, setTab] = useState<Tab>('diario');
  const [fluxo, setFluxo] = useState<FluxoEstabelecimento>(() => {
    const saved = localStorage.getItem(FLUXO_KEY) as FluxoEstabelecimento | null;
    return saved || 'medio';
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [pendentes, setPendentes] = useState<POPPendenteType[]>([]);
  const [pops, setPops] = useState<POP[]>([]);

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<POP | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titulo: '', descricao: '', categoria: '', frequencia: 'diario' as PeriodoChecklist,
    momento: '' as string, setor: '', passos: [] as any[], ordem: 0,
    exigencia_fluxo: { baixo: 'sempre', medio: 'sempre', alto: 'sempre' } as Record<string, string>,
  });

  const [execModal, setExecModal] = useState<POPPendenteType | null>(null);
  const [execForm, setExecForm] = useState({ realizado_por: '', observacao: '' });
  const [executing, setExecuting] = useState(false);

  const load = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const periodo = tab === 'gerenciar' ? undefined : tab;
      const params: any = { fluxo };
      if (periodo) params.frequencia = periodo;
      const [pendRes, popsRes] = await Promise.all([
        popsService.pendentes(params),
        popsService.listar({ fluxo }),
      ]);
      setPendentes(pendRes.data || []);
      setPops(popsRes.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao carregar o checklist');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tab, fluxo]);

  useEffect(() => { load(); }, [load]);

  const changeFluxo = (f: FluxoEstabelecimento) => {
    setFluxo(f);
    localStorage.setItem(FLUXO_KEY, f);
  };

  const abrirExecucao = (pop: POPPendenteType) => {
    setExecForm({ realizado_por: usuario?.nome || '', observacao: '' });
    setExecModal(pop);
  };

  const handleExecutar = async () => {
    if (!execModal) return;
    setExecuting(true);
    try {
      await popsService.executar(execModal.id, execForm);
      setExecModal(null);
      load(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao concluir item');
    } finally {
      setExecuting(false);
    }
  };

  const openNovo = () => {
    setEditando(null);
    setForm({
      titulo: '', descricao: '', categoria: '', frequencia: 'diario',
      momento: '', setor: '', passos: [], ordem: 0,
      exigencia_fluxo: { baixo: 'sempre', medio: 'sempre', alto: 'sempre' },
    });
    setShowModal(true);
  };

  const openEditar = (pop: POP) => {
    setEditando(pop);
    setForm({
      titulo: pop.titulo,
      descricao: pop.descricao || '',
      categoria: pop.categoria || '',
      frequencia: (pop.frequencia || 'diario') as PeriodoChecklist,
      momento: pop.momento || '',
      setor: pop.setor || '',
      passos: pop.passos || [],
      ordem: pop.ordem || 0,
      exigencia_fluxo: { baixo: 'sempre', medio: 'sempre', alto: 'sempre', ...(pop.exigencia_fluxo || {}) },
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.titulo.trim()) return;
    setSaving(true);
    try {
      const payload = { ...form, momento: form.frequencia === 'diario' ? form.momento || null : null };
      if (editando) {
        await popsService.atualizar(editando.id, payload);
      } else {
        await popsService.criar(payload);
      }
      setShowModal(false);
      load(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao salvar item');
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

  const total = pendentes.length;
  const concluidos = pendentes.filter((p) => p.concluido_periodo).length;
  const progresso = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  const porMomento = (m: string) => pendentes.filter((p) => p.momento === m);
  const porSetor = (list: POPPendenteType[]) => {
    const grupos: Record<string, POPPendenteType[]> = {};
    SETORES.forEach((s) => {
      const itens = list.filter((p) => (p.setor || 'Outros') === s);
      if (itens.length) grupos[s] = itens;
    });
    const outros = list.filter((p) => !SETORES.includes(p.setor || ''));
    if (outros.length) grupos['Outros'] = outros;
    return grupos;
  };

  const getFrequenciaBadge = (f: string) => {
    switch (f) {
      case 'diario': return 'info';
      case 'semanal': return 'warning';
      case 'mensal': return 'success';
      default: return 'primary';
    }
  };

  const renderItem = (pop: POPPendenteType) => {
    const req = pop.exigencia_fluxo?.[fluxo];
    const opcional = req === 'opcional';
    return (
      <Card key={pop.id} className={pop.concluido_periodo ? 'opacity-60' : ''}>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-sm font-bold text-[var(--color-on-surface)]">{pop.titulo}</h3>
              <Badge variant={getFrequenciaBadge(pop.frequencia)}>{PERIODO_LABEL[pop.frequencia as PeriodoChecklist] || pop.frequencia}</Badge>
              {pop.setor && <Badge variant="primary">{pop.setor}</Badge>}
              {opcional && <Badge variant="secondary">Opcional no seu fluxo</Badge>}
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
          <div className="ml-4 flex flex-col items-center gap-2 flex-shrink-0">
            {pop.concluido_periodo ? (
              <Badge variant="success">Concluído</Badge>
            ) : (
              <Button size="sm" onClick={() => abrirExecucao(pop)} icon={<CheckCircle size={14} />}>
                Concluir
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderLista = (list: POPPendenteType[]) => {
    if (list.length === 0) {
      return <Card><p className="text-sm text-[var(--color-outline)] text-center py-4">Nenhum item para este período</p></Card>;
    }

    if (tab === 'diario') {
      return (
        <div className="space-y-6">
          {['abertura', 'durante', 'fechamento'].map((mom) => {
            const itens = porMomento(mom);
            if (itens.length === 0) return null;
            const MomIcon = MOMENTOS[mom].icon;
            const done = itens.filter((i) => i.concluido_periodo).length;
            return (
              <div key={mom}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[var(--color-primary-container)]/20 text-[var(--color-primary)] flex items-center justify-center">
                      <MomIcon size={14} />
                    </span>
                    <h3 className="text-sm font-bold text-[var(--color-on-surface)]">{MOMENTOS[mom].label}</h3>
                    <span className="text-[10px] text-[var(--color-outline)]">{done}/{itens.length}</span>
                  </div>
                  <div className="w-32 h-1.5 rounded-full bg-[var(--color-surface-container-high)] overflow-hidden">
                    <div className="h-full bg-[var(--color-primary)] rounded-full transition-all" style={{ width: `${itens.length ? (done / itens.length) * 100 : 0}%` }} />
                  </div>
                </div>
                <div className="space-y-3">
                  {Object.entries(porSetor(itens)).map(([setor, grupo]) => (
                    <div key={setor}>
                      <p className="text-[10px] font-mono uppercase text-[var(--color-outline)] mb-1 px-1">{setor}</p>
                      <div className="space-y-3">{grupo.map(renderItem)}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {Object.entries(porSetor(list)).map(([setor, grupo]) => {
          const done = grupo.filter((i) => i.concluido_periodo).length;
          return (
            <div key={setor}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-[var(--color-on-surface)]">{setor}</h3>
                <span className="text-[10px] text-[var(--color-outline)]">{done}/{grupo.length} concluídos</span>
              </div>
              <div className="space-y-3">{grupo.map(renderItem)}</div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-outline)] text-sm">
        Carregando checklist...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-headline-lg font-bold text-[var(--color-on-surface)]">Checklist</h1>
          <p className="text-label-md text-[var(--color-outline)] mt-1 uppercase">Procedimentos Operacionais Padrão</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-[var(--color-surface-container-lowest)] border border-[rgba(var(--overlay-rgb),0.08)] rounded-lg p-1">
            <Gauge size={14} className="text-[var(--color-outline)] mx-1" />
            {(Object.keys(FLUXO_LABEL) as FluxoEstabelecimento[]).map((f) => (
              <button
                key={f}
                onClick={() => changeFluxo(f)}
                title={FLUXO_LABEL[f]}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                  fluxo === f
                    ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] shadow-[0_0_8px_rgba(0,218,243,0.15)]'
                    : 'text-[var(--color-on-surface-variant)] hover:bg-[rgba(var(--overlay-rgb),0.04)]'
                }`}
              >
                {FLUXO_LABEL[f].replace(' Movimento', '')}
              </button>
            ))}
          </div>
          <Button variant="ghost" icon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />} onClick={() => load(true)}>
            Atualizar
          </Button>
          <Button icon={<Plus size={16} />} onClick={openNovo}>
            Novo Item
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
        <StatsCard title={`Total ${tab === 'gerenciar' ? 'de Itens' : PERIODO_LABEL[tab]}`} value={tab === 'gerenciar' ? pops.length : total} icon={<ClipboardList size={20} />} variant="primary" />
        <StatsCard title="Concluídos" value={tab === 'gerenciar' ? '-' : concluidos} icon={<CheckCircle size={20} />} variant="success" subtitle={tab === 'gerenciar' ? 'Gestão de itens' : `Progresso ${progresso}%`} />
        <StatsCard title="Pendentes" value={tab === 'gerenciar' ? '-' : total - concluidos} icon={<Clock size={20} />} variant="warning" subtitle={`Fluxo: ${FLUXO_LABEL[fluxo]}`} />
      </div>

      {tab !== 'gerenciar' && total > 0 && (
        <div className="h-2 rounded-full bg-[var(--color-surface-container-high)] overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] rounded-full transition-all" style={{ width: `${progresso}%` }} />
        </div>
      )}

      <Card className="!p-1">
        <div className="flex gap-1 flex-wrap">
          {(['diario', 'semanal', 'mensal'] as PeriodoChecklist[]).map((p) => {
            const Icon = p === 'diario' ? Sun : p === 'semanal' ? CalendarDays : CalendarRange;
            return (
              <button
                key={p}
                onClick={() => setTab(p)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  tab === p
                    ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] shadow-[0_0_8px_rgba(0,218,243,0.15)]'
                    : 'text-[var(--color-on-surface-variant)] hover:bg-[rgba(var(--overlay-rgb),0.04)]'
                }`}
              >
                <Icon size={14} />
                {PERIODO_LABEL[p]}
              </button>
            );
          })}
          <button
            onClick={() => setTab('gerenciar')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              tab === 'gerenciar'
                ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] shadow-[0_0_8px_rgba(0,218,243,0.15)]'
                : 'text-[var(--color-on-surface-variant)] hover:bg-[rgba(var(--overlay-rgb),0.04)]'
            }`}
          >
            <ClipboardList size={14} />
            Gerenciar
          </button>
        </div>
      </Card>

      {tab !== 'gerenciar' && renderLista(pendentes)}

      {tab === 'gerenciar' && (
        <div className="space-y-4">
          {pops.length === 0 ? (
            <Card><p className="text-sm text-[var(--color-outline)] text-center py-4">Nenhum item cadastrado</p></Card>
          ) : (
            pops.map((pop) => (
              <Card key={pop.id}>
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="text-sm font-bold text-[var(--color-on-surface)]">{pop.titulo}</h3>
                      <Badge variant={getFrequenciaBadge(pop.frequencia)}>{PERIODO_LABEL[pop.frequencia as PeriodoChecklist] || pop.frequencia}</Badge>
                    </div>
                    {pop.descricao && <p className="text-xs text-[var(--color-on-surface-variant)]">{pop.descricao}</p>}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {pop.setor && <Badge variant="primary">{pop.setor}</Badge>}
                      {pop.momento && <Badge variant="info">{MOMENTOS[pop.momento]?.label || pop.momento}</Badge>}
                      <span className="text-[10px] text-[var(--color-outline)]">{pop.passos?.length || 0} passo(s) · ordem {pop.ordem || 0}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                    <button onClick={() => openEditar(pop)} className="p-1.5 rounded text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[rgba(0,218,243,0.1)] cursor-pointer">
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editando ? 'Editar Item' : 'Novo Item'} size="md">
        <div className="space-y-4">
          <Input label="Título *" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
          <Input label="Descrição" value={form.descricao || ''} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--color-outline)] font-mono uppercase mb-1 block">Período</label>
              <select
                value={form.frequencia}
                onChange={(e) => setForm({ ...form, frequencia: e.target.value as PeriodoChecklist, momento: e.target.value === 'diario' ? form.momento : '' })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)]/50"
              >
                <option value="diario">Diário</option>
                <option value="semanal">Semanal</option>
                <option value="mensal">Mensal</option>
              </select>
            </div>
            {form.frequencia === 'diario' && (
              <div>
                <label className="text-xs text-[var(--color-outline)] font-mono uppercase mb-1 block">Momento</label>
                <select
                  value={form.momento}
                  onChange={(e) => setForm({ ...form, momento: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)]/50"
                >
                  <option value="">Selecionar...</option>
                  <option value="abertura">Abertura</option>
                  <option value="durante">Durante o Serviço</option>
                  <option value="fechamento">Fechamento</option>
                </select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--color-outline)] font-mono uppercase mb-1 block">Setor</label>
              <select
                value={form.setor}
                onChange={(e) => setForm({ ...form, setor: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)]/50"
              >
                <option value="">Selecionar...</option>
                {SETORES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--color-outline)] font-mono uppercase mb-1 block">Ordem</label>
              <input
                type="number"
                value={form.ordem}
                onChange={(e) => setForm({ ...form, ordem: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)]/50"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--color-outline)] font-mono uppercase mb-1 block">Exigência por fluxo</label>
            <div className="grid grid-cols-3 gap-2">
              {(['baixo', 'medio', 'alto'] as FluxoEstabelecimento[]).map((f) => (
                <div key={f}>
                  <label className="text-[10px] text-[var(--color-outline)] mb-1 block capitalize">{f}</label>
                  <select
                    value={form.exigencia_fluxo[f]}
                    onChange={(e) => setForm({ ...form, exigencia_fluxo: { ...form.exigencia_fluxo, [f]: e.target.value } })}
                    className="w-full px-2 py-1.5 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.08)] text-xs text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)]/50"
                  >
                    <option value="sempre">Sempre</option>
                    <option value="opcional">Opcional</option>
                    <option value="nao_aplicavel">Não aplicável</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button className="flex-1" loading={saving} onClick={handleSave}>
              {editando ? 'Atualizar' : 'Criar'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={execModal !== null} onClose={() => setExecModal(null)} title="Concluir Item" size="sm">
        {execModal && (
          <div className="space-y-4">
            <p className="text-sm font-bold text-[var(--color-on-surface)]">{execModal.titulo}</p>
            {execModal.descricao && <p className="text-xs text-[var(--color-on-surface-variant)]">{execModal.descricao}</p>}
            <Input label="Feito por" value={execForm.realizado_por} onChange={(e) => setExecForm({ ...execForm, realizado_por: e.target.value })} />
            <div>
              <label className="text-xs text-[var(--color-outline)] font-mono uppercase mb-1 block">Observação (opcional)</label>
              <textarea
                value={execForm.observacao}
                onChange={(e) => setExecForm({ ...execForm, observacao: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.08)] text-sm text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)]/50 resize-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setExecModal(null)}>Cancelar</Button>
              <Button className="flex-1" loading={executing} onClick={handleExecutar} icon={<CheckCircle size={16} />}>
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
