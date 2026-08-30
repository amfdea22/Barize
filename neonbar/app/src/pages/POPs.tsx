import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Clock, Sunrise, Moon, RefreshCw, AlertTriangle } from 'lucide-react';
import { popsService } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import type { POPPendente, FluxoEstabelecimento, PeriodoChecklist } from '../types';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import { toast } from '../components/Toast';

type Tab = PeriodoChecklist | 'gerenciar';

const MOMENTOS: Record<string, { label: string; icon: any }> = {
  abertura: { label: 'Abertura', icon: Sunrise },
  durante: { label: 'Durante', icon: Clock },
  fechamento: { label: 'Fechamento', icon: Moon },
};

const PERIODO_LABEL: Record<PeriodoChecklist, string> = { diario: 'Diário', semanal: 'Semanal', mensal: 'Mensal' };
const FLUXO_LABEL: Record<FluxoEstabelecimento, string> = { baixo: 'Baixo', medio: 'Médio', alto: 'Alto' };

export default function POPs() {
  const { usuario } = useAuth();
  const [tab, setTab] = useState<Tab>('diario');
  const [fluxo, setFluxo] = useState<FluxoEstabelecimento>('medio');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendentes, setPendentes] = useState<POPPendente[]>([]);
  const [execModal, setExecModal] = useState<POPPendente | null>(null);
  const [execForm, setExecForm] = useState({ realizado_por: '', observacao: '' });
  const [executing, setExecuting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { fluxo };
      if (tab !== 'gerenciar') params.frequencia = tab;
      const res = await popsService.pendentes(params);
      setPendentes(res.data || []);
    } catch (err: any) { setError(err?.response?.data?.detail || 'Erro'); }
    finally { setLoading(false); }
  }, [tab, fluxo]);

  useEffect(() => { load(); }, [load]);

  const handleExecutar = async () => {
    if (!execModal) return;
    setExecuting(true);
    try {
      await popsService.executar(execModal.id, execForm);
      setExecModal(null); toast.success('Concluído!'); load();
    } catch (err: any) { setError(err?.response?.data?.detail || 'Erro'); }
    finally { setExecuting(false); }
  };

  const total = pendentes.length;
  const concluidos = pendentes.filter(p => p.concluido_periodo).length;
  const progresso = total > 0 ? Math.round((concluidos / total) * 100) : 0;

  const porMomento = (m: string) => pendentes.filter(p => p.momento === m);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-on-surface)]">Checklist</h1>
          <p className="text-xs text-[var(--color-on-surface-variant)]">Procedimentos Operacionais</p>
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-[var(--color-surface-container-high)]">
          <RefreshCw size={16} className="text-[var(--color-on-surface-variant)]" />
        </button>
      </div>

      <div className="px-4 pb-2 flex gap-1">
        {(Object.keys(FLUXO_LABEL) as FluxoEstabelecimento[]).map(f => (
          <button key={f} onClick={() => setFluxo(f)} className={`px-2.5 py-1 rounded-md text-[10px] font-medium ${fluxo === f ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'}`}>
            {FLUXO_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="px-4 pb-2 flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {(['diario', 'semanal', 'mensal'] as PeriodoChecklist[]).map(p => (
          <button key={p} onClick={() => setTab(p)} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${tab === p ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]' : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)]'}`}>
            {PERIODO_LABEL[p]}
          </button>
        ))}
      </div>

      {error && <div className="mx-4 mb-2 p-2 rounded-lg bg-[var(--color-error)]/10 text-xs text-[var(--color-error)] flex items-center gap-2"><AlertTriangle size={14} /> {error}</div>}

      {tab !== 'gerenciar' && total > 0 && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-[var(--color-outline)]">{concluidos}/{total} = {progresso}%</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--color-surface-container-high)] overflow-hidden">
            <div className="h-full bg-[var(--color-primary)] rounded-full transition-all" style={{ width: `${progresso}%` }} />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-3">
        {loading ? <div className="py-12 text-center text-sm text-[var(--color-outline)]">Carregando...</div> :
          pendentes.length === 0 ? <div className="py-12 text-center text-sm text-[var(--color-outline)]">Nenhum item pendente</div> :
          tab === 'diario' ? (
            ['abertura', 'durante', 'fechamento'].map(mom => {
              const itens = porMomento(mom);
              if (itens.length === 0) return null;
              const MomIcon = MOMENTOS[mom].icon;
              const done = itens.filter(i => i.concluido_periodo).length;
              return (
                <div key={mom}>
                  <div className="flex items-center gap-2 mb-2">
                    <MomIcon size={14} className="text-[var(--color-primary)]" />
                    <span className="text-xs font-bold text-[var(--color-on-surface)]">{MOMENTOS[mom].label}</span>
                    <span className="text-[10px] text-[var(--color-outline)]">{done}/{itens.length}</span>
                  </div>
                  <div className="space-y-2">
                    {itens.map(p => (
                      <div key={p.id} className={`p-3 rounded-xl bg-[var(--color-surface-container)] border border-[rgba(var(--overlay-rgb),0.06)] ${p.concluido_periodo ? 'opacity-50' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-[var(--color-on-surface)]">{p.titulo}</p>
                            {p.descricao && <p className="text-[10px] text-[var(--color-on-surface-variant)] mt-0.5">{p.descricao}</p>}
                          </div>
                          {p.concluido_periodo ? <Badge variant="success">OK</Badge> :
                            <button onClick={() => { setExecForm({ realizado_por: usuario?.nome || '', observacao: '' }); setExecModal(p); }} className="p-1.5 rounded-lg bg-[var(--color-primary-container)]/20 text-[var(--color-primary)]"><CheckCircle size={16} /></button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            pendentes.map(p => (
              <div key={p.id} className={`p-3 rounded-xl bg-[var(--color-surface-container)] border border-[rgba(var(--overlay-rgb),0.06)] ${p.concluido_periodo ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-on-surface)]">{p.titulo}</p>
                    {p.descricao && <p className="text-[10px] text-[var(--color-on-surface-variant)] mt-0.5">{p.descricao}</p>}
                  </div>
                  {p.concluido_periodo ? <Badge variant="success">OK</Badge> :
                    <button onClick={() => { setExecForm({ realizado_por: usuario?.nome || '', observacao: '' }); setExecModal(p); }} className="p-1.5 rounded-lg bg-[var(--color-primary-container)]/20 text-[var(--color-primary)]"><CheckCircle size={16} /></button>}
                </div>
              </div>
            ))
          )}
      </div>

      <Modal open={execModal !== null} onClose={() => setExecModal(null)} title="Concluir Item" size="lg">
        {execModal && (
          <div className="space-y-3">
            <p className="text-sm font-bold text-[var(--color-on-surface)]">{execModal.titulo}</p>
            <input placeholder="Feito por" value={execForm.realizado_por} onChange={e => setExecForm({ ...execForm, realizado_por: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.1)] text-sm text-[var(--color-on-surface)] outline-none" />
            <textarea placeholder="Observação (opcional)" value={execForm.observacao} onChange={e => setExecForm({ ...execForm, observacao: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.1)] text-sm text-[var(--color-on-surface)] outline-none resize-none" />
            <Button onClick={handleExecutar} loading={executing} className="w-full"><CheckCircle size={16} /> Confirmar</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
