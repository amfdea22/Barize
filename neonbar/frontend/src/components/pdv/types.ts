import type { Produto } from '../../types';

export interface CartItem {
  produto: Produto;
  quantidade: number;
}

export type FormaPagamento = 'dinheiro' | 'cartao_credito' | 'cartao_debito' | 'pix';

export interface PagamentoPayload {
  forma_pagamento: FormaPagamento;
  valor_recebido: number;
  troco: number;
  parcelas: number;
  desconto_percentual: number;
  taxa_servico_percentual: number;
  mesa: string;
  cliente: string;
  vendedor: string;
  observacao: string;
  imprimir_comanda: boolean;
}

export const FORMAS_PAGAMENTO: { key: FormaPagamento; label: string }[] = [
  { key: 'dinheiro', label: 'Dinheiro' },
  { key: 'cartao_credito', label: 'Crédito' },
  { key: 'cartao_debito', label: 'Débito' },
  { key: 'pix', label: 'Pix' },
];
