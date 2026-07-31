import axios, { AxiosError } from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

// Retry: tenta novamente se o servidor estiver offline
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const isRetryError = (err: AxiosError) =>
  !err.response && (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error'));

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    const config = err.config as any;
    if (!config || config._retryCount >= MAX_RETRIES || !isRetryError(err)) throw err;
    config._retryCount = (config._retryCount || 0) + 1;
    await new Promise((r) => setTimeout(r, RETRY_DELAY * config._retryCount));
    return api(config);
  },
);

// Interceptor: anexa token JWT automaticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('barize_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: redireciona para login se 401
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('barize_token');
      localStorage.removeItem('barize_usuario');


      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default api;

/* ─── Auth ─── */
export const authService = {
  login: (username: string, senha: string) =>
    api.post('/auth/login', { username, senha }),
  me: () => api.get('/auth/me'),
  listarUsuarios: () => api.get('/auth/usuarios'),
  criarUsuario: (data: any) => api.post('/auth/usuarios', data),
  atualizarUsuario: (usuario_id: number, data: any) =>
    api.put(`/auth/usuarios/${usuario_id}`, data),
};

/* ─── PDV / Produtos ─── */
export const pdvService = {
  listarProdutos: () => api.get('/pdv/produtos'),
  criarProduto: (data: any) => api.post('/pdv/produtos', data),
  atualizarProduto: (produto_id: number, data: any) =>
    api.put(`/pdv/produtos/${produto_id}`, data),
  excluirProduto: (produto_id: number) =>
    api.delete(`/pdv/produtos/${produto_id}`),
  vender: (produto_id: number, quantidade: number, imprimir_comanda = false) =>
    api.post(`/pdv/vender?produto_id=${produto_id}&quantidade=${quantidade}&imprimir_comanda=${imprimir_comanda}`),
  finalizarComanda: (itens: { produto_id: number; quantidade: number; nota?: string }[], imprimir_comanda = true, observacao?: string, mesa?: string, cliente?: string) =>
    api.post('/pdv/finalizar-comanda', { itens, imprimir_comanda, observacao, mesa, cliente }),
  cancelarVenda: (movimentacao_id: number, motivo: string) =>
    api.post(`/pdv/cancelar-venda?movimentacao_id=${movimentacao_id}&motivo=${encodeURIComponent(motivo)}`),
  /* ── Receitas ── */
  listarReceitas: (produto_id: number) =>
    api.get(`/pdv/produtos/${produto_id}/receitas`),
  substituirReceitas: (produto_id: number, receitas: { insumo_id: number; quantidade_necessaria: number }[]) =>
    api.put(`/pdv/produtos/${produto_id}/receitas`, receitas),
  adicionarReceita: (produto_id: number, data: { insumo_id: number; quantidade_necessaria: number }) =>
    api.post(`/pdv/produtos/${produto_id}/receitas`, data),
  removerReceita: (produto_id: number, receita_id: number) =>
    api.delete(`/pdv/produtos/${produto_id}/receitas/${receita_id}`),
};

/* ─── Estoque / Insumos ─── */
export const estoqueService = {
  listarInsumos: (ativos?: boolean) =>
    api.get(`/estoque/insumos${ativos !== undefined ? `?ativos=${ativos}` : ''}`),
  criarInsumo: (data: any) => api.post('/estoque/insumos', data),
  atualizarInsumo: (insumo_id: number, data: any) =>
    api.put(`/estoque/insumos/${insumo_id}`, data),
  excluirInsumo: (insumo_id: number) =>
    api.delete(`/estoque/insumos/${insumo_id}`),
  entrada: (data: any) => api.post('/estoque/entrada', data),
  ajuste: (insumo_id: number, novo_estoque: number, motivo: string) =>
    api.post(`/estoque/ajuste?insumo_id=${insumo_id}&novo_estoque=${novo_estoque}&motivo=${encodeURIComponent(motivo)}`),
  perda: (insumo_id: number, quantidade: number, motivo: string) =>
    api.post(`/estoque/perda?insumo_id=${insumo_id}&quantidade=${quantidade}&motivo=${encodeURIComponent(motivo)}`),
  movimentacoes: (params?: { insumo_id?: number; tipo?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.insumo_id) query.set('insumo_id', String(params.insumo_id));
    if (params?.tipo) query.set('tipo', params.tipo);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const qs = query.toString();
    return api.get(`/estoque/movimentacoes${qs ? `?${qs}` : ''}`);
  },
  baixoEstoque: () => api.get('/estoque/insumos-baixo-estoque'),
};

/* ─── CMV ─── */
export const cmvService = {
  calcular: (dias = 30, data_inicio?: string, data_fim?: string) => {
    const query = new URLSearchParams({ dias: String(dias) });
    if (data_inicio) query.set('data_inicio', data_inicio);
    if (data_fim) query.set('data_fim', data_fim);
    return api.get(`/cmv/calcular?${query.toString()}`);
  },
  dashboard: () => api.get('/cmv/dashboard'),
};

/* ─── Caixa ─── */
export const caixaService = {
  abrir: (data: any) => api.post('/caixa/abrir', data),
  fechar: (caixa_id: number, data: any) =>
    api.post(`/caixa/fechar/${caixa_id}`, data),
  aberto: () => api.get('/caixa/aberto'),
  resumoDiario: (data?: string) =>
    api.get(`/caixa/resumo-diario${data ? `?data=${data}` : ''}`),
};

/* ─── Relatórios ─── */
export const relatoriosService = {
  auditoria: (params?: { acao?: string; usuario_id?: number; entidade_tipo?: string; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    if (params?.acao) query.set('acao', params.acao);
    if (params?.usuario_id) query.set('usuario_id', String(params.usuario_id));
    if (params?.entidade_tipo) query.set('entidade_tipo', params.entidade_tipo);
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    const qs = query.toString();
    return api.get(`/relatorios/auditoria${qs ? `?${qs}` : ''}`);
  },
  acoesAuditoria: () => api.get('/relatorios/auditoria/acoes'),
  dashboardExecutivo: () => api.get('/relatorios/dashboard-executivo'),
  listarAlertasConfig: () => api.get('/relatorios/alertas/config'),
  criarAlertaConfig: (data: any) => api.post('/relatorios/alertas/config', data),
  atualizarAlertaConfig: (config_id: number, data: any) =>
    api.put(`/relatorios/alertas/config/${config_id}`, data),
  historicoAlertas: (limit = 50) =>
    api.get(`/relatorios/alertas/historico?limit=${limit}`),
};

/* ─── Financeiro ─── */
function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export const financeiroService = {
  carregarPainel: async (): Promise<import('../types').FinanceiroData> => {
    const hoje = new Date();
    const ontem = new Date(hoje); ontem.setDate(ontem.getDate() - 1);
    const semana = new Date(hoje); semana.setDate(semana.getDate() - 7);

    const hojeStr = fmtDate(hoje);
    const ontemStr = fmtDate(ontem);
    const semanaStr = fmtDate(semana);

    const [execRes, cmvRes, caixaRes, pagRes, hojeRes, ontemRes, semanaRes] = await Promise.all([
      relatoriosService.dashboardExecutivo(),
      cmvService.dashboard(),
      caixaService.aberto(),
      pagamentoService.listar(),
      caixaService.resumoDiario(hojeStr),
      caixaService.resumoDiario(ontemStr),
      caixaService.resumoDiario(semanaStr),
    ]);

    const indicadores = execRes.data.indicadores || {};
    const cmvData = cmvRes.data?.resumo || cmvRes.data || {};
    const caixaAberto = caixaRes.data?.caixa_aberto ? caixaRes.data.caixa : null;
    const hojeData = hojeRes.data || {};
    const ontemData = ontemRes.data || {};
    const semanaData = semanaRes.data || {};

    const receitaHoje = hojeData.receita_total || 0;
    const receitaMes = cmvData.receita_mes || indicadores.receita_mes || 0;
    const custoMes = cmvData.custo_mes || 0;
    const cmvPct = cmvData.cmv_percentual || 0;

    // Agrupar pagamentos por forma
    const pagamentos = pagRes.data || [];
    const totalPag = pagamentos.reduce((s: number, p: any) => s + p.valor, 0) || 1;
    const formaMap: Record<string, number> = {};
    pagamentos.forEach((p: any) => {
      formaMap[p.forma_pagamento] = (formaMap[p.forma_pagamento] || 0) + p.valor;
    });
    const pagamentosPorForma = Object.entries(formaMap).map(([forma, valor]) => ({
      forma,
      valor: valor as number,
      percentual: Math.round((valor as number) / totalPag * 100),
    }));

    // Comparação
    const receitaOntem = ontemData.receita_total || 0;
    const receitaSemana = semanaData.receita_total || 0;

    // Projeção do mês
    const diasTotal = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
    const diasConcluidos = hoje.getDate();
    const pctConcluido = Math.round((diasConcluidos / diasTotal) * 100);
    const receitaProjetada = diasConcluidos > 0 ? Math.round((receitaMes / diasConcluidos) * diasTotal) : 0;

    // CMV interpretação
    let cmvInterpretacao = 'Bom';
    if (cmvPct < 25) cmvInterpretacao = 'Excelente';
    else if (cmvPct < 35) cmvInterpretacao = 'Bom';
    else if (cmvPct < 45) cmvInterpretacao = 'Atenção';
    else cmvInterpretacao = 'Crítico';

    // Ticket médio
    const totalItens = hojeData.total_itens_vendidos || 0;
    const ticketMedio = totalItens > 0 ? receitaHoje / totalItens : 0;

    // Faturamento do turno (caixa ativo)
    const receitaTurno = caixaAberto
      ? (caixaAberto as any).receita_parcial || hojeData.receita_total || 0
      : 0;

    return {
      receitaHoje,
      receitaMes,
      receitaTurno,
      cmvPercentual: cmvPct,
      custoMes,
      lucroEstimado: receitaMes - custoMes,
      ticketMedio,
      totalPedidosHoje: hojeData.total_pedidos || 0,
      caixaAtivo: caixaAberto,
      receitaUltimosDias: execRes.data.receita_ultimos_dias || [],
      pagamentosPorForma,
      ultimasMovimentacoes: execRes.data.ultimas_movimentacoes || [],
      cmvInterpretacao,
      comparacao: {
        ontem: receitaOntem,
        semanaPassada: receitaSemana,
        variacaoOntem: receitaOntem > 0 ? Math.round((receitaHoje - receitaOntem) / receitaOntem * 100) : 0,
        variacaoSemana: receitaSemana > 0 ? Math.round((receitaHoje - receitaSemana) / receitaSemana * 100) : 0,
      },
      projecaoMes: {
        diasConcluidos,
        diasTotal,
        percentualConcluido: pctConcluido,
        receitaProjetada,
      },
    };
  },
};

/* ─── Admin ─── */
export const adminService = {
  health: () => api.get('/admin/health'),
  healthDb: () => api.get('/admin/health/db'),
  healthEnhanced: () => api.get('/admin/health/enhanced'),
  metrics: () => api.get('/admin/metrics'),
  logs: (lines = 50) => api.get(`/admin/logs?lines=${lines}`),
  setLogLevel: (level: string) => api.post(`/admin/logs/level?level=${level}`),
  getPrinterConfig: () => api.get('/admin/printer-config'),
  updatePrinterConfig: (data: import('../types').PrinterConfigUpdate) => api.put('/admin/printer-config', data),
  testPrinter: (data: import('../types').PrinterConfig) =>
    api.post('/admin/printer-test', {
      tipo: data.tipo,
      host: data.host,
      porta: data.porta,
      baud_rate: data.baud_rate,
      timeout: data.timeout,
    }),
};

/* ─── Pedidos (KDS) ─── */
export const pedidosService = {
  listarAtivos: () => api.get('/pedidos/ativos'),
  listarTodos: (status?: string) => api.get('/pedidos/', { params: status ? { status } : {} }),
  criar: (data: import('../types').PedidoCreate) => api.post('/pedidos/', data),
  atualizarStatus: (id: number, status: string) => api.patch(`/pedidos/${id}/status`, { status }),
  atualizar: (id: number, data: import('../types').PedidoUpdate) => api.patch(`/pedidos/${id}`, data),
};

/* ─── Lotes ─── */
export const lotesService = {
  listar: (params?: { insumo_id?: number; proximo_vencimento?: boolean }) => api.get('/lotes/', { params }),
  vencendo: (dias = 30) => api.get(`/lotes/vencendo?dias=${dias}`),
  criar: (data: import('../types').LoteCreate) => api.post('/lotes/', data),
  atualizar: (id: number, data: Partial<import('../types').LoteCreate>) => api.put(`/lotes/${id}`, data),
  excluir: (id: number) => api.delete(`/lotes/${id}`),
};

/* ─── Produto Lotes ─── */
export const produtoLotesService = {
  listar: (params?: { produto_id?: number }) => api.get('/produto-lotes/', { params }),
  vencendo: (dias = 30) => api.get(`/produto-lotes/vencendo?dias=${dias}`),
  criar: (data: import('../types').ProdutoLoteCreate) => api.post('/produto-lotes/', data),
  atualizar: (id: number, data: Partial<import('../types').ProdutoLoteUpdate>) => api.put(`/produto-lotes/${id}`, data),
  excluir: (id: number) => api.delete(`/produto-lotes/${id}`),
};

/* ─── Etiquetas ─── */
export const etiquetasService = {
  listar: (params?: { tipo?: string; lote_id?: number; produto_id?: number; insumo_id?: number }) => api.get('/etiquetas/', { params }),
};

/* ─── Fichas Técnicas ─── */
export const fichasTecnicasService = {
  listar: (params?: import('../types').FichaTecnicaFilter) => api.get('/fichas-tecnicas/', { params }),
  obter: (produtoId: number) => api.get(`/fichas-tecnicas/${produtoId}`),
  categorias: () => api.get('/fichas-tecnicas/categorias/lista'),
  tags: () => api.get('/fichas-tecnicas/tags/lista'),
  alergenos: () => api.get('/fichas-tecnicas/alergenos/lista'),
  atualizar: (produtoId: number, data: { dificuldade?: string; teor_alcoolico?: number; modo_preparo?: string; tipo_copo?: string; guarnicao?: string; tempo_preparo?: number }) =>
    api.put(`/pdv/produtos/${produtoId}/ficha-tecnica`, data),
};

/* ─── Recebimentos ─── */
export const recebimentosService = {
  listar: (params?: { data_inicio?: string; data_fim?: string; fornecedor?: string }) =>
    api.get('/recebimentos/', { params }),
  get: (id: number) => api.get(`/recebimentos/${id}`),
  criar: (data: import('../types').RecebimentoCreate) => api.post('/recebimentos/', data),
  relatorio: (params?: { data_inicio?: string; data_fim?: string }) =>
    api.get('/recebimentos/relatorio', { params }),
};

/* ─── Contagens ─── */
export const contagensService = {
  listar: () => api.get('/contagens/'),
  get: (id: number) => api.get(`/contagens/${id}`),
  criar: (data: import('../types').ContagemCreate) => api.post('/contagens/', data),
  atualizarItem: (contagemId: number, itemId: number, data: { quantidade_contada: number }) =>
    api.put(`/contagens/${contagemId}/itens/${itemId}`, data),
  concluir: (id: number) => api.put(`/contagens/${id}/concluir`),
  aprovar: (id: number) => api.put(`/contagens/${id}/aprovar`),
  relatorio: () => api.get('/contagens/relatorio'),
  historico: () => api.get('/contagens/historico'),
};

/* ─── Produção ─── */
export const producaoService = {
  listar: () => api.get('/producoes/'),
  get: (id: number) => api.get(`/producoes/${id}`),
  criar: (data: import('../types').ProducaoCreate) => api.post('/producoes/', data),
  relatorio: (params?: { data_inicio?: string; data_fim?: string }) =>
    api.get('/producoes/relatorio', { params }),
};

/* ─── Copos ─── */
export const coposService = {
  listar: (params?: { baixo_estoque?: boolean }) => api.get('/copos/', { params }),
  get: (id: number) => api.get(`/copos/${id}`),
  criar: (data: import('../types').CopoCreate) => api.post('/copos/', data),
  atualizar: (id: number, data: Partial<import('../types').CopoCreate>) => api.put(`/copos/${id}`, data),
  excluir: (id: number) => api.delete(`/copos/${id}`),
  entrada: (id: number, quantidade: number) => api.post(`/copos/${id}/entrada`, { quantidade }),
};

/* ─── Materiais ─── */
export const materiaisService = {
  listar: (params?: { baixo_estoque?: boolean }) => api.get('/materiais/', { params }),
  get: (id: number) => api.get(`/materiais/${id}`),
  criar: (data: import('../types').MaterialCreate) => api.post('/materiais/', data),
  atualizar: (id: number, data: Partial<import('../types').MaterialCreate>) => api.put(`/materiais/${id}`, data),
  excluir: (id: number) => api.delete(`/materiais/${id}`),
  entrada: (id: number, quantidade: number) => api.post(`/materiais/${id}/entrada`, { quantidade }),
};

/* ─── Upload ─── */
export const uploadService = {
  uploadImagem: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const token = localStorage.getItem('barize_token') || localStorage.getItem('barize_token');
    const res = await fetch('/api/v1/upload/imagem', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Erro no upload' }));
      throw Object.assign(new Error(err.detail), { response: { data: err, status: res.status } });
    }
    return { data: await res.json() };
  },
};

/* ─── Pagamentos ─── */
export const pagamentoService = {
  listar: () => api.get('/pagamentos/'),
  obter: (id: number) => api.get(`/pagamentos/${id}`),
  criar: (data: { venda_id?: number; forma_pagamento: string; valor: number }) =>
    api.post('/pagamentos/', data),
  listarPorVenda: (venda_id: number) => api.get(`/pagamentos/por-venda/${venda_id}`),
};

/* ─── Copos Quebrados ─── */
/* ─── POP / Checklist ─── */
export const popsService = {
  listar: (params?: { categoria?: string; frequencia?: string; setor?: string }) =>
    api.get('/pops/', { params }),
  criar: (data: any) => api.post('/pops/', data),
  atualizar: (id: number, data: any) => api.put(`/pops/${id}`, data),
  excluir: (id: number) => api.delete(`/pops/${id}`),
  pendentes: () => api.get('/pops/pendentes'),
  executar: (id: number, data?: { realizado_por?: string; observacao?: string }) =>
    api.post(`/pops/${id}/executar`, data || {}),
  relatorio: (params?: { data_inicio?: string; data_fim?: string }) =>
    api.get('/pops/relatorio', { params }),
};

/* ─── Fornecedores ─── */
export const fornecedoresService = {
  listar: (params?: { ativos?: boolean; nome?: string }) => api.get('/fornecedores/', { params }),
  obter: (id: number) => api.get(`/fornecedores/${id}`),
  criar: (data: any) => api.post('/fornecedores/', data),
  atualizar: (id: number, data: any) => api.put(`/fornecedores/${id}`, data),
  excluir: (id: number) => api.delete(`/fornecedores/${id}`),
};

/* ─── Financeiro Plus ─── */
export const financeiroPlusService = {
  vendasPorCategoria: (params?: { data_inicio?: string; data_fim?: string }) =>
    api.get('/financeiro-plus/vendas-por-categoria', { params }),
  dre: (params?: { data_inicio?: string; data_fim?: string; aliquota_impostos?: number }) =>
    api.get('/financeiro-plus/dre', { params }),
  custosFixos: () => api.get('/financeiro-plus/custos-fixos'),
  criarCustoFixo: (data: any) => api.post('/financeiro-plus/custos-fixos', data),
  atualizarCustoFixo: (id: number, data: any) => api.put(`/financeiro-plus/custos-fixos/${id}`, data),
  excluirCustoFixo: (id: number) => api.delete(`/financeiro-plus/custos-fixos/${id}`),
  metas: () => api.get('/financeiro-plus/metas'),
};

/* ─── Análise de Estoque ─── */
export const analiseEstoqueService = {
  giro: (dias = 30) => api.get(`/analise-estoque/giro?dias=${dias}`),
  abc: (dias = 90) => api.get(`/analise-estoque/abc?dias=${dias}`),
  pontoPedido: () => api.get('/analise-estoque/ponto-pedido'),
};

/* ─── Precificação ─── */
export const precificacaoService = {
  listar: (params?: { categoria?: string; cmv_min?: number; cmv_max?: number; apenas_sem_preco?: boolean }) =>
    api.get('/precificacao/', { params }),
  obter: (produtoId: number) => api.get(`/precificacao/${produtoId}`),
  aplicarPreco: (produtoId: number, targetCmv: number) =>
    api.put(`/precificacao/${produtoId}/aplicar?target_cmv=${targetCmv}`),
  categorias: () => api.get('/precificacao/categorias/lista'),
};

export const coposQuebradosService = {
  listar: () => api.get('/copos-quebrados/'),
  resumo: () => api.get('/copos-quebrados/resumo'),
  criar: (data: import('../types').CopoQuebradoCreate) => api.post('/copos-quebrados/', data),
  excluir: (id: number) => api.delete(`/copos-quebrados/${id}`),
};
