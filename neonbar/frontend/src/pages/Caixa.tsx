import { useState, useEffect } from 'react';
import { DollarSign, Lock, Unlock, RefreshCw, Receipt, Plus, CreditCard, Banknote, Smartphone } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Badge from '../components/Badge';
import StatsCard from '../components/StatsCard';
import Modal from '../components/Modal';
import type { Caixa, Pagamento } from '../types';
import { caixaService, pagamentoService } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const FORMAS_PAGAMENTO = [
  { key: 'dinheiro', label: 'Dinheiro', icon: Banknote },
  { key: 'cartao_credito', label: 'Cartão de Crédito', icon: CreditCard },
  { key: 'cartao_debito', label: 'Cartão de Débito', icon: CreditCard },
  { key: 'pix', label: 'PIX', icon: Smartphone },
];

export default function CaixaPage() {
  const { usuario } = useAuth();
  const [_caixas, setCaixas] = useState<Caixa[]>([]);
  const [caixaAtivo, setCaixaAtivo] = useState<Caixa | null>(null);
  const [_loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Abrir caixa
  const [showAbrir, setShowAbrir] = useState(false);
  const [saldoInicial, setSaldoInicial] = useState(100);

  // Fechar caixa
  const [showFechar, setShowFechar] = useState(false);
  const [valoresDeclarados, setValoresDeclarados] = useState({
    dinheiro: 0,
    cartao_credito: 0,
    cartao_debito: 0,
    pix: 0,
  });

  // Pagamentos
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [showPagamento, setShowPagamento] = useState(false);
  const [novoPagamento, setNovoPagamento] = useState({ forma_pagamento: 'dinheiro', valor: 0 });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await caixaService.aberto();
      const caixaData = res.data?.caixa || null;
      setCaixaAtivo(caixaData);
      setCaixas(caixaData ? [caixaData] : []);
    } catch (err: any) {
      if (err?.response?.status !== 404) {
        setError(err?.response?.data?.detail || 'Erro ao carregar caixa');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPagamentos = async () => {
    try {
      const res = await pagamentoService.listar();
      setPagamentos(Array.isArray(res.data) ? res.data : []);
    } catch {
      // silent
    }
  };

  useEffect(() => { load(); loadPagamentos(); }, []);

  const handleAbrir = async () => {
    if (!usuario) return;
    try {
      await caixaService.abrir({ usuario_id: usuario.id, saldo_inicial: saldoInicial });
      setShowAbrir(false);
      setSuccess('Caixa aberto com sucesso!');
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao abrir caixa');
    }
  };

  const handleFechar = async () => {
    if (!caixaAtivo) return;
    try {
      await caixaService.fechar(caixaAtivo.id, { valores_declarados: valoresDeclarados });
      setShowFechar(false);
      setSuccess('Caixa fechado com sucesso!');
      await load();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao fechar caixa');
    }
  };

  const handleRegistrarPagamento = async () => {
    if (novoPagamento.valor <= 0) return;
    try {
      await pagamentoService.criar({
        forma_pagamento: novoPagamento.forma_pagamento,
        valor: novoPagamento.valor,
      });
      setShowPagamento(false);
      setNovoPagamento({ forma_pagamento: 'dinheiro', valor: 0 });
      setSuccess('Pagamento registrado!');
      await loadPagamentos();
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao registrar pagamento');
    }
  };

  const totalPorForma = (forma: string) =>
    pagamentos.filter((p) => p.forma_pagamento === forma).reduce((s, p) => s + p.valor, 0);

  const totalGeral = pagamentos.reduce((s, p) => s + p.valor, 0);

  const formatMoney = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg text-[var(--color-on-surface)]">Caixa</h1>
          <p className="text-label-md text-[var(--color-outline)] mt-1 uppercase">Abertura, fechamento e conciliação</p>
        </div>
        <div className="flex gap-2">
          {caixaAtivo && (
            <Button variant="primary" icon={<Plus size={16} />} onClick={() => setShowPagamento(true)}>
              Registrar Pagamento
            </Button>
          )}
          {caixaAtivo ? (
            <Button variant="secondary" icon={<Lock size={16} />} onClick={() => {
              setValoresDeclarados({ dinheiro: 0, cartao_credito: 0, cartao_debito: 0, pix: 0 });
              setShowFechar(true);
            }}>
              Fechar Caixa
            </Button>
          ) : (
            <Button variant="primary" icon={<Unlock size={16} />} onClick={() => setShowAbrir(true)}>
              Abrir Caixa
            </Button>
          )}
          <Button variant="ghost" icon={<RefreshCw size={16} />} onClick={() => { load(); loadPagamentos(); }}>Atualizar</Button>
        </div>
      </div>

      {/* Status Banner */}
      {caixaAtivo ? (
        <Card glow="primary" className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <Unlock size={24} className="text-[var(--color-primary)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-on-surface)]">Caixa Aberto</p>
              <p className="text-xs text-[var(--color-outline)] font-mono">
                ID: {caixaAtivo.id} · Saldo inicial: R$ {caixaAtivo.saldo_inicial.toFixed(2)} · Aberto em: {new Date(caixaAtivo.aberto_em).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
          <Badge variant="success" pulsing>Operacional</Badge>
        </Card>
      ) : (
        <Card className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <Lock size={24} className="text-[var(--color-outline)]" />
            <div>
              <p className="text-sm font-semibold text-[var(--color-on-surface)]">Caixa Fechado</p>
              <p className="text-xs text-[var(--color-outline)]">Abra o caixa para iniciar as operações</p>
            </div>
          </div>
          <Badge variant="neutral">Inativo</Badge>
        </Card>
      )}

      {/* Error / Success */}
      {error && (
        <div className="p-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-sm text-[var(--color-error)]">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline cursor-pointer">Fechar</button>
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 text-sm text-[var(--color-primary)]">
          {success}
          <button onClick={() => setSuccess('')} className="ml-2 underline cursor-pointer">Fechar</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatsCard title="Caixa" value={caixaAtivo ? 'Aberto' : 'Fechado'} icon={<Receipt size={20} />} variant={caixaAtivo ? 'success' : 'warning'} />
        <StatsCard title="Total em Pagamentos" value={formatMoney(totalGeral)} icon={<DollarSign size={20} />} variant="info" />
        <StatsCard title="Total de Vendas" value={pagamentos.length} icon={<Receipt size={20} />} variant="info" />
      </div>

      {/* Pagamentos do Dia */}
      <Card>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--color-on-surface)]">Pagamentos do Dia</h2>
            {caixaAtivo && (
              <Button variant="ghost" size="sm" icon={<Plus size={14} />} onClick={() => setShowPagamento(true)}>
                Novo
              </Button>
            )}
          </div>

          {/* Totais por forma */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {FORMAS_PAGAMENTO.map(({ key, label, icon: Icon }) => (
              <div key={key} className="p-3 rounded-lg bg-[var(--color-surface-container-high)]/50 border border-[rgba(var(--overlay-rgb),0.06)]">
                <div className="flex items-center gap-2 text-xs text-[var(--color-outline)] mb-1">
                  <Icon size={14} />
                  <span>{label}</span>
                </div>
                <span className="text-sm font-semibold text-[var(--color-primary)]">
                  {formatMoney(totalPorForma(key))}
                </span>
              </div>
            ))}
          </div>

          {/* Lista */}
          {pagamentos.length === 0 ? (
            <div className="text-center py-6 text-xs text-[var(--color-outline)]">
              Nenhum pagamento registrado hoje
            </div>
          ) : (
            <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
              {pagamentos.map((p) => {
                const forma = FORMAS_PAGAMENTO.find((f) => f.key === p.forma_pagamento);
                const Icon = forma?.icon || DollarSign;
                return (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--color-surface-container-high)]/30 border border-[rgba(var(--overlay-rgb),0.04)]">
                    <Icon size={16} className="text-[var(--color-primary)]/60" />
                    <span className="flex-1 text-sm text-[var(--color-on-surface)]">
                      {forma?.label || p.forma_pagamento}
                    </span>
                    <span className="text-sm font-mono text-[var(--color-primary)]">
                      {formatMoney(p.valor)}
                    </span>
                    <span className="text-[10px] text-[var(--color-outline)] font-mono">
                      {new Date(p.created_at).toLocaleTimeString('pt-BR')}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>

      {/* Modal: Abrir Caixa */}
      <Modal open={showAbrir} onClose={() => setShowAbrir(false)} title="Abrir Caixa" size="sm">
        <div className="space-y-4">
          <Input label="Saldo Inicial (R$)" type="number" value={saldoInicial} onChange={(e) => setSaldoInicial(Number(e.target.value))} />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowAbrir(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleAbrir}>Abrir Caixa</Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Registrar Pagamento */}
      <Modal open={showPagamento} onClose={() => setShowPagamento(false)} title="Registrar Pagamento" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-medium text-[var(--color-on-surface-variant)] font-mono tracking-[0.05em] uppercase mb-1">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              {FORMAS_PAGAMENTO.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setNovoPagamento((prev) => ({ ...prev, forma_pagamento: key }))}
                  className={`flex items-center gap-2 p-3 rounded-lg border text-sm transition-all cursor-pointer ${
                    novoPagamento.forma_pagamento === key
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                      : 'border-[rgba(var(--overlay-rgb),0.1)] bg-[var(--color-surface-low)] text-[var(--color-on-surface)] hover:border-[var(--color-primary)]/50'
                  }`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
          <Input label="Valor (R$)" type="number" step="0.01" min={0}
            value={novoPagamento.valor || ''}
            onChange={(e) => setNovoPagamento((prev) => ({ ...prev, valor: Number(e.target.value) }))}
          />
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowPagamento(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleRegistrarPagamento} disabled={novoPagamento.valor <= 0}>
              Registrar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Fechar Caixa */}
      <Modal open={showFechar} onClose={() => setShowFechar(false)} title="Fechar Caixa - Conciliação" size="md">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-on-surface-variant)]">
            Informe os valores apurados no fechamento do caixa:
          </p>
          {FORMAS_PAGAMENTO.map(({ key, label }) => (
            <Input
              key={key}
              label={`${label} (R$)`}
              type="number" step="0.01"
              value={(valoresDeclarados as any)[key] ?? 0}
              onChange={(e) => setValoresDeclarados((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
            />
          ))}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setShowFechar(false)}>Cancelar</Button>
            <Button variant="secondary" className="flex-1" onClick={handleFechar}>Fechar Caixa</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
