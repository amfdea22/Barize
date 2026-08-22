import { useState, useEffect } from 'react';
import { Store, Plus, X } from 'lucide-react';
import { useMesas } from '../hooks/useMesas';
import { mesasService, pedidosService } from '../services/api';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Modal from '../components/Modal';

type Tab = 'mesas' | 'balcao';

export default function Sala() {
  const { mesas, loading, error, reload } = useMesas();
  const [activeTab, setActiveTab] = useState<Tab>('mesas');
  const [selecionadaId, setSelecionadaId] = useState<number | null>(null);
  const [mesasOcupadas, setMesasOcupadas] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);

  // Busca pedidos ativos para identificar mesas ocupadas
  useEffect(() => {
    const carregarPedidosAtivos = async () => {
      try {
        const res = await pedidosService.listarAtivos();
        const pedidos = res.data || [];
        const ocupadas = new Set<string>();
        pedidos.forEach((p: any) => {
          if (p.mesa && ['Novo', 'Preparando', 'Pronto'].includes(p.status)) {
            ocupadas.add(p.mesa);
          }
        });
        setMesasOcupadas(ocupadas);
      } catch {
        // Silently ignore — mesas will show as livre
      }
    };
    carregarPedidosAtivos();
    const interval = setInterval(carregarPedidosAtivos, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);
  const [editingMesa, setEditingMesa] = useState<{ id?: number; nome: string; local: string } | null>(null);
  const [formNome, setFormNome] = useState('');
  const [formLocal, setFormLocal] = useState('');
  const [saving, setSaving] = useState(false);

  const openModal = (mesa?: typeof editingMesa) => {
    if (mesa) {
      setEditingMesa(mesa);
      setFormNome(mesa.nome);
      setFormLocal(mesa.local || '');
    } else {
      setEditingMesa(null);
      setFormNome('');
      setFormLocal(activeTab === 'balcao' ? 'Balcão' : 'Mesa');
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formNome.trim()) return;
    setSaving(true);
    try {
      if (editingMesa?.id) {
        await mesasService.atualizar(editingMesa.id, { nome: formNome.trim(), local: formLocal.trim() || undefined });
      } else {
        await mesasService.criar({ nome: formNome.trim(), local: formLocal.trim() || undefined });
      }
      setShowModal(false);
      reload();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDesativar = async (id: number) => {
    if (!confirm('Desativar?')) return;
    try {
      await mesasService.desativar(id);
      reload();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Erro ao desativar');
    }
  };

  const handleReativar = async (id: number) => {
    try {
      await mesasService.atualizar(id, { ativo: 1 });
      reload();
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Erro ao reativar');
    }
  };

  const isBalcao = (m: { local?: string | null }) => {
    const l = (m.local || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return l.includes('balcao');
  };

  const mesasTab = mesas.filter((m) => m.ativo && !isBalcao(m));
  const balcaoTab = mesas.filter((m) => m.ativo && isBalcao(m));
  const inativas = mesas.filter((m) => !m.ativo);

  const currentList = activeTab === 'mesas' ? mesasTab : balcaoTab;
  const currentLabel = activeTab === 'mesas' ? 'Mesa' : 'Balcão';

  return (
    <div className="flex flex-col gap-lg">
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center justify-between px-lg py-md border-b border-[rgba(var(--overlay-rgb),0.06)]">
          <div className="flex items-center gap-md">
            <Store size={20} className="text-[var(--color-primary)]" />
            <h2 className="text-headline-md font-semibold text-[var(--color-on-surface)]">Salão</h2>
          </div>
          <Button size="sm" onClick={() => openModal()}>
            <Plus size={16} /> Novo
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[rgba(var(--overlay-rgb),0.06)]">
          {([
            { key: 'mesas' as Tab, label: 'Mesas', count: mesasTab.length },
            { key: 'balcao' as Tab, label: 'Balcão', count: balcaoTab.length },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-sm py-md text-label-md font-medium transition-colors cursor-pointer ${
                activeTab === tab.key
                  ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
                  : 'text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] hover:bg-[rgba(var(--overlay-rgb),0.04)]'
              }`}
            >
              {tab.label}
              <Badge variant={activeTab === tab.key ? 'primary' : 'neutral'}>{tab.count}</Badge>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32 text-[var(--color-outline)] text-sm">Carregando...</div>
        ) : error ? (
          <div className="flex items-center justify-center h-32 text-[var(--color-error)] text-sm">{error}</div>
        ) : (
          <div className="p-lg">
            {currentList.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-md mb-lg">
                {currentList.map((mesa) => {
                  const isSelected = selecionadaId === mesa.id;
                  const isOcupada = mesasOcupadas.has(mesa.nome);
                  return (
                    <button
                      key={mesa.id}
                      onClick={() => setSelecionadaId(isSelected ? null : mesa.id)}
                      className={`aspect-square flex flex-col items-center justify-center gap-1 rounded-xl border transition-all duration-200 cursor-pointer group ${
                        isSelected
                          ? 'bg-[rgba(0,218,243,0.12)] border-[var(--color-primary)] shadow-sm'
                          : isOcupada
                            ? 'bg-[rgba(255,165,0,0.10)] border-orange-400'
                            : 'bg-[var(--color-surface-container)] border-[rgba(var(--overlay-rgb),0.06)] hover:border-[var(--color-primary)] hover:bg-[rgba(0,218,243,0.05)]'
                      }`}
                    >
                      <span className={`text-headline-sm font-bold font-mono transition-colors ${
                        isSelected ? 'text-[var(--color-primary)]' : isOcupada ? 'text-orange-600' : 'text-[var(--color-on-surface)] group-hover:text-[var(--color-primary)]'
                      }`}>
                        {mesa.nome}
                      </span>
                      {mesa.local && (
                        <span className="text-[10px] text-[var(--color-on-surface-variant)] uppercase tracking-wide truncate max-w-full px-1">
                          {mesa.local}
                        </span>
                      )}
                      {isOcupada && (
                        <span className="text-[9px] font-medium text-orange-500 uppercase tracking-wider">
                          Ocupada
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {currentList.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-[var(--color-outline)] text-sm gap-2">
                <Store size={32} className="opacity-40" />
                <span>Nenhum{(activeTab === 'balcao' ? ' balcão' : 'a mesa')} cadastrad{(activeTab === 'balcao' ? 'o' : 'a')}</span>
              </div>
            )}

            {/* Inativas */}
            {inativas.length > 0 && (
              <>
                <h3 className="text-label-lg font-medium text-[var(--color-on-surface-variant)] mb-md opacity-60">Inativas</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-md">
                  {inativas
                    .filter((m) => activeTab === 'mesas' ? !isBalcao(m) : isBalcao(m))
                    .map((mesa) => (
                    <button
                      key={mesa.id}
                      onClick={() => handleReativar(mesa.id)}
                      className="aspect-square flex flex-col items-center justify-center gap-1 rounded-xl bg-[var(--color-surface-container)] border border-[rgba(var(--overlay-rgb),0.06)] opacity-40 hover:opacity-70 transition-all duration-200 cursor-pointer"
                      title={`Reativar ${currentLabel.toLowerCase()} ${mesa.nome}`}
                    >
                      <span className="text-headline-sm font-bold text-[var(--color-on-surface)] font-mono line-through">
                        {mesa.nome}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      {/* Modal Criar/Editar */}
      <Modal open={showModal} onClose={() => setShowModal(false)}>
          <div className="p-lg">
            <div className="flex items-center justify-between mb-lg">
              <h2 className="text-headline-md font-semibold text-[var(--color-on-surface)]">
                {editingMesa ? `Editar ${currentLabel}` : `Nov${activeTab === 'balcao' ? 'o' : 'a'} ${currentLabel}`}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)] cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-md">
              <div>
                <label className="text-label-md text-[var(--color-on-surface-variant)] mb-1 block">Nome *</label>
                <input
                  type="text"
                  value={formNome}
                  onChange={(e) => setFormNome(e.target.value)}
                  placeholder={activeTab === 'balcao' ? 'Ex: B1, B2...' : 'Ex: M1, M2...'}
                  className="h-12 w-full bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] rounded-lg px-md text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-label-md text-[var(--color-on-surface-variant)] mb-1 block">Tipo</label>
                <select
                  value={formLocal}
                  onChange={(e) => setFormLocal(e.target.value)}
                  className="h-12 w-full bg-[var(--color-surface-container-low)] border border-[rgba(var(--overlay-rgb),0.08)] rounded-lg px-md text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]"
                >
                  <option value="Mesa">Mesa</option>
                  <option value="Balcão">Balcão</option>
                </select>
              </div>
              {editingMesa && (
                <button
                  onClick={() => handleDesativar(editingMesa.id!)}
                  className="text-label-md text-[var(--color-error)] hover:underline cursor-pointer text-left"
                >
                  Desativar este{(activeTab === 'balcao' ? ' balcão' : 'a mesa')}
                </button>
              )}
            </div>
            <div className="flex justify-end gap-sm mt-lg">
              <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={!formNome.trim() || saving}>
                {saving ? 'Salvando...' : editingMesa ? 'Salvar' : 'Criar'}
              </Button>
            </div>
          </div>
        </Modal>
    </div>
  );
}
