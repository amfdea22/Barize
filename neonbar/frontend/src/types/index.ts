/* ─── BARIZE — TypeScript Types ─── */

// ─── Auth ───
export interface LoginRequest {
  username: string;
  senha: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  usuario: Usuario;
}

export interface Usuario {
  id: number;
  username: string;
  nome: string;
  role: UserRole;
  ativo: boolean;
  ultimo_login?: string;
}

export type UserRole = 'admin' | 'gerente' | 'bartender';

// ─── InsumoBaixo (baixo estoque) ───
export interface InsumoBaixo {
  id: number;
  nome: string;
  estoque_atual: number;
  estoque_minimo: number;
  unidade_medida: string;
  diferenca: number;
}

// ─── Insumo ───
export interface Insumo {
  id: number;
  nome: string;
  categoria: string;
  unidade_medida: string;
  estoque_atual: number;
  estoque_minimo: number;
  custo_unitario: number;
  deleted_at?: string;
  created_at: string;
}

export interface InsumoCreate {
  nome: string;
  categoria: string;
  unidade_medida: string;
  estoque_atual?: number;
  estoque_minimo?: number;
  custo_unitario: number;
}

// ─── Produto ───

export interface ReceitaItem {
  insumo_id: number;
  nome: string;
  quantidade: number;
  unidade_medida: string;
  custo_unitario: number;
}

export interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  preco_venda: number;
  categoria: string;
  codigo_barras?: string;
  imagem?: string;
  foto_url?: string;
  ingredientes?: string;
  ativo: boolean;
  receita: ReceitaItem[];
  tempo_preparo?: number;
}

export interface ProdutoLote {
  id: number;
  produto_id: number;
  codigo_lote: string;
  data_fabricacao?: string;
  data_validade?: string;
  quantidade: number;
  deleted_at?: string;
  created_at?: string;
  produto?: {
    id: number;
    nome: string;
    categoria?: string;
  };
}

export interface ProdutoLoteCreate {
  produto_id: number;
  codigo_lote: string;
  data_fabricacao?: string;
  data_validade?: string;
  quantidade: number;
}

export interface ProdutoLoteUpdate {
  codigo_lote?: string;
  data_fabricacao?: string;
  data_validade?: string;
  quantidade?: number;
}

export interface EtiquetaItem {
  tipo: 'insumo' | 'produto';
  item_id: number;
  nome: string;
  categoria?: string;
  codigo_lote: string;
  data_validade?: string;
  data_fabricacao?: string;
  quantidade: number;
  unidade_medida?: string;
  codigo_barras?: string;
  dias_para_vencer?: number;
}

// ─── Movimentação ───
export interface Movimentacao {
  id: number;
  insumo_id: number;
  produto_id?: number;
  tipo: MovimentacaoTipo;
  quantidade: number;
  quantidade_produto?: number;
  custo_no_momento: number;
  motivo?: string;
  created_at: string;
}

export type MovimentacaoTipo = 'COMPRA' | 'VENDA' | 'PERDA' | 'AJUSTE' | 'TRANSFERENCIA';

// ─── Pagamento ───
export interface Pagamento {
  id: number;
  venda_id?: number;
  forma_pagamento: string;
  valor: number;
  created_at: string;
}

// ─── CMV ───
export interface CMVResult {
  periodo_inicio: string;
  periodo_fim: string;
  custo_total: number;
  receita_total: number;
  cmv_percentual: number;
  interpretacao?: string;
}

// ─── Caixa ───
export interface Caixa {
  id: number;
  usuario_id: number;
  usuario_nome?: string;
  saldo_inicial: number;
  saldo_final?: number;
  receita_total?: number;
  aberto_em: string;
  fechado_em?: string;
  status: 'aberto' | 'fechado';
}

export interface AbrirCaixaRequest {
  usuario_id: number;
  saldo_inicial: number;
}

export interface FecharCaixaRequest {
  valores_declarados: {
    dinheiro: number;
    cartao_credito: number;
    pix: number;
  };
}

// ─── Auditoria ───
export interface AuditLog {
  id: number;
  usuario_id: number;
  usuario_nome?: string;
  acao: string;
  entidade_tipo?: string;
  entidade_id?: number;
  detalhes?: string;
  ip_address?: string;
  created_at: string;
}

// ─── Dashboard ───
export interface DashboardData {
  indicadores: {
    total_insumos: number;
    total_produtos: number;
    receita_mes: number;
    cmv_mes: number;
    cmv_percentual: number;
  interpretacao?: string;
    caixa_aberto: boolean;
    alertas_estoque: number;
    insumos_criticos?: number;
  };
  ultimas_movimentacoes: Movimentacao[];
  receita_ultimos_dias: { dia: string; receita: number }[];
}

// ─── Financeiro ───
export interface FinanceiroData {
  receitaHoje: number;
  receitaMes: number;
  receitaTurno: number;
  cmvPercentual: number;
  custoMes: number;
  lucroEstimado: number;
  ticketMedio: number;
  totalPedidosHoje: number;
  caixaAtivo: { id: number; saldo_inicial: number; data_abertura: string } | null;
  receitaUltimosDias: { dia: string; receita: number }[];
  pagamentosPorForma: { forma: string; valor: number; percentual: number }[];
  ultimasMovimentacoes: Movimentacao[];
  cmvInterpretacao: string;
  comparacao: {
    ontem: number;
    semanaPassada: number;
    variacaoOntem: number;
    variacaoSemana: number;
  };
  projecaoMes: {
    diasConcluidos: number;
    diasTotal: number;
    percentualConcluido: number;
    receitaProjetada: number;
  };
}

// ─── Health ───
export interface HealthCheck {
  status: string;
  version: string;
  database: string;
  uptime: number;
}

// ─── API Error ───
export interface ApiError {
  detail: string;
}

// ─── Printer Config ───
export type PrinterType = 'network' | 'usb' | 'serial';

export interface PrinterConfig {
  id: number;
  tipo: PrinterType;
  host: string | null;
  porta: number | null;
  baud_rate: number | null;
  timeout: number | null;
  ativo: boolean;
}

export interface PrinterConfigUpdate {
  tipo?: PrinterType;
  host?: string;
  porta?: number;
  baud_rate?: number;
  timeout?: number;
  ativo?: boolean;
}

export interface PrinterTestResult {
  sucesso: boolean;
  mensagem: string;
}

// ─── Pedido (KDS) ───
export type PedidoStatus = 'Novo' | 'Preparando' | 'Pronto' | 'Entregue';

export interface PedidoItem {
  nome: string;
  quantidade: number;
  preco: number;
  observacao?: string;
}

export interface Pedido {
  id: number;
  mesa?: string;
  cliente?: string;
  status: PedidoStatus;
  itens: PedidoItem[];
  total: number;
  observacao?: string;
  created_at?: string;
  updated_at?: string;
  iniciado_em?: string;
  pronto_em?: string;
  tempo_preparo_estimado?: number;
}

export interface PedidoCreate {
  mesa?: string;
  cliente?: string;
  itens: { nome: string; quantidade: number; preco: number; observacao?: string }[];
  observacao?: string;
}

export interface PedidoUpdate {
  mesa?: string;
  cliente?: string;
  observacao?: string;
  itens?: { nome: string; quantidade: number; preco: number; observacao?: string }[];
  tempo_preparo_estimado?: number;
}

// ─── Lote ───
export interface Lote {
  id: number;
  insumo_id: number;
  codigo_lote: string;
  data_fabricacao?: string;
  data_validade?: string;
  quantidade_inicial: number;
  quantidade_atual: number;
  custo_unitario: number;
  created_at: string;
}

export interface LoteCreate {
  insumo_id: number;
  codigo_lote: string;
  data_fabricacao?: string;
  data_validade?: string;
  quantidade_inicial: number;
  custo_unitario?: number;
}

// ─── Recebimento ───
export interface ItemRecebimento {
  id: number;
  recebimento_id: number;
  insumo_id: number;
  insumo_nome?: string;
  lote_id?: number;
  quantidade: number;
  custo_unitario: number;
  total: number;
  data_validade?: string;
}

export interface Recebimento {
  id: number;
  nota_fiscal?: string;
  fornecedor_nome?: string;
  data_recebimento: string;
  observacao?: string;
  total_itens: number;
  total_valor: number;
  created_by?: string;
  created_at: string;
  itens?: ItemRecebimento[];
}

export interface RecebimentoCreate {
  nota_fiscal?: string;
  fornecedor_nome?: string;
  data_recebimento: string;
  observacao?: string;
  itens: {
    insumo_id: number;
    quantidade: number;
    custo_unitario: number;
    data_validade?: string;
    lote_codigo?: string;
  }[];
}

// ─── Contagem ───
export interface ItemContagem {
  id: number;
  contagem_id: number;
  insumo_id: number;
  insumo_nome?: string;
  quantidade_sistema: number;
  quantidade_contada: number;
  diferenca: number;
  status: string;
  observacao?: string;
}

export interface Contagem {
  id: number;
  data_contagem: string;
  status: string;
  observacao?: string;
  created_by?: string;
  aprovado_por?: string;
  total_divergencias: number;
  created_at: string;
  itens?: ItemContagem[];
}

export interface ContagemCreate {
  data_contagem: string;
  observacao?: string;
}

// ─── Produção ───
export interface ItemProducao {
  id: number;
  producao_id: number;
  produto_id: number;
  produto_nome?: string;
  quantidade_produzida: number;
  custo_unitario: number;
  custo_total: number;
}

export interface Producao {
  id: number;
  data_producao: string;
  observacao?: string;
  custo_total: number;
  created_by?: string;
  created_at: string;
  itens?: ItemProducao[];
}

export interface ProducaoCreate {
  data_producao: string;
  observacao?: string;
  itens: { produto_id: number; quantidade_produzida: number }[];
}

// ─── Copo ───
export interface Copo {
  id: number;
  nome: string;
  tipo?: string;
  capacidade_ml?: number;
  estoque_atual: number;
  estoque_minimo: number;
  custo_unitario: number;
  created_at: string;
}

export interface CopoCreate {
  nome: string;
  tipo?: string;
  capacidade_ml?: number;
  estoque_atual?: number;
  estoque_minimo?: number;
  custo_unitario?: number;
}

// ─── Material ───
export interface Material {
  id: number;
  nome: string;
  categoria?: string;
  estoque_atual: number;
  estoque_minimo: number;
  custo_unitario: number;
  created_at: string;
}

export interface MaterialCreate {
  nome: string;
  categoria?: string;
  estoque_atual?: number;
  estoque_minimo?: number;
  custo_unitario?: number;
}

// ─── Copo Quebrado ───
export interface CopoQuebrado {
  id: number;
  copo_id: number;
  copo_nome?: string;
  quantidade: number;
  motivo?: string;
  valor_total: number;
  registrado_por?: string;
  created_at: string;
}

export interface CopoQuebradoCreate {
  copo_id: number;
  quantidade: number;
  motivo?: string;
}

// ─── Ficha Técnica ───
export interface PreparoItem {
  ordem: number;
  descricao: string;
  tempo_segundos?: number;
  tecnica?: string;
  observacao?: string;
}

export interface ArmazenamentoItem {
  tipo: string;
  temperatura_min?: number;
  temperatura_max?: number;
  tempo_maximo_dias?: number;
  observacao?: string;
}

export interface HarmonizacaoItem {
  descricao: string;
  tipo?: string;
}

export interface FichaTecnicaItem {
  produto_id: number;
  nome: string;
  categoria?: string;
  descricao?: string;
  preco_venda: number;
  codigo_barras?: string;
  foto_url?: string;
  imagem?: string;
  teor_alcoolico?: number;
  dificuldade?: string;
  custo_total?: number;
  margem_lucro?: number;
  ingredientes: Array<{
    insumo_id: number;
    nome: string;
    quantidade: number;
    unidade_medida: string;
    custo_unitario: number;
  }>;
  preparo: PreparoItem[];
  armazenamento: ArmazenamentoItem[];
  harmonizacao: HarmonizacaoItem[];
  calorias_estimadas?: number;
  carboidratos_g?: number;
  proteinas_g?: number;
  gorduras_g?: number;
  tags: string[];
  alergenos: string[];
  criado_em?: string;
  atualizado_em?: string;
  versao: number;
}

// ─── Fornecedor ───
export interface Fornecedor {
  id: number;
  nome: string;
  cnpj?: string;
  contato?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  prazo_entrega_dias?: number;
  observacao?: string;
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
}

// ─── Custo Fixo ───
export interface CustoFixo {
  id: number;
  nome: string;
  categoria?: string;
  valor: number;
  dia_vencimento?: number;
  observacao?: string;
  ativo: boolean;
}

// ─── DRE ───
export interface DRE {
  periodo: { data_inicio: string; data_fim: string };
  receita_bruta: number;
  deducoes_impostos: number;
  aliquota_impostos_pct: number;
  receita_liquida: number;
  cmv: number;
  custos_fixos: number;
  lucro_operacional: number;
  margem_liquida: number;
}

export interface VendaCategoria {
  categoria: string;
  total_vendas: number;
  quantidade_total: number;
  receita: number;
  percentual: number;
}

export interface VendasPorCategoria {
  periodo: { data_inicio: string; data_fim: string };
  total_receita: number;
  categorias: VendaCategoria[];
}

export interface MetasFinanceiras {
  mes: string;
  metas_padrao: Record<string, { meta: number; realizado: number }>;
}

// ─── POP ───
export interface POP {
  id: number;
  titulo: string;
  descricao?: string;
  categoria?: string;
  passos: Array<{ ordem: number; descricao: string; tempo_estimado?: number }>;
  frequencia: string;
  setor?: string;
  ativo: boolean;
  created_at?: string;
}

export interface POPPendente {
  id: number;
  titulo: string;
  descricao?: string;
  categoria?: string;
  passos: Array<{ ordem: number; descricao: string; tempo_estimado?: number }>;
  frequencia: string;
  setor?: string;
  concluido_hoje: boolean;
  ultima_execucao?: string;
  ultimo_status?: string;
}

// ─── Precificação ───
export interface PrecificacaoItem {
  produto_id: number;
  nome: string;
  categoria?: string;
  preco_venda: number;
  custo_dose: number;
  cmv_atual: number;
  margem_atual: number;
  preco_sugerido_25: number;
  preco_sugerido_30: number;
  preco_sugerido_35: number;
  preco_sugerido_40: number;
  preco_sugerido_atual?: number;
  cmv_25: number;
  cmv_30: number;
  cmv_35: number;
  cmv_40: number;
  possui_receita: boolean;
  foto_url?: string;
  imagem?: string;
}

export interface CenarioPrecificacao {
  margem_desejada: number;
  preco_sugerido: number;
  cmv_resultante: number;
  lucro_por_dose: number;
  diferenca_preco_atual: number;
}

export interface PrecificacaoDetalhe {
  produto_id: number;
  nome: string;
  categoria?: string;
  preco_venda: number;
  custo_dose: number;
  cmv_atual: number;
  margem_atual: number;
  preco_sugerido_atual?: number;
  ingredientes: Array<{
    insumo_id: number;
    nome: string;
    quantidade: number;
    unidade_medida: string;
    custo_unitario: number;
    custo_parcial: number;
    percentual_custo: number;
  }>;
  cenarios: CenarioPrecificacao[];
  foto_url?: string;
  imagem?: string;
}

// ─── Análise de Estoque ───
export interface GiroEstoque {
  periodo: { data_inicio: string; data_fim: string; dias: number };
  custo_vendas_periodo: number;
  estoque_medio_valor: number;
  giro_estoque: number;
  dias_cobertura: number;
  total_insumos_ativos: number;
  interpretacao: string;
}

export interface ItemABC {
  insumo_id: number;
  nome: string;
  categoria?: string;
  custo_unitario: number;
  estoque_atual: number;
  valor_consumo: number;
  quantidade_consumida: number;
  percentual: number;
  percentual_acumulado: number;
  classificacao: 'A' | 'B' | 'C';
}

export interface CurvaABC {
  periodo: { data_inicio: string; data_fim: string };
  total_valor_consumo: number;
  itens: ItemABC[];
  resumo: Record<string, { valor: number; percentual: number; itens: number }>;
}

export interface ItemPontoPedido {
  insumo_id: number;
  nome: string;
  categoria?: string;
  unidade_medida: string;
  estoque_atual: number;
  estoque_minimo: number;
  consumo_diario_medio: number;
  consumo_30d: number;
  lead_time_dias: number;
  estoque_seguranca: number;
  ponto_pedido: number;
  quantidade_repor: number;
  dias_ate_zerar: number;
  status: 'urgente' | 'repor_em_breve' | 'ok';
}

export interface PontoPedido {
  data_referencia: string;
  lead_time_padrao_dias: number;
  itens: ItemPontoPedido[];
  resumo: { total: number; urgentes: number; repor_em_breve: number; ok: number };
}

export interface FichaTecnicaFilter {
  categoria?: string;
  tag?: string;
  alergeno_excluir?: string;
  dificuldade?: string;
  teor_alcoolico_max?: number;
  preco_max?: number;
  apenas_ativos?: boolean;
}


