import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  RefreshCw,
  AlertTriangle,
  Calculator,
  CheckCircle,
  Percent,
  BarChart3,
} from 'lucide-react';
import Card from '../components/Card';
import StatsCard from '../components/StatsCard';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Badge from '../components/Badge';
import ProductThumbnail from '../components/ProductThumbnail';
import { precificacaoService } from '../services/api';
import type { PrecificacaoItem, PrecificacaoDetalhe } from '../types';

export default function Precificacao() {
  const [produtos, setProdutos] = useState<PrecificacaoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [categoriaFilter, setCategoriaFilter] = useState('');
  const [categorias, setCategorias] = useState<string[]>([]);
  const [detalhe, setDetalhe] = useState<PrecificacaoDetalhe | null>(null);
  const [showDetalhe, setShowDetalhe] = useState(false);
  const [aplicando, setAplicando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const load = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const res = await precificacaoService.listar({ categoria: categoriaFilter || undefined });
      setProdutos(res.data.produtos || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao carregar precificação');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoriaFilter]);

  const loadCategorias = useCallback(async () => {
    try {
      const res = await precificacaoService.categorias();
      setCategorias(res.data || []);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCategorias(); }, [loadCategorias]);

  const handleVerDetalhe = async (produtoId: number) => {
    try {
      const res = await precificacaoService.obter(produtoId);
      setDetalhe(res.data);
      setShowDetalhe(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao carregar detalhes');
    }
  };

  const handleAplicar = async (targetCmv: number) => {
    if (!detalhe) return;
    setAplicando(true);
    setMensagem('');
    try {
      const res = await precificacaoService.aplicarPreco(detalhe.produto_id, targetCmv);
      setMensagem(res.data.mensagem || 'Preço aplicado com sucesso!');
      setShowDetalhe(false);
      setDetalhe(null);
      load(true);
      setTimeout(() => setMensagem(''), 3000);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao aplicar preço');
    } finally {
      setAplicando(false);
    }
  };

  const produtosSemReceita = produtos.filter((p) => !p.possui_receita).length;
  const cmvMedio = produtos.length > 0
    ? produtos.reduce((s, p) => s + p.cmv_atual, 0) / produtos.length
    : 0;
  const produtosAjustar = produtos.filter((p) => p.cmv_atual > 35).length;
  const produtosOk = produtos.filter((p) => p.cmv_atual > 0 && p.cmv_atual <= 35).length;

  const getCmvColor = (cmv: number) => {
    if (cmv <= 25) return 'text-green-400';
    if (cmv <= 35) return 'text-cyan-400';
    if (cmv <= 45) return 'text-amber-400';
    return 'text-red-400';
  };

  const getCmvBadge = (cmv: number) => {
    if (cmv <= 25) return 'success';
    if (cmv <= 35) return 'info';
    if (cmv <= 45) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-outline)] text-sm">
        Carregando precificação...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline-lg font-bold text-[var(--color-on-surface)]">PRECIFICAÇÃO</h1>
          <p className="text-label-md text-[var(--color-outline)] mt-1 uppercase">CMV por Dose & Preço Sugerido</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" icon={<RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />} onClick={() => load(true)}>
            Atualizar
          </Button>
        </div>
      </div>

      {mensagem && (
        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm text-green-400 flex items-center gap-2">
          <CheckCircle size={16} />
          {mensagem}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-sm text-[var(--color-error)] flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total de Produtos"
          value={total}
          icon={<BarChart3 size={20} />}
          variant="primary"
          subtitle={`${produtosOk} com CMV ≤ 35%`}
        />
        <StatsCard
          title="CMV Médio"
          value={`${cmvMedio.toFixed(1)}%`}
          icon={<Percent size={20} />}
          variant={cmvMedio <= 25 ? 'success' : cmvMedio <= 35 ? 'primary' : cmvMedio <= 45 ? 'warning' : 'error'}
          subtitle="Média geral"
        />
        <StatsCard
          title="Precificar (CMV > 35%)"
          value={produtosAjustar}
          icon={<AlertTriangle size={20} />}
          variant="warning"
          subtitle="Requerem ajuste"
        />
        <StatsCard
          title="Sem Receita"
          value={produtosSemReceita}
          icon={<Calculator size={20} />}
          variant="error"
          subtitle="Custo por dose = 0"
        />
      </div>

      {/* Filtros */}
      {categorias.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-[var(--color-outline)] font-mono uppercase mr-1">Categoria:</span>
            <button
              onClick={() => setCategoriaFilter('')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                !categoriaFilter
                  ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30'
                  : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] border border-transparent hover:border-[var(--color-outline-variant)]'
              }`}
            >
              Todas
            </button>
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  categoriaFilter === cat
                    ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30'
                    : 'bg-[var(--color-surface-container-high)] text-[var(--color-on-surface-variant)] border border-transparent hover:border-[var(--color-outline-variant)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Tabela */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[11px] font-mono tracking-wider text-[var(--color-outline)] uppercase border-b border-[rgba(var(--overlay-rgb),0.06)]">
                <th className="pb-2 pr-4">Produto</th>
                <th className="pb-2 pr-4 w-8"></th>
                <th className="pb-2 pr-4">Categoria</th>
                <th className="pb-2 pr-4 text-right">Preço Atual</th>
                <th className="pb-2 pr-4 text-right">Custo/Dose</th>
                <th className="pb-2 pr-4 text-right">CMV Atual</th>
                <th className="pb-2 pr-4 text-right">Margem</th>
                <th className="pb-2 pr-4 text-right">Sugerido 30%</th>
                <th className="pb-2 pr-4 text-right">CMV 30%</th>
                <th className="pb-2 pr-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.length === 0 ? (
                <tr><td colSpan={9} className="pt-4 text-sm text-[var(--color-outline)] text-center">Nenhum produto encontrado</td></tr>
              ) : (
                produtos.map((p) => (
                  <tr
                    key={p.produto_id}
                    className="border-b border-[rgba(var(--overlay-rgb),0.03)] hover:bg-[rgba(var(--overlay-rgb),0.02)] cursor-pointer"
                    onClick={() => handleVerDetalhe(p.produto_id)}
                  >
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-3">
                        <ProductThumbnail foto_url={p.foto_url} imagem={p.imagem} size="lg" alt={p.nome} />
                        <span className="text-sm font-medium text-[var(--color-on-surface)]">{p.nome}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      <span className="text-xs text-[var(--color-outline)]">{p.categoria || '-'}</span>
                    </td>
                    <td className="py-2 pr-4 text-right font-mono text-sm">
                      R$ {p.preco_venda.toFixed(2)}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono text-sm text-[var(--color-on-surface-variant)]">
                      {p.possui_receita ? `R$ ${p.custo_dose.toFixed(2)}` : '-'}
                    </td>
                    <td className={`py-2 pr-4 text-right font-mono text-sm font-bold ${getCmvColor(p.cmv_atual)}`}>
                      {p.possui_receita ? `${p.cmv_atual.toFixed(1)}%` : '-'}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono text-sm text-[var(--color-on-surface-variant)]">
                      {p.possui_receita ? `${p.margem_atual.toFixed(1)}%` : '-'}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono text-sm text-[var(--color-primary)]">
                      {p.possui_receita ? `R$ ${p.preco_sugerido_30.toFixed(2)}` : '-'}
                    </td>
                    <td className="py-2 pr-4 text-center">
                      {p.possui_receita && (
                        <Badge variant={getCmvBadge(p.cmv_30)}>{p.cmv_30.toFixed(0)}%</Badge>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-center">
                      {p.possui_receita && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); handleVerDetalhe(p.produto_id); }}
                        >
                          Detalhes
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Detalhe */}
      <Modal open={showDetalhe} onClose={() => { setShowDetalhe(false); setDetalhe(null); }} title={detalhe?.nome || 'Detalhes'} size="lg">
        {detalhe && (
          <div className="space-y-6">
            {/* Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-[var(--color-surface-container-lowest)]">
                <p className="text-[10px] text-[var(--color-outline)] uppercase tracking-wider">Preço Atual</p>
                <p className="text-headline-sm font-bold text-[var(--color-on-surface)]">R$ {detalhe.preco_venda.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--color-surface-container-lowest)]">
                <p className="text-[10px] text-[var(--color-outline)] uppercase tracking-wider">Custo por Dose</p>
                <p className="text-headline-sm font-bold text-[var(--color-on-surface)]">R$ {detalhe.custo_dose.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--color-surface-container-lowest)]">
                <p className="text-[10px] text-[var(--color-outline)] uppercase tracking-wider">CMV Atual</p>
                <p className={`text-headline-sm font-bold ${getCmvColor(detalhe.cmv_atual)}`}>{detalhe.cmv_atual.toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-lg bg-[var(--color-surface-container-lowest)]">
                <p className="text-[10px] text-[var(--color-outline)] uppercase tracking-wider">Margem Atual</p>
                <p className="text-headline-sm font-bold text-[var(--color-on-surface)]">{detalhe.margem_atual.toFixed(1)}%</p>
              </div>
            </div>

            {/* Ingredientes */}
            <div>
              <h3 className="text-label-sm font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-3">
                Composição da Receita
              </h3>
              <div className="space-y-1">
                {detalhe.ingredientes.map((ing, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-[var(--color-surface-container-lowest)] text-sm">
                    <div className="flex items-center gap-3">
                      <span className="text-[var(--color-on-surface)] font-medium">{ing.nome}</span>
                      <span className="text-[var(--color-outline)] text-xs">{ing.quantidade} {ing.unidade_medida}</span>
                    </div>
                    <div className="flex items-center gap-4 font-mono text-xs">
                      <span className="text-[var(--color-on-surface-variant)]">R$ {ing.custo_parcial.toFixed(4)}</span>
                      <span className="text-[var(--color-outline)]">{ing.percentual_custo.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cenários */}
            <div>
              <h3 className="text-label-sm font-semibold text-[var(--color-on-surface-variant)] uppercase tracking-wider mb-3">
                Cenários de Precificação
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {detalhe.cenarios.map((c) => (
                  <div
                    key={c.margem_desejada}
                    className="p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:scale-[1.02]"
                    style={{
                      borderColor: c.margem_desejada === 30 ? 'rgba(0,218,243,0.4)' : 'rgba(var(--overlay-rgb),0.06)',
                      backgroundColor: c.margem_desejada === 30 ? 'rgba(0,218,243,0.05)' : 'var(--color-surface-container-lowest)',
                    }}
                    onClick={() => handleAplicar(c.margem_desejada)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-wider">
                        Margem {c.margem_desejada}%
                      </span>
                      {c.margem_desejada === 30 && (
                        <span className="text-[10px] text-[var(--color-primary)] font-bold">Recomendado</span>
                      )}
                    </div>
                    <p className="text-headline-sm font-bold text-[var(--color-on-surface)]">
                      R$ {c.preco_sugerido.toFixed(2)}
                      {c.diferenca_preco_atual !== 0 && (
                        <span className={`text-xs ml-2 font-normal ${c.diferenca_preco_atual > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {c.diferenca_preco_atual > 0 ? '+' : ''}R$ {c.diferenca_preco_atual.toFixed(2)}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-outline)] font-mono">
                      <span>CMV: {c.cmv_resultante.toFixed(1)}%</span>
                      <span>Lucro/dose: R$ {c.lucro_por_dose.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Aplicar */}
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => { setShowDetalhe(false); setDetalhe(null); }}>
                Fechar
              </Button>
              <Button
                className="flex-1"
                icon={<DollarSign size={16} />}
                loading={aplicando}
                onClick={() => handleAplicar(30)}
              >
                Aplicar Margem 30%
              </Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
