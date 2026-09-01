import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Wifi, WifiOff, Printer, Trash2, Check, X, Settings, RefreshCw, Search, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';

interface Impressora {
  id: number;
  nome: string;
  modelo: string;
  ip: string;
  porta: number;
  tipo: 'wifi' | 'bluetooth' | 'usb';
  status: 'online' | 'offline' | 'erro';
  impressoes: number;
  padrao: boolean;
}

interface ImpressoraDetectada {
  ip: string;
  nome: string;
  modelo: string;
  fabricante: string;
  porta: number;
}

export default function Impressoras() {
  const navigate = useNavigate();
  const [impressoras, setImpressoras] = useState<Impressora[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Impressora | null>(null);
  const [testando, setTestando] = useState<number | null>(null);
  const [escaneando, setEscaneando] = useState(false);
  const [detectadas, setDetectadas] = useState<ImpressoraDetectada[]>([]);
  const [aba, setAba] = useState<'manual' | 'automatica'>('automatica');
  const [form, setForm] = useState({
    nome: '',
    modelo: 'Epson TM-T20',
    ip: '',
    porta: 9100,
    tipo: 'wifi' as 'wifi' | 'bluetooth' | 'usb',
  });

  const modelos = [
    'Epson TM-T20',
    'Epson TM-T88',
    'Bematech MP-4200',
    'Bematech MP-2500',
    'Elgin I9',
    'Elgin iFood Partner',
    'Diebold Compact',
    'Outro',
  ];

  const tipos = [
    { id: 'wifi', label: 'Wi-Fi', icon: Wifi, color: 'text-emerald-400' },
    { id: 'bluetooth', label: 'Bluetooth', icon: Wifi, color: 'text-purple-400' },
    { id: 'usb', label: 'USB', icon: Printer, color: 'text-amber-400' },
  ];

  useEffect(() => {
    carregarImpressoras();
  }, []);

  async function carregarImpressoras() {
    try {
      const res = await api.get('/impressoras');
      setImpressoras(res.data || []);
    } catch (err) {
      console.error('Erro ao carregar impressoras:', err);
    } finally {
      setCarregando(false);
    }
  }

  function abrirNovo() {
    setEditando(null);
    setForm({
      nome: '',
      modelo: 'Epson TM-T20',
      ip: '',
      porta: 9100,
      tipo: 'wifi',
    });
    setAba('automatica');
    setDetectadas([]);
    setShowModal(true);
  }

  function abrirEditar(imp: Impressora) {
    setEditando(imp);
    setForm({
      nome: imp.nome,
      modelo: imp.modelo,
      ip: imp.ip,
      porta: imp.porta,
      tipo: imp.tipo,
    });
    setAba('manual');
    setDetectadas([]);
    setShowModal(true);
  }

  async function salvar() {
    try {
      if (editando) {
        await api.put(`/impressoras/${editando.id}`, form);
      } else {
        await api.post('/impressoras', form);
      }
      setShowModal(false);
      carregarImpressoras();
    } catch (err) {
      console.error('Erro ao salvar:', err);
    }
  }

  async function excluir(id: number) {
    if (!confirm('Excluir impressora?')) return;
    try {
      await api.delete(`/impressoras/${id}`);
      carregarImpressoras();
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  }

  async function testarImpressao(id: number) {
    setTestando(id);
    try {
      await api.post(`/impressoras/${id}/testar`);
      alert('Teste de impressão enviado!');
    } catch (err) {
      console.error('Erro ao testar:', err);
      alert('Erro ao testar impressão');
    } finally {
      setTestando(null);
    }
  }

  async function definirPadrao(id: number) {
    try {
      await api.put(`/impressoras/${id}/padrao`);
      carregarImpressoras();
    } catch (err) {
      console.error('Erro ao definir padrão:', err);
    }
  }

  async function escanearRede() {
    setEscaneando(true);
    setDetectadas([]);
    try {
      const res = await api.get('/impressoras/scan');
      setDetectadas(res.data || []);
    } catch (err) {
      console.error('Erro ao escanear rede:', err);
      setDetectadas([]);
    } finally {
      setEscaneando(false);
    }
  }

  function conectarDetectada(detectada: ImpressoraDetectada) {
    setEditando(null);
    setForm({
      nome: detectada.nome || `Impressora ${detectada.ip}`,
      modelo: detectada.modelo || 'Epson TM-T20',
      ip: detectada.ip,
      porta: detectada.porta || 9100,
      tipo: 'wifi',
    });
    setAba('manual');
  }

  const statusColors = {
    online: 'bg-emerald-400',
    offline: 'bg-[var(--color-on-surface-variant)]',
    erro: 'bg-[var(--color-error)]',
  };

  const statusLabels = {
    online: 'Online',
    offline: 'Offline',
    erro: 'Erro',
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
        <h1 className="text-lg font-semibold text-[var(--color-on-surface)]">Impressoras</h1>
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
        ) : impressoras.length === 0 ? (
          <div className="text-center py-8">
            <Printer size={48} className="mx-auto mb-3 text-[var(--color-outline)]" />
            <p className="text-[var(--color-on-surface-variant)]">Nenhuma impressora configurada</p>
            <button
              onClick={abrirNovo}
              className="mt-4 px-4 py-2 rounded-xl bg-[var(--color-primary-container)] text-[var(--color-on-primary)] text-sm font-medium hover:brightness-110 transition-all"
            >
              Adicionar Impressora
            </button>
          </div>
        ) : (
          impressoras.map((imp) => (
            <div
              key={imp.id}
              className="bg-[var(--color-surface-container)] border border-[rgba(var(--overlay-rgb),0.15)] rounded-2xl p-4 hover:bg-[var(--color-surface-container-high)] transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-container)]/20 flex items-center justify-center flex-shrink-0 relative">
                  <Printer size={24} className="text-[var(--color-primary-container)]" />
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ${statusColors[imp.status]} border-2 border-[var(--color-surface-container)]`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-[var(--color-on-surface)]">{imp.nome}</span>
                    {imp.padrao && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-primary-container)]/20 text-[var(--color-primary-container)]">
                        PADRÃO
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[var(--color-on-surface-variant)] space-y-0.5">
                    <div>{imp.modelo}</div>
                    <div className="flex items-center gap-2">
                      <span>{imp.ip}:{imp.porta}</span>
                      <span className="text-[10px] text-[var(--color-on-surface-variant)]">•</span>
                      <span>{statusLabels[imp.status]}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-[var(--color-on-surface-variant)] mt-1">
                    {imp.impressoes} impressões
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => testarImpressao(imp.id)}
                    disabled={testando === imp.id}
                    className="p-1.5 rounded-lg hover:bg-emerald-400/20 transition-colors disabled:opacity-50"
                  >
                    {testando === imp.id ? (
                      <RefreshCw size={14} className="text-emerald-400 animate-spin" />
                    ) : (
                      <Printer size={14} className="text-emerald-400" />
                    )}
                  </button>
                  <button
                    onClick={() => definirPadrao(imp.id)}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-primary-container)]/20 transition-colors"
                  >
                    <Check size={14} className="text-[var(--color-primary-container)]" />
                  </button>
                  <button
                    onClick={() => abrirEditar(imp)}
                    className="p-1.5 rounded-lg hover:bg-amber-400/20 transition-colors"
                  >
                    <Settings size={14} className="text-amber-400" />
                  </button>
                  <button
                    onClick={() => excluir(imp.id)}
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

      {showModal && (
        <Modal open={showModal} onClose={() => setShowModal(false)} title={editando ? 'Editar Impressora' : 'Nova Impressora'} size="md">
          <div className="space-y-4">
            <div className="flex gap-2 bg-[var(--color-surface-container)] rounded-xl p-1">
              <button
                onClick={() => setAba('automatica')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  aba === 'automatica'
                    ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary)]'
                    : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'
                }`}
              >
                <Wifi size={14} className="inline mr-1.5" />
                Conectar via WiFi
              </button>
              <button
                onClick={() => setAba('manual')}
                className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  aba === 'manual'
                    ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary)]'
                    : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-high)]'
                }`}
              >
                <Settings size={14} className="inline mr-1.5" />
                Configuração Manual
              </button>
            </div>

            {aba === 'automatica' && (
              <div className="space-y-3">
                <p className="text-xs text-[var(--color-on-surface-variant)]">
                  Escaneie a rede para encontrar impressoras térmicas disponíveis automaticamente.
                </p>
                
                <button
                  onClick={escanearRede}
                  disabled={escaneando}
                  className="w-full py-3 rounded-2xl bg-[var(--color-primary-container)] text-[var(--color-on-primary)] text-sm font-medium hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-primary-container)]/25"
                >
                  {escaneando ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Escaneando rede...
                    </>
                  ) : (
                    <>
                      <Search size={16} />
                      Buscar Impressoras
                    </>
                  )}
                </button>

                {detectadas.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">
                      Impressoras Detectadas ({detectadas.length})
                    </label>
                    {detectadas.map((d, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-container-high)] border border-[rgba(var(--overlay-rgb),0.15)] hover:bg-[var(--color-surface-container-highest)] transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-emerald-400/20 flex items-center justify-center flex-shrink-0">
                          <Wifi size={20} className="text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-[var(--color-on-surface)]">{d.nome}</div>
                          <div className="text-xs text-[var(--color-on-surface-variant)]">{d.modelo} • {d.ip}:{d.porta}</div>
                        </div>
                        <button
                          onClick={() => conectarDetectada(d)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-400/20 text-emerald-400 text-xs font-medium hover:bg-emerald-400/30 transition-colors"
                        >
                          Conectar
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {!escaneando && detectadas.length === 0 && (
                  <div className="text-center py-6">
                    <WifiOff size={32} className="mx-auto mb-2 text-[var(--color-outline)]" />
                    <p className="text-xs text-[var(--color-on-surface-variant)]">
                      Nenhuma impressora encontrada na rede
                    </p>
                    <p className="text-[10px] text-[var(--color-on-surface-variant)] mt-1">
                      Verifique se a impressora está ligada e conectada ao WiFi
                    </p>
                  </div>
                )}
              </div>
            )}

            {aba === 'manual' && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Nome</label>
                  <input
                    type="text"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    placeholder="Ex: Impressora Cozinha"
                    className="w-full px-4 py-3 rounded-2xl bg-[var(--color-surface-container-high)] border border-[var(--color-outline)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:border-[var(--color-primary-container)] focus:ring-2 focus:ring-[var(--color-primary-container)]/20 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Modelo</label>
                  <select
                    value={form.modelo}
                    onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-[var(--color-surface-container-high)] border border-[var(--color-outline)] text-[var(--color-on-surface)] text-sm focus:outline-none focus:border-[var(--color-primary-container)] focus:ring-2 focus:ring-[var(--color-primary-container)]/20 transition-all appearance-none cursor-pointer"
                  >
                    {modelos.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Tipo de Conexão</label>
                  <div className="grid grid-cols-3 gap-2">
                    {tipos.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setForm({ ...form, tipo: t.id as 'wifi' | 'bluetooth' | 'usb' })}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl transition-all ${
                          form.tipo === t.id
                            ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary)] shadow-lg shadow-[var(--color-primary-container)]/25'
                            : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] border border-[var(--color-outline)] hover:bg-[var(--color-surface-container-highest)]'
                        }`}
                      >
                        <t.icon size={20} />
                        <span className="text-xs font-medium">{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">IP</label>
                    <input
                      type="text"
                      value={form.ip}
                      onChange={(e) => setForm({ ...form, ip: e.target.value })}
                      placeholder="192.168.1.100"
                      className="w-full px-4 py-3 rounded-2xl bg-[var(--color-surface-container-high)] border border-[var(--color-outline)] text-[var(--color-on-surface)] text-sm font-mono focus:outline-none focus:border-[var(--color-primary-container)] focus:ring-2 focus:ring-[var(--color-primary-container)]/20 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">Porta</label>
                    <input
                      type="number"
                      value={form.porta}
                      onChange={(e) => setForm({ ...form, porta: Number(e.target.value) })}
                      placeholder="9100"
                      className="w-full px-4 py-3 rounded-2xl bg-[var(--color-surface-container-high)] border border-[var(--color-outline)] text-[var(--color-on-surface)] text-sm font-mono focus:outline-none focus:border-[var(--color-primary-container)] focus:ring-2 focus:ring-[var(--color-primary-container)]/20 transition-all"
                    />
                  </div>
                </div>
              </>
            )}
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
              disabled={!form.nome || !form.ip}
              className="flex-1 py-3 rounded-2xl bg-[var(--color-primary-container)] text-[var(--color-on-primary)] text-sm font-medium hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-[var(--color-primary-container)]/25"
            >
              <Save size={16} />
              {editando ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Save({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  );
}
