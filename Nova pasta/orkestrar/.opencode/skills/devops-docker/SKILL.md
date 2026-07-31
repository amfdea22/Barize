# devops-docker

> **Categoria**: devops
> **Tags**: docker, compose, ci-cd, github-actions, containers, infra

DevOps e infraestrutura: Docker, Docker Compose, CI/CD com GitHub Actions, boas práticas de containerização.

## Quando Usar

Use ao containerizar aplicações, configurar pipelines de CI/CD, escrever Dockerfiles ou gerenciar infraestrutura.

## Dockerfile — Boas Práticas

```dockerfile
# Multi-stage build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER node  # non-root
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

- Imagens pequenas: alpine ou distroless
- `USER node`: não rodar como root
- `COPY --chown=node:node` para permissões corretas
- Labels: `org.opencontainers.image.source`, `version`

## Docker Compose

```yaml
version: '3.9'
services:
  app:
    build: .
    ports: ['3000:3000']
    depends_on: [db, redis]
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/myapp

  db:
    image: postgres:16-alpine
    volumes: ['pgdata:/var/lib/postgresql/data']
    environment:
      POSTGRES_DB: myapp
      POSTGRES_PASSWORD: ${DB_PASSWORD}

volumes: { pgdata }
```

## GitHub Actions CI/CD

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

## Infra as Code

- **Terraform/OpenTofu**: provisionamento declarativo
- **Docker Compose**: ambientes multi-container locais
- **Kubernetes**: orquestração em produção (se necessário)
- **Helm**: packages Kubernetes
- **Ansible**: configuração de servidores (se sem containers)

## Segurança em Containers

- Scan com `trivy` ou `grype` para vulnerabilidades
- `docker scout` para análise de imagens
- .dockerignore para evitar secrets no build
- Secrets via Docker secrets ou variáveis de ambiente (nunca no Dockerfile)
- Read-only root filesystem: `readOnly: true`
- Resource limits: `--memory`, `--cpus`
