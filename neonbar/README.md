# BARIZE 🍸

**ERP profissional para gestão de bares** — do estoque ao fechamento do caixa.

Arquitetura enterprise em Python (FastAPI + PostgreSQL + Docker) com foco em **resiliência**, **integridade de dados** e **operação offline-first**.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Backend | Python 3.12 + FastAPI |
| Database | PostgreSQL 16 (com Alembic) |
| Workers | Docker services independentes |
| Proxy | Nginx (modo quiosque) |
| Impressão | ESC/POS (python-escpos) |
| Logs | Loguru (rotação automática) |
| Auth | JWT + bcrypt + RBAC |

## Arquitetura (6 Pilares)

```
┌─────────────────────────────────────────────────────┐
│                  NEONBAR SYSTEM                       │
├─────────────────────────────────────────────────────┤
│  1. Infraestrutura Física  (UPS, Rede, Climatização) │
│  2. Arquitetura Software    (Docker, Logs, Backup)  │
│  3. Banco de Dados          (PostgreSQL, Alembic)   │
│  4. Integração Hardware     (ESC/POS Worker)        │
│  5. Segurança               (RBAC, Audit, bcrypt)   │
│  6. Operacional             (Caixa, CMV, Alertas)   │
└─────────────────────────────────────────────────────┘
```

## Quick Start

### Desenvolvimento

```bash
# Clone e entre no diretório
cd barize

# Configure ambiente
cp .env.example .env
# Edite JWT_SECRET e POSTGRES_PASSWORD

# Inicie com Docker
docker-compose -f infra/docker-compose.yml up -d

# Execute migrações
docker-compose -f infra/docker-compose.yml exec backend alembic upgrade head

# Popule dados de exemplo
docker-compose -f infra/docker-compose.yml exec backend python -m scripts.seed_data
```

### Acesso

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| Frontend | http://barize.local | admin / admin123 |
| API | http://barize.local/api/v1 | — |
| Docs | http://barize.local/docs | (apenas LAN) |
| PostgreSQL | localhost:5432 | barize / barize_secret |

## Estrutura

```
barize/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI entrypoint
│   │   ├── config.py         # Settings centralizado
│   │   ├── database.py       # PostgreSQL + SQLAlchemy
│   │   ├── models/           # 9 modelos de dados
│   │   ├── schemas/          # Pydantic validation
│   │   ├── routers/          # 7 módulos de API
│   │   ├── services/         # Lógica de negócio
│   │   └── worker/           # Workers de impressão/alertas
│   ├── alembic/              # Migrations
│   ├── Dockerfile            # API container
│   └── Dockerfile.worker     # Worker container
├── infra/
│   ├── docker-compose.yml    # 5 serviços
│   └── nginx/                # Proxy + Kiosk config
├── scripts/
│   ├── backup.sh             # pg_dump automático
│   ├── restore.sh            # Restaura backup
│   ├── setup.sh              # Setup inicial
│   ├── seed_data.py          # Dados de exemplo
│   └── kiosk-mode.ps1        # Modo quiosque Windows
└── docs/
    ├── ARQUITETURA_FISICA.md # Guia de hardware
    └── GO_LIVE_CHECKLIST.md  # Plano de implantação
```

## Endpoints da API

| Grupo | Prefixo | Descrição |
|-------|---------|-----------|
| Auth | `/api/v1/auth` | Login, usuários, RBAC |
| PDV | `/api/v1/pdv` | Vendas, comandas |
| Estoque | `/api/v1/estoque` | Insumos, movimentações |
| CMV | `/api/v1/cmv` | Custos, dashboards |
| Caixa | `/api/v1/caixa` | Abertura/fechamento |
| Relatórios | `/api/v1/relatorios` | Auditoria, alertas |
| Admin | `/api/v1/admin` | Health check, logs |

## Workers

O sistema roda **3 workers independentes** em containers Docker:

- **API** (FastAPI + Uvicorn) — endpoints REST
- **Worker Impressão** — monitora e processa fila ESC/POS
- **Worker Alertas** — verifica estoque mínimo e notifica webhooks

## Licença

Proprietária — André M. França
