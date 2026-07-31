# devops

> **Categoria**: devops
> **Tags**: docker, ci-cd, kubernetes, observability, opentelemetry, gitops, terraform, infrastructure

DevOps e infraestrutura moderna: Docker, CI/CD pipelines, Kubernetes, observabilidade com OpenTelemetry, GitOps, Infrastructure as Code e gerenciamento de secrets.

## Quando Usar

Use ao configurar pipelines de CI/CD, criar Dockerfiles, deployar em Kubernetes, implementar observabilidade, gerenciar infraestrutura como código ou configurar GitOps.

## Docker — Boas Práticas

### Multi-stage Build

```dockerfile
# ===== Estágio 1: Build =====
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN npm run build

# ===== Estágio 2: Runtime (imagem final enxuta) =====
FROM node:22-alpine AS runner
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package.json ./

USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
```

### Dockerfile Checklist

- [ ] Imagem base específica (node:22-alpine, NÃO node:latest)
- [ ] Multi-stage build (separar build de runtime)
- [ ] Usuário não-root (USER appuser)
- [ ] HEALTHCHECK configurado
- [ ] .dockerignore presente (excluir node_modules, .git, dist/*.map)
- [ ] COPY --chown para ownership correto
- [ ] EXPOSE apenas portas necessárias
- [ ] Sem secrets em build args (usar build secrets do Docker)

```dockerignore
node_modules/
.git/
.gitignore
*.md
dist/*.map
.env
.env.*
```

## CI/CD — GitHub Actions

### Pipeline de Qualidade

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:ci
      - run: npm run build

      # SAST + SCA
      - run: npm audit --audit-level=moderate
        continue-on-error: true
      - uses: github/codeql-action/analyze@v3
        with:
          languages: javascript, typescript

      # Docker
      - run: docker build -t app .
      - run: docker scout quickview app # Análise de vulnerabilidades na imagem
```

### Estratégia de Pipeline

```yaml
# Estratégia recomendada:
# 1. PR Check: lint, typecheck, test, build (rápido, <5min)
# 2. Merge Check: PR Check + SAST/SCA + Docker build
# 3. Nightly: Full scan (grype/trivy), dependency audit, SBOM generation
# 4. Release: Build + test + publish (Docker Hub, npm, GH Release)
```

## Kubernetes

### Deployment Pattern

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app
  labels:
    app.kubernetes.io/name: app
    app.kubernetes.io/part-of: my-project
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0     # Zero-downtime deployment
      maxSurge: 1
  selector:
    matchLabels:
      app: app
  template:
    metadata:
      labels:
        app: app
    spec:
      terminationGracePeriodSeconds: 30
      containers:
        - name: app
          image: myregistry/app:latest
          ports:
            - containerPort: 3000
              protocol: TCP
          envFrom:
            - configMapRef:
                name: app-config
            - secretRef:
                name: app-secrets
          resources:
            requests:
              cpu: "250m"
              memory: "256Mi"
            limits:
              cpu: "1"
              memory: "512Mi"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 15
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: app-service
spec:
  selector:
    app: app
  ports:
    - port: 80
      targetPort: 3000
  type: ClusterIP
```

### K8s Checklist

- [ ] Resource requests/limits definidos para todos os containers
- [ ] Liveness + Readiness probes configurados
- [ ] PodDisruptionBudget para mínimo de réplicas disponíveis
- [ ] NetworkPolicy para isolamento de tráfego
- [ ] Secrets via External Secrets Operator ou Vault (não hardcoded)
- [ ] HorizontalPodAutoscaler configurado
- [ ] affinity/anti-affinity para distribuição de pods
- [ ] `terminationGracePeriodSeconds` >= tempo de graceful shutdown
- [ ] ServiceAccount com permissões mínimas (principle of least privilege)

## Observabilidade (OpenTelemetry)

### Instrumentação

```typescript
import { trace, context, Span } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

// Criar spans manuais
const tracer = trace.getTracer('my-service');

async function handleRequest(req: Request) {
  return tracer.startActiveSpan('handle-request', async (span: Span) => {
    span.setAttribute('http.method', req.method);
    span.setAttribute('http.url', req.url);

    try {
      const result = await processRequest(req);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.recordException(err);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw err;
    } finally {
      span.end();
    }
  });
}
```

### Métricas e Logs Estruturados

```typescript
// Métricas com OpenTelemetry
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('my-service');
const requestCounter = meter.createCounter('http.requests.total', {
  description: 'Total HTTP requests',
});

function trackRequest(method: string, status: number) {
  requestCounter.add(1, { method, status });
}

// Logs estruturados (JSON)
const log = {
  level: 'info',
  message: 'Request processed',
  service: 'my-service',
  timestamp: new Date().toISOString(),
  httpMethod: req.method,
  httpStatus: statusCode,
  durationMs: duration,
  traceId: span.spanContext().traceId,
};
```

### Three Pillars of Observability

| Pillar       | Ferramentas                         | O que responder                         |
|-------------|-------------------------------------|----------------------------------------|
| Logs        | ELK, Loki, SigNoz                   | "O que aconteceu?"                     |
| Metrics     | Prometheus, Grafana, Datadog        | "Quantas vezes aconteceu?"             |
| Traces      | Jaeger, Tempo, SigNoz               | "Onde e por que aconteceu?"            |

## GitOps — Flux / ArgoCD

```yaml
# Repositório Git como fonte única da verdade.
# ArgoCD Application manifest
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
spec:
  destination:
    namespace: production
    server: https://kubernetes.default.svc
  source:
    repoURL: https://github.com/org/gitops-config
    path: apps/my-app/overlays/production
    targetRevision: main
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

Boas práticas GitOps:
- Repositório separado para config (app-config) e código (app-code)
- Kustomize ou Helm para gerenciar overlays por ambiente
- PR aprovado = mudança no cluster (não `kubectl apply` manual)
- Image updater automático (Renovate + Flux Image Automation)

## Infrastructure as Code — Terraform

```hcl
terraform {
  required_version = ">= 1.7"
  backend "s3" {
    bucket = "my-tfstate"
    key    = "infra/terraform.tfstate"
    region = "us-east-1"
    # DynamoDB para state locking
    dynamodb_table = "tfstate-lock"
  }
}

# Módulos para reuso
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "my-vpc"
  cidr = "10.0.0.0/16"
  azs  = ["us-east-1a", "us-east-1b"]
}
```

## Secrets Management

```yaml
# Estratégia: NUNCA secrets no repositório
# Desenvolvimento: .env.local (gitignorado) + .env.example
# CI/CD: GitHub Secrets / GitLab CI Variables
# Kubernetes: External Secrets Operator + AWS Secrets Manager / Vault
# Runtime: Variáveis de ambiente injetadas no deploy

# Exemplo: ExternalSecret para Kubernetes
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: app-secrets
spec:
  secretStoreRef:
    name: aws-secretsmanager
    kind: SecretStore
  target:
    name: app-secrets
  data:
    - secretKey: DATABASE_URL
      remoteRef:
        key: production/app/database-url
```

## Checklist DevOps

- [ ] Dockerfile multi-stage, usuário não-root, HEALTHCHECK
- [ ] CI executa lint + typecheck + test + build em todo PR
- [ ] SAST/SCA integrado ao pipeline (CodeQL, npm audit, grype)
- [ ] Docker image escaneada por vulnerabilidades (Docker Scout, Trivy)
- [ ] K8s manifests com resource limits, probes, PDB
- [ ] Observabilidade: traces (OTel), metrics (Prometheus), logs (estruturados)
- [ ] GitOps: repositório separado para config, auto-sync via ArgoCD/Flux
- [ ] IaC: Terraform com remote state + state locking
- [ ] Secrets via External Secrets Operator / Vault (nunca no git)
- [ ] Backup e disaster recovery testados periodicamente
- [ ] SBOM gerado e armazenado para cada release
- [ ] Canary deployments ou blue/green para produção
