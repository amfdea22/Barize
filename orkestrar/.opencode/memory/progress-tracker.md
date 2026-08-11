# Progress Tracker

> Tracks task progress across sessions.

## Current Session

- **Task**: Corrigir servidor não aceita conexões (Windows + Python 3.14)
- **Started**: 2026-07-28
- **Agent**: build + architect

## Task History

| # | Task | Agent | Status |
|---|---|---|---|
| 1 | Corrigir servidor ASGI não bindar no Windows (ProactorEventLoop) | build + architect | ✅ Concluído |
| 2 | Paginação (TC-005) em endpoints de listagem | build | 🔄 Parcial (pdv/estoque ok, falta aplicar nos demais) |
| 3 | Edição de Comandas (TC-021) — backend PATCH + frontend modal | build + architect | ✅ Concluído |
| 4 | Renomear sistema de NeonBar para BARIZE (TC-022) | build + architect | ✅ Concluído |
| 5 | Fase 1 — Performance: code splitting, lazy loading, DB indexes, N+1 queries | build | ✅ Concluído |
| 6 | Fase 2 — Segurança: security headers, password policy, CSP | build | ✅ Concluído |
| 7 | Fase 3 — UX/A11y: Skeleton, ErrorBoundary, EmptyState, ARIA, focus-visible | build | ✅ Concluído |
| 8 | Fase 4 — Monitoramento: metrics middleware, enhanced health, telemetry hook | build | ✅ Concluído |
| 9 | SDD-001: Recuperar imagens e funcionalidades do menu Comandas | architect | 📋 SDD criado (draft) |
| 10 | SDD-002: Recuperar registros e imagens no sistema (auditoria + plano) | architect + explore + ui-designer | ✅ Concluído |
| 11 | Criar produto + upload imagem no PDV | build | ✅ Concluído |
| 12 | Editar/excluir produto no PDV | build | ✅ Concluído |
| 13 | Bug 500 no PDV (UNIQUE codigo_barras) — normalizar ''→NULL + IntegrityError→409 | build | ✅ Concluído |
| 14 | Renomear menu "POP's" → "Checklist" | architect + build | ✅ Concluído |
| 15 | Checklist profissional (79 itens) por período (diário/semanal/mensal) + fluxo (baixo/médio/alto) | architect + build | ✅ Concluído |
| 16 | Implementar cadastro de funcionários no Admin (TC-024) | build | 🔄 Em andamento |
| 17 | Gerar QR code do cardápio digital localmente (TC-019) + regra no-external-resources + regra layout-constraints | build | ✅ Concluído |
| 18 | Corrigir overflow do modal QR (max-w-sm + w-full + mx-lg) — padrão Modal.tsx (TC-019/TC-001) | build | ✅ Concluído |
| 19 | Menu Relatórios & Analytics (TC-020) — 4 endpoints analytics + frontend abas Analytics/Auditoria | build | ✅ Concluído |
| 20 | TC-026: Área insumos/etiqueta no menu Comanda + redesign card comanda + etiqueta 80mm BARIZE | build + ui-designer | ✅ Concluído |
| 21 | TC-009: Ajustar tamanho das imagens dos produtos (nome sobreposto → área própria abaixo da imagem) | build | ✅ Concluído |
| 22 | TC-027: PDV profissional Fase 1 (mesa, pagamento+troco, desconto, cupom 80mm, baixa estoque via /pdv/finalizar-comanda) | build + ui-designer | ✅ Concluído |
| 23 | TC-026: Área insumos/etiqueta no menu Comanda + etiqueta 80mm igual à referência ui/comanda | build + ui-designer | ✅ Concluído |
| 24 | TC-024: Cadastro de funcionários no Admin (backend + frontend) | build | ✅ Concluído |
| 25 | TC-028: Mesas dinâmicas — tabela mesas + CRUD /admin/mesas + PDV dinâmico + aba Admin | build + architect | ✅ Concluído |
| 26 | TC-029: Área CMV/margem/insumos com relatórios precisos — correção de 5 bugs + router relatorios_cmv + CSV + página CMV | build | ✅ Concluído |
| 27 | TC-030: Mover funcionalidades de etiqueta da Comanda para o menu Etiquetas (centralizar) | build | ✅ Concluído |
| 28 | TC-031: Resgatar informações do menu Configurações (reescrever Admin.tsx do Bootstrap para Tailwind) | build | ✅ Concluído |
| 29 | TC-032: Alinhar visual do Admin.tsx ao padrão das outras páginas (design review) | build + ui-designer + architect | ✅ Concluído |
| 30 | TC-033: Multi-impressora por setor (Caixa/Cozinha/Bar) | build + architect | ✅ Concluído |
| 31 | TC-034: Worker ESC/POS usa config do banco + layout por tipo | build | ✅ Concluído |
| 32 | TC-035: DLE EOT 2/4 com leitura + erros tampa/papel/guilhotina + aviso pouco papel | build | ✅ Concluído |
| 33 | TC-036: Comanda de produção sem preços (ESC/POS + Comandas.tsx modal) | build | ✅ Concluído |
| 34 | TC-037: Corte parcial guilhotina \x1d\x56\x01 + 3 feeds | build | ✅ Concluído |
| 35 | TC-038: Abertura de gaveta RJ11 \x1b\x70\x00\x19\xfa | build | ✅ Concluído |
| 36 | TC-039: QR PIX no cupom ESC/POS (GS ( k) + payload PIX CRC-16 + QRCodePix.tsx | build | ✅ Concluído |
| 37 | TC-040: Fila de contingência + Reenviar Pedido (printer-fila GET/POST + UI aba Impressoras) | build | ✅ Concluído |
| 38 | TC-041: Sistema de impressão CSS consolidado (@media print único, @page 80mm + ficha-a4) | build | ✅ Concluído |
| 39 | TC-042: Aba Impressoras no Admin (form/status/testar/salvar) | build | ✅ Concluído |
| 40 | TC-043: Emulador CLI ASCII 48 col + limpar_comandos_escpos | build | ✅ Concluído |
| 41 | TC-044: Visualizador web 80mm com serrilha (Visualizador80mm + modal Preview Cupom) | build | ✅ Concluído |
| 42 | TC-045: Cancelar pedido no Painel (Dashboard) — status Cancelado + modal motivo + botão no OrderCard | build | ✅ Concluído |
| 43 | TC-046: Tema claro/escuro sem mudar interface — tokens CSS (overlay/glass/neutral) + override paleta light + useTheme + ThemeToggle (Sidebar/Login) + anti-FOUC | build | ✅ Concluído |
| 44 | TC-047: Área de Responsável na etiqueta 80mm — campo no InsumoEtiquetaModal + Label80mm RESPONSÁVEL + pré-preenchimento com usuário logado | build | ✅ Concluído |
| 45 | TC-048: Editar ficha técnica na página Ficha Técnica — botão Editar (cards/lista/modal detalhe, admin/gerente) + modal com Dificuldade/Teor/Copo/Tempo/Guarnição/Modo de Preparo via PUT /pdv/produtos/{id}/ficha-tecnica | build | ✅ Concluído |
| 46 | TC-005: Paginação nos endpoints de listagem | build | ✅ Concluído |
| 47 | TC-011/TC-012: Padronizar card das bebidas igual a drinks (card único aspect-[16/10] validado) | build | ✅ Concluído |
| 48 | TC-013: Cardápio Digital Básico — toggle Básico/Completo + localStorage barize-cardapio-modo | build | ✅ Concluído |
| 49 | TC-016: Scrollbar visível no cardápio digital (.scrollbar-visible WebKit+Firefox) | build | ✅ Concluído |
| 50 | TC-017: Scrollbar visível no painel de produtos do PDV | build | ✅ Concluído |
| 51 | TC-019: QR code cardápio (já existente) validado — smoke 16/16 | build | ✅ Concluído |
| 52 | TC-021: Edição de comandas (já existente) validada — smoke 16/16 | build | ✅ Concluído |
| 53 | TC-025: Áreas de acesso por perfil — menu filtrado (Sidebar podeAcessar) + rotas restritas (RequireRole) | build | ✅ Concluído |
| 54 | TC-005: Paginação limit/offset nos 10 routers de listagem (pdv, estoque, relatorios, recebimentos, funcionarios, materiais, copos, mesas, copos-quebrados, producoes) — smoke 14/14 | build | ✅ Concluído |
| 55 | TC-009: Imagens dos produtos com nome em área própria abaixo (aspect-[16/10]) — validado 6/6 | build | ✅ Concluído |
| 56 | TC-053: Padronizar preview reimprimir comanda para 80mm e fundo branco | build | ✅ Concluído |
| 57 | TC-054: Inserir barra de rolagem visível na área dos produtos do PDV | build | ✅ Concluído |
| 58 | TC-055: Inserir opção calculadora no painel Caixa e no registro de pagamento | build | ✅ Concluído |
| 59 | TC-056: Inserir contador de pedido nos Pedidos Ativos | build | ✅ Concluído |
| 60 | TC-057: Foto do funcionário na área Novo Funcionário (upload, preview, coluna Foto na listagem) | build | ✅ Concluído |
| 61 | TC-058: Atualizar e sincronizar os dados do menu financeiro | build | ✅ Concluído |
| 62 | TC-059: Analisar, sincronizar e corrigir os dados do CMV | build | ✅ Concluído |

## Notas TC-059 (Corrigir Dados do CMV)

- **Dados corrompidos corrigidos** (banco dev):
  - Cachaça 51 (insumo 1): `custo_unitario` 25,0 → **0,030/ml** (garrafa 1L = R$30, confirmado pelo usuário). Snapshots `custo_no_momento` das 4 movs VENDA atualizados (25,0 → 0,030).
  - Gin (insumo 3): `custo_unitario` 50,0 → **0,050/ml** (garrafa 1L = R$50, confirmado). Snapshots das 2 movs VENDA atualizados (0,12 → 0,050).
  - Resultado: CMV 30d de ~1858% → **25,82%** (Custo R$70,50 / Receita R$273,00). Caipirinha 14,5%, Caipiroska 27%, Gin Tônica 34,8%.
- **Bug corrigido `producao.py`**: movimentações VENDA de produção não preenchiam `quantidade_produto` → custo sem receita inflava CMV. Agora preenche na primeira receita (i==0), igual ao `finalizar_comanda`.
- **Bug corrigido `relatorios_cmv.py`**: endpoints `/produtos`, `/categorias`, `/insumos`, `/insumos/{id}/produtos` usavam `data_inicio`/`data_fim` originais (None) no retorno → 500 quando chamados sem datas. Agora usam as datas resolvidas de `_periodo`.
- **Validação**: py_compile OK; tsc/lint OK; smoke CDP 8/8 PASS; regressão TC-055 (11/11), TC-056 (4/4), TC-058 (6/6) PASS.
- **Status**: executing→testing (qa-engineer)→verified (gate) OK. Aguardando confirmação do usuário para `verified→completed`.
- **Observação**: Refrigerante (produto 5) tinha CMV 116,7% — venda abaixo do custo. **Corrigido**: preço de venda R$6,00 → **R$14,00** (CMV 50%, custo R$7,00/un). CMV geral 30d agora **25,09%** (Custo R$70,50 / Receita R$281,00).

## Notas TC-058 (Sincronizar Dados Financeiros)

- **Backend**:
  - `relatorios.py` `dashboard-executivo` agora retorna `receita_ultimos_dias` (7 dias, vendas por dia) e movimentações completas (`custo_no_momento`, `insumo_id`, `produto_id`, `quantidade_produto`, `created_at`) — antes só `id/tipo/quantidade/data`.
  - `caixa_service.py` `obter_resumo_diario` agora retorna `total_pedidos` (contagem de pedidos do dia).
- **Frontend** `services/api.ts` `carregarPainel()`:
  - `receitaHoje` unificada com o Caixa (soma dos pagamentos do dia), fallback `receita_total`.
  - `receitaUltimosDias` agora vem de `dashboard-executivo` (gráfico "Receita Diária" deixa de ficar vazio).
  - `totalPedidosHoje` usa `total_pedidos` do resumo-diario (antes campo inexistente → sempre 0).
  - Movimentações usam `custo_no_momento`/`created_at` (agora retornados) — colunas Valor/Data corretas.
- **Validação**: py_compile OK; tsc/lint/build OK; smoke backend (7 dias + movs completas + total_pedidos) OK; smoke CDP 6/6 PASS; regressão TC-055 (11/11) e TC-056 (4/4) PASS.
- **Status**: executing→testing (qa-engineer)→verified (gate) OK. Aguardando confirmação do usuário para `verified→completed`.

## Notas TC-057 (Foto do Funcionário)

- **Backend**: coluna `foto_url` em `models/funcionario.py` (String 255, nullable); `schemas/funcionario.py` `foto_url` em `FuncionarioBase`/`FuncionarioUpdate`/`FuncionarioListItem`; `routers/funcionarios.py` `_serialize_funcionario` + create/update + **listagem** (GET / e GET /ativos) incluem `foto_url`. Migração manual em `database.py` + alembic `0017_add_foto_url_funcionarios.py`.
- **Frontend**: `types/index.ts` `foto_url?` em Funcionario/Create/Update; `Admin.tsx` — upload via `uploadService.uploadImagem` (padrão PDV), preview circular na tab dados, botão Remover foto, coluna Foto (thumbnail circular) na DataTable.
- **Bug pré-existente corrigido**: form enviava `data_nascimento:''` (e outros opcionais vazios) → backend rejeitava 422. `handleFuncionarioSubmit` agora converte campos opcionais vazios para `null` antes do envio.
- **Validação**: py_compile OK; tsc/lint/build OK; smoke backend (upload/criar/listar/detalhe/update/delete) PASS; smoke CDP 12/12 PASS; regressão TC-055 (11/11) e TC-056 (4/4) PASS.
- **Status**: transitions executing→testing (qa-engineer)→verified (gate) OK. Aguardando confirmação do usuário para `verified→completed`.

## Notas TC-026 (Etiqueta de Insumo na Comanda)

- **Diagnóstico ui-designer**: "a comanda não mudou de designer" porque o TC-026 nunca foi implementado (só especificado). Comandas.tsx nunca teve commit de etiqueta; único template de etiqueta existia em Etiquetas.tsx (NEONBAR, outra rota).
- **Implementado**: botão "Nova Etiqueta de Insumo" no header de Comandas; card de pedido redesenhado (faixa de status lateral, thumbnail do 1º item, identidade mesa/cliente/itens, total mono, footer Editar/Ver/Etiqueta); modal 2 colunas (Form | Preview ao vivo) em `components/etiqueta/InsumoEtiquetaModal.tsx`; template térmico 80mm P&B `components/etiqueta/Label80mm.tsx` (header BARIZE, 3x NOME, LOTE/FAB/VAL, destaque VALIDADE colorido VENCIDO/VENCE EM N DIAS/OK, código de barras via CSS puro, rodapé).
- **Print**: `@page size 80mm auto` + `.print-80mm` isolado no `index.css` (Ctrl+P).
- **Backend**: NENHUM — reutiliza `lotes.py` (POST/PUT/DELETE `/lotes/`, roles admin/gerente) e `etiquetas.py` existentes.
- **Pendência visual**: imagem `ui/comanda/Comanda.jpg` não lida pelo modelo (sem visão) — conferir manualmente se template diverge da referência.
- **Concluído em 2026-08-06**: transições executing→testing (qa-engineer)→verified (gate)→completed (user). Build OK, lint 0 erros. Usuário confirmou finalização.

## Notas TC-009 (Tamanho imagens produtos)

- **CardapioDigital**: nome/descrição/preço saíram de cima da imagem (gradiente sobreposto, cortava nomes) → área própria `p-3` abaixo da imagem (`break-words`), imagem `aspect-[16/10]`.
- **PDV**: nome do produto `truncate` → `break-words leading-snug` (nomes longos cortados).
- Build + lint OK (0 erros; 3 warnings pré-existentes: Etiquetas.tsx:37, Comandas.tsx:91, FichaTecnica.tsx:121 — missing deps).

## Notas TC-019 (QR Cardápio)

- **QR gerado localmente** com lib `qrcode` (sem `api.qrserver.com`), download local.
- **Modal corrigido**: removido `max-w-sm w-full mx-lg` (overflow horizontal em viewport pequeno) → padrão `Modal.tsx` (`w-full min-w-0 max-w-sm` + wrapper `p-4`).
- **Regras criadas**: `frontend-no-external-resources.md` (sem CDN/APIs externas) e `frontend-layout-constraints.md` (sem `max-w`+`w-full`+`mx-*` combinados).

## Checkpoints

- **2026-07-28 19:33**: Server fix aplicado. `WindowsSelectorEventLoopPolicy` em `main.py`.
- Server aceita conexões em `127.0.0.1:8000`, health check retorna OK, /docs retorna 200.
- 26 tabelas criadas no SQLite.

## Notas TC-024 (Funcionários)

- **Backend completo e testado** (modelo, schema com validação CPF, router CRUD + vincular/desvincular).
- **Frontend**: aba Funcionários + modal com 4 tabs (Dados Pessoais | Contrato | Escala | Vínculo Sistema) + modal Vincular Usuário + filtros (cargo/status/busca).
- **Build frontend OK** (`tsc -b && vite build`), lint 0 erros.
- **Smoke test end-to-end OK** (login → listar → criar → vincular → desvincular → desligar).
- **Atenção**: modal de funcionário não renderizado causava TS6133/TS6196 (states nunca lidos) — resolvido adicionando os modais ao JSX.
- **Pendências**: falta commit do TC-024 + marcar card como concluído.


## Notas TC-027 (PDV profissional Fase 1)

- **Card criado corretamente** no indice real `orkestrar/.opencode/taskcards/` (nextId 28).
- **Correcao de bug**: `createTask()` com `new TaskCardManager(process.cwd())` gravou no indice stale `projeto_bar/.opencode/taskcards/` (nextId 4, colidindo com TC-003). Fix: instanciar com `{ cwd: <projeto>/orkestrar }` — `getTaskcardDir()` resolve `orkestrar/.opencode/taskcards`. Indice stale restaurado (nextId 3, sem TC-003 inventado).

## Notas TC-027 (PDV profissional Fase 1 — IMPLEMENTADO)

- **Fluxo**: card criado no indice real (`{ cwd: <projeto>/orkestrar }`), transicoes backlog->analyzing->ready->executing via StateMachineEngine + TaskCardManager.updateCardStatus (actor 'build' para analyzing/ready, 'user' para executing).
- **Backend** (`pdv.py`): adicionado campo `vendedor` ao `FinalizarComandaRequest`; `atendente = vendedor ou current_user.nome` na impressao COMANDA.
- **Frontend**:
  - `api.ts`: `pdvService.finalizarComanda` agora aceita payload completo (imprimir_comanda, observacao, mesa, cliente, desconto_percentual, taxa_servico_percentual, forma_pagamento, vendedor).
  - `PDV.tsx` reescrito: usa `pdvService.finalizarComanda` (NAO mais `pedidosService.criar`); painel venda 360/400px; SeletorMesa (M1-M10 + B1-B3), SeletorVendedor, cliente, desconto%, taxa servico% (+ SegmentedControl 0/8/10%), total consolidado Subtotal/Desconto/Taxa/Total; busca com atalho '/'; modal pagamento step-by-step (Dinheiro/Credito/Debito/Pix, parcelamento SegmentedControl, teclado numerico + troco ao vivo); modal sucesso com CupomPDV 80mm + window.print().
  - Componentes novos em `components/pdv/`: types.ts (CartItem, FormaPagamento, PagamentoPayload, FORMAS_PAGAMENTO, MESAS), ProdutoCardPDV, CarrinhoPDV (qty w-11 h-11), SeletorMesa+MesaBadge, SeletorVendedor, TecladoNumerico, PainelPagamento, CupomPDV+CupomPrintActions.
  - `index.css`: bloco print `.cupom-80mm` + `.no-print`.
- **Validacao**: build frontend OK (tsc -b && vite build), lint OK (0 erros; 3 warnings pre-existentes), smoke test backend OK (`POST /pdv/finalizar-comanda` com desconto 10% + taxa 8% + dinheiro + mesa + vendedor -> 200, pagamento_id/pedido_id criados, auditoria COMANDA_FINALIZADA registrada).
- **Atencao**: endpoint exige receita cadastrada por produto; teste usou produto id=5 (Refrigerante).
- **Fase 2 (futuro)**: caixa_id no Pagamento, split pagamento, dividir comanda. **Fase 3**: KDS realtime, alertas estoque, dashboard.

## Notas TC-028 (Mesas dinâmicas)

- **Diagnóstico @architect**: mesas hardcoded em `components/pdv/types.ts` (`MESAS = ['M1'..'M10','B1','B2','B3']`); backend `Pedido.mesa` é `String(20)` livre (sem tabela). Decisão: tabela `mesas` + CRUD `/admin/mesas` + seed das 13 atuais + PDV dinâmico + aba Mesas no Admin. Retro-compatibilidade total (Pedido.mesa continua string).
- **Backend**: `models/mesa.py` (id, nome unique String(20), local String(50), ativo, timestamps), registrado em `models/__init__.py`; `schemas/mesa.py` (MesaBase/Create/Update/Response — datas `datetime`); `routers/mesas.py` (GET autenticado, POST/PUT admin/gerente com 409 duplicado e 422 nome vazio, DELETE admin soft delete); `main.py` include_router; `database.py` init_db + `_seed_mesas()` (13 mesas se vazio).
- **Frontend**: tipo `Mesa` em `types/index.ts`; `mesasService` em `api.ts`; hook `useMesas`; `SeletorMesa` presentacional (recebe `mesas: string[]` por prop); constante `MESAS` removida de `types.ts`; `PDV.tsx` usa `useMesas` (`mesas.map(m => m.nome)`); aba **Mesas** no `Admin.tsx` (tabela + modal criar/editar + desativar/reativar, padrão aba Funcionários).
- **Bugs corrigidos**: schema datas eram `str` mas ORM retorna `datetime` (ResponseValidationError) → `datetime`; POST aceitava nome só-espaços `"   "` e serialização quebrava → 422 explícito; `_serialize_mesa` morto removido.
- **Validação**: build frontend OK, lint 0 erros (3 warnings pré-existentes), smoke test backend 12/12 PASS (seed 13, filtro ativo, criar 201, duplicado 409, vazio 422, PUT rename/duplicado, soft delete, reativar, 401 sem token), seed confirmado em banco real (13 mesas).
- **Concluído em 2026-08-06**: transições executing→testing (qa-engineer)→verified (gate)→completed (user). TC-024 permanece `verified` aguardando usuário.

## Notas TC-029 (CMV/Margem/Insumos — relatórios precisos)

- **Diagnóstico @explore**: 5 bugs de precisão — (1) `estoque_service.calcular_cmv` receita SQL não filtrava por período (all-time); (2) `financeiro_plus.vendas-por-categoria`, (3) `cmv.receita_dia` e (4) `relatorios.dashboard-executivo` usavam `ABS(m.quantidade)` (quantidade do insumo) em vez de `quantidade_produto` — inflava receita em produtos compostos (2+ insumos); (5) tipo `CMVResult` frontend desalinhado ao payload real (`periodo.data_inicio/data_fim` vs `periodo_inicio/periodo_fim`).
- **Correções**: receita agora usa `movimentacoes.quantidade_produto × produtos.preco_venda` (preenchida apenas na 1ª movimentação de cada venda) e é filtrada por `:di/:df`; custo = `SUM(|quantidade| × custo_no_momento)` de movs VENDA.
- **Backend**: novo `routers/relatorios_cmv.py` (prefixo `/cmv/relatorios`): GET `produtos` (order_by receita|custo|margem|cmv|nome), `categorias`, `insumos`, `insumos/{id}/produtos`; CSV `produtos.csv`/`categorias.csv`/`insumos.csv` via StreamingResponse (`;` delimitador, `text/csv; charset=utf-8`). Registrado no `main.py`.
- **Frontend**: tipos novos em `types/index.ts` (CMVResult corrigido, CMVProdutoItem/Result, CMVCategoriaItem/Result, InsumoConsumoItem/Result, InsumoProdutoItem); `cmvRelatoriosService` + `cmvService.calcular` com datas em `api.ts`; `CMV.tsx` reescrito (período customizado, abas produtos/categorias/insumos, exportação CSV via `window.location.href` incluindo prefixo `/api/v1`, detalhe produtos-por-insumo); item **CMV** no `Sidebar.tsx` (ícone Calculator); `Financeiro.tsx` corrigido para `cmvDetalhado.periodo.data_inicio/data_fim`.
- **Validação**: smoke test backend 40/40 PASS (produto composto Caipirinha com 3 insumos: venda 2x → receita 24.00, custo 6.00, CMV 25%, margem 75%; período histórico vazio → receita 0; CSV text/csv; 401 sem token); build frontend OK; lint frontend 0 erros (3 warnings pré-existentes); ruff backend = apenas padrões pré-existentes (B008/UP045/UP006).
- **Fora de escopo**: custo teórico de produto duplicado em 3 lugares (precificacao.py:16, fichas_tecnicas.py:18, pdv.py:549).
- **Concluído em 2026-08-06**: transições executing→testing (qa-engineer)→verified (gate). TC-029 aguarda usuário finalizar (verified→completed). TC-024 também continua `verified`.
- **Finalizado em 2026-08-06**: usuário aprovou completeTask para TC-029 e TC-024 → ambos `completed`.

## Notas Fixes Críticos PDV (revisão /revisar)

- **Fix 1 — validação de valores no backend** (`pdv.py` `FinalizarComandaRequest`/`ItemComanda`): `desconto_percentual` Field(ge=0, le=100), `taxa_servico_percentual` Field(ge=0), `quantidade` Field(gt=0). `vender` usa `Query(gt=0)`. Serviços `realizar_baixa`/`finalizar_comanda` também validam `quantidade > 0` (defesa em profundidade — impede fraude com estoque negativo).
- **Fix 2 — atomicidade do finalizar-comanda**: `EstoqueService.finalizar_comanda` ganhou param `commit=False` (flush) e `AuditService.registrar` ganhou `commit=False`; router agora envolve tudo (baixa + pagamento + auditoria + fila impressão + pedido) em try/except com `db.rollback()` e UM ÚNICO `db.commit()` no final. Falha em qualquer etapa → rollback total (estoque não fica baixado sem venda).
- **Validação**: smoke 16/16 PASS (desconto 150%→422, -5%→422, taxa -1%→422, qtd 0/-3→422, vender qtd 0→422, valor_final 19.60 com 10% desc + 8% taxa, estoque baixado corretamente, pagamento/pedido persistidos, produto sem receita→400 e estoque intacto). Import backend OK.
- **Ruff**: apenas padrões pré-existentes (F401/F841 em linhas não tocadas).

## Notas TC-030 (Centralizar etiquetas no menu Etiquetas)

- **Objetivo**: remover a área de etiquetas da Comanda (botão 'Nova Etiqueta de Insumo' no header + botão 'Etiqueta' por pedido + `<InsumoEtiquetaModal>`) e concentrar TODAS as funções de etiqueta no menu Etiquetas (`/etiquetas`).
- **Implementado**:
  - `Comandas.tsx`: removidos import `InsumoEtiquetaModal`/`Tag`, estados `etiquetaOpen`/`etiquetaInitial`, botão do header, botão 'Etiqueta' do rodapé do card de pedido e o `<InsumoEtiquetaModal>` do JSX. `primeiroProduto` mantido (thumbnail).
  - `Etiquetas.tsx`: adicionado botão **'Nova Etiqueta de Insumo'** no header (abre `InsumoEtiquetaModal` — form + preview 80mm BARIZE + Imprimir) e botão **'Etiqueta'** em cada item da lista (pré-preenche nome/quantidade/unidade/categoria/lote/fabricação/validade, com `stopPropagation` para não alternar seleção). Listagem/seleção/preview existentes preservados.
- **Validação**: build frontend OK (tsc -b && vite build), lint 0 erros (3 warnings pré-existentes: Etiquetas.tsx:40, Comandas.tsx:87, FichaTecnica.tsx:121). Nenhuma funcionalidade de etiqueta removida do sistema — apenas realocada.
- **Em 2026-08-06**: transições executing→testing (qa-engineer)→verified (gate, allTestsPassed:true). TC-030 aguarda usuário finalizar (verified→completed).
- **Concluído em 2026-08-06**: usuário aprovou completeTask('TC-030','user') → `completed`.

## Notas TC-031 (Resgatar menu Configurações — Admin.tsx)

- **Diagnóstico**: Admin.tsx (rota /admin, item "Configurações" do Sidebar) usava 100% classes Bootstrap (row/card/table/modal/nav-tabs/form-control/bi-*/spinner-border) mas o projeto NÃO tem Bootstrap instalado nem via CDN (CSS = Tailwind + vars --color-*). A página renderizava completamente sem estilo — as informações existiam no backend mas não apareciam.
- **Implementado**: Admin.tsx reescrito integralmente no design system do projeto — componentes Modal/Button/Input/Badge/DataTable/ProductThumbnail + ícones lucide-react (Activity, Box, FileText, Images, Users, Grid3x3, Plus, Pencil, Trash, Link, UserPlus, CheckCircle, XCircle, RefreshCw). 6 abas preservadas: Monitoramento (health cards + métricas por endpoint + lotes vencendo + produtos ativos), Gestão de Lotes (CRUD), Fichas Técnicas (tabela + edição), Imagens (listar/filtrar/vincular), Funcionários (CRUD + filtros + modal 4 abas + vínculo usuário), Mesas (CRUD + ativar/desativar). Toda a lógica de estado/handlers preservada. Constantes CARGO_LABELS/TURNO_LABELS/DIAS_SEMANA extraídas. Ícone ArrowClockwise não existe no lucide-react → RefreshCw.
- **Validação**: build frontend OK (tsc -b && vite build), lint 0 erros (3 warnings pré-existentes), grep confirma ZERO classes Bootstrap/bi-* restantes no Admin.tsx.
- **Em 2026-08-07**: transições executing→testing (qa-engineer)→verified (gate, allTestsPassed:true). TC-031 aguarda usuário finalizar.

## Notas TC-032 (Design do Admin.tsx alinhado às outras páginas)

- **Diagnóstico**: @architect (D1-D12) + @ui-designer (A1-A3/M1-M4/B4-B7) apontaram desalinhamentos entre o Admin.tsx recém-reescrito (TC-031) e o padrão das demais páginas. Consenso ~85-90% conforme; somente Admin.tsx precisa de mudanças, nenhum componente.
- **Implementado** (7 ajustes, todos aprovados):
  - A1 — 4 ações destrutivas trocaram `window.confirm` por Modal de confirmação (excluir lote, desligar/reativar funcionário, desvincular usuário, desativar mesa).
  - A2 — selects (filtros/formulários) → `h-12` + `bg-surface-container-low` + border `rgba(255,255,255,0.08)`.
  - A3 — botão "Editar Fichas" → `<Button size="sm" variant="ghost">`.
  - M1 — tabs → `h-[36px]`, ativa com `text-[var(--color-on-primary-container)]`.
  - M2 — search → border `0.1`, `pl-xl pr-md py-xs`, `text-body-md`, ícone 18 `left-sm`.
  - M3 — empty/loading do Monitoramento → ícone + flex col center `h-32 gap-2`.
  - H — health cards → `StatsCard` (variant success/error/info/primary); ações em linha → icon boxed `bg-surface-container-highest` (padrão Estoque.tsx:409-447, com `title`/`aria-label`).
  - D10 — blocos com DataTable (Lotes/Fichas/Funcionários/Mesas) → `Card p-0 overflow-hidden`, removido wrapper `p-lg` duplicado (ghost-border duplicado).
- **Validação**: build frontend OK (tsc -b && vite build), lint 0 erros (3 warnings pré-existentes: Comandas.tsx:87, Etiquetas.tsx:40, FichaTecnica.tsx:121). Somente Admin.tsx tocado nesta etapa.
- **Em 2026-08-07**: transições executing→testing (qa-engineer)→verified (gate, allTestsPassed:true). TC-032 aguarda usuário finalizar. TC-031 também permanece `verified`.
- **Concluídos em 2026-08-07**: usuário finalizou TC-031 e TC-032 via `completeTask('user')` → ambos `completed` (build + tsc --noEmit OK).

## Notas TC-033..TC-044 (Checklist Impressão 80mm — cards criados)

- **Checklist técnico do usuário**: módulo de impressão 80mm (ESC/POS) — hardware/bobina (48 chars Fonte A, 3 \n\n\n pré-corte, corte parcial), periféricos (gaveta RJ11 b'\x1b\x70\x00\x19\xfa', multi-impressora por setor IP:9100), layout (comanda produção sem preços, fechamento justificado + total destaque, QR PIX GS ( k), resiliência (DLE EOT 2/4, erros tampa/papel/guilhotina, aviso pouco papel, fila contingência + Reenviar, threads), emulação (regex hex, emulador CLI 48 col, visualizador web 80mm serrilhado).
- **Diagnóstico @architect + @ui-designer** (read-only, nada alterado): backend mais adiantado que UI. Já existe: worker ESC/POS (`impressao_worker.py`), fila (`fila_impressao.py`), printer-config API (sem tela), CupomPDV/Label80mm. Lacunas P0: multi-impressora por setor, worker ignora banco (cai USB), DLE EOT sem leitura, comanda com preços, corte total→parcial. P1: gaveta, QR PIX, erros específicos, Reenviar real, justificado ESC/POS. P2: emulador CLI + visualizador web (sem serrilhado/QR). Bugs CSS: 4 blocos @media print conflitantes (A4 sobrescreve 80mm), modal comanda sem classe print, marca NEONBAR.
- **Cards criados** via `TaskCardManager.createTask({cwd:'.../projeto_bar/orkestrar'})` — 12 cards em backlog: TC-033 (multi-impressora por setor), TC-034 (worker usa config banco + layout por tipo), TC-035 (DLE EOT 2/4 + erros + pouco papel), TC-036 (comanda produção sem preços), TC-037 (corte parcial), TC-038 (gaveta RJ11), TC-039 (QR PIX cupom/UI), TC-040 (fila + Reenviar Pedido), TC-041 (corrigir @media print CSS), TC-042 (aba Impressoras no Admin), TC-043 (emulador CLI ASCII), TC-044 (visualizador web 80mm). nextId 45.

## Notas TC-033 (Multi-impressora por setor)

- **Problema**: `printer_config` era tabela única global (1 impressora, `_get_printer_config` retorna 1ª ativa sem setor); `fila_impressao.impressora_destino` existia (fila_impressao.py:23) mas NUNCA era preenchida (pdv.py vender/finalizar-comanda). Worker caía em Usb() sem host (escopo TC-034).
- **Implementado** (evolui printer_config, não cria tabela nova):
  - `models/printer_config.py`: coluna `setor` (String(20), default CAIXA, index).
  - `schemas/printer.py`: setor em Base/Update + novo `PrinterConfigCreate`.
  - `database.py`: migração incremental (PRAGMA table_info + ALTER TABLE ADD COLUMN setor + backfill CAIXA) seguindo padrão pedidos/pops; novo `_seed_impressoras()` cria 3 impressoras (CAIXA/COZINHA/BAR) porta 9100.
  - `routers/admin.py`: `_get_printer_config(db, setor)` por setor; `GET /printer-config?setor=` (default CAIXA); novo `GET /printer-configs` (lista); `PUT /printer-config` atualiza por setor; novo `POST /printer-config` (upsert por setor).
  - `routers/pdv.py`: constante `CATEGORIAS_BAR` + helper `_setor_producao(categoria)` (bebidas/drinks→BAR, demais→COZINHA); `vender()` preenche `impressora_destino` da COMANDA; `finalizar-comanda()` preenche por item (setor por categoria) + cria FECHAMENTO com `impressora_destino=CAIXA`.
  - `alembic/versions/0016_add_setor_printer_config.py`: migration (revises 0015).
- **Validação**: smoke test 23/23 PASS (seed 3 impressoras, coluna setor, GET por setor/default, PUT isolado por setor, POST upsert, GET lista, 401 sem token, vender bebida→fila COMANDA destino BAR) + migração incremental PASS (banco antigo sem setor→coluna adicionada, registro antigo backfill CAIXA preservando host, seed criado). Import app OK. Ruff: apenas avisos pré-existentes (I001 imports não ordenados, padrão do projeto sem isort).
- **Em 2026-08-08**: transições executing→testing (qa-engineer)→verified (gate, allTestsPassed:true, 23 testes). TC-033 aguarda usuário finalizar.
- **Concluído em 2026-08-08**: usuário finalizou via `completeTask('user')` → `completed`.

## Notas TC-034 (Worker ESC/POS usa config do banco + layout por tipo)

- **Problema**: `ImpressaoWorker` não lia `printer_config` (entrypoint sem args → `conectar_impressora` caía em `Usb()` quando host None, impressao_worker.py:62-65); formatação única `formatar_comanda_escpos` imprimia preços; nunca lia `impressora_destino` (preenchido no TC-033).
- **Implementado** (reescrita de `worker/impressao_worker.py`):
  - `resolve_config_setor(db, setor)` → config ATIVA do setor; setor vazio→CAIXA; setor inexistente→fallback 1ª ativa.
  - `conectar_impressora(config)` → `Network(host, porta)`; sem host → erro claro (NUNCA Usb() cego); `Serial/Usb` removidos do import.
  - `processar_fila()` roteia cada trabalho pela `impressora_destino`; reconecta quando o setor (config.id) muda (`_config_atual`); setor sem config → `ConnectionError` tratado (PENDENTE + erro_msg).
  - `formatar_comanda_escpos` (COMANDA): título FONT_LARGE BARIZE + * COMANDAS *, item `qtd x nome` em negrito, SEM preços, observação em destaque; corte parcial `\x1d\x56\x01`.
  - `formatar_fechamento_escpos` (FECHAMENTO): cabeçalho centralizado mesa/cliente, itens justificados dinâmico (48 col), desconto/taxa, TOTAL em FONT_LARGE + negrito, pagamento; corte parcial.
  - `formatar_documento(dados, tipo)` → FECHAMENTO usa fechamento, demais usam comanda.
  - `iniciar()` não pré-conecta no boot (conecta sob demanda por setor); `__main__` mantém `ImpressaoWorker().iniciar()` sem args (Dockerfile.worker CMD intacto).
- **Validação**: smoke 29/29 PASS (resolve_config_setor BAR/vazio/inexistente, COMANDA sem R$, FECHAMENTO justificado len=48, roteamento vender→BAR e finalizar→CAIXA, todos CONCLUIDO, setor sem config→PENDENTE+erro). Import app OK; ruff só I001 pré-existente.
- **Em 2026-08-08**: executing→testing (qa-engineer)→verified (gate, allTestsPassed:true, 29 testes). TC-034 aguarda usuário finalizar.
- **Concluído em 2026-08-08**: usuário finalizou via `completeTask('user')` → `completed`.

## Notas TC-035 (DLE EOT 2/4 com leitura + erros físicos + pouco papel)

- **Problema**: TC-034 enviava DLE EOT sem LER a resposta (`verificar_impressora_online` só enviava o comando); `processar_fila` não diferenciava erros físicos; não havia endpoint de status para o painel.
- **Implementado** (worker + API):
  - `worker/impressao_worker.py`: constantes `DLE_EOT_PRINTER=16`/`DLE_EOT_OFFLINE=2`/`DLE_EOT_ERROR=4`/`DLE_EOT_PAPER=4`; função pura `interpretar_dle_eot(offline_byte, papel_byte)` — offline=bit0, tampa=bit1, erro_mecânico=bit4, recovery=bit6; papel_baixo=bit0, papel_esgotado=bit1; `online = not (offline or tampa or papel_esgotado or erro_mecanico)`; `offline_razao` = lista legível.
  - `_ler_dle_eot(comando)` — envia o comando e LÊ 1 byte (`settimeout(0.5)`/`send`/`recv(1)`); timeout/erro → None (tratado como offline).
  - `verificar_impressora_detalhada()` — envia DLE EOT 2 e 4, retorna dict completo; em modo simulação retorna `online=True` e flags False.
  - `verificar_impressora_online()` reescrito para usar `verificar_impressora_detalhada()`.
  - `processar_fila()`: ANTES de imprimir chama `verificar_impressora_detalhada()`; tampa aberta / papel esgotado / erro mecânico / offline → `ConnectionError` com razão específica (job PENDENTE com erro, ERRO após 3 tentativas); **papel_baixo = só warning (NÃO bloqueia)**.
  - `schemas/printer.py`: `PrinterStatusResponse` (setor, online, tampa_aberta, papel_esgotado, papel_baixo, erro_mecanico, recovery, offline_razao, mensagem).
  - `routers/admin.py`: `GET /admin/printer-status?setor=` (admin/gerente) — resolve config, conecta via Network, roda verificação detalhada, fecha conexão e retorna o dict com mensagem legível; sem config → online=False com motivo.
- **Validação**: smoke 20/20 PASS (interpretação bit a bit incl. combinado tampa+papel e recovery, simulação True, endpoint CAIXA/COZINHA 200 com token + 401 sem token, `processar_fila` em simulação conclui COMANDA/FECHAMENTO sem erro). Ruff apenas I001 pré-existente. Import app OK.
- **Em 2026-08-08**: executing→testing (qa-engineer)→verified (gate, allTestsPassed:true, 20 testes). TC-035 aguarda usuário finalizar (verified→completed).
- **Concluído em 2026-08-08**: usuário finalizou via `completeTask('TC-035','user')` → `completed`.

## Notas TC-036..TC-044 (Checklist Impressão 80mm — IMPLEMENTADO)

- **TC-036 (comanda produção sem preços)**: modal de comanda em `Comandas.tsx` reescrito — BARIZE, "Comanda de Produção", classe `comanda-print`, SEM preços/total nos itens, obs ("Obs:") em destaque.
- **TC-037 (corte parcial)**: `\x1d\x56\x01` + 3 feeds `\n\n\n` já presentes em comanda e fechamento (confirmado, vindo do TC-034).
- **TC-038 (gaveta RJ11)**: `ABRIR_GAVETA = b"\x1b\x70\x00\x19\xfa"` adicionado como PRIMEIRO byte do buffer de fechamento ESC/POS.
- **TC-039 (QR PIX)**: `gerar_payload_pix()` (CRC-16/CCITT, TLV, txid, valor) + `formatar_qr_escpos()` (GS ( k modelo 2) no worker; QR inserido no fechamento quando `forma_pagamento=="pix"` e há `PIX_CHAVE`; lado texto renderiza "[ QR CODE PIX ]" + payload. Frontend: `QRCodePix.tsx` (gerador PIX JS + placeholder QR grid) usado no `CupomPDV.tsx`. Config `PIX_CHAVE/PIX_NOME_RECEBEDOR/PIX_CIDADE` em config.py.
- **TC-040 (fila + Reenviar)**: `GET /admin/printer-fila?status=` e `POST /admin/printer-fila/{id}/reenviar` (zera tentativas, limpa erro, volta PENDENTE; 404 se inexistente) + schema `FilaImpressaoItem` + UI na aba Impressoras.
- **TC-041 (CSS print)**: `index.css` consolidado — 3 blocos `@media print` duplicados → 1 único (80mm), `@page { size:80mm auto }` global + `@page ficha-a4` com `page: ficha-a4` para `.ficha-print` (A4 não sobrescreve 80mm).
- **TC-042 (aba Impressoras)**: Admin.tsx aba `impressoras` — chip setores + select CAIXA/COZINHA/BAR, form tipo/host/porta/baud/timeout/ativo, checar status DLE EOT, testar, salvar via `adminService` (getPrinterConfigs, getPrinterStatus, reenviarFila, createPrinterConfig).
- **TC-043 (emulador CLI)**: `worker/emulador_escpos.py` — CLI (`--comanda/--qtd/--obs/--fechamento/--raw/--colunas`), `limpar_comandos_escpos()` (regex binários → rótulos "CORTE PARCIAL", remove `\x1b[^\n]{1,6}`/`\x1d[^\n]{1,20}`), `renderizar_ascii()` 48 col centralizado, serrilhado `~`.
- **TC-044 (visualizador 80mm)**: `Visualizador80mm.tsx` com serrilha lateral/inferior (`.print-serrilha`/`.print-serrilha-bottom` no index.css) envolvendo `CupomPDV`; usado no PDV.tsx no modal "Preview Cupom 80mm".
- **Backend**: config.py ganhou `PRINT_*` + `PIX_*`; `import os` removido (F401).
- **Validação**: smoke `smoke_tc037_039.py` 18/18 PASS e `smoke_tc040.py` 12/12 PASS (removidos após passar); `tsc -b` OK; `npm run build` OK; `npm run lint` 0 erros. Ruff apenas I001 pré-existente.
- **Em 2026-08-08**: transições batch `tc036-044-analyzing.mjs`→`tc036-044-ready.mjs`→`tc036-044-executing.mjs`(user)→`tc036-044-verify.mjs`(qa-engineer→gate). TC-036..TC-044 `verified` aguardando usuário finalizar (completeTask 'user').

## Notas TC-045 (Cancelar pedido no Painel — Dashboard)

- **Pedido do usuário**: "criar opção no painel de cancelar pedido" — clarificado via pergunta → **Dashboard (Painel tempo real)**.
- **Backend** (`routers/pedidos.py`): `valid_status` ampliado para incluir `"Cancelado"` no `PATCH /pedidos/{id}/status`. Pedido cancelado sai de `GET /pedidos/ativos` (filtra Novo/Preparando) e aparece com filtro `status=Cancelado` na listagem.
- **Frontend**:
  - `types/index.ts`: `PedidoStatus` inclui `'Cancelado'`.
  - `OrderCard.tsx`: `STATUS_CONFIG` adiciona Cancelado (badge error); prop `onCancel`; botão "Cancelar Pedido" (error) visível em Novo/Preparando/Pronto; rodapé mostra "Pedido cancelado" quando status Cancelado.
  - `Dashboard.tsx`: estado `cancelarPedido`/`motivoCancelamento`/`cancelando`; `handleCancelarPedido` chama `pedidosService.atualizarStatus(id,'Cancelado')` + reload; modal de confirmação com aviso (id/mesa/cliente/nº itens) + textarea motivo opcional + botão vermelho "Confirmar Cancelamento".
  - `Comandas.tsx`: `statusConfig` adiciona Cancelado (ícone X, cor error) + filtro "Cancelado".
- **Validação**: smoke backend 6/6 PASS (status inválido→400, cancelar→200, response status Cancelado, fora de ativos, filtro Cancelado listado, 401 sem token); `tsc -b` OK; `npm run build` OK; `npm run lint` 0 erros (5 warnings pré-existentes).
- **Escopo**: cancelamento de pedido KDS em aberto NÃO estorna estoque (baixa só ocorre em `/pdv/finalizar-comanda`).
- **Em 2026-08-08**: backlog→analyzing→ready→executing(user)→testing(qa-engineer)→verified(gate). **Finalizado pelo usuário em 2026-08-08 (completeTask 'user').**

## Notas TC-046 (Tema claro/escuro sem mudar a interface)

- **Pedido do usuário**: "opção de tema claro e escuro do sistema sem mudar a interface do sistema" — o toggle deve existir no layout atual (Sidebar/Login) e a troca é exclusivamente de cores.
- **Tokens**: o sistema usa design tokens via Tailwind `@theme` (`--color-*` → `var(--color-*)`). Não havia suporte a `prefers-color-scheme`/`data-theme`.
- **Abordagem**: 3 variáveis semânticas novas no `:root` (dark default): `--overlay-rgb:255,255,255` (textos/hovers sobre overlay), `--glass-rgb:28,27,27` (fundo vidro/glass), `--neutral-rgb:59,73,76` (tons neutros). Em `:root[data-theme='light']`: `--overlay-rgb:0,0,0`, `--glass-rgb:255,255,255`, `--neutral-rgb` inalterado, + override completo da paleta clara (surfaces, on-surface, outline, primary/secondary/tertiary/error containers, background).
- **Batch substituição**: ~164 usos `rgba(255,255,255,…)` + `rgba(28,27,27,…)`(4) + `rgba(59,73,76,…)`(18) nos tsx/ts → `rgba(var(--overlay-rgb)/--glass-rgb/--neutral-rgb,…)`. Variantes cobertas: overlay 0.03/0.04/0.05/0.06/0.08/0.10/0.15/0.02; glass 0.6/0.85/0.9; neutral 0.1/0.2/0.3/0.4. **3 usos mantidos intencionais**: CardapioDigital backdrop `rgba(0,0,0,0.6)` sobre imagem, Dashboard sombra inset `rgba(0,0,0,0.5)`, Etiquetas preview `bg-white`/`border rgba(0,0,0,0.1)` (papel de impressão branco em qualquer tema).
- **Arquivos**: `index.html` (script anti-FOUC inline lê `localStorage['barize-theme']` e seta `data-theme`), `index.css` (tokens + override light + `.ghost-border`/autofill/scrollbar-track com vars), novos `hooks/useTheme.ts` (getInitialTheme/applyTheme/toggleTheme, key `barize-theme`) e `components/ThemeToggle.tsx` (Sol/Lua, prop `collapsed`), wiring em `layouts/Sidebar.tsx` (rodapé antes do perfil) e `pages/Login.tsx` (header, ícone-only).
- **Validação**: `tsc -b` OK; `npm run lint` 0 erros (5 warnings pré-existentes); `npm run build` OK; smoke browser CDP 12/12 PASS (data-theme default dark → toggle light → localStorage persiste → reload mantém → color-scheme light → tokens --color-primary #006874 e --overlay-rgb 0,0,0 → toggle volta dark → tokens restaurados).
- **Em 2026-08-08**: backlog→analyzing→ready→executing(user, aprovado)→testing(qa-engineer)→verified(gate). **Finalizado pelo usuário em 2026-08-08 (completeTask 'user').**

## Notas TC-047 (Área de Responsável na etiqueta)

- **Pedido do usuário**: "na área de etiquetas - inserir área de responsável" — a etiqueta 80mm de insumo deve conter o nome de quem é responsável.
- **Mudanças**:
  - `InsumoEtiquetaModal.tsx`: `EtiquetaForm` ganhou `responsavel` (emptyForm = ''); input "Responsável" (ícone Package) após Categoria.
  - `Label80mm.tsx`: prop `responsavel`; nova seção 6 "RESPONSÁVEL" (label + nome uppercase) entre o destaque de validade/código de barras e o rodapé; renderiza só quando preenchido.
  - `Etiquetas.tsx`: `useAuth()` adicionado; `responsavel: usuario?.nome` pré-preenchido tanto no botão "Nova Etiqueta de Insumo" quanto no "Etiqueta" por item.
- **Escopo**: campo de impressão apenas — NÃO persistido em banco (etiqueta sob demanda).
- **Validação**: smoke browser CDP 9/9 PASS (login → /etiquetas → modal Nova Etiqueta → campo presente + pré-preenchido "Administrador" → preenche Leite Integral/Ana Souza → preview com RESPONSÁVEL + ANA SOUZA + LEITE INTEGRAL); `tsc -b` OK; `npm run lint` 0 erros (5 warnings pré-existentes); `npm run build` OK.
- **Em 2026-08-08**: backlog→analyzing→ready→executing(user, aprovado)→testing(qa-engineer)→verified(gate). **Finalizado pelo usuário em 2026-08-08 (completeTask 'user').**

## Notas TC-049 (Sempre aparecer as categorias cadastradas no dropdown do PDV)

- **Pedido do usuário**: "na área categoria, sempre aparecer as opções de categorias já cadastradas no sistema" — dropdown Categoria do modal Novo/Editar Produto e chips de filtro devem listar TODAS as categorias cadastradas, não apenas as dos produtos carregados.
- **Causa raiz**: `PDV.tsx` derivava categorias de `produtos.map(p => p.categoria)`, limitado ao `limit=50` do `GET /pdv/produtos` — categorias de produtos além dos 50 primeiros ou de produtos desativados não apareciam.
- **Mudanças**:
  - `backend/app/routers/pdv.py`: novo endpoint `GET /pdv/categorias` — lista categorias distintas de produtos ATIVOS (sem paginação), mesmo padrão de `/precificacao/categorias/lista`.
  - `frontend/src/services/api.ts`: `pdvService.categorias()`.
  - `frontend/src/pages/PDV.tsx`: estado `categoriasSistema` carregado no mount via endpoint; `useMemo categorias` agora faz união (produtos carregados + categoriasSistema) e mantém 'all'. Opção '+ Nova Categoria' preservada.
- **Escopo decidido pelo usuário**: dropdown PDV apenas (sem criar tabela de categorias — categorias são strings no Produto).
- **Validação**: py_compile OK; smoke backend GET /pdv/categorias → 200 com token admin e bartender (["Drinks","Cervejas","Bebidas","Porções"]), 401 sem token; `tsc -b` OK; `npm run lint` 0 erros; `npm run build` OK; smoke browser CDP 4/4 PASS (login → /pdv → modal Novo Produto → dropdown com as 4 categorias + '+ Nova Categoria').
- **Em 2026-08-09**: backlog→analyzing→ready→executing(user, aprovado)→testing(qa-engineer)→verified(gate)→completed(user).


## Notas TC-050 (Centralizar card Entrada Manual no Dashboard)

- **Pedido do usuário**: "centralizar o card da área de entrada manual" — tile Entrada Manual do Dashboard ficava colado à esquerda quando a grid de pedidos não estava cheia.
- **Causa raiz**: Dashboard.tsx:392-405 — tile é o último item do grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3; com poucos pedidos ficava na primeira coluna livre à esquerda.
- **Mudanças**:
  - `frontend/src/pages/Dashboard.tsx`: tile Entrada Manual agora em wrapper `col-span-full flex justify-center` com card `w-full max-w-md` — fica centralizado horizontalmente na área de pedidos independente de quantos pedidos existam. Conteúdo interno (círculo + texto) mantém centralização (flex items-center justify-center + text-center). Clique preservado (abre modal Novo Pedido — Entrada Manual).
- **Escopo decidido pelo usuário**: 'Tile centralizado no grid'.
- **Validação**: `tsc -b` OK; `npm run lint` 0 erros; `npm run build` OK; smoke browser CDP 4/4 PASS (login → /dashboard → tile Entrada Manual centralizado diffCenter=2px → clique abre modal Novo Pedido).
- **Em 2026-08-09**: backlog→analyzing→ready→executing(user, aprovado)→testing(qa-engineer)→verified(gate)→completed(user).


## Notas TC-051 (Modelo de etiqueta no Visualizar e Imprimir = Label80mm)

- **Pedido do usuário**: "na área de etiquetas em visualizar e imprimir colocar o modelo da etiqueta igual a do nova etiqueta de insumo 80mm" — preview de impressão deveria usar o modelo oficial Label80mm (BARIZE), não o HTML antigo NEONBAR.
- **Causa raiz**: Etiquetas.tsx:229-260 — modal 'Visualização de Impressão' (botão 'Visualizar e Imprimir') usava card inline NEONBAR (sem código de barras real, sem status colorido, sem responsável).
- **Mudanças**:
  - `frontend/src/pages/Etiquetas.tsx`: import de `Label80mm`; grid do preview (agora grid-cols-1 sm:2 lg:3 justify-items-center) renderiza `<Label80mm>` mapeando EtiquetaItem → props (nome, quantidade, unidade_medida, categoria, codigo_lote, data_fabricacao, data_validade, responsavel=usuario.nome). Botão Imprimir (window.print) e classe print-80mm preservados.
- **Validação**: `tsc -b` OK; `npm run lint` 0 erros (1 warning pré-existente exhaustive-deps em loadEtiquetas); `npm run build` OK; smoke browser CDP 7/7 PASS (login → /etiquetas → 31 itens → Visualizar e Imprimir → 7 Label80mm BARIZE com LOTE/FAB/VAL, 7 códigos de barras CSS, RESPONSÁVEL preenchido, NEONBAR ausente).
- **Em 2026-08-09**: backlog→analyzing→ready→executing(user, aprovado)→testing(qa-engineer)→verified(gate)→completed(user).


## Notas TC-052 (Preview Visualizar e Imprimir mostra apenas uma etiqueta)

- **Pedido do usuário**: "o preview Visualizar e Imprimir deve visualizar apenas uma etiqueta referente ao insumo" — hoje exibia grid com todas as selecionadas.
- **Causa raiz**: Etiquetas.tsx:230-245 — modal 'Visualização de Impressão' renderizava itemsToPrint.map (grid de Label80mm) com todas as etiquetas selecionadas.
- **Mudanças**:
  - `frontend/src/pages/Etiquetas.tsx`: preview agora exibe APENAS `itemsToPrint[0]` (primeiro item selecionado) como Label80mm único, centralizado em container `flex justify-center` com fundo branco. Texto indicativo fixo "1 etiqueta — use Ctrl+P para imprimir". Botão Imprimir (window.print) preservado.
- **Escopo decidido pelo usuário**: 'Primeira selecionada'.
- **Validação**: `tsc -b` OK; `npm run lint` 0 erros (1 warning pré-existente exhaustive-deps); `npm run build` OK; smoke browser CDP 5/5 PASS (login → /etiquetas → selecionar 3 itens (primeiro Cachaça 51) → Visualizar e Imprimir → preview com 1 Label80mm e texto '1 etiqueta').
- **Em 2026-08-09**: backlog→analyzing→ready→executing(user, aprovado)→testing(qa-engineer)→verified(gate)→completed(user).


## Notas TC-053 (Padronizar preview reimprimir comanda — 80mm e fundo branco)

- **Pedido do usuário**: "no menu de ações Rápidas na área de reimprimir comanda padronizar o tamanho da comanda de 80mm e fundo branco" — o modal 'Pré-visualização da Comanda' do Dashboard deveria seguir o padrão térmico 80mm/fundo branco usado nas demais comandas.
- **Causa raiz**: Dashboard.tsx:485-534 — preview do reimprimir era simulador ESC/POS estilizado com fundo preto (`bg-black/80`), cores neon do tema e largura livre, divergente do padrão do projeto (Comandas.tsx:321 `comanda-print w-[80mm] bg-white`, CupomPDV.tsx:41).
- **Mudanças**:
  - `frontend/src/pages/Dashboard.tsx`: preview do modal reimprimir trocou `bg-black/80` por `comanda-print bg-white text-black rounded-sm p-4 font-mono w-[80mm] min-w-[80mm] shrink-0 mx-auto max-h-[340px] overflow-y-auto`; cores neon → tons preto/black-alpha; cabeçalho NEONBAR → BARIZE; texto "Visualização do formato de impressão ESC/POS" → "Visualização do formato de impressão 80mm"; removido o aviso "Esta é uma simulação..." (AC5). Conteúdo (itens, obs, total, taxa, atendente, mesa) preservado.
  - CSS `@media print` (index.css:365-402) já consolidava `.comanda-print` para 80mm/fundo branco — nenhuma mudança necessária.
- **Validação**: `tsc -b` OK; `npm run lint` 0 erros; smoke browser CDP 8/8 PASS (login → /dashboard → REIMPRIMIR → modal com comanda-print, fundo branco, w-[80mm], sem bg-black, sem texto "Esta é uma simulação" → Fechar fecha modal).
- **Em 2026-08-09**: backlog→analyzing→ready→executing(user, aprovado)→testing(qa-engineer)→verified(gate, allTestsPassed:true)→completed(user).


## Notas TC-054 (Barra de rolagem visível na área dos produtos do PDV)

- **Pedido do usuário**: "no menu PDV inserir barra de rolagem na área dos produtos" — o painel de produtos deve ter scrollbar visível e rolar internamente.
- **Causa raiz**: `PDV.tsx:362` já tinha `flex-1 overflow-y-auto min-h-0 scrollbar-visible`, mas NUNCA rolava internamente porque o wrapper `MainLayout.tsx:72` (`<div className="p-lg animate-fade-in">`) crescia com o conteúdo (medido 1025px vs main 743px), delegando o scroll ao `<main>` com barra global invisível.
- **Mudanças**:
  - `frontend/src/layouts/MainLayout.tsx`: wrapper do Outlet ganhou `h-full min-h-0` → o conteúdo passa a ficar contido na altura do `<main>` (`h-[calc(100vh-4rem)] overflow-y-auto`) e cada página passa a gerenciar seu próprio scroll.
  - `frontend/src/pages/PDV.tsx`: painel de venda (linha 379) ganhou `min-h-0 overflow-y-auto` — sem isso o cabeçalho (343px) + rodapé (290px) excediam a altura e o `<main>` voltava a rolar.
- **Validação**:
  - Diagnóstico CDP (diag5): painel produtos rola internamente (ch=433 sh=813), main NÃO rola no PDV, painel venda rola internamente.
  - Smoke funcional 7/7 PASS (painel rolável, main sem scroll no PDV, prods acessíveis, rolagem funcional, Comandas renderiza, Relatorios renderiza).
  - Regressão 14/14 PASS (rotas operacionais via clique NavLink: Comandas/Etiquetas/FichaTécnica/PDV/Estoque/Precificação renderizam sem corte; conteúdo longo — Estoque wrSh=685, Precificação wrSh=1180 — rola no main corretamente).
- **Nota importante**: rotas dentro de `RequireRole` (DRE, Relatorios, Admin) NÃO montam conteúdo no headless (wrapper vazio, chunk lazy nunca requisitado) — confirmado pré-existente (DRE não monta nem sem o fix, stash testado). É limitação do teste CDP com rotas aninhadas, NÃO regressão do TC-054. O smoke 7/7 anterior teve falso positivo em "Relatorios renderiza" (contava botões da sidebar, não o conteúdo do wrapper).
- **Em 2026-08-09**: backlog→analyzing→ready→executing(user, aprovado)→testing(qa-engineer)→verified(gate, allTestsPassed:true). **Finalizado pelo usuário em 2026-08-09 (completeTask 'user') → completed.**

## Notas TC-056 (Contador de pedido nos Pedidos Ativos)

- **Pedido do usuário**: "inserir contador de pedido nos Pedidos Ativos" — clarificado via pergunta → **Ambos**: header global (MainLayout) + footer do Dashboard.
- **Mudanças**:
  - `frontend/src/layouts/MainLayout.tsx`: `activeOrdersCount` deixou de ser hardcoded `useState(12)` (nunca atualizado) e agora é carregado via `pedidosService.listarAtivos()` (`GET /pedidos/ativos`) com polling a cada 15s (useEffect + setInterval, cleanup com `cancelled`). Header `Pedidos Ativos (N)` visível em todas as páginas.
  - `frontend/src/pages/Dashboard.tsx`: footer "Pedidos Ativos" ganhou `<Badge variant="primary">{pedidos.length}</Badge>` ao lado do label (import do componente Badge).
- **Validação**: `tsc -b` OK; `npm run lint` 0 erros (5 warnings pré-existentes); `npm run build` OK; smoke browser CDP 4/4 PASS (form login, header com contador real "Pedidos Ativos (0)" == API /pedidos/ativos, badge no footer = 0). Regressão TC-054 14/14 PASS.
- **Em 2026-08-09**: backlog→analyzing→ready→executing(user, aprovado)→testing(qa-engineer)→verified(gate, allTestsPassed:true). **Finalizado pelo usuário em 2026-08-09 (completeTask 'user') → completed.**

## Notas TC-055 (Calculadora no painel Caixa e no registro de pagamento)

- **Pedido do usuário**: "inserir opção calculadora no painel caixa e no registro e pagamento" — botão Calculadora no painel `/caixa` e no modal "Registrar Pagamento", com botão "Usar resultado" preenchendo o campo Valor.
- **Mudanças**:
  - `frontend/src/components/Calculadora.tsx` (NOVO): modal + display `.text-data-display` + teclado 4x5 (C/±/%/÷/×/−/+/=/decimal) + botões "Apagar"/"Usar resultado"; prop `onResult` opcional.
  - `frontend/src/pages/Caixa.tsx`: botão "Calculadora" (ghost, ícone Calculator) no header do painel + botão `aria-label="Abrir calculadora"` ao lado do Input Valor no modal Registrar Pagamento + `<Calculadora>` standalone (consulta) e com `onResult` (seta `novoPagamento.valor`) no fim do JSX.
- **Bug real de produção descoberto e corrigido (ADR-016)**: `RequireRole` (App.tsx) usava `{children}`, mas rotas via `<Route element={...}>` no react-router v7 NÃO passam children — exigem `<Outlet/>`. Consequência: TODAS as rotas protegidas (/caixa, /cmv, /relatorios, /financeiro, /analise-estoque, /dre, /fornecedores, /admin) nunca renderizavam conteúdo em NENHUM ambiente (o headless só expôs; o ADR-015 classificou como limitação do headless de forma incorreta). Fix: `RequireRole` agora retorna `<Outlet/>` e recebe apenas `roles`. Sem isso o chunk `Caixa.tsx` nunca era requisitado e o smoke não encontrava os botões.
- **Validação**: smoke browser CDP 11/11 PASS (form login, navegação /caixa, botão Calculadora, abre standalone, 20+30=50, caixa aberto, modal Registrar Pagamento, botão calculadora no modal, Usar resultado preenche Valor=125, pagamento registrado); regressão TC-054 14/14 PASS; `tsc -b` OK; `npm run lint` 0 erros (5 warnings pré-existentes); `npm run build` OK.
- **Em 2026-08-09**: backlog→analyzing→ready→executing(user, aprovado)→testing(qa-engineer)→verified(gate, allTestsPassed:true). **Finalizado pelo usuário em 2026-08-09 (completeTask 'user') → completed.**
