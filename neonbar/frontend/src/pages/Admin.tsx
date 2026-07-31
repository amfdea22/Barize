import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTelemetry } from '../hooks/useTelemetry';
import { produtoLotesService, fichasTecnicasService, pdvService, adminService } from '../services/api';
import type { ProdutoLote, ProdutoLoteCreate, Produto } from '../types';

const Admin: React.FC = () => {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'monitoramento' | 'lotes' | 'fichas' | 'imagens'>('monitoramento');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Monitoramento state
  const [lotesVencendo, setLotesVencendo] = useState<ProdutoLote[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const telemetry = useTelemetry();

  // Gestão de Lotes state
  const [lotes, setLotes] = useState<ProdutoLote[]>([]);
  const [showLoteModal, setShowLoteModal] = useState(false);
  const [editingLote, setEditingLote] = useState<ProdutoLote | null>(null);
  const [loteForm, setLoteForm] = useState<ProdutoLoteCreate>({
    produto_id: 0,
    codigo_lote: '',
    data_fabricacao: '',
    data_validade: '',
    quantidade: 0,
  });

  // Fichas Técnicas state
  const [fichas, setFichas] = useState<any[]>([]);
  const [selectedFicha, setSelectedFicha] = useState<any | null>(null);
  const [showFichaModal, setShowFichaModal] = useState(false);

  // Imagens state
  const [images, setImages] = useState<any[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [fichaForm, setFichaForm] = useState({
    dificuldade: '',
    teor_alcoolico: '',
    modo_preparo: '',
    tipo_copo: '',
    guarnicao: '',
    tempo_preparo: '',
  });

  const hasRole = (roles: string[]) => usuario ? roles.includes(usuario.role) : false;
  const isAdminOrGerente = hasRole(['admin', 'gerente']);

  useEffect(() => {
    if (!usuario) {
      navigate('/login');
      return;
    }
    if (!isAdminOrGerente) {
      navigate('/pdv');
      return;
    }
    loadMonitoramento();
    loadProdutos();
  }, [usuario, isAdminOrGerente, navigate]);

  useEffect(() => {
    if (activeTab === 'lotes') loadLotes();
    if (activeTab === 'fichas') loadFichas();
    if (activeTab === 'imagens') loadImages();
  }, [activeTab]);

  const loadMonitoramento = async () => {
    try {
      setLoading(true);
      const [vencendo, prods, healthRes, metricsRes] = await Promise.all([
        produtoLotesService.vencendo(30),
        pdvService.listarProdutos(),
        adminService.healthEnhanced().catch(() => ({ data: null })),
        adminService.metrics().catch(() => ({ data: null })),
      ]);
      setLotesVencendo(vencendo.data.filter((l: ProdutoLote) => l.quantidade > 0));
      setProdutos(prods.data.filter((p: Produto) => p.ativo));
      setHealth(healthRes?.data || null);
      setMetrics(metricsRes?.data || null);
    } catch (err: any) {
      setError('Erro ao carregar monitoramento: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadProdutos = async () => {
    try {
      const data = await pdvService.listarProdutos();
      setProdutos(data.data.filter((p: Produto) => p.ativo));
    } catch (err: any) {
      setError('Erro ao carregar produtos: ' + (err.response?.data?.detail || err.message));
    }
  };

  const loadLotes = async () => {
    try {
      setLoading(true);
      const data = await produtoLotesService.listar();
      setLotes(data.data);
    } catch (err: any) {
      setError('Erro ao carregar lotes: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const loadImages = async () => {
    try {
      setImagesLoading(true);
      const res = await adminService.listImages();
      setImages(res.data.images || []);
    } catch (err: any) {
      setError('Erro ao carregar imagens: ' + (err.response?.data?.detail || err.message));
    } finally {
      setImagesLoading(false);
    }
  };

  const loadFichas = async () => {
    try {
      setLoading(true);
      const data = await fichasTecnicasService.listar();
      setFichas(data.data);
    } catch (err: any) {
      setError('Erro ao carregar fichas técnicas: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleLoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editingLote) {
        await produtoLotesService.atualizar(editingLote.id, loteForm);
      } else {
        await produtoLotesService.criar(loteForm);
      }
      setShowLoteModal(false);
      setEditingLote(null);
      resetLoteForm();
      loadLotes();
    } catch (err: any) {
      setError('Erro ao salvar lote: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLote = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este lote?')) return;
    try {
      await produtoLotesService.excluir(id);
      loadLotes();
    } catch (err: any) {
      setError('Erro ao excluir lote: ' + (err.response?.data?.detail || err.message));
    }
  };

  const openLoteModal = (lote?: ProdutoLote) => {
    if (lote) {
      setEditingLote(lote);
      setLoteForm({
        produto_id: lote.produto_id,
        codigo_lote: lote.codigo_lote,
        data_fabricacao: lote.data_fabricacao ? lote.data_fabricacao.split('T')[0] : '',
        data_validade: lote.data_validade ? lote.data_validade.split('T')[0] : '',
        quantidade: lote.quantidade,
      });
    } else {
      setEditingLote(null);
      resetLoteForm();
    }
    setShowLoteModal(true);
  };

  const resetLoteForm = () => {
    setLoteForm({
      produto_id: 0,
      codigo_lote: '',
      data_fabricacao: '',
      data_validade: '',
      quantidade: 0,
    });
  };

  const handleFichaSelect = (ficha: any) => {
    setSelectedFicha(ficha);
    setFichaForm({
      dificuldade: ficha.dificuldade || '',
      teor_alcoolico: ficha.teor_alcoolico || '',
      modo_preparo: ficha.modo_preparo || '',
      tipo_copo: ficha.tipo_copo || '',
      guarnicao: ficha.guarnicao || '',
      tempo_preparo: ficha.tempo_preparo || '',
    });
    setShowFichaModal(true);
  };

  const handleFichaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFicha) return;
    try {
      setLoading(true);
      await fichasTecnicasService.atualizar(selectedFicha.id, {
        dificuldade: fichaForm.dificuldade || undefined,
        teor_alcoolico: fichaForm.teor_alcoolico ? parseFloat(fichaForm.teor_alcoolico) : undefined,
        modo_preparo: fichaForm.modo_preparo || undefined,
        tipo_copo: fichaForm.tipo_copo || undefined,
        guarnicao: fichaForm.guarnicao || undefined,
        tempo_preparo: fichaForm.tempo_preparo ? parseInt(fichaForm.tempo_preparo) : undefined,
      });
      setShowFichaModal(false);
      loadFichas();
    } catch (err: any) {
      setError('Erro ao atualizar ficha técnica: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getDificuldadeColor = (dificuldade?: string) => {
    switch (dificuldade?.toLowerCase()) {
      case 'fácil': return 'success';
      case 'médio': return 'warning';
      case 'difícil': return 'danger';
      default: return 'secondary';
    }
  };

  if (!usuario || !isAdminOrGerente) return null;

  return (
    <div className="admin-page container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Administração</h1>
        <span className="badge bg-primary">{usuario.nome} ({usuario.role})</span>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      <ul className="nav nav-tabs mb-4" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'monitoramento' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitoramento')}
            role="tab"
          >
            <i className="bi bi-activity me-1"></i> Monitoramento
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'lotes' ? 'active' : ''}`}
            onClick={() => setActiveTab('lotes')}
            role="tab"
          >
            <i className="bi bi-box-seam me-1"></i> Gestão de Lotes
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'fichas' ? 'active' : ''}`}
            onClick={() => setActiveTab('fichas')}
            role="tab"
          >
            <i className="bi bi-file-text me-1"></i> Fichas Técnicas
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeTab === 'imagens' ? 'active' : ''}`}
            onClick={() => setActiveTab('imagens')}
            role="tab"
          >
            <i className="bi bi-images me-1"></i> Imagens
          </button>
        </li>
      </ul>

      {/* Tab: Monitoramento */}
      {activeTab === 'monitoramento' && (
        <>
          {/* System Health Row */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="card text-center h-100">
                <div className="card-body">
                  <i className={`bi ${health?.status === 'ok' ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-danger'} fs-1`}></i>
                  <h6 className="mt-2 mb-0">Sistema</h6>
                  <small className={`text-${health?.status === 'ok' ? 'success' : 'danger'}`}>{health?.status || '---'}</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center h-100">
                <div className="card-body">
                  <i className={`bi ${health?.banco?.status === 'conectado' ? 'bi-database-fill-check text-success' : 'bi-database-fill-exclamation text-danger'} fs-1`}></i>
                  <h6 className="mt-2 mb-0">Banco</h6>
                  <small className={`text-${health?.banco?.status === 'conectado' ? 'success' : 'danger'}`}>{health?.banco?.status || '---'}</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center h-100">
                <div className="card-body">
                  <i className="bi bi-arrow-clockwise text-info fs-1"></i>
                  <h6 className="mt-2 mb-0">Requests</h6>
                  <small>{metrics ? Object.values(metrics.endpoints as Record<string, any>).reduce((s: number, e: any) => s + e.total, 0) : '---'}</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card text-center h-100">
                <div className="card-body">
                  <i className="bi bi-activity text-primary fs-1"></i>
                  <h6 className="mt-2 mb-0">Telemetria</h6>
                  <small>{telemetry.getStats() ? `${telemetry.getStats()!.total} req` : '---'}</small>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics Table */}
          {metrics?.endpoints && Object.keys(metrics.endpoints).length > 0 && (
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0"><i className="bi bi-bar-chart-line me-2"></i> Métricas por Endpoint</h5>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-sm table-hover mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Endpoint</th>
                        <th>Total</th>
                        <th>Erros</th>
                        <th>Taxa Erro</th>
                        <th>Tempo Médio</th>
                        <th>Tempo Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(metrics.endpoints as Record<string, any>).map(([key, data]) => (
                        <tr key={key}>
                          <td><code>{key}</code></td>
                          <td>{data.total}</td>
                          <td>
                            <span className={`badge bg-${data.erros > 0 ? 'danger' : 'success'}`}>
                              {data.erros}
                            </span>
                          </td>
                          <td>
                            <span className={`badge bg-${data.taxa_erro_pct > 5 ? 'danger' : data.taxa_erro_pct > 0 ? 'warning' : 'success'}`}>
                              {data.taxa_erro_pct}%
                            </span>
                          </td>
                          <td>{data.duracao_media_ms}ms</td>
                          <td>{data.duracao_total_s}s</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          <div className="row">
            <div className="col-md-6">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0"><i className="bi bi-exclamation-triangle text-warning me-2"></i> Lotes Vencendo (30 dias)</h5>
                  <span className="badge bg-warning text-dark">{lotesVencendo.length}</span>
                </div>
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center py-4"><div className="spinner-border text-primary"></div></div>
                  ) : lotesVencendo.length === 0 ? (
                    <div className="text-center py-4 text-muted">Nenhum lote vencendo nos próximos 30 dias</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Produto</th>
                            <th>Lote</th>
                            <th>Validade</th>
                            <th>Qtd</th>
                            <th>Dias</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lotesVencendo.map(lote => {
                            const dias = lote.data_validade
                              ? Math.ceil((new Date(lote.data_validade).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                              : 0;
                            return (
                              <tr key={lote.id} className={dias <= 7 ? 'table-danger' : dias <= 15 ? 'table-warning' : ''}>
                                <td>{lote.produto?.nome || 'N/A'}</td>
                                <td>{lote.codigo_lote}</td>
                                <td>{formatDate(lote.data_validade)}</td>
                                <td>{lote.quantidade}</td>
                                <td><span className="badge bg-danger">{dias} dias</span></td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0"><i className="bi bi-box text-danger me-2"></i> Produtos Ativos</h5>
                  <span className="badge bg-primary">{produtos.length}</span>
                </div>
                <div className="card-body p-0">
                  {loading ? (
                    <div className="text-center py-4"><div className="spinner-border text-primary"></div></div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Produto</th>
                            <th>Categoria</th>
                            <th>Preço</th>
                          </tr>
                        </thead>
                        <tbody>
                          {produtos.map(p => (
                            <tr key={p.id}>
                              <td>{p.nome}</td>
                              <td>{p.categoria || '-'}</td>
                              <td>R$ {p.preco_venda.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Tab: Gestão de Lotes */}
      {activeTab === 'lotes' && (
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Lotes de Produtos</h5>
            <button className="btn btn-primary" onClick={() => openLoteModal()} disabled={!isAdminOrGerente}>
              <i className="bi bi-plus-lg me-1"></i> Novo Lote
            </button>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-4"><div className="spinner-border text-primary"></div></div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Produto</th>
                      <th>Código do Lote</th>
                      <th>Fabricação</th>
                      <th>Validade</th>
                      <th>Quantidade</th>
                      <th className="text-end">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lotes.map(lote => (
                      <tr key={lote.id}>
                        <td>{lote.produto?.nome || 'N/A'}</td>
                        <td><code>{lote.codigo_lote}</code></td>
                        <td>{formatDate(lote.data_fabricacao)}</td>
                        <td>{formatDate(lote.data_validade)}</td>
                        <td>{lote.quantidade}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-primary me-1"
                            onClick={() => openLoteModal(lote)}
                            disabled={!isAdminOrGerente}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDeleteLote(lote.id)}
                            disabled={!isAdminOrGerente}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Fichas Técnicas */}
      {activeTab === 'fichas' && (
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">Fichas Técnicas dos Produtos</h5>
          </div>
          <div className="card-body p-0">
            {loading ? (
              <div className="text-center py-4"><div className="spinner-border text-primary"></div></div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Produto</th>
                      <th>Categoria</th>
                      <th>Dificuldade</th>
                      <th>Teor Alcoólico</th>
                      <th>Tempo (min)</th>
                      <th>Copo</th>
                      <th className="text-end">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fichas.map(ficha => (
                      <tr key={ficha.id}>
                        <td><strong>{ficha.nome}</strong></td>
                        <td>{ficha.categoria || '-'}</td>
                        <td>
                          {ficha.dificuldade && (
                            <span className={`badge bg-${getDificuldadeColor(ficha.dificuldade)}`}>
                              {ficha.dificuldade}
                            </span>
                          )}
                        </td>
                        <td>{ficha.teor_alcoolico ? `${ficha.teor_alcoolico}%` : '-'}</td>
                        <td>{ficha.tempo_preparo ? `${ficha.tempo_preparo} min` : '-'}</td>
                        <td>{ficha.tipo_copo || '-'}</td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleFichaSelect(ficha)}
                          >
                            <i className="bi bi-pencil me-1"></i> Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Novo/Editar Lote */}
      {showLoteModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingLote ? 'Editar Lote' : 'Novo Lote de Produto'}</h5>
                <button type="button" className="btn-close" onClick={() => setShowLoteModal(false)}></button>
              </div>
              <form onSubmit={handleLoteSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Produto *</label>
                    <select
                      className="form-select"
                      value={loteForm.produto_id}
                      onChange={e => setLoteForm({ ...loteForm, produto_id: parseInt(e.target.value) })}
                      required
                    >
                      <option value="">Selecione...</option>
                      {produtos.map(p => (
                        <option key={p.id} value={p.id}>{p.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Código do Lote *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={loteForm.codigo_lote}
                      onChange={e => setLoteForm({ ...loteForm, codigo_lote: e.target.value })}
                      required
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Data de Fabricação</label>
                      <input
                        type="date"
                        className="form-control"
                        value={loteForm.data_fabricacao}
                        onChange={e => setLoteForm({ ...loteForm, data_fabricacao: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Data de Validade</label>
                      <input
                        type="date"
                        className="form-control"
                        value={loteForm.data_validade}
                        onChange={e => setLoteForm({ ...loteForm, data_validade: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Quantidade *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={loteForm.quantidade}
                      onChange={e => setLoteForm({ ...loteForm, quantidade: parseFloat(e.target.value) || 0 })}
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowLoteModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm me-1"></span> : ''}
                    {editingLote ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Imagens */}
      {activeTab === 'imagens' && (
        <div className="row">
          <div className="col-12 mb-4">
            <div className="card">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0"><i className="bi bi-images me-2"></i> Imagens Disponíveis ({images.length})</h5>
                <button className="btn btn-sm btn-outline-primary" onClick={loadImages} disabled={imagesLoading}>
                  <i className="bi bi-arrow-clockwise me-1"></i> Atualizar
                </button>
              </div>
              <div className="card-body">
                {imagesLoading ? (
                  <div className="text-center py-4"><div className="spinner-border text-primary"></div></div>
                ) : images.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <i className="bi bi-images fs-1 d-block mb-2"></i>
                    Nenhuma imagem encontrada. Faça upload pelo endpoint <code>POST /api/v1/upload/imagem</code>.
                  </div>
                ) : (
                  <div className="row g-3">
                    {images.map((img: any) => (
                      <div key={img.filename} className="col-6 col-md-4 col-lg-3 col-xl-2">
                        <div className="card h-100">
                          <div className="card-img-top bg-dark d-flex align-items-center justify-content-center" style={{ height: 140 }}>
                            <img
                              src={img.url}
                              alt={img.filename}
                              className="img-fluid"
                              style={{ maxHeight: '100%', objectFit: 'contain' }}
                              loading="lazy"
                            />
                          </div>
                          <div className="card-body p-2 text-center">
                            <small className="text-muted d-block text-truncate">{img.filename}</small>
                            <small className="text-muted">{img.size_kb} KB</small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Ficha Técnica */}
      {showFichaModal && selectedFicha && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Produto: {selectedFicha.nome}</h5>
                <button type="button" className="btn-close" onClick={() => setShowFichaModal(false)}></button>
              </div>
              <form onSubmit={handleFichaSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Dificuldade</label>
                      <select className="form-select" value={fichaForm.dificuldade} onChange={e => setFichaForm({ ...fichaForm, dificuldade: e.target.value })}>
                        <option value="">Selecione...</option>
                        <option value="Fácil">Fácil</option>
                        <option value="Médio">Médio</option>
                        <option value="Difícil">Difícil</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Teor Alcoólico (%)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={fichaForm.teor_alcoolico}
                        onChange={e => setFichaForm({ ...fichaForm, teor_alcoolico: e.target.value })}
                        step="0.1"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Tipo de Copo</label>
                      <input
                        type="text"
                        className="form-control"
                        value={fichaForm.tipo_copo}
                        onChange={e => setFichaForm({ ...fichaForm, tipo_copo: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Tempo de Preparo (min)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={fichaForm.tempo_preparo}
                        onChange={e => setFichaForm({ ...fichaForm, tempo_preparo: e.target.value })}
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Guarnicão</label>
                    <input
                      type="text"
                      className="form-control"
                      value={fichaForm.guarnicao}
                      onChange={e => setFichaForm({ ...fichaForm, guarnicao: e.target.value })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Modo de Preparo</label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={fichaForm.modo_preparo}
                      onChange={e => setFichaForm({ ...fichaForm, modo_preparo: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowFichaModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? <span className="spinner-border spinner-border-sm me-1"></span> : ''} Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;