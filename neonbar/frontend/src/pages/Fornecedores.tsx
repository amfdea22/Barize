import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  Plus,
  Building2,
  Phone,
  Mail,
  Truck,
  Pencil,
  Trash2,
} from 'lucide-react';
import Card from '../components/Card';
import StatsCard from '../components/StatsCard';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Badge from '../components/Badge';
import { fornecedoresService } from '../services/api';
import type { Fornecedor } from '../types';

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Fornecedor | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    nome: '', cnpj: '', contato: '', telefone: '', email: '',
    endereco: '', prazo_entrega_dias: 7, observacao: '',
  });

  const load = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await fornecedoresService.listar({ nome: search || undefined });
      setFornecedores(res.data.fornecedores || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao carregar fornecedores');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const openNovo = () => {
    setEditando(null);
    setForm({ nome: '', cnpj: '', contato: '', telefone: '', email: '', endereco: '', prazo_entrega_dias: 7, observacao: '' });
    setShowModal(true);
  };

  const openEditar = (f: Fornecedor) => {
    setEditando(f);
    setForm({
      nome: f.nome,
      cnpj: f.cnpj || '',
      contato: f.contato || '',
      telefone: f.telefone || '',
      email: f.email || '',
      endereco: f.endereco || '',
      prazo_entrega_dias: f.prazo_entrega_dias || 7,
      observacao: f.observacao || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.nome.trim()) return;
    setSaving(true);
    try {
      if (editando) {
        await fornecedoresService.atualizar(editando.id, form);
      } else {
        await fornecedoresService.criar(form);
      }
      setShowModal(false);
      load(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleExcluir = async (id: number) => {
    try {
      await fornecedoresService.excluir(id);
      load(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao excluir');
    }
  };

  const ativos = fornecedores.filter((f) => f.ativo).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-outline)] text-sm">
        Carregando fornecedores...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg font-bold text-[var(--color-on-surface)]">FORNECEDORES</h1>
          <p className="text-label-md text-[var(--color-outline)] mt-1 uppercase">Cadastro de fornecedores</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" icon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />} onClick={() => load(true)}>
            Atualizar
          </Button>
          <Button icon={<Plus size={16} />} onClick={openNovo}>
            Novo Fornecedor
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
        <StatsCard title="Total" value={total} icon={<Building2 size={20} />} variant="primary" />
        <StatsCard title="Ativos" value={ativos} icon={<Building2 size={20} />} variant="success" />
        <StatsCard title="Inativos" value={total - ativos} icon={<Building2 size={20} />} variant="error" />
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-surface-container-high)] border border-[rgba(255,255,255,0.08)] text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:border-[var(--color-primary)]/50"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {fornecedores.length === 0 ? (
            <div className="col-span-full text-center py-8 text-sm text-[var(--color-outline)]">
              Nenhum fornecedor encontrado
            </div>
          ) : (
            fornecedores.map((f) => (
              <Card key={f.id} className={`${f.ativo ? '' : 'opacity-50'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--color-on-surface)]">{f.nome}</h3>
                    {f.cnpj && <p className="text-[10px] font-mono text-[var(--color-outline)]">{f.cnpj}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditar(f)} className="p-1 rounded text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] hover:bg-[rgba(0,218,243,0.1)] cursor-pointer">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleExcluir(f.id)} className="p-1 rounded text-[var(--color-on-surface-variant)] hover:text-[var(--color-error)] hover:bg-[rgba(255,0,0,0.1)] cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {f.contato && (
                    <div className="flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)]">
                      <Building2 size={12} />
                      {f.contato}
                    </div>
                  )}
                  {f.telefone && (
                    <div className="flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)]">
                      <Phone size={12} />
                      {f.telefone}
                    </div>
                  )}
                  {f.email && (
                    <div className="flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)]">
                      <Mail size={12} />
                      {f.email}
                    </div>
                  )}
                  {f.prazo_entrega_dias && (
                    <div className="flex items-center gap-2 text-xs text-[var(--color-on-surface-variant)]">
                      <Truck size={12} />
                      Prazo: {f.prazo_entrega_dias} dias
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Badge variant={f.ativo ? 'success' : 'error'}>{f.ativo ? 'Ativo' : 'Inativo'}</Badge>
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editando ? 'Editar Fornecedor' : 'Novo Fornecedor'} size="md">
        <div className="space-y-4">
          <Input label="Nome *" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="CNPJ" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
            <Input label="Prazo Entrega (dias)" type="number" value={form.prazo_entrega_dias} onChange={(e) => setForm({ ...form, prazo_entrega_dias: Number(e.target.value) })} />
          </div>
          <Input label="Contato" value={form.contato} onChange={(e) => setForm({ ...form, contato: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Telefone" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <Input label="Endereço" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
          <Input label="Observação" value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} />
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
