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

## Checkpoints

- **2026-07-28 19:33**: Server fix aplicado. `WindowsSelectorEventLoopPolicy` em `main.py`.
- Server aceita conexões em `127.0.0.1:8000`, health check retorna OK, /docs retorna 200.
- 26 tabelas criadas no SQLite.
