import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, DollarSign, RefreshCw, Download, Package, BarChart3, Grid } from 'lucide-react';
import Card from '../components/Card';
import StatsCard from '../components/StatsCard';
import Button from '../components/Button';
import type { CMVResult, CMVProdutosResult, CMVCategoriasResult, InsumoConsumoResult, InsumoProdutoItem } from '../types';
import { cmvService, cmvRelatoriosService } from '../services/api';

type Tab = 'produtos' | 'categorias' | 'insumos';

export default function CMV() {
  const [cmv, setCmv] = useState<CMVResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Período customizado
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().split('T')[0]);

  // Relatórios
  const [tab, setTab] = useState<Tab>('produtos');
  const [orderBy, setOrderBy] = useState('receita');
  const [produtos, setProdutos] = useState<CMVProdutosResult | null>(null);
  const [categorias, setCategorias] = useState<CMVCategoriasResult | null>(null);
  const [insumos, setInsumos] = useState<InsumoConsumoResult | null>(null);
  const [detalheInsumo, setDetalheInsumo] = useState<InsumoProdutoItem[] | null>(null);
  const [relLoading, setRelLoading] = useState(false);
  const [relError, setRelError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await cmvService.calcular(30);
      setCmv(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erro ao calcular CMV');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const loadRelatorios = async () => {
    setRelLoading(true);
    setRelError('');
    try {
      const params = { data_inicio: dataInicio, data_fim: dataFim };
      const [p, c, i] = await Promise.all([
        cmvRelatoriosService.produtos({ ...params, order_by: orderBy }),
        cmvRelatoriosService.categorias(params),
        cmvRelatoriosService.insumos(params),
      ]);
      setProdutos(p.data);
      setCategorias(c.data);
      setInsumos(i.data);
    } catch (err: any) {
      setRelError(err?.response?.data?.detail || 'Erro ao carregar relatórios');
    } finally {
      setRelLoading(false);
    }
  };

  useEffect(() => {
    loadRelatorios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataInicio, dataFim]);

  useEffect(() => {
    if (tab !== 'produtos') return;
    setRelLoading(true);
    cmvRelatoriosService.produtos({ data_inicio: dataInicio, data_fim: dataFim, order_by: orderBy })
      .then(res => setProdutos(res.data))
      .catch((err: any) => setRelError(err?.response?.data?.detail || 'Erro ao ordenar produtos'))
      .finally(() => setRelLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderBy]);

  const baixarCSV = (tipo: 'produtos' | 'categorias' | 'insumos') => {
    window.location.href = cmvRelatoriosService.csvUrl(tipo, { data_inicio: dataInicio, data_fim: dataFim });
  };

  const abrirDetalheInsumo = async (insumoId: number) => {
    try {
      const res = await cmvRelatoriosService.produtosPorInsumo(insumoId, { data_inicio: dataInicio, data_fim: dataFim });
      setDetalheInsumo(res.data.produtos);
    } catch (err: any) {
      setRelError(err?.response?.data?.detail || 'Erro ao carregar produtos do insumo');
    }
  };

  const formatarPeriodo = (cmvData: CMVResult) => {
    if (!cmvData?.periodo) return '—';
    const ini = cmvData.periodo.data_inicio;
    const fim = cmvData.periodo.data_fim;
    if (!ini || !fim) return '—';
    const i = new Date(ini + 'T00:00:00');
    const f = new Date(fim + 'T00:00:00');
    if (isNaN(i.getTime()) || isNaN(f.getTime())) return '—';
    return `${i.toLocaleDateString('pt-BR')} — ${f.toLocaleDateString('pt-BR')}`;
  };

  const cmvPercentual = cmv ? cmv.cmv_percentual : 0;
  const cmvColor = cmvPercentual <= 25 ? 'success' : cmvPercentual <= 40 ? 'warning' : 'error';

  const relTotalReceita = produtos?.total_receita || 0;
  const relTotalCusto = produtos?.total_custo || 0;
  const relTotalMargem = produtos?.total_margem || 0;
  const relCmvPct = relTotalReceita > 0 ? (relTotalCusto / relTotalReceita) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-headline-lg text-[var(--color-on-surface)]">CMV</h1>
          <p className="text-label-md text-[var(--color-outline)] mt-1 uppercase">Custo da Mercadoria Vendida</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dataInicio}
            onChange={e => setDataInicio(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[var(--color-surface-container)] border border-[var(--color-outline)]/20 text-sm text-[var(--color-on-surface)]"
          />
          <span className="text-sm text-[var(--color-outline)]">até</span>
          <input
            type="date"
            value={dataFim}
            onChange={e => setDataFim(e.target.value)}
            className="px-3 py-2 rounded-lg bg-[var(--color-surface-container)] border border-[var(--color-outline)]/20 text-sm text-[var(--color-on-surface)]"
          />
          <Button variant="ghost" icon={<RefreshCw size={16} />} onClick={loadRelatorios}>Atualizar</Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      {/* Resumo geral (últimos 30 dias) */}
      {loading ? (
        <div className="flex items-center justify-center h-32 text-[var(--color-outline)] text-sm">
          Calculando CMV...
        </div>
      ) : cmv ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard
              title="Custo Total (30d)"
              value={`R$ ${cmv.custo_total.toFixed(2)}`}
              icon={<Calculator size={20} />}
              variant="warning"
            />
            <StatsCard
              title="Receita Total (30d)"
              value={`R$ ${cmv.receita_total.toFixed(2)}`}
              icon={<DollarSign size={20} />}
              variant="primary"
            />
            <StatsCard
              title="CMV %"
              value={`${cmv.cmv_percentual.toFixed(1)}%`}
              icon={<TrendingUp size={20} />}
              variant={cmvColor}
            />
          </div>

          <Card className="p-6">
            <h3 className="text-sm font-semibold text-[var(--color-on-surface)] mb-4">Detalhes do Período (30 dias)</h3>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-[var(--color-outline)] text-xs font-mono tracking-wider uppercase mb-1">Período</p>
                <p className="text-[var(--color-on-surface)]">{formatarPeriodo(cmv)}</p>
              </div>
              <div>
                <p className="text-[var(--color-outline)] text-xs font-mono tracking-wider uppercase mb-1">Benchmark</p>
                <p className="text-[var(--color-on-surface)]">
                  {cmv.cmv_percentual <= 25 ? '✅ Excelente (≤25%)' : cmv.cmv_percentual <= 40 ? '⚠️ Aceitável (25-40%)' : '🔴 Crítico (>40%)'}
                </p>
              </div>
            </div>
          </Card>
        </>
      ) : (
        <div className="flex items-center justify-center h-32 text-[var(--color-outline)] text-sm">
          Nenhum dado disponível para cálculo do CMV
        </div>
      )}

      {/* Relatórios precisos */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 pt-5 pb-3 border-b border-[var(--color-outline)]/10 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-[var(--color-on-surface)]">Relatórios de CMV, Margem e Insumos</h3>
          <div className="flex gap-1.5">
            <button
              className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 ${tab === 'produtos' ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]' : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'}`}
              onClick={() => setTab('produtos')}
            >
              <BarChart3 size={15} /> Produtos
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 ${tab === 'categorias' ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]' : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'}`}
              onClick={() => setTab('categorias')}
            >
              <Grid size={15} /> Categorias
            </button>
            <button
              className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 ${tab === 'insumos' ? 'bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]' : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'}`}
              onClick={() => setTab('insumos')}
            >
              <Package size={15} /> Insumos
            </button>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-[var(--color-outline)]/10 flex flex-wrap items-center justify-between gap-3">
          {tab === 'produtos' ? (
            <>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="text-[var(--color-outline)] font-mono text-xs uppercase tracking-wider">Total Receita: <strong className="text-[var(--color-on-surface)]">R$ {relTotalReceita.toFixed(2)}</strong></span>
                <span className="text-[var(--color-outline)] font-mono text-xs uppercase tracking-wider">Total Custo: <strong className="text-[var(--color-on-surface)]">R$ {relTotalCusto.toFixed(2)}</strong></span>
                <span className="text-[var(--color-outline)] font-mono text-xs uppercase tracking-wider">Margem: <strong className="text-[var(--color-success)]">R$ {relTotalMargem.toFixed(2)}</strong></span>
                <span className="text-[var(--color-outline)] font-mono text-xs uppercase tracking-wider">CMV: <strong className="text-[var(--color-on-surface)]">{relCmvPct.toFixed(1)}%</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={orderBy}
                  onChange={e => setOrderBy(e.target.value)}
                  className="px-2 py-1.5 rounded-lg bg-[var(--color-surface-container)] border border-[var(--color-outline)]/20 text-sm text-[var(--color-on-surface)]"
                >
                  <option value="receita">Ordenar por receita</option>
                  <option value="custo">Ordenar por custo</option>
                  <option value="margem">Ordenar por margem</option>
                  <option value="cmv">Ordenar por CMV %</option>
                  <option value="nome">Ordenar por nome</option>
                </select>
                <Button variant="ghost" icon={<Download size={15} />} onClick={() => baixarCSV('produtos')}>CSV</Button>
              </div>
            </>
          ) : tab === 'categorias' ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-[var(--color-outline)]">CMV e margem por categoria de produto no período selecionado</span>
              <Button variant="ghost" icon={<Download size={15} />} onClick={() => baixarCSV('categorias')}>CSV</Button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <span className="text-sm text-[var(--color-outline)]">Consumo e custo de insumos (somente vendas) no período selecionado</span>
              <Button variant="ghost" icon={<Download size={15} />} onClick={() => baixarCSV('insumos')}>CSV</Button>
            </div>
          )}
        </div>

        {relError && (
          <div className="p-3 m-6 rounded-lg bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 text-sm text-[var(--color-error)]">
            {relError}
          </div>
        )}

        <div className="px-6 py-4">
          {relLoading ? (
            <div className="flex items-center justify-center h-24 text-[var(--color-outline)] text-sm">Carregando relatórios...</div>
          ) : (
            <>
              {tab === 'produtos' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[var(--color-outline)] font-mono text-xs uppercase tracking-wider border-b border-[var(--color-outline)]/10">
                        <th className="py-2 pr-3">Produto</th>
                        <th className="py-2 pr-3">Categoria</th>
                        <th className="py-2 pr-3 text-right">Qtd</th>
                        <th className="py-2 pr-3 text-right">Preço</th>
                        <th className="py-2 pr-3 text-right">Receita</th>
                        <th className="py-2 pr-3 text-right">Custo</th>
                        <th className="py-2 pr-3 text-right">Margem R$</th>
                        <th className="py-2 pr-3 text-right">Margem %</th>
                        <th className="py-2 text-right">CMV %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(produtos?.produtos || []).map(p => (
                        <tr key={p.produto_id} className="border-b border-[var(--color-outline)]/5 hover:bg-[var(--color-surface-container)]/50">
                          <td className="py-2 pr-3 font-medium text-[var(--color-on-surface)]">{p.nome}</td>
                          <td className="py-2 pr-3 text-[var(--color-on-surface-variant)]">{p.categoria || '—'}</td>
                          <td className="py-2 pr-3 text-right text-[var(--color-on-surface-variant)]">{p.quantidade_vendida.toFixed(1)}</td>
                          <td className="py-2 pr-3 text-right text-[var(--color-on-surface-variant)]">R$ {p.preco_venda.toFixed(2)}</td>
                          <td className="py-2 pr-3 text-right text-[var(--color-on-surface)]">R$ {p.receita.toFixed(2)}</td>
                          <td className="py-2 pr-3 text-right text-[var(--color-on-surface-variant)]">R$ {p.custo.toFixed(2)}</td>
                          <td className={`py-2 pr-3 text-right ${p.margem_bruta >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>R$ {p.margem_bruta.toFixed(2)}</td>
                          <td className={`py-2 pr-3 text-right ${p.margem_pct >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>{p.margem_pct.toFixed(1)}%</td>
                          <td className={`py-2 text-right ${p.cmv_pct <= 40 ? 'text-[var(--color-success)]' : p.cmv_pct <= 60 ? 'text-[var(--color-warning)]' : 'text-[var(--color-error)]'}`}>{p.cmv_pct.toFixed(1)}%</td>
                        </tr>
                      ))}
                      {(produtos?.produtos || []).length === 0 && (
                        <tr>
                          <td colSpan={9} className="py-6 text-center text-[var(--color-outline)]">Nenhuma venda no período selecionado.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'categorias' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[var(--color-outline)] font-mono text-xs uppercase tracking-wider border-b border-[var(--color-outline)]/10">
                        <th className="py-2 pr-3">Categoria</th>
                        <th className="py-2 pr-3 text-right">Qtd Vendida</th>
                        <th className="py-2 pr-3 text-right">Receita</th>
                        <th className="py-2 pr-3 text-right">Custo</th>
                        <th className="py-2 pr-3 text-right">Margem R$</th>
                        <th className="py-2 text-right">CMV %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(categorias?.categorias || []).map(c => (
                        <tr key={c.categoria} className="border-b border-[var(--color-outline)]/5 hover:bg-[var(--color-surface-container)]/50">
                          <td className="py-2 pr-3 font-medium text-[var(--color-on-surface)]">{c.categoria}</td>
                          <td className="py-2 pr-3 text-right text-[var(--color-on-surface-variant)]">{c.quantidade_vendida.toFixed(1)}</td>
                          <td className="py-2 pr-3 text-right text-[var(--color-on-surface)]">R$ {c.receita.toFixed(2)}</td>
                          <td className="py-2 pr-3 text-right text-[var(--color-on-surface-variant)]">R$ {c.custo.toFixed(2)}</td>
                          <td className={`py-2 pr-3 text-right ${c.margem_bruta >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>R$ {c.margem_bruta.toFixed(2)}</td>
                          <td className={`py-2 text-right ${c.cmv_pct <= 40 ? 'text-[var(--color-success)]' : c.cmv_pct <= 60 ? 'text-[var(--color-warning)]' : 'text-[var(--color-error)]'}`}>{c.cmv_pct.toFixed(1)}%</td>
                        </tr>
                      ))}
                      {(categorias?.categorias || []).length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-[var(--color-outline)]">Nenhuma venda no período selecionado.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'insumos' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[var(--color-outline)] font-mono text-xs uppercase tracking-wider border-b border-[var(--color-outline)]/10">
                        <th className="py-2 pr-3">Insumo</th>
                        <th className="py-2 pr-3">Categoria</th>
                        <th className="py-2 pr-3 text-right">Qtd Consumida</th>
                        <th className="py-2 pr-3 text-right">Custo Consumido</th>
                        <th className="py-2 text-right">% do Custo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(insumos?.insumos || []).map(i => (
                        <tr
                          key={i.insumo_id}
                          className="border-b border-[var(--color-outline)]/5 hover:bg-[var(--color-surface-container)]/50 cursor-pointer"
                          onClick={() => abrirDetalheInsumo(i.insumo_id)}
                        >
                          <td className="py-2 pr-3 font-medium text-[var(--color-on-surface)]">{i.nome}</td>
                          <td className="py-2 pr-3 text-[var(--color-on-surface-variant)]">{i.categoria || '—'}</td>
                          <td className="py-2 pr-3 text-right text-[var(--color-on-surface-variant)]">{i.quantidade_consumida.toFixed(2)} {i.unidade_medida}</td>
                          <td className="py-2 pr-3 text-right text-[var(--color-on-surface)]">R$ {i.custo_consumido.toFixed(2)}</td>
                          <td className="py-2 text-right text-[var(--color-on-surface-variant)]">
                            {insumos && insumos.total_custo > 0 ? ((i.custo_consumido / insumos.total_custo) * 100).toFixed(1) : '0.0'}%
                          </td>
                        </tr>
                      ))}
                      {(insumos?.insumos || []).length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-[var(--color-outline)]">Nenhum insumo consumido no período.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {detalheInsumo && (
                    <div className="mt-4 border border-[var(--color-outline)]/15 rounded-lg overflow-hidden">
                      <div className="px-4 py-2.5 bg-[var(--color-surface-container)] flex items-center justify-between">
                        <span className="text-sm font-semibold text-[var(--color-on-surface)]">Produtos que consomem este insumo</span>
                        <button
                          className="text-sm text-[var(--color-primary)] hover:underline"
                          onClick={() => setDetalheInsumo(null)}
                        >
                          Fechar
                        </button>
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-[var(--color-outline)] font-mono text-xs uppercase tracking-wider border-b border-[var(--color-outline)]/10">
                            <th className="py-2 px-4">Produto</th>
                            <th className="py-2 pr-3 text-right">Qtd Insumo</th>
                            <th className="py-2 pr-3 text-right">Custo</th>
                            <th className="py-2 pr-3 text-right">Qtd Produto</th>
                            <th className="py-2 pr-3 text-right">Receita</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detalheInsumo.map(p => (
                            <tr key={p.produto_id} className="border-b border-[var(--color-outline)]/5">
                              <td className="py-2 px-4 font-medium text-[var(--color-on-surface)]">{p.nome}</td>
                              <td className="py-2 pr-3 text-right text-[var(--color-on-surface-variant)]">{p.quantidade_insumo.toFixed(2)}</td>
                              <td className="py-2 pr-3 text-right text-[var(--color-on-surface)]">R$ {p.custo_insumo.toFixed(2)}</td>
                              <td className="py-2 pr-3 text-right text-[var(--color-on-surface-variant)]">{p.quantidade_produto.toFixed(1)}</td>
                              <td className="py-2 pr-3 text-right text-[var(--color-on-surface)]">R$ {p.receita.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
