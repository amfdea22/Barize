# Decision Log

> Architecture Decision Records (ADRs) for this project.

| ID | Date | Decision | Status |
|---|---|---|---|---|
| ADR-007 | 2026-07-28 | Forçar WindowsSelectorEventLoopPolicy em Windows com Python ≥3.12 | Proposto |
| ADR-009 | 2026-07-31 | Frontend: proibir recursos externos (no-CDN) e constraints de largura (max-w+w-full+mx-*) | Aprovado |
| ADR-010 | 2026-08-06 | finalizar-comanda atômico: commit único (estoque+pagamento+auditoria+pedido) com rollback + validação de range (desconto 0-100, taxa ≥0, quantidade >0) | Aprovado |
| ADR-011 | 2026-08-08 | Tema claro/escuro via design tokens: --overlay-rgb/--glass-rgb/--neutral-rgb + override paleta em :root[data-theme='light'] + toggle persistido em localStorage (barize-theme) — interface inalterada | Aprovado |
| ADR-012 | 2026-08-08 | Etiqueta 80mm de insumo ganha área RESPONSÁVEL (campo no formulário + impressão no Label80mm) — campo de impressão, não persistido em banco; pré-preenchido com usuário logado | Aprovado |
| ADR-013 | 2026-08-09 | Preview de reimprimir comanda no Dashboard padronizado para comanda térmica 80mm fundo branco (classe comanda-print, w-[80mm], bg-white) — substitui simulador ESC/POS com fundo preto, alinhando ao padrão de Comandas.tsx/CupomPDV | Aprovado |
| ADR-014 | 2026-08-09 | Cadeia de altura para scrollbar visível no PDV: wrapper do MainLayout com h-full min-h-0 (conteúdo contido na altura do main) + painel de venda do PDV com min-h-0 overflow-y-auto — painel de produtos (flex-1 overflow-y-auto scrollbar-visible) rola internamente e o main não rola | Aprovado |
| ADR-015 | 2026-08-09 | Limitação do teste CDP headless: rotas aninhadas dentro de <Route element={<RequireRole/>}> (DRE, Relatorios, Admin) não montam o chunk lazy (wrapper vazio, sem requisição ao chunk) — comportamento pré-existente, NÃO causado por mudanças de layout; regressão dessas páginas deve ser validada manualmente ou fora do headless | Aprovado |
| ADR-016 | 2026-08-09 | Corrigido bug real de produção no RequireRole: componente usava `{children}` mas é renderizado via `<Route element={...}>` (react-router v7), que NÃO passa children — exige `<Outlet/>`. Resultado: TODAS as rotas protegidas (/caixa, /cmv, /relatorios, /financeiro, /analise-estoque, /dre, /fornecedores, /admin) nunca renderizavam conteúdo em nenhum ambiente (não era limitação do headless como assumido no ADR-015). Fix: App.tsx `RequireRole` agora retorna `<Outlet/>` e recebe só `roles`. Descoberto durante smoke do TC-055 | Aprovado |

## ADR-008: Estrat�gia de Estabilidade do Backend em Desenvolvimento

- **Data**: 2026-07-28
- **Contexto**: O backend FastAPI (uvicorn) � iniciado manualmente em um shell interativo. Quando o shell/bash tool encerra por timeout, o processo uvicorn � morto, causando erro "Erro ao conectar ao servidor" no frontend. O projeto usa Python 3.14 com venv, SQLite em dev, e o frontend Vite faz proxy para localhost:8000.

- **Decis�o**: Adotar uma estrat�gia h�brida com 3 camadas:

  1. **Script start-dev.ps1** (PowerShell) que inicia o backend como processo detached usando Start-Process -NoNewWindow com logging para arquivo. O script cria o diret�rio de logs (logs/ local), configura o .venv, e inicia o uvicorn com --reload. O processo pode ser parado com Stop-Process pelo nome.

  2. **Retry/Reconnect no frontend**: Adicionar interceptor no axios (pi.ts) que detecta ERR_CONNECTION_REFUSED / Network Error e tenta reconectar com backoff exponencial (3 tentativas, intervalos de 1s, 2s, 4s). Exibir toast "Servidor reconectando..." durante as tentativas.

  3. **Health check polling**: O frontend passa a fazer polling do endpoint /admin/health a cada 10s. Se falhar, ativa o modo "offline" (exibe banner "Servidor indispon�vel" e desabilita a��es de escrita). Quando o health retorna 200, restaura o funcionamento normal.

  Op��es rejeitadas:
  - **nssm (Windows Service)**: Exige instala��o global e eleva��o de admin. N�o pr�tico para dev.
  - **Docker**: J� existe Dockerfile, mas --reload n�o funciona bem com bind mounts no Windows (Watching de arquivos � lento e inst�vel). Reservado para produ��o.
  - **Windows Scheduled Task**: Muito overhead para dev, sem hot-reload adequado.

- **Consequ�ncias**:
  [+]\$ackend sempre dispon�vel durante sess�o dev
  [+]\$rontend resiliente a quedas tempor�rias
  [+]\$hot-reload preservado (uvicorn --reload)
  [+]\$in�cio/parada simples (um script .ps1)
  [-]\$processo detached n�o � gerenciado visualmente (sem janela)
  [-]\$consumo de recursos mesmo quando n�o usado (precisa kill manual)
  [-]\$logs v�o para arquivo, n�o para stdout do terminal

- **Status**: Proposto

## SDD-001: Recuperar Imagens e Funcionalidades do Menu Comandas

- **Data**: 2026-07-30
- **Contexto**: O menu Comandas (KDS) não exibe imagens dos produtos, não possui botões de ação para avançar status (Novo → Preparando → Pronto → Entregue), e não tem ordenação inteligente ou auto-refresh.
- **Decisão**: Implementar apenas no front-end (`Comandas.tsx`) sem alterações no backend:
  1. Lookup table em memória (`produtosLookup`) para mapear `nome → foto_url/imagem`
  2. Thumbnails nos itens expandidos com fallback `foto_url → imagem → ícone`
  3. Botões contextuais de status por status atual do pedido
  4. Ordenação: Pronto > Preparando > Novo > Entregue
  5. Auto-refresh a cada 15s
- **Consequências**: [+] Zero mudanças no backend, [+] Padrão consistente com PDV, [-] Dados de imagem podem ficar defasados se produtos forem alterados entre refreshes
- **Status**: Proposto (SDD-001 em draft)

## SDD-002: Recuperar Registros e Imagens no Sistema

- **Data**: 2026-07-30
- **Contexto**: Auditoria completa revelou que 8 produtos existem com emoji mas sem `foto_url`. 52 imagens em `uploads/` sem associação. 4 endpoints e 5 páginas frontend sem exibição de imagens. Scripts apontam para DB errado.
- **Decisão**: Abordagem em 4 fases — (1) corrigir backend + scripts, (2) corrigir types TS, (3) adicionar thumbnails nas páginas, (4) criar UI Admin para vincular imagens. Componente `ProductThumbnail` compartilhado com fallback de 3 níveis.
- **Consequências**: [+] Consistência visual entre todos os módulos, [+] Imagens reais nos produtos, [+] Scripts funcionam de qualquer diretório, [-] Requer execução manual do `assign_images.py`
- **Status**: Implementado (commit 5261681)

## Checklist Profissional por Período e Fluxo

- **Data**: 2026-07-30
- **Contexto**: O menu "POP's" tinha apenas 2 itens seedados e a lógica de pendências ignorava a frequência (itens semanais/mensais apareciam como pendentes todo dia). Necessidade de um checklist completo e profissional para o operacional do bar.
- **Decisão**: Estruturar o módulo como checklist por período (Diário 47 / Semanal 20 / Mensal 12 = 79 itens), com adaptação por fluxo do estabelecimento (Baixo/Médio/Alto). Mudanças: (1) colunas novas `momento`, `exigencia_fluxo` (JSON) e `ordem` no model POP + ALTER TABLE em database.py; (2) schema Pydantic criado (schemas/pop.py — módulo era o único sem schema); (3) `GET /pops/pendentes` corrigido para calcular vencimento por frequência (diário=1, semanal=7, mensal=30 dias) e filtros `?fluxo=` e `?frequencia=`; (4) seed idempotente `scripts/seed_pops.py`; (5) UI POPs.tsx refatorada com abas por período, seções por setor/momento, seletor de fluxo (persistido em localStorage), modal de execução com "feito por"+observação e barras de progresso.
- **Consequências**: [+] Checklist operacional completo e padronizado, [+] Pendências calculadas corretamente por vencimento, [+] Adaptação por fluxo sem duplicação de itens, [-] Colunas novas exigem ALTER TABLE em bancos existentes (feito via database.py init_db), [-] Fluxo é preferência local (localStorage), não por estabelecimento no servidor
- **Status**: Implementado

## ADR-009: Regras de Frontend — No External Resources e Layout Constraints

- **Data**: 2026-07-31
- **Contexto**: Dois tipos de bug recorrentes no frontend: (1) recursos externos (CDN/APIs de terceiros) que quebram sem internet — TC-001 (imagens do login) e TC-019 (QR code via api.qrserver.com); (2) classes de largura `max-w` combinadas com `w-full` e `mx-*` no mesmo elemento, causando overflow horizontal e conteúdo espremido/cortado em viewports pequenos — TC-001 (login) e TC-019 (modal do QR). Ambos os problemas se repetiram porque não havia regra formalizada.
- **Decisão**:
  1. **NUNCA** referenciar URLs externas para recursos essenciais no frontend (`<img src="https://...">`, `<script>`, `<link>`, APIs de QR, fontes). Servir localmente: imagens em `backend/app/uploads/`, QR gerado com lib `qrcode`, ícones com `lucide-react`. Regra: `orkestrar/.opencode/rules/frontend-no-external-resources.md`.
  2. **NUNCA** combinar `max-w-*` + `w-full` + `mx-*` no mesmo elemento. Para limitar largura: usar `w-full min-w-0 max-w-*` em container **sem** margens laterais, centralizado via wrapper `flex min-h-full items-center justify-center p-4` (padrão `Modal.tsx`). Regra: `orkestrar/.opencode/rules/frontend-layout-constraints.md`.
  3. Verificação manual no Validation Gate via grep (ver seção "Verificação" de cada regra), pois oxlint não cobre CSS classes.
- **Consequências**: [+] Frontend funciona offline, [+] Sem conteúdo cortado/espremido em qualquer viewport, [+] Regras documentadas impedem reincidência, [-] Verificação é manual (grep), não automatizada no lint
- **Status**: Aprovado (regras criadas e referenciadas no AGENTS.md)

## ADR-010: Etiqueta de Insumo no Menu Comanda (TC-026) e Tamanho de Imagens (TC-009)

- **Data**: 2026-08-06
- **Contexto**: O usuário reportou "a comanda não mudou de designer". Diagnóstico @ui-designer: TC-026 estava especificado mas nunca implementado — `Comandas.tsx` nunca teve commit de etiqueta; o único template existia em `Etiquetas.tsx` com branding antigo NEONBAR e em outra rota. Paralelamente, TC-009: nomes de produtos eram cortados/sobrepostos pela imagem (CardapioDigital sobrepunha nome sobre gradiente da imagem).
- **Decisão** (TC-026):
  1. Botão **"Nova Etiqueta de Insumo"** (`Tag`) no header de Comandas ao lado de "Atualizar" (`RefreshCw`).
  2. Card de comanda redesenhado: faixa de status lateral colorida, thumbnail do 1º item (`ProductThumbnail size="lg"`), identidade (Mesa/Cliente/itens com MapPin/User/ShoppingCart), total em mono + Timer de preparo, footer 3 ações (Editar/Ver/Etiqueta).
  3. Modal 2 colunas **Form | Preview 80mm ao vivo** (`components/etiqueta/InsumoEtiquetaModal.tsx`) pré-preenchido pelo 1º item quando acionado pelo footer do card.
  4. Template térmico **`Label80mm.tsx`**: largura `w-[80mm]` (sem max-w/w-full/mx juntos), header BARIZE, `3x NOME`, LOTE/FAB/VAL, bloco VALIDADE dinâmico (VENCIDO=VENCIDO/dentro de 7 dias=VENCE EM N DIAS/OK, cores #dc2626/#b45309/#16a34a), código de barras CSS puro (`repeating-linear-gradient`, zero deps), rodapé. Print via `@page size 80mm auto` + `.print-80mm` isolado (visibility hidden) no `index.css`.
  5. **Backend: zero** — reutiliza `lotes.py` (CRUD `/lotes/`, roles admin/gerente) e `etiquetas.py`.
- **Decisão** (TC-009):
  1. CardapioDigital: nome/descrição/preço movidos para área própria `p-3` abaixo da imagem (`break-words`), imagem `aspect-[16/10]` (antes `aspect-[4/3]` com gradiente sobreposto).
  2. PDV: nome `truncate` → `break-words leading-snug`.
- **Consequências**: [+] Mudança visível imediata no menu Comanda, [+] Etiqueta imprimível em impressora térmica 80mm, [+] Nomes de produtos 100% visíveis, [+] Sem dependências externas, [-] Imagem de referência `ui/comanda/Comanda.jpg` não lida pelo modelo (sem visão) — validação visual manual pendente
- **Status**: Implementado (build + lint OK, 0 erros; 3 warnings pré-existentes missing-deps)

## ADR: Cancelamento do TC-049

- **Data**: 2026-08-08
- **Contexto**: Card criado como "no menu ficha técnica, inserir opção de editar ficha técnica", duplicado do TC-048
- **Decisão**: Cancelado — TC-048 já implementa edição de ficha técnica (botão Editar + modal via PUT /pdv/produtos/{id}/ficha-tecnica) e está completed
- **Consequências**: [+]$'backlog limpo', [-]$'nenhuma' 
- **Status**: Cancelado


## ADR: Cancelamento do TC-050 (desfeito pelo usuário)

- **Data**: 2026-08-09
- **Contexto**: Card "centralizar o card da área de entrada manual" foi implementado e concluído (tile Entrada Manual centralizado no Dashboard via col-span-full + flex justify-center). Usuário pediu para desfazer.
- **Decisão**: Reverter o código no `Dashboard.tsx` (tile Entrada Manual de volta ao estado original do grid) e mover o card TC-050 para `cancelled/` com status `cancelled`, preservando histórico.
- **Consequências**: [+] Código revertido (git diff limpo em Dashboard.tsx), [+] Histórico preservado em cancelled/, [-] Centralização perdida
- **Status**: Cancelado
