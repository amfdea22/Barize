## Visão Geral do Produto
- Descrição concisa  
  Módulo web de controle de estoque para bares, cobrindo entrada de compras com estágios (pendente → recebido), ajuste de valores reais de recebimento, múltiplos estoques (depósitos/bares/geladeiras), fichas técnicas de produtos, requisições internas de transferência, integração automática com sistema de vendas (API), sincronização de nomenclaturas, kardex (registro completo de movimentações), controle de CMV (custo da mercadoria vendida), lista de compras automática baseada em estoque mínimo e relatórios de movimentação/valorização.

- Público-alvo  
  Proprietários de bares, gerentes operacionais, estoquistas, compradores, contadores e integradores de POS/ERP em estabelecimentos de alimentação e bebidas.

- Proposta de valor única  
  Fornecer um sistema de controle de estoque orientado às necessidades de bares que une rastreabilidade completa (kardex + auditoria), flexibilidade multi-depósito, integração em tempo real com vendas e ferramentas para reduzir perdas e otimizar compras com uma UX ágil e confiável.

## Requisitos Funcionais

Lista de requisitos principais organizada por MoSCoW.

Must have (essencial)
- Cadastro e gerenciamento de produtos (nome, SKU, unidade, fator de conversão, custo padrão).
- Estoques múltiplos por local (ex.: Bar A, Cozinha, Geladeira 1).
- Entrada de compras com status: Pendente (pedido), Recebido parcial, Recebido total.  
- Ao marcar como Recebido: registrar quantidades recebidas e permitir alterar valores unitários reais (preço do recebimento).
- Registro de movimentações (kardex) por produto com data, origem/destino, tipo (entrada compra, saída venda, transferência, ajuste), quantidade, custo unitário e saldo pós-movimento.
- Requisições internas de transferência entre estoques com aprovação e workflow (solicitante → aprovador → execução).
- Integração via API para ingestão de vendas do POS (webhooks e/ou polling), com mapeamento para SKUs do estoque.
- Mecanismo de sincronização/normalização de nomes entre POS e sistema (manual + regras automáticas).
- Cálculo de CMV (Custo da Mercadoria Vendida) por período, com métodos: FIFO e Custo Médio Ponderado.
- Lista de compras sugerida baseada em estoque mínimo por produto, lead time e consumo médio.
- Relatórios: movimentações por período, relatório de recebimentos, relatórios de custo e CMV, ajuste de inventário.
- Auditoria / log de alterações (quem, quando, antes/depois) para entradas, alterações de preços e transferências.
- Permissões por função (Admin, Estoquista, Comprador, Leitura somente).
- Import/Export CSV/Excel para produtos, compras e kardex.
- Notificações (toasts) e alertas para estoques abaixo do mínimo.

Should have (importante)
- Fichas técnicas (receita/consumo por porção) vinculadas a produtos e cálculo automático do consumo de insumos por venda.
- Recebimento parcial com reconciliação de valores e possibilidade de recalcular valuation (impacto no estoque e CMV).
- Workflow de aprovação de compras e registro de notas fiscais (NF).
- Dashboard com KPIs: giro de estoque, estoque valorizado, CMV por período, consumo por produto.
- Busca avançada com filtros (data, produto, tipo movimento, estoque, fornecedor).
- Undo limitado para operações recentes (ex.: desfazer lançamento em 5 minutos).
- Controle de lotes e validade (opcional para bebidas empacotadas e perecíveis).
- Fila de sincronização e retry para integrações externas.

Could have (desejável)
- Suporte offline/mobile (PWA) para uso em tablets durante inventário.
- Escaneamento de código de barras/QR para entrada e transferência.
- Sugestões de compra baseadas em previsões (ML simples).
- Integração com fornecedores (pedidos eletrônicos).
- Painel multi-unidade com consolidação de estoques por grupo.
- Visualização por mapas de calor de consumo por horário/dia.
- Exportação automática de documentos fiscais e integração com ERPs fiscais locais.

Won't have (nesta versão)
- Gestão completa de produção (BOM complexos para fábricas).
- Blockchain para rastreabilidade de fornecedores.
- Módulo financeiro/contábil completo (apenas exportação para ERPs/contadores).

## Histórias de Usuário

Formato: Como [tipo de usuário], eu quero [ação] para [benefício]

- Como Administrador, eu quero cadastrar múltiplos estoques para refletir áreas do bar para ter controle por local.
- Como Comprador, eu quero criar um pedido de compra (status Pendente) para registrar intenção de aquisição junto a fornecedores.
- Como Estoquista, eu quero marcar um pedido como Recebido (total/parcelado) e ajustar preços reais para atualizar valuation do estoque.
- Como Estoquista, eu quero ver o kardex de um produto para auditar todas as movimentações e saldos.
- Como Garçom/Gerente de Salão, eu quero que as vendas do POS cheguem automaticamente ao sistema para reduzir o trabalho manual e manter o estoque atualizado.
- Como Administrador, eu quero mapear nomes de produtos do POS para SKUs do sistema para evitar discrepâncias de inventário.
- Como Estoquista, eu quero solicitar transferência entre depósitos para repor o bar e ter um aprovador confirmar antes da execução.
- Como Contador, eu quero relatórios de CMV por período para contabilizar custo de vendas corretamente.
- Como Comprador, eu quero uma lista de compras sugerida baseada no estoque mínimo e consumo médio para planejar pedidos.
- Como Auditor, eu quero logs detalhados de quem alterou preços de recebimento e quando para conformidade fiscal.
- Como Estoquista, eu quero registrar lotes e validade para produtos perecíveis para evitar perdas.

## Estrutura de Páginas/Seções

Hierarquia de navegação (principal)
- Dashboard
- Estoques
  - Visão geral por local
  - Inventário por produto
  - Transferências internas
- Produtos
  - Lista de produtos
  - Ficha técnica (receitas/insumos)
  - Gestão de SKUs e mapeamento POS
- Compras
  - Pedidos (Pendente / Recebido / Histórico)
  - Recebimento (formulário de ajuste)
  - Fornecedores
- Kardex e Movimentações
  - Kardex por produto
  - Histórico de movimentos e filtros avançados
- CMV e Relatórios
  - Relatórios de CMV
  - Relatórios financeiros / exportação
- Lista de Compras
  - Itens sugeridos
  - Planejamento e geração de pedidos
- Configurações
  - Mapeamento de nomes POS
  - Métodos de valuation (FIFO, média)
  - Perfis e permissões
  - Integrações API / Webhooks
- Auditoria / Logs
- Ajuda / Documentação

Wireframes em texto para cada página principal

1) Dashboard (visão)
- Topbar: seleção de unidade/estoque, data range picker, perfil do usuário
- KPI cards: Estoque Valorizado, CMV período, Giro de estoque, Produtos abaixo do mínimo
- Gráfico principal: consumo por categoria (últimos 30 dias)
- Listas rápidas: Pedidos pendentes, Transferências pendentes, Itens críticos (abaixo do mínimo)
- Ações rápidas: New Purchase, Inventory Count, Transfer Request

2) Estoques → Visão geral por local
- Left column: filtro de estoques/depósitos
- Main: lista de produtos com colunas: SKU, Produto, Estoque atual, Unidade, Custo médio, Ação (transferir / ajustar / detalhar)
- Row actions: quick adjust modal (ajuste de quantidade/preço), ver kardex
- Mini-paginação e lazy-load

3) Produtos → Lista de produtos
- Tabela com pesquisa livre e filtros por categoria/fornecedor
- A ação “Ficha técnica” abre drawer lateral com ingredientes/receita e impacto de conversão em estoque

4) Compras → Pedidos
- Lista de pedidos com status tags (Pendente, Parcial, Recebido)
- Botão “Criar Pedido” → modal/flow wizard: escolher fornecedor, adicionar linhas (produto, qty solicitada, preço estimado), salvar como Pendente
- Detalhe do pedido: actions para “Marcar recebimento” → abrir form para registrar quantidades recebidas e preço real por linha; calcular diferença total e mostrar impacto no valuation com preview antes de confirmar

5) Recebimento (form)
- Cabeçalho com dados do pedido e fornecedor
- Linha por produto: solicitado, recebido (editable), custo unitário real (editable), lote, validade (opcional)
- Preview: alteração de custo médio/FIFO e saldo resultante do estoque
- Botões: Confirmar (gera movimentações, atualiza kardex), Salvar rascunho

6) Transferências
- Form solicitar transferência: de/para estoque, produtos e qty
- Status: Solicitado → Aguardando aprovação → Em trânsito → Concluído
- Histórico e rastreio por transferência

7) Kardex de produto
- Header: produto, SKU, saldo atual
- Timeline tabelada: data, tipo, origem/destino, qtd, custo unit., saldo após movimento, referência (pedido/transferência/nota)
- Filtros por período e tipos de movimento, export CSV

8) Lista de Compras
- Gerado automaticamente: produtos abaixo do mínimo com cálculo de qty sugerida (meta estoque mínimo + safety stock - atual)
- Interface para ajustar quantidades sugeridas e gerar pedido ou exportar para fornecedor

9) Configurações → Integrações
- Mapeamento POS: tabela com nome do POS, nome do sistema, sugestão automática (similaridade), botão de confirmar/mudar
- Webhooks: registrar endpoints e logs de entregas

## Design e Interações

Paleta de cores sugerida
- Primária (Ação): #FF6B35 (laranja quente) — enérgico, associado a bares/serviço
- Secundária: #1F2937 (grafite) — texto e elementos primários
- Neutros: #F7FAFC (fundo), #E6E9EE (bordas), #9AA4B2 (muted)
- Indicadores: Verde #16A34A (positivo), Vermelho #EF4444 (erro/negativo), Amarelo #F59E0B (aviso)
- Use variações com opacidades para estados hover/pressed.

Tipografia
- Títulos: Inter / Roboto Condensed (sem serifa, legível em baixos resoluções)
- Texto: Inter / Roboto (peso 400-700)
- Sizes: 14px base, 16px corpo, 20–24px títulos, 12px para metadados
- Altura de linha: 1.4 para legibilidade em tabelas densas.

Animações e microinterações (detalhes técnicos)
- Diretrizes gerais
  - Respeitar preferência do usuário por reduzido movimento (prefers-reduced-motion).
  - Durations e easings padrão via CSS custom properties:
    --motion-duration-fast: 150ms;
    --motion-duration-medium: 300ms;
    --motion-duration-slow: 500ms;
    --motion-ease: cubic-bezier(0.22, 1, 0.36, 1) (material-ish).
  - Forçar animações de entrada/saída suaves e de baixa latência; evitar jank em listas grandes (usar virtualização).

- Transições de lista (entrada/remoção/atualização)
  - Objetivo: quando um produto é atualizado por venda ou recebimento, reordenar a lista com animação de movimento fluida (move).
  - Implementação: usar library de animação que suporte FLIP/position transition (Framer Motion's layout/AnimateSharedLayout ou AutoAnimate). Técnica FLIP: capture bounding boxes antes/depois, aplicar transform para suavizar.
  - Valores: duration 250–350ms, easing cubic-bezier(0.22,1,0.36,1).
  - Evitar animações de escala brusca em tabelas; prefira translate + opacity.

- Modal / Drawer entry
  - Modal: fade + scale (0.98 → 1). Use AnimatePresence e motion.div variants {hidden: {opacity:0, scale:0.98}, visible:{opacity:1, scale:1}, exit:{opacity:0, scale:0.98}}.
  - Duration: 180–220ms.
  - Drawer lateral: slide from right with overlay fade; use translateX(100%→0).

- Row hover & inline edit microinteractions
  - Hover: subtle elevation (box-shadow), background tint shift (rgba primary 0.04).
  - Inline edit: cell transforms into input with cross-fade and focus ring; animate height/opacity for smoothness.

- Skeleton loaders / placeholders
  - For listas e dashboard cards: shimmer gradient animation (CSS keyframes) 1.2s infinite linear. Prefer CSS-only to preservar performance.

- Toasts & confirmations
  - Toasts slide up from bottom-right and auto-dismiss (default 4s). Allow action buttons (undo).
  - Implement accessible live region (ARIA) for toasts.

- Transfer workflow animations
  - Micro timeline for transfer status changes: stepper with animated progress (GSAP timeline or Framer Motion animate with stagger). Show subtle pulse on “Em trânsito” state.

- Kardex timeline entry animation
  - New entries highlighted briefly: background flash (yellow 0.16s → fade to transparent over 1s) to draw atenção ao novo movimento.

- Complex sequences (onboarding/walkthrough)
  - Use GSAP timeline for choreographed tutorials that envolvem múltiplos elementos e pontos focais.

- Accessibility
  - Todas as animações reduzidas se prefers-reduced-motion = reduce.
  - Fornecer foco visível e controles navegáveis por teclado.
  - Contrast ratios >= WCAG AA.

Bibliotecas recomendadas (animação + UI)
- Framer Motion (React): animações de layout, AnimatePresence, shared layout transitions. Ótimo para listas e modais.
- GSAP: sequências complexas, timelines, animações dirigidas (uso limitado onde Framer Motion não atende).
- Lottie + react-lottie-player: micro-illustrations animadas (recebimento concluído, sucesso).
- AutoAnimate (ou React-Flip-toolkit): fácil animação automática em listas pequenas.
- react-virtualized / react-window: virtualização de listas volumosas para performance (combinar com Framer Motion com cuidado — animar só on-screen rows).
- Tailwind CSS ou design system CSS-in-JS com tokens de animação (CSS vars) para consistência.

Padrões de interação premiados (UX patterns)
- Progressive Disclosure: mostrar informações essenciais em tabelas com possibilidade de expandir para detalhes (drawer/modal) ao invés de páginas separadas.
- Inline Editing + Preview: alterar quantidades/preços inline com um preview do impacto (recalculo de valuation) antes da confirmação.
- Contextual Actions (row actions): ações principais visíveis, ações secundárias em menu kebab.
- Bulk Actions com confirmação: seleção em massa para ajustes ou impressões de pedidos.
- Undo & Soft-delete: permitir desfazer operações críticas por curto período.
- Sticky action bar: em páginas de formulários longos (recebimento), manter barra de ações fixa em bottom para confirmar/salvar.
- Search-as-you-type com fuzzy matching para mapping POS → SKU.
- Skeletal loading e placeholders para manter percepção de performance.
- Visual feedback imediato com toasts e badges para estados (pendente, parcial, recebido).

## Considerações Técnicas

Stack tecnológica sugerida
- Frontend: React (17/18) + TypeScript. UI lib: Tailwind CSS ou design system próprio. State management: React Query / SWR para cache de dados, Zustand ou Redux Toolkit para estado global crítico. Router: React Router.
- Backend: Node.js (NestJS ou Express) + TypeScript. API RESTful + GraphQL opcional (para queries complexas).
- Banco de dados: PostgreSQL (ACID, transações para inventário), usar schemas e índices apropriados. Considerar TimescaleDB extension para séries temporais (movimentações) se necessário.
- Cache/Real-time: Redis para filas, locks e pub/sub. WebSocket (Socket.IO ou Phoenix/Channels) para push de atualizações em tempo real.
- Filas/Workers: BullMQ (Redis) para processamento assíncrono de integrações, reconciliações e reprocessamento de vendas.
- Hospedagem: Kubernetes / managed container (EKS/GKE) ou serverless (FaaS) com RDS/Postgres gerenciado.
- Observabilidade: Sentry (erros), Prometheus/Grafana (metrics), logs centralizados (ELK).

Modelagem crítica e estratégia de consistência
- Movimentações imutáveis: cada alteração no estoque cria um registro de movimento (kardex). Não atualizar registros antigos; use operações compensatórias para correções.
- Transações DB: envolver leitura de saldo + criação de movimento + atualização de saldo em uma transação atômica para evitar condições de corrida.
- Locks otimistas/pessimistas: use row-level locks quando processar recebimentos simultâneos para mesma SKU/estoque.
- Valuation: cálculos FIFO exigem armazenamento de lotes/entradas com qty remanescente e custo. Média ponderada pode recalcular em update de recebimento (batch job para reconciliações históricas).

Integrações necessárias
- API POS (webhooks/polling): ingestão de vendas (itens vendidos, qty, timestamp, nome do item). Implementar adapter por integrador (mapeamento de campos).
- Mapping engine: tabela de correspondência entre nome_do_POS ↔ SKU_local + regras fuzzy (levenshtein / trigram similarity).
- Fornecedor / ERPs: endpoints de exportação/importação CSV/Excel e webhooks para notas fiscais.
- Autenticação: OAuth2/JWT para integrações externes; SSO corporativo opcional.
- Serviços de terceiros: serviços de e-mail, SMS, e gateway para notificações.

Requisitos de performance
- Latência das operações principais (consulta de estoque, recebimento) < 300ms em condições normais.
- Escalabilidade horizontal do backend para picos (ex.: final do expediente com múltiplos recebimentos).
- Virtualizar listas > 200 rows. Paginação e índices nas queries de movimentações.
- Websocket para push; fallback polling de 5–30s conforme criticidade.
- Jobs de reprocessamento em background para integrações e reconciliation (vício de dados).

Segurança e conformidade
- Controle de acesso baseado em roles (RBAC).
- Logs de auditoria imutáveis, com retenção configurável.
- Criptografia em trânsito (TLS) e em repouso (DB encryption where possible).
- Proteção contra operações perigosas com dupla confirmação (ex.: ajuste de custo que recalcule CMV).
- Compliance com legislação fiscal local ao armazenar NF e dados contábeis (exportáveis).

## Roadmap Sugerido

MVP (Fase 1)
- Cadastro de produtos e estoques múltiplos.
- Criação de pedidos de compra com status Pendente.
- Recebimento de pedidos com marcação como Recebido (total/parcial) e edição de custo unitário real.
- Registro de movimentações (kardex) e visualização por produto.
- Integração básica com POS via API (polling + mapping manual).
- Lista de compras baseada em estoque mínimo.
- Relatórios básicos: movimentações, listagem de itens abaixo do mínimo.
- Autenticação, RBAC básico e logs de auditoria.

Melhorias futuras (Fase 2)
- Workflow de aprovação para transferências e compras.
- Fichas técnicas e cálculo automático de consumo por receita.
- Métodos de valuation (FIFO + Média) e recalculo de CMV com simulação.
- Webhooks em tempo real e mapeamento automático (fuzzy) entre POS e SKUs.
- Ferramentas de inventário (scanners, PWA para tablets).
- Virtualização e otimização de performance para grandes catálogos.
- Undo/soft-delete, notificações avançadas e dashboard com KPIs.

Visão de longo prazo (Fase 3)
- Previsão de demanda (ML) para sugerir compras baseadas em sazonalidade e eventos.
- Integração direta com fornecedores (EDI/API) para criação automática de pedidos.
- Portal para fornecedores e gestão de cotações.
- Consolidação multi-unidade e balancing automático entre locais (transferência automática sugerida).
- Suporte avançado a lotes, validade e recall, com QR/barcode tracing.
- Analytics avançado: análise de perda, desperdício e otimização de mix de produtos.