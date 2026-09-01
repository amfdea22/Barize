import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, User, Phone, Mail, Shield, Edit3, Trash2, Save, X } from 'lucide-react';
import Modal from '../components/Modal';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Funcionario {
  id: number;
  nome: string;
  cargo: string;
  telefone: string;
  email: string;
  permissoes: string[];
  ativo: boolean;
}

export default function Equipe() {
  const navigate = useNavigate();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Funcionario | null>(null);
  const [form, setForm] = useState({
    nome: '',
    cargo: 'Garçom',
    telefone: '',
    email: '',
    permissoes: ['pdv', 'comandas'] as string[],
  });

  const cargos = ['Garçom', 'Cozinheiro', 'Barman', 'Caixa', 'Gerente', 'Auxiliar'];
  const permissoesDisponiveis = [
    { id: 'pdv', label: 'PDV' },
    { id: 'comandas', label: 'Comandas' },
    { id: 'estoque', label: 'Estoque' },
    { id: 'financeiro', label: 'Financeiro' },
    { id: 'relatorios', label: 'Relatórios' },
    { id: 'admin', label: 'Administração' },
  ];

  useEffect(() => {
    carregarFuncionarios();
  }, []);

  async function carregarFuncionarios() {
    try {
      const res = await api.get('/usuarios');
      setFuncionarios(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar equipe:', err);
    } finally {
      setCarregando(false);
    }
  }

  function abrirNovo() {
    setEditando(null);
    setForm({
      nome: '',
      cargo: 'Garçom',
      telefone: '',
      email: '',
      permissoes: ['pdv', 'comandas'],
    });
    setShowModal(true);
  }

  function abrirEditar(f: Funcionario) {
    setEditando(f);
    setForm({
      nome: f.nome,
      cargo: f.cargo,
      telefone: f.telefone,
      email: f.email,
      permissoes: f.permissoes,
    });
    setShowModal(true);
  }

  async function salvar() {
    try {
      if (editando) {
        await api.put(`/usuarios/${editando.id}`, form);
      } else {
        await api.post('/usuarios', form);
      }
      setShowModal(false);
      carregarFuncionarios();
    } catch (err) {
      console.error('Erro ao salvar:', err);
    }
  }

  async function excluir(id: number) {
    if (!confirm('Excluir funcionário?')) return;
    try {
      await api.delete(`/usuarios/${id}`);
      carregarFuncionarios();
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  }

  function togglePermissao(id: string) {
    setForm({
      ...form,
      permissoes: form.permissoes.includes(id)
        ? form.permissoes.filter((p) => p !== id)
        : [...form.permissoes, id],
    });
  }

  const cargoColors: Record<string, string> = {
    'Garçom': 'bg-emerald-400/20 text-emerald-400',
    'Cozinheiro': 'bg-amber-400/20 text-amber-400',
    'Barman': 'bg-purple-400/20 text-purple-400',
    'Caixa': 'bg-[var(--color-primary-container)]/20 text-[var(--color-primary-container)]',
    'Gerente': 'bg-pink-400/20 text-pink-400',
    'Auxiliar': 'bg-[var(--color-on-surface-variant)]/20 text-[var(--color-on-surface-variant)]',
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-background)]">
      <header className="sticky top-0 z-40 flex items-center gap-3 px-4 h-14 border-b border-[var(--color-outline)] bg-[var(--color-surface)]">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-[var(--color-surface-container-high)] transition-colors"
        >
          <ArrowLeft size={20} className="text-[var(--color-on-surface)]" />
        </button>
        <h1 className="text-lg font-semibold text-[var(--color-on-surface)]">Equipe</h1>
        <button
          onClick={abrirNovo}
          className="ml-auto p-2 rounded-xl bg-[var(--color-primary-container)]/20 hover:bg-[var(--color-primary-container)]/30 transition-colors"
        >
          <Plus size={20} className="text-[var(--color-primary-container)]" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-3">
        {carregando ? (
          <div className="text-center py-8 text-[var(--color-on-surface-variant)]">Carregando...</div>
        ) : funcionarios.length === 0 ? (
          <div className="text-center py-8">
            <User size={48} className="mx-auto mb-3 text-[var(--color-outline)]" />
            <p className="text-[var(--color-on-surface-variant)]">Nenhum funcionário cadastrado</p>
            <button
              onClick={abrirNovo}
              className="mt-4 px-4 py-2 rounded-xl bg-[var(--color-primary-container)] text-[var(--color-on-primary)] text-sm font-medium hover:brightness-110 transition-all"
            >
              Adicionar Funcionário
            </button>
          </div>
        ) : (
          funcionarios.map((f) => (
            <div
              key={f.id}
              className="bg-[var(--color-surface-container)] border border-[rgba(var(--overlay-rgb),0.15)] rounded-2xl p-4 hover:bg-[var(--color-surface-container-high)] transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-container)]/20 flex items-center justify-center flex-shrink-0">
                  <User size={24} className="text-[var(--color-primary-container)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[var(--color-on-surface)]">{f.nome}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cargoColors[f.cargo] || 'bg-[var(--color-on-surface-variant)]/20 text-[var(--color-on-surface-variant)]'}`}>
                      {f.cargo}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--color-on-surface-variant)] space-y-0.5">
                    {f.telefone && (
                      <div className="flex items-center gap-1">
                        <Phone size={10} />
                        {f.telefone}
                      </div>
                    )}
                    {f.email && (
                      <div className="flex items-center gap-1">
                        <Mail size={10} />
                        {f.email}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {f.permissoes.map((p) => (
                      <span key={p} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-[var(--color-surface-high)] text-[var(--color-on-surface-variant)]">
                        {permissoesDisponiveis.find((pd) => pd.id === p)?.label || p}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => abrirEditar(f)}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-primary-container)]/20 transition-colors"
                  >
                    <Edit3 size={14} className="text-[var(--color-primary-container)]" />
                  </button>
                  <button
                    onClick={() => excluir(f.id)}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-error)]/20 transition-colors"
                  >
                    <Trash2 size={14} className="text-[var(--color-error)]" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editando ? 'Editar Funcionário' : 'Novo Funcionário'} size="md">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Nome</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  placeholder="Nome completo"
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--color-surface-container-high)] border border-[var(--color-outline)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:border-[var(--color-primary-container)] focus:ring-2 focus:ring-[var(--color-primary-container)]/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Cargo</label>
                <select
                  value={form.cargo}
                  onChange={(e) => setForm({ ...form, cargo: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl bg-[var(--color-surface-container-high)] border border-[var(--color-outline)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:border-[var(--color-primary-container)] focus:ring-2 focus:ring-[var(--color-primary-container)]/20 transition-all appearance-none cursor-pointer"
                >
                  {cargos.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Telefone</label>
                  <input
                    type="tel"
                    value={form.telefone}
                    onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-3 rounded-2xl bg-[var(--color-surface-container-high)] border border-[var(--color-outline)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:border-[var(--color-primary-container)] focus:ring-2 focus:ring-[var(--color-primary-container)]/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    className="w-full px-4 py-3 rounded-2xl bg-[var(--color-surface-container-high)] border border-[var(--color-outline)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:border-[var(--color-primary-container)] focus:ring-2 focus:ring-[var(--color-primary-container)]/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Permissões</label>
                <div className="flex flex-wrap gap-2">
                  {permissoesDisponiveis.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => togglePermissao(p.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                        form.permissoes.includes(p.id)
                          ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary)] shadow-lg shadow-[var(--color-primary-container)]/25'
                          : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)] border border-[var(--color-outline)]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 rounded-2xl border border-[var(--color-outline)] text-[var(--color-on-surface)] text-sm font-medium hover:bg-[var(--color-surface-container-high)] active:scale-[0.98] transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={!form.nome}
                className="flex-1 py-3 rounded-2xl bg-[var(--color-primary-container)] text-[var(--color-on-primary)] text-sm font-medium hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-primary-container)]/25"
              >
                <Save size={16} />
                {editando ? 'Atualizar' : 'Salvar'}
              </button>
            </div>
      </Modal>
    </div>
  );
}
