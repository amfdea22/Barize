import { useState, useEffect, useCallback } from 'react';
import { Plus, Building2, Phone, Mail, Truck, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { fornecedoresService } from '../services/api';
import type { Fornecedor } from '../types';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import { toast } from '../components/Toast';

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const safeError = typeof error === 'string' ? error : JSON.stringify(error);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Fornecedor | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome: '', cnpj: '', contato: '', telefone: '', email: '', endereco: '', prazo_entrega_dias: 7, observacao: '' });
  const [deletando, setDeletando] = useState<Fornecedor | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fornecedoresService.listar({ nome: search || undefined });
      const raw = res.data.fornecedores || [];
      setFornecedores(Array.isArray(raw) ? raw.filter((f: any) => f && typeof f === 'object' && typeof f.nome === 'string') : []);
    } catch (err: any) { const d = err?.response?.data?.detail; setError(typeof d === 'string' ? d : JSON.stringify(d) || 'Erro'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openNovo = () => { setEditando(null); setForm({ nome: '', cnpj: '', contato: '', telefone: '', email: '', endereco: '', prazo_entrega_dias: 7, observacao: '' }); setShowModal(true); };
  const openEditar = (f: Fornecedor) => { setEditando(f); setForm({ nome: f.nome, cnpj: f.cnpj || '', contato: f.contato || '', telefone: f.telefone || '', email: f.email || '', endereco: f.endereco || '', prazo_entrega_dias: f.prazo_entrega_dias || 7, observacao: f.observacao || '' }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.nome.trim()) return;
    setSaving(true);
    try {
      editando ? await fornecedoresService.atualizar(editando.id, form) : await fornecedoresService.criar(form);
      setShowModal(false); toast.success(editando ? 'Atualizado!' : 'Criado!'); load();
    } catch (err: any) { const d = err?.response?.data?.detail; setError(typeof d === 'string' ? d : JSON.stringify(d) || 'Erro'); }
    finally { setSaving(false); }
  };

  const handleExcluir = async () => {
    if (!deletando) return;
    try { await fornecedoresService.excluir(deletando.id); toast.success('Excluído!'); setDeletando(null); load(); }
    catch (err: any) { const d = err?.response?.data?.detail; setError(typeof d === 'string' ? d : JSON.stringify(d) || 'Erro'); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-[var(--color-on-surface)]">Fornecedores</h1>
          <p className="text-xs text-[var(--color-on-surface-variant)]">{fornecedores.length} cadastrado(s)</p>
        </div>
        <button onClick={openNovo} className="p-2 rounded-lg bg-[var(--color-primary-container)]">
          <Plus size={16} className="text-[var(--color-on-primary-container)]" />
        </button>
      </div>

      {error && <div className="mx-4 mb-3 p-2 rounded-lg bg-[var(--color-error)]/10 text-xs text-[var(--color-error)] flex items-center gap-2"><AlertTriangle size={14} /> {safeError}</div>}

      <div className="px-4 pb-3">
        <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.1)] rounded-lg px-3 py-2.5 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)]/40 outline-none" />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
        {loading ? <div className="py-12 text-center text-sm text-[var(--color-outline)]">Carregando...</div> :
          fornecedores.length === 0 ? <div className="py-12 text-center text-sm text-[var(--color-outline)]">Nenhum fornecedor</div> :
          fornecedores.map(f => (
            <div key={f.id} className={`p-3 rounded-xl bg-[var(--color-surface-container)] border border-[rgba(var(--overlay-rgb),0.06)] ${f.ativo ? '' : 'opacity-50'}`}>
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--color-on-surface)]">{f.nome}</p>
                  {f.cnpj && <p className="text-[10px] font-mono text-[var(--color-outline)]">{f.cnpj}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEditar(f)} className="p-1.5 rounded text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]"><Pencil size={14} /></button>
                  <button onClick={() => setDeletando(f)} className="p-1.5 rounded text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)]"><Trash2 size={14} /></button>
                </div>
              </div>
              <div className="mt-2 space-y-1">
                {f.contato && <div className="flex items-center gap-2 text-[11px] text-[var(--color-on-surface-variant)]"><Building2 size={11} /> {f.contato}</div>}
                {f.telefone && <div className="flex items-center gap-2 text-[11px] text-[var(--color-on-surface-variant)]"><Phone size={11} /> {f.telefone}</div>}
                {f.email && <div className="flex items-center gap-2 text-[11px] text-[var(--color-on-surface-variant)]"><Mail size={11} /> {f.email}</div>}
                {f.prazo_entrega_dias && <div className="flex items-center gap-2 text-[11px] text-[var(--color-on-surface-variant)]"><Truck size={11} /> Prazo: {f.prazo_entrega_dias} dias</div>}
              </div>
              <div className="mt-2"><Badge variant={f.ativo ? 'success' : 'error'}>{f.ativo ? 'Ativo' : 'Inativo'}</Badge></div>
            </div>
          ))}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editando ? 'Editar' : 'Novo Fornecedor'} size="lg">
        <div className="space-y-3">
          <input placeholder="Nome *" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.1)] text-sm text-[var(--color-on-surface)] outline-none" />
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="CNPJ" value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} className="px-3 py-2.5 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.1)] text-sm text-[var(--color-on-surface)] outline-none" />
            <input placeholder="Prazo (dias)" type="number" value={form.prazo_entrega_dias} onChange={e => setForm({ ...form, prazo_entrega_dias: Number(e.target.value) })} className="px-3 py-2.5 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.1)] text-sm text-[var(--color-on-surface)] outline-none" />
          </div>
          <input placeholder="Telefone" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.1)] text-sm text-[var(--color-on-surface)] outline-none" />
          <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.1)] text-sm text-[var(--color-on-surface)] outline-none" />
          <Button onClick={handleSave} loading={saving} className="w-full">{editando ? 'Atualizar' : 'Criar'}</Button>
        </div>
      </Modal>

      <Modal open={!!deletando} onClose={() => setDeletando(null)} title="Confirmar exclusão" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-on-surface)]">
            Tem certeza que deseja excluir o fornecedor <strong>{deletando?.nome}</strong>?
          </p>
          <p className="text-xs text-[var(--color-error)]">Esta ação não pode ser desfeita.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeletando(null)}
              className="flex-1 h-10 rounded-lg border border-[rgba(var(--overlay-rgb),0.15)] text-sm text-[var(--color-on-surface-variant)] cursor-pointer">
              Cancelar
            </button>
            <button onClick={handleExcluir}
              className="flex-1 h-10 rounded-lg bg-[var(--color-error)] text-sm font-bold text-white cursor-pointer">
              Excluir
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
