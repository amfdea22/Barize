# microsservicos

> **Categoria**: architecture
> **Tags**: microsservicos, saga, grpc, message-broker, api-gateway, distributed-systems

Microsservi�os: bounded context (DDD), comunica��o sync (REST/gRPC) e async (events/messaging), saga pattern, API gateway, service discovery e observabilidade distribu�da.

## Quando Usar

Use ao arquitetar sistemas distribu�dos, dividir monolitos em servi�os, definir comunica��o entre servi�os ou implementar padr�es de resili�ncia.

## Service Boundaries & Bounded Contexts

**Cada microsservi�o = um Bounded Context (DDD)**:

- Modelo de dados independente (schema pr�prio, banco pr�prio)
- Equipe aut�noma (ownership claro)
- Deploy independente (cada servi�o tem seu pipeline)

```
? ERRADO: Servi�o "User" + Servi�o "Order" compartilham banco
? CERTO:  Cada servi�o tem seu banco, comunica��o via API/eventos
```

**Anti-corruption Layer**: traduzir modelos entre contextos

- Servi�o A n�o conhece o modelo interno do Servi�o B
- ACL traduz conceitos na fronteira

## Inter-Service Communication

**Sync (REST/gRPC)** � request/response, baixa lat�ncia:

```protobuf
service OrderService {
  rpc GetOrder(GetOrderRequest) returns (Order) {}
}
```

**Async (Events/Messaging)** � desacoplado, eventual consistency:

```typescript
// Publisher (Order Service)
await broker.publish('order.placed', {
  orderId: '123',
  customerId: '456',
  total: 299.9,
});

// Consumer (Shipping Service)
broker.subscribe('order.placed', async (event) => {
  const address = await getAddress(event.customerId);
  await createShipment(event.orderId, address);
});
```

| Caracter�stica | Sync (REST/gRPC)           | Async (Events)      |
| -------------- | -------------------------- | ------------------- |
| Acoplamento    | Temporal (ambos ativos)    | Espacial + Temporal |
| Consist�ncia   | Forte                      | Eventual            |
| Resili�ncia    | Menor (cascading failures) | Maior (buffer)      |
| Complexidade   | Menor                      | Maior               |

- Preferir async para fluxos de neg�cio longos; sync para queries

## Data per Service

- **Database-per-service**: cada servi�o tem seu pr�prio banco
- **Dados duplicados intencionalmente**: servi�o de pedidos tem c�pia do nome do cliente
- **Sagas** para consist�ncia entre servi�os:

```
Order Service ? Payment Service ? Inventory Service
     �                                �
     ?                                ?
Order confirmed                 Stock reserved
     �
     ?
Se falha ? Compensating transaction (rollback)
```

## Observabilidade Distribu�da

**Logs**: correla��o via `traceId` em toda comunica��o

```
{"level":"error","traceId":"abc123","service":"orders","msg":"payment failed"}
```

**M�tricas**: RED (Rate, Errors, Duration) por servi�o

```prometheus
# HELP http_requests_duration_seconds Request duration by service
http_requests_duration_seconds{service="orders",method="POST",status="200"}
```

**Tracing**: OpenTelemetry para rastrear requests cross-service

- Span por chamada externa (HTTP, gRPC, message broker)
- Propaga��o de contexto via headers (W3C Trace Context)
- Dashboards: Jaeger/Tempo para traces, Grafana para m�tricas

## Saga Pattern

**Coreografia** (cada servi�o reage a eventos):

```
Order ? evento "order.created"
Payment ? reage, processa, emite "payment.completed"
Shipping ? reage a "payment.completed", emite "shipping.created"
```

- Simples, mas dif�cil de rastrear fluxos complexos

**Orquestra��o** (coordenador central):

```
SagaOrchestrator ? "process payment" ? Payment Service
SagaOrchestrator ? "reserve inventory" ? Inventory Service
SagaOrchestrator ? "confirm order" ? Order Service
SagaOrchestrator ? se falha ? "cancel payment" (compensa��o)
```

- Mais controle, mas ponto central de falha

**Regras**:

- Cada step tem a��o + compensa��o (rollback)
- idempotente (pode repetir steps)
- Timeout por step + fallback

## API Gateway & Service Discovery

**API Gateway**:

- Roteamento: `/api/orders/*` ? Order Service
- Cross-cutting: auth, rate limiting, cors, logging
- Request aggregation: 1 request ? m�ltiplos servi�os
- **Ferramentas**: Kong, APISIX, Envoy, AWS API Gateway

**Service Discovery**:

```yaml
# docker-compose
services:
  orders:
    image: orders:latest
    environment:
      - DISCOVERY_URL=http://consul:8500
  consul:
    image: consul:latest
```

- **Client-side**: servi�o consulta registry (Eureka, Consul)
- **Server-side**: load balancer (Kubernetes Service, AWS ALB)
- **Service mesh**: Istio, Linkerd (sidecar proxy gerencia comunica��o)
