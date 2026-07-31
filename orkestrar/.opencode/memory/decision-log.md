# Decision Log

> Architecture Decision Records (ADRs) for this project.

| ID | Date | Decision | Status |
|---|---|---|---|---|
| ADR-007 | 2026-07-28 | ForÃ§ar WindowsSelectorEventLoopPolicy em Windows com Python â‰¥3.12 | Proposto |

## ADR-008: Estratégia de Estabilidade do Backend em Desenvolvimento

- **Data**: 2026-07-28
- **Contexto**: O backend FastAPI (uvicorn) é iniciado manualmente em um shell interativo. Quando o shell/bash tool encerra por timeout, o processo uvicorn é morto, causando erro "Erro ao conectar ao servidor" no frontend. O projeto usa Python 3.14 com venv, SQLite em dev, e o frontend Vite faz proxy para localhost:8000.

- **Decisão**: Adotar uma estratégia híbrida com 3 camadas:

  1. **Script start-dev.ps1** (PowerShell) que inicia o backend como processo detached usando Start-Process -NoNewWindow com logging para arquivo. O script cria o diretório de logs (logs/ local), configura o .venv, e inicia o uvicorn com --reload. O processo pode ser parado com Stop-Process pelo nome.

  2. **Retry/Reconnect no frontend**: Adicionar interceptor no axios (pi.ts) que detecta ERR_CONNECTION_REFUSED / Network Error e tenta reconectar com backoff exponencial (3 tentativas, intervalos de 1s, 2s, 4s). Exibir toast "Servidor reconectando..." durante as tentativas.

  3. **Health check polling**: O frontend passa a fazer polling do endpoint /admin/health a cada 10s. Se falhar, ativa o modo "offline" (exibe banner "Servidor indisponível" e desabilita ações de escrita). Quando o health retorna 200, restaura o funcionamento normal.

  Opções rejeitadas:
  - **nssm (Windows Service)**: Exige instalação global e elevação de admin. Não prático para dev.
  - **Docker**: Já existe Dockerfile, mas --reload não funciona bem com bind mounts no Windows (Watching de arquivos é lento e instável). Reservado para produção.
  - **Windows Scheduled Task**: Muito overhead para dev, sem hot-reload adequado.

- **Consequências**:
  [+]\$ackend sempre disponível durante sessão dev
  [+]\$rontend resiliente a quedas temporárias
  [+]\$hot-reload preservado (uvicorn --reload)
  [+]\$início/parada simples (um script .ps1)
  [-]\$processo detached não é gerenciado visualmente (sem janela)
  [-]\$consumo de recursos mesmo quando não usado (precisa kill manual)
  [-]\$logs vão para arquivo, não para stdout do terminal

- **Status**: Proposto
