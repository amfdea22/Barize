# observability

> **Categoria**: devops
> **Tags**: observability, logging, metrics, tracing, opentelemetry

Observabilidade completa: logging estruturado (Pino), métricas (Prometheus), tracing (OpenTelemetry), dashboards.

## Quando Usar

Use ao configurar monitoramento, implementar logging, adicionar métricas ou tracing distribuído.

## Os 3 Pilares

| Pilar        | Objetivo                       | Ferramentas           |
| ------------ | ------------------------------ | --------------------- |
| **Logging**  | Eventos discretos              | Pino, Winston, Bunyan |
| **Métricas** | Dados agregados no tempo       | Prometheus, StatsD    |
| **Tracing**  | Fluxo de requests distribuídos | OpenTelemetry, Jaeger |

## Logging Estruturado com Pino

```typescript
import pino from 'pino';
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level(label) {
      return { level: label };
    },
  },
});
logger.info({ userId, action }, 'User action logged');
// → {"level":"info","time":...,"userId":"abc","action":"login","msg":"User action logged"}
```

## OpenTelemetry (Tracing)

```typescript
import { trace } from '@opentelemetry/api';
const tracer = trace.getTracer('my-service');

async function handleRequest(req: Request) {
  return tracer.startActiveSpan('handle-request', async (span) => {
    span.setAttribute('http.method', req.method);
    const result = await processRequest(req);
    span.end();
    return result;
  });
}
```

## Métricas com Prometheus

```typescript
import promClient from 'prom-client';
const requestCounter = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total de requests HTTP',
  labelNames: ['method', 'path', 'status'],
});
requestCounter.inc({ method: 'GET', path: '/api/users', status: 200 });
```

## Boas Práticas

- Log em JSON, não texto livre (facilita parsing)
- Incluir `traceId`/`spanId` em cada log para correlação
- NUNCA logar dados sensíveis (senhas, tokens, PII)
- Alertas baseados em métricas, não logs
- Dashboard Grafana com SLOs/SLIs definidos
