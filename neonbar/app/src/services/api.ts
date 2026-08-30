import axios from 'axios';
import { enqueueRequest } from './syncService';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
});

api.interceptors.request.use((config: any) => {
  const token = localStorage.getItem('barize_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res: any) => res,
  async (err: any) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('barize_token');
    }
    if (!navigator.onLine && err.config?.method === 'post') {
      await enqueueRequest({
        url: err.config.url,
        method: 'POST',
        body: err.config.data ? JSON.parse(err.config.data) : undefined,
        headers: err.config.headers || {},
      });
    }
    return Promise.reject(err);
  },
);

// ─── Auth ───
export const authService = {
  login: (username: string, senha: string) =>
    api.post('/auth/login', { username, senha }),
  me: () => api.get('/auth/me'),
};

// ─── PDV / Produtos ───
export const pdvService = {
  listarProdutos: () => api.get('/pdv/produtos'),
  categorias: () => api.get('/pdv/categorias'),
  finalizarComanda: (
    itens: { produto_id: number; quantidade: number; nota?: string }[],
    data?: {
      imprimir_comanda?: boolean;
      observacao?: string;
      mesa?: string;
      cliente?: string;
      desconto_percentual?: number;
      desconto_fixo?: number;
      taxa_servico_percentual?: number;
      gorjeta_percentual?: number;
      couver_valor?: number;
      tipo_pedido?: string;
      forma_pagamento?: string;
      vendedor?: string;
    },
  ) =>
    api.post('/pdv/finalizar-comanda', {
      itens,
      imprimir_comanda: data?.imprimir_comanda ?? true,
      observacao: data?.observacao,
      mesa: data?.mesa,
      cliente: data?.cliente,
      desconto_percentual: data?.desconto_percentual ?? 0,
      desconto_fixo: data?.desconto_fixo ?? 0,
      taxa_servico_percentual: data?.taxa_servico_percentual ?? 0,
      gorjeta_percentual: data?.gorjeta_percentual ?? 0,
      couver_valor: data?.couver_valor ?? 0,
      tipo_pedido: data?.tipo_pedido ?? 'consumo',
      forma_pagamento: data?.forma_pagamento ?? 'dinheiro',
      vendedor: data?.vendedor,
    }),
  imprimirCupom: (data: {
    itens?: any[];
    subtotal?: number;
    desconto?: number;
    taxa?: number;
    valor_final?: number;
    forma_pagamento?: string;
    mesa?: string;
    cliente?: string;
    vendedor?: string;
    observacao?: string;
  }) => api.post('/pdv/imprimir-cupom', data),
};

// ─── Pedidos (KDS / Garcom) ───
export const comandasService = {
  listar: () => api.get('/pedidos?status=Aberta'),
  criar: (data: { mesa: string; cliente?: string; itens: any[] }) =>
    api.post('/pedidos/', data),
  atualizarStatus: (id: number, status: string) =>
    api.patch(`/pedidos/${id}/status`, { status }),
};

export const pedidosService = {
  listarAtivos: () => api.get('/pedidos/ativos'),
  listarTodos: (status?: string) =>
    api.get('/pedidos/', { params: { limit: 500, ...(status ? { status } : {}) } }),
  criar: (data: any) => api.post('/pedidos/', data),
  atualizarStatus: (id: number, status: string) =>
    api.patch(`/pedidos/${id}/status`, { status }),
  atualizar: (id: number, data: any) => api.patch(`/pedidos/${id}`, data),
};

// ─── Estoque / Insumos ───
export const estoqueService = {
  listarInsumos: (ativos?: boolean) =>
    api.get(`/estoque/insumos?limit=500${ativos !== undefined ? `&ativos=${ativos}` : ''}`),
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
  movimentacao: (data: any) => api.post('/estoque/movimentacao', data),
  baixoEstoque: () => api.get('/estoque/insumos-baixo-estoque'),
};

// ─── Mesas ───
export const mesasService = {
  listar: (params?: { ativo?: number }) =>
    api.get('/admin/mesas/', { params: { ...params } }),
  criar: (data: { nome: string; local?: string }) =>
    api.post('/admin/mesas/', data),
  atualizar: (id: number, data: { nome?: string; local?: string; ativo?: number }) =>
    api.put(`/admin/mesas/${id}`, data),
  desativar: (id: number) => api.delete(`/admin/mesas/${id}`),
};

// ─── Cardapio (publico) ───
export const cardapioService = {
  listar: () => api.get('/cardapio/'),
};

// ─── Caixa ───
export const caixaService = {
  aberto: () => api.get('/caixa/aberto'),
  resumoDiario: (data?: string) =>
    api.get(`/caixa/resumo-diario${data ? `?data=${data}` : ''}`),
  abrir: (data: any) => api.post('/caixa/abrir', data),
  fechar: (caixa_id: number, data: any) =>
    api.post(`/caixa/fechar/${caixa_id}`, data),
};

// ─── CMV ───
export const cmvService = {
  calcular: (dias = 30, data_inicio?: string, data_fim?: string) => {
    const query = new URLSearchParams({ dias: String(dias) });
    if (data_inicio) query.set('data_inicio', data_inicio);
    if (data_fim) query.set('data_fim', data_fim);
    return api.get(`/cmv/calcular?${query.toString()}`);
  },
  dashboard: () => api.get('/cmv/dashboard'),
};

export const cmvRelatoriosService = {
  produtos: (params?: { data_inicio?: string; data_fim?: string; dias?: number; order_by?: string }) => {
    const query = new URLSearchParams();
    if (params?.data_inicio) query.set('data_inicio', params.data_inicio);
    if (params?.data_fim) query.set('data_fim', params.data_fim);
    if (params?.dias) query.set('dias', String(params.dias));
    if (params?.order_by) query.set('order_by', params.order_by);
    const qs = query.toString();
    return api.get(`/cmv/relatorios/produtos${qs ? `?${qs}` : ''}`);
  },
  categorias: (params?: { data_inicio?: string; data_fim?: string; dias?: number }) => {
    const query = new URLSearchParams();
    if (params?.data_inicio) query.set('data_inicio', params.data_inicio);
    if (params?.data_fim) query.set('data_fim', params.data_fim);
    if (params?.dias) query.set('dias', String(params.dias));
    const qs = query.toString();
    return api.get(`/cmv/relatorios/categorias${qs ? `?${qs}` : ''}`);
  },
  insumos: (params?: { data_inicio?: string; data_fim?: string; dias?: number }) => {
    const query = new URLSearchParams();
    if (params?.data_inicio) query.set('data_inicio', params.data_inicio);
    if (params?.data_fim) query.set('data_fim', params.data_fim);
    if (params?.dias) query.set('dias', String(params.dias));
    const qs = query.toString();
    return api.get(`/cmv/relatorios/insumos${qs ? `?${qs}` : ''}`);
  },
};

// ─── Relatórios ───
export const relatoriosService = {
  dashboardExecutivo: () => api.get('/relatorios/dashboard-executivo'),
};

export const relatoriosAnalyticsService = {
  resumo: (periodo: 'dia' | 'semana' | 'mes') =>
    api.get('/relatorios/analytics/resumo', { params: { periodo } }),
  topProdutos: (periodo: 'dia' | 'semana' | 'mes', limite = 5) =>
    api.get('/relatorios/analytics/top-produtos', { params: { periodo, limite } }),
  desempenhoEquipe: (periodo: 'dia' | 'semana' | 'mes') =>
    api.get('/relatorios/analytics/desempenho-equipe', { params: { periodo } }),
};

// ─── Financeiro ───
export const financeiroService = {
  carregarPainel: async () => {
    const hoje = new Date();
    const hojeStr = hoje.toISOString().slice(0, 10);

    const [cmvRes, caixaRes, hojeRes] = await Promise.all([
      cmvService.dashboard(),
      caixaService.aberto(),
      caixaService.resumoDiario(hojeStr),
    ]);

    const cmvData = cmvRes.data?.resumo || cmvRes.data || {};
    const caixaAberto = caixaRes.data?.caixa_aberto ? caixaRes.data.caixa : null;
    const hojeData = hojeRes.data || {};

    return {
      receitaHoje: hojeData.receita_total || 0,
      receitaMes: cmvData.receita_mes || 0,
      custoMes: cmvData.custo_mes || 0,
      cmvPercentual: cmvData.cmv_percentual || 0,
      lucroEstimado: (cmvData.receita_mes || 0) - (cmvData.custo_mes || 0),
      caixaAtivo: caixaAberto,
      totalPedidosHoje: hojeData.total_pedidos || 0,
    };
  },
};

export const financeiroPlusService = {
  dre: (params?: { data_inicio?: string; data_fim?: string; aliquota_impostos?: number }) =>
    api.get('/financeiro-plus/dre', { params }),
  custosFixos: () => api.get('/financeiro-plus/custos-fixos'),
  metas: () => api.get('/financeiro-plus/metas'),
  vendasPorCategoria: (params?: { data_inicio?: string; data_fim?: string }) =>
    api.get('/financeiro-plus/vendas-por-categoria', { params }),
};

// ─── Fichas Técnicas ───
export const fichasTecnicasService = {
  listar: (params?: any) =>     api.get('/fichas-tecnicas/', { params: { ...params } }),
  categorias: () => api.get('/fichas-tecnicas/categorias/lista'),
};

// ─── Etiquetas ───
export const etiquetasService = {
  listar: (params?: { tipo?: string; lote_id?: number; produto_id?: number }) =>
    api.get('/etiquetas/', { params: { ...params } }),
};

// ─── Precificação ───
export const precificacaoService = {
  listar: (params?: { categoria?: string }) =>
    api.get('/precificacao/', { params: { ...params } }),
  aplicarPreco: (produtoId: number, targetCmv: number) =>
    api.put(`/precificacao/${produtoId}/aplicar?target_cmv=${targetCmv}`),
};

// ─── Análise de Estoque ───
export const analiseEstoqueService = {
  giro: (dias = 30) => api.get(`/analise-estoque/giro?dias=${dias}`),
  abc: (dias = 90) => api.get(`/analise-estoque/abc?dias=${dias}`),
  pontoPedido: () => api.get('/analise-estoque/ponto-pedido'),
};

// ─── Fornecedores ───
export const fornecedoresService = {
  listar: (params?: { ativos?: boolean; nome?: string }) =>
    api.get('/fornecedores/', { params: { ...params } }),
  criar: (data: any) => api.post('/fornecedores/', data),
  atualizar: (id: number, data: any) => api.put(`/fornecedores/${id}`, data),
  excluir: (id: number) => api.delete(`/fornecedores/${id}`),
};

// ─── POPs / Checklist ───
export const popsService = {
  listar: (params?: { categoria?: string; frequencia?: string; setor?: string }) =>
    api.get('/pops/', { params: { ...params } }),
  executar: (id: number, data?: { realizado_por?: string; observacao?: string }) =>
    api.post(`/pops/${id}/executar`, data || {}),
  pendentes: (params?: { categoria?: string; frequencia?: string; setor?: string; fluxo?: string }) =>
    api.get('/pops/pendentes', { params: { ...params } }),
};

// ─── Pagamentos ───
export const pagamentosService = {
  criar: (data: { 
    venda_id?: number; 
    forma_pagamento: string; 
    valor: number;
    valor_servico_pago?: number;
    valor_couvert_pago?: number;
    isencao_servico?: boolean;
    isencao_couvert?: boolean;
    motivo_isencao?: string;
  }) =>
    api.post('/pagamentos/', data),
  listar: () => api.get('/pagamentos/'),
  porVenda: (vendaId: number) => api.get(`/pagamentos/por-venda/${vendaId}`),
};

// ─── Admin ───
export const adminService = {
  health: () => api.get('/admin/health'),
  healthDb: () => api.get('/admin/health/db'),
  healthEnhanced: () => api.get('/admin/health/enhanced'),
  metrics: () => api.get('/admin/metrics'),
};

// ─── Public API ───
export const publicApi = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
});

export const cardapioPublicService = {
  listar: () => publicApi.get('/cardapio/'),
};

export default api;
