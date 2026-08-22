# Regras de Negócio: Sistema PDV para Bares e Restaurantes

Este documento detalha as regras de negócio essenciais para o desenvolvimento de um sistema de Ponto de Venda (PDV) estruturado e profissional, focado no segmento de Food Service (bares e restaurantes).

## 1. Regras de Mesas e Comandas
A gestão do salão precisa ser flexível para o cliente, mas rigorosa para o caixa e para a operação.

* **Transferência e Junção:** Deve ser possível transferir itens específicos ou uma conta inteira para outra mesa ou comanda. O sistema deve recalcular os totais e as taxas de serviço automaticamente após qualquer movimentação.
* **Bloqueio de Fechamento:** O sistema deve impedir o fechamento de uma mesa ou comanda se houver pedidos com status ativo (ex: "em preparo" ou "pronto, aguardando entrega") na cozinha ou bar.
* **Controle de Limite de Crédito:** Comandas individuais devem suportar um limite de consumo pré-definido. Ao atingir o limite, o lançamento de novos itens é bloqueado no terminal ou app do garçom, exigindo liberação via senha gerencial.

## 2. Regras de Pedidos e Preparo
A comunicação entre o salão e a área de produção deve ser automatizada e à prova de falhas.

* **Roteamento Inteligente (KDS/Impressão):** Ao confirmar o pedido, o sistema deve fracioná-lo por praça de preparo. Bebidas devem ir para as telas ou impressoras do bar, pratos quentes para a cozinha e sobremesas para a copa.
* **Hierarquia e Fluxo de Cancelamento:** 
  * Se o status for apenas "Enviado", o garçom pode cancelar o item diretamente.
  * Se o status for "Em Preparo" ou "Pronto", o cancelamento exige senha do gerente e preenchimento de um motivo obrigatório (ex: desperdício, erro do cliente, desistência) para controle de perdas.
* **Comportamento de Modificadores:** Modificadores com acréscimo financeiro (ex: "adicional de bacon") somam ao valor base do produto. Modificadores de instrução (ex: "sem cebola", "bem passado") possuem valor zero, mas devem ter destaque visual nas comandas de produção.

## 3. Controle de Estoque e Fichas Técnicas
A rentabilidade do negócio depende de um controle preciso do uso de insumos.

* **Baixa por Composição (Ficha Técnica):** A venda de um produto final (ex: um drink) deve acionar o desconto automático das quantidades fracionadas dos insumos cadastrados (ex: ml de vodka, fatias de limão, ml de xarope).
* **Comportamento de Estoque Negativo:** O estabelecimento deve poder configurar o sistema para "Bloquear vendas sem estoque" ou "Permitir estoque negativo". Se a segunda opção estiver ativa, o sistema deve permitir a venda, abater o saldo (deixando-o negativo) e gerar alertas de divergência para a gerência fazer os ajustes e cobrar compras não registradas.

## 4. Regras de Fechamento e Pagamento
O fechamento de conta deve ser ágil, seguro e flexível para acomodar as preferências dos clientes.

* **Taxa de Serviço Opcional:** O cálculo da taxa de serviço (geralmente 10% a 13%) deve ser automático sobre o subtotal de itens consumíveis, mas sua remoção, edição ou aplicação de desconto deve estar disponível no painel de pagamento.
* **Pagamentos Parciais e Divisão de Conta:** O sistema deve suportar divisão complexa (rateio por item consumido ou divisão igualitária) e múltiplas formas de pagamento na mesma conta (ex: metade no Pix, metade em cartões). A mesa só terá seu status alterado de "Ocupada/Pagando" para "Livre" quando o saldo pendente for validado como R$ 0,00.
* **Log de Auditoria (Trilha de Ações):** Toda ação crítica de negócio (cancelamentos, reabertura de conta fechada, aplicação de desconto manual, exclusão de taxa de serviço) deve gerar um log inalterável no banco de dados contendo: `Data e Hora`, `Ação Realizada`, `Usuário Solicitante` e `Usuário Aprovador`.
