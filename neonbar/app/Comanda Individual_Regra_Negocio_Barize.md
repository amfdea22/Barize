# 🍻 Barize & Barize Web
## Regra de Negócio: Fechamento de Conta Individual com Opt-in/Opt-out de Taxas

Este documento define as regras e os fluxos de sistema para o fechamento de contas por **Cliente (Comanda Individual)** ao invés de apenas por **Mesa**, permitindo a flexibilidade de cobrar ou isentar a **Taxa de Serviço (10%)** e o **Couvert Artístico** de forma individualizada.

---

## 1. Objetivo
Proporcionar uma experiência de pagamento justa e flexível para os clientes do **Barize**, garantindo que o garçom ou operador do caixa possa, no momento do fechamento da conta de um único cliente (em uma mesa compartilhada ou comanda individual), remover a taxa de serviço (10%) e/ou o couvert artístico sem afetar a conta dos demais membros da mesa.

---

## 2. Lógica Base de Cálculo

Quando a conta está sendo fechada por cliente, o sistema deve tratar o consumo da seguinte forma:

1. **Subtotal do Cliente (Consumo):** Soma de todos os itens consumidos exclusivamente por este cliente + a fração de itens divididos com a mesa (ex: uma porção de batata dividida por 3).
2. **Taxa de Serviço (10%):** Calculada estritamente sobre o **Subtotal do Cliente**.
3. **Couvert Artístico:** Valor fixo por pessoa configurado no sistema (ou na mesa).

### 2.1 A Regra de Opcionalidade (Toggle)
No momento do checkout do cliente, o sistema (App Garçom/Caixa ou Web) deve apresentar **dois seletores (toggles/checkboxes)**, marcados como "Cobrar" por padrão:

- [x] Cobrar Taxa de Serviço (10% sobre R$ XX,XX)
- [x] Cobrar Couvert Artístico (R$ XX,XX)

---

## 3. Cenários e Comportamento do Sistema

### Cenário A: Cliente paga Consumo + 10% + Couvert (Fluxo Ideal)
- **Ação:** O garçom seleciona o cliente para fechamento. Ambas as taxas estão marcadas.
- **Cálculo:** Subtotal do Cliente + (Subtotal * 0.10) + Couvert.
- **Efeito na Mesa:** O cliente é marcado como "Pago" e seu consumo, sua parte dos 10% e seu couvert são subtraídos do saldo total da mesa.

### Cenário B: Cliente recusa o pagamento dos 10%
- **Ação:** O garçom desmarca a opção `[ ] Cobrar Taxa de Serviço`.
- **Cálculo:** O valor final a ser cobrado será apenas (Subtotal do Cliente + Couvert).
- **Regra Crítica:** O valor de 10% recusado por este cliente **NÃO DEVE** ser redistribuído ou repassado para os outros clientes da mesa. Ele é classificado como "Isenção de Taxa" e abatido da expectativa de gorjeta total da mesa.

### Cenário C: Cliente é isento do Couvert (ex: Chegou depois do show)
- **Ação:** O garçom desmarca a opção `[ ] Cobrar Couvert Artístico`.
- **Cálculo:** O valor final será (Subtotal do Cliente + 10% do Subtotal).
- **Regra Crítica:** Assim como os 10%, o couvert não cobrado deste cliente **não deve** ser cobrado dos demais. A isenção é estritamente pessoal.

---

## 4. Requisitos de Interface (UI/UX) - App e Web

1. **Tela de Fechamento de Conta (Split/Individual):**
   - Mostrar o nome/número da comanda do cliente no topo.
   - Lista rápida dos itens (ou fração de itens) consumidos.
   - **Área de Resumo de Valores:**
     - Subtotal: R$ 50,00
     - 🎚️ Taxa de Serviço (10%): R$ 5,00 *(Botão de liga/desliga)*
     - 🎚️ Couvert Artístico: R$ 15,00 *(Botão de liga/desliga)*
     - **Total a Pagar: R$ 70,00** *(Atualiza em tempo real ao mexer nos botões)*

2. **Motivo da Isenção (Opcional, mas recomendado para controle):**
   - Se o operador desativar os 10% ou o couvert, abrir um pequeno *dropdown* ou solicitar um motivo rápido (ex: "Insatisfação", "Não assistiu ao show", "Gerência liberou"). Isso gera relatórios valiosos para os donos de bares.

---

## 5. Diretrizes de Backend e Banco de Dados

- **Entidade `Pagamento` ou `Transacao`:** Deve ter colunas separadas para `valor_consumo`, `valor_servico_pago`, `valor_couvert_pago`. 
- **Entidade `Isenção` (Log):** Se uma taxa for recusada, registrar o ID do cliente, ID da mesa, ID do operador/garçom, qual taxa foi isentada e o valor da isenção (para fins de auditoria e comissão de garçons).
- **Integridade da Mesa:** A mesa só pode ser fechada (`status = 'fechada'`) quando todos os clientes associados tiverem fechado suas contas. O saldo remanescente da mesa (se houver divergência) deve alertar o caixa antes do encerramento total.

---

## 6. Passo a Passo para Implementação (Roadmap)

1. **Backend:** 
   - Criar endpoints de simulação de checkout por ID de Cliente/Comanda, aceitando flags booleanas `chargeServiceFee` e `chargeCover`.
   - Ajustar o cálculo do extrato da mesa para deduzir corretamente os itens já pagos isoladamente e as taxas não cobradas (para não virar saldo devedor na mesa).
2. **Frontend (App Garçom/Barize Web):**
   - Desenvolver o componente de Toggles na tela de pagamento.
   - Garantir a reatividade: O valor total deve mudar instantaneamente quando o toggle é clicado.
3. **Analytics (Dashboard):**
   - Criar um relatório para o dono do bar: "Taxa de Aceitação de 10%" e "Isenções de Couvert".

---
*Documento gerado para a equipe de Produto e Engenharia do Barize.*
