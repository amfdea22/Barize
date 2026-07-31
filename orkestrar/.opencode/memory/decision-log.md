# Decision Log

> Architecture Decision Records (ADRs) for this project.

| ID | Date | Decision | Status |
|---|---|---|---|---|
| ADR-007 | 2026-07-28 | Forçar WindowsSelectorEventLoopPolicy em Windows com Python ≥3.12 | Proposto |

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
