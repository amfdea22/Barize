# event-driven

> **Categoria**: architecture
> **Tags**: event-driven, cqrs, event-sourcing, kafka, rabbitmq, saga

Event-Driven Architecture: event sourcing, CQRS, message brokers (Kafka/RabbitMQ/Redis), CloudEvents, eventual consistency, exactly-once/at-least-once delivery, idempotency, saga/choreography.

## Quando Usar

Use ao projetar sistemas orientados a eventos, implementar CQRS, configurar message brokers, lidar com consist�ncia eventual ou modelar sagas/coreografias.

## Core Concepts (Events, Commands, Messages)

**Commands**: inten��o (imperativo) � "fa�a algo"

```json
{ "type": "PlaceOrder", "data": { "customerId": "123", "items": [...] } }
```

**Events**: fato consumado (passado) � "algo aconteceu"

```json
{
  "type": "OrderPlaced",
  "data": { "orderId": "456", "total": 299.9 },
  "occurredAt": "2026-07-06T10:00:00Z"
}
```

**Messages**: transporte neutro (pode ser command ou event)

**CloudEvents** (padr�o CNCF para schema de eventos):

```json
{
  "specversion": "1.0",
  "type": "com.example.order.placed",
  "source": "/orders/v1",
  "id": "uuid-123",
  "time": "2026-07-06T10:00:00Z",
  "datacontenttype": "application/json",
  "data": { "orderId": "456" }
}
```

## CQRS Pattern

**Command Query Responsibility Segregation**: separa operações de escrita (Commands) e leitura (Queries) em modelos distintos, permitindo otimizar cada lado independentemente.

```
+--------------+     +--------------+
|  Commands    |     |   Queries    |
|  (write)     |     |   (read)     |
+--------------+     +--------------+
| CreateOrder  |     | GetOrder     |
| UpdateOrder  |     | ListOrders   |
| CancelOrder  |     | SearchOrders |
+--------------+     +--------------+
       |                    |
       v                    v
+--------------+     +--------------+
|  Write DB    |---->|  Read DB     |
|  (normalized)|     |  (denormalized)|
+--------------+     +--------------+
```

### Conceitos Base

- **Commands**: alteram estado, retornam void/confirmação, são imperativos ("faça X")
- **Queries**: retornam dados, NÃO alteram estado, perguntam ("me dê X")
- **Write Model**: modelo normalizado para consistência de escrita (ex: 3FN)
- **Read Model**: modelo desnormalizado otimizado para queries específicas
- **Sincronização**: eventos → projeções → read models
- Separar modelos permite escalar leitura e escrita de forma independente

### Command Handlers

Um Command Handler é responsável por validar e executar um comando:

```typescript
// Command object (imutável)
type PlaceOrderCommand = {
  readonly type: 'PlaceOrder';
  readonly data: {
    customerId: string;
    items: Array<{ productId: string; quantity: number }>;
  };
};

// Command Handler
class PlaceOrderHandler {
  async handle(command: PlaceOrderCommand): Promise<OrderPlacedEvent> {
    // 1. Validar
    if (command.data.items.length === 0) throw new Error('Empty order');

    // 2. Executar lógica de negócio
    const order = await Order.create(command.data);

    // 3. Persistir + publicar evento
    await this.orderRepo.save(order);
    const event = new OrderPlacedEvent(order.id, order.total);
    await this.eventBus.publish(event);

    // 4. Retornar confirmação (não dados)
    return event;
  }
}
```

**Regras do Command Handler:**

- NÃO retornar dados de leitura (apenas confirmação ou erro)
- Ser idempotente quando possível (mesmo comando repetido = mesmo resultado)
- Lançar exceção em vez de retornar status error
- Um comando = uma operação atômica

### Query Handlers

```typescript
// Query object
type GetOrderQuery = {
  readonly type: 'GetOrder';
  readonly data: { orderId: string };
};

// Query Handler
class GetOrderHandler {
  async handle(query: GetOrderQuery): Promise<OrderReadModel | null> {
    // Busca direto no read model (tabela otimizada)
    return this.orderReadRepo.findById(query.data.orderId);
  }
}
```

**Regras do Query Handler:**

- NÃO alterar estado (side-effect free)
- Retornar DTOs específicos (não entidades de domínio)
- Pode fazer cache (read models são candidatos naturais a cache)
- Pode ser escalado horizontalmente (read replicas)

### Estratégias de Sincronização Write → Read

| Estratégia                            | Consistência                          | Latência           | Complexidade | Uso                         |
| ------------------------------------- | ------------------------------------- | ------------------ | ------------ | --------------------------- |
| **Event-driven (assíncrono)**         | Eventual                              | ms–s               | Alta         | Alta escala, desacoplado    |
| **Same-transaction**                  | Forte                                 | Imediata           | Baixa        | Monólito, mesmo banco       |
| **Database View / Materialized View** | Forte (view) / Quase-forte (mat view) | Imediata / refresh | Muito baixa  | CQRS mais simples possível  |
| **CDC (Change Data Capture)**         | Eventual                              | ms                 | Média        | Sem modificar app existente |

#### 1. Same-Transaction (CQRS em Monólito)

Útil quando não há necessidade de consistência eventual. Write e Read models no mesmo banco, atualizados na mesma transação:

```typescript
async function placeOrder(command: PlaceOrderCommand): Promise<void> {
  await this.db.transaction(async (tx) => {
    // 1. Write model (normalizado)
    await tx.orderTable.insert({ id, customerId, total, status: 'pending' });
    await tx.orderItemTable.insert(items);

    // 2. Read model (desnormalizado) — mesma transação
    await tx.orderReadModel.upsert({
      id,
      customerId,
      customerName: command.customerName,
      total,
      itemCount: items.length,
      status: 'pending',
    });
  });
}
```

**Prós**: Consistência forte, simplicidade, sem event broker
**Contras**: Acoplamento write/read, não escala leitura independentemente

#### 2. Database Views / Materialized Views (CQRS mais simples)

O banco de dados faz a sincronização automaticamente:

```sql
-- View: sincronizada em tempo real (mesma tabela)
CREATE VIEW order_summary AS
SELECT o.id, o.customer_id, c.name AS customer_name,
       o.total, COUNT(oi.id) AS item_count, o.status
FROM orders o
JOIN customers c ON c.id = o.customer_id
JOIN order_items oi ON oi.order_id = o.id;

-- Materialized View: atualizada sob demanda
CREATE MATERIALIZED VIEW order_dashboard AS
SELECT ...;  -- queries pesadas pré-computadas
REFRESH MATERIALIZED VIEW order_dashboard;  -- manual ou scheduled
```

**Prós**: Zero código de sincronização, consistência forte (view) ou quase-forte (mat view)
**Contras**: View pode ser lenta em dados complexos; mat view requer refresh

#### 3. Event-driven (assíncrono — padrão completo)

Eventos publicados pelo write side são consumidos para atualizar read models:

```typescript
// Write side publica evento
class OrderService {
  async placeOrder(cmd: PlaceOrderCommand): Promise<void> {
    const event = new OrderPlacedEvent({ ... });
    await this.orderRepo.save(event); // event store
    await this.eventBus.publish(event);
  }
}

// Read side projeta evento
class OrderProjection {
  async onOrderPlaced(event: OrderPlacedEvent): Promise<void> {
    const readModel = {
      id: event.data.orderId,
      customerId: event.data.customerId,
      total: event.data.total,
      status: 'pending',
      createdAt: event.occurredAt,
    };
    await this.readRepo.upsert(readModel);
  }
}
```

### CQRS sem Event Sourcing

Muitas implementações CQRS usam **event sourcing**, mas os dois padrões são independentes. CQRS pode existir sem event sourcing:

| Combinação                  | Write Model                        | Read Model            | Sincronização               |
| --------------------------- | ---------------------------------- | --------------------- | --------------------------- |
| **CQRS + Event Sourcing**   | Event store (sequência de eventos) | Projeções dos eventos | Event-driven                |
| **CQRS sem Event Sourcing** | Tabela relacional normalizada      | Tabela desnormalizada | Same-transaction, view, CDC |
| **CQRS híbrido**            | Event store + snapshot             | Materialized views    | Event-driven + refresh      |

**Quando usar CQRS sem Event Sourcing:**

- Time pequeno que precisa dos benefícios de read models otimizados
- Sistema com requisitos de consistência forte
- Não há necessidade de audit trail completo (event sourcing)
- Sistema legado onde introduzir event store é inviável

### Testing CQRS

#### Commands (testar side-effect / estado final)

```typescript
describe('PlaceOrderHandler', () => {
  it('deve criar pedido e publicar evento', async () => {
    const handler = new PlaceOrderHandler(mockRepo, mockBus);

    await handler.handle({ type: 'PlaceOrder', data: { customerId: 'c1', items: [...] } });

    // Assert: estado final do write model
    expect(mockRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'c1', status: 'pending' })
    );
    // Assert: evento publicado
    expect(mockBus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'OrderPlaced' })
    );
  });

  it('deve rejeitar pedido sem items', async () => {
    await expect(
      handler.handle({ type: 'PlaceOrder', data: { customerId: 'c1', items: [] } })
    ).rejects.toThrow('Empty order');
  });
});
```

#### Queries (testar dados retornados)

```typescript
describe('GetOrderHandler', () => {
  it('deve retornar read model', async () => {
    const mockReadRepo = { findById: async () => ({ id: '1', total: 100 }) };
    const handler = new GetOrderHandler(mockReadRepo as any);

    const result = await handler.handle({ type: 'GetOrder', data: { orderId: '1' } });

    expect(result).toEqual({ id: '1', total: 100 });
  });

  it('deve retornar null para pedido inexistente', async () => {
    const mockReadRepo = { findById: async () => null };
    const handler = new GetOrderHandler(mockReadRepo as any);

    const result = await handler.handle({ type: 'GetOrder', data: { orderId: '999' } });

    expect(result).toBeNull();
  });
});
```

#### Projections (testar sincronização)

```typescript
describe('OrderProjection', () => {
  it('deve upsert read model quando evento chega', async () => {
    const projection = new OrderProjection(mockReadRepo);
    const event = new OrderPlacedEvent('order-1', 299.9);

    await projection.onOrderPlaced(event);

    expect(mockReadRepo.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'order-1', total: 299.9, status: 'pending' }),
    );
  });
});
```

### Quando NÃO usar CQRS

| Cenário                            | Motivo                                                     | Alternativa                                      |
| ---------------------------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| **CRUD simples**                   | Mesma representação para leitura e escrita = sem benefício | Repository pattern tradicional                   |
| **Time pequeno (< 5 devs)**        | Complexidade adicional injustificada                       | Três camadas (controller → service → repository) |
| **Consistência forte obrigatória** | CQRS eventual consistency não atende                       | Mesmo banco, mesmo modelo                        |
| **Poucas queries diferentes**      | Read models não trazem ganho                               | Otimizar queries pontualmente                    |
| **Prototype / MVP**                | Overhead de manutenção ~2x mais código                     | Começar simples, refatorar depois                |

### Anti-Patterns

| Anti-pattern                                         | Problema                                                            | Solução                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------- |
| **CQRS sem motivo**                                  | Complexidade desnecessária                                          | Só usar quando há assimetria real entre leitura e escrita |
| **Modelos idênticos**                                | Se write model = read model, não há segregação                      | Repensar se CQRS é necessário                             |
| **Sincronização na mesma transação com acoplamento** | Write e read acoplados no mesmo código                              | Usar views do banco ou eventos                            |
| **Ignorar consistência eventual**                    | Consumidores do read model não sabem que o dado pode estar defasado | Documentar latency, expor metadados (ex: `lastUpdatedAt`) |
| **Command retornando dados**                         | Viola segregação: command que retorna dados vira query também       | Command retorna apenas confirmação/erro                   |
| **Query alterando estado**                           | Viola segregação: query com side-effect                             | Extrair side-effect para comando separado                 |

## Event Sourcing

Em vez de estado atual, armazenar sequ�ncia de eventos:

```sql
-- Event store (exemplo)
CREATE TABLE events (
  aggregate_id UUID NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  version INT NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (aggregate_id, version)
);
```

**Reconstru��o de estado**:

```typescript
class Order {
  private events: DomainEvent[] = [];
  private state: OrderState = { status: 'pending', items: [] };

  static loadFromHistory(events: DomainEvent[]): Order {
    const order = new Order();
    for (const event of events) order.apply(event);
    return order;
  }

  private apply(event: DomainEvent) {
    this.events.push(event);
    // mutate state based on event type
  }
}
```

- **Snapshot**: ap�s N eventos, salvar estado + �ltimo version
- **Projections**: eventos ? read models (tabelas de query)
- **Benef�cios**: audit trail completo, debug temporal, rebuild

## Message Brokers Concepts

| Broker            | Modelo        | Persist�ncia                 | Ordem                  | Caso de Uso                           |
| ----------------- | ------------- | ---------------------------- | ---------------------- | ------------------------------------- |
| **Kafka**         | Log commitado | Disco (configur�vel)         | Garantida por parti��o | Event streaming, alt�ssimo throughput |
| **RabbitMQ**      | Fila/Exchange | Mem�ria/Disco                | N�o garantida          | Task queues, RPC                      |
| **Redis Streams** | Stream        | Mem�ria/Disco                | Garantida              | Cache + messaging leve                |
| **NATS**          | Pub/Sub       | Mem�ria (JetStream opcional) | N�o garantida          | Alta velocidade, baixa lat�ncia       |

**Padr�es de routing**:

- **Point-to-point**: fila ? 1 consumidor (RabbitMQ queues)
- **Pub/Sub**: t�pico ? N consumidores (Kafka consumer groups)
- **Fan-out**: exchange ? todas as filas vinculadas
- **Routing key**: exchange direciona por chave (RabbitMQ direct/topic)

## Event Delivery Guarantees

| Garantia          | Descri��o                   | Como Implementar                            |
| ----------------- | --------------------------- | ------------------------------------------- |
| **At-most-once**  | Pode perder, nunca duplicar | Auto-commit antes de processar              |
| **At-least-once** | Nunca perde, pode duplicar  | Commit ap�s processar, idempot�ncia         |
| **Exactly-once**  | Nunca perde, nunca duplica  | Idempot�ncia + dedup + transactional outbox |

**Idempot�ncia**:

```typescript
async function handleEvent(event: OrderPlaced): Promise<void> {
  // Verificar se j� processou este evento
  const processed = await dedupStore.exists(event.id);
  if (processed) return; // idempotente

  await processOrder(event);
  await dedupStore.mark(event.id); // marca como processado
}
```

**Transactional Outbox**:

- Escrever evento + atualizar banco na mesma transa��o
- Outbox table: `{ id, aggregate_id, event_type, payload, status }`
- Publisher l� outbox e publica no broker

## Error Handling & Retries

**Dead Letter Queue (DLQ)**:

```
Processamento ? erro ? retry (3x com backoff) ? DLQ ? alerta
```

**Retry strategies**:

```yaml
retry:
  max_attempts: 3
  backoff: exponential # 1s, 4s, 9s
  jitter: true # + rand(0, 1s) para thundering herd
  dlq_topic: 'orders.failed.dlq'
```

**Poison message handling**:

- Mensagem que sempre falha
- Identificar por contagem de retries no header
- Mover para DLQ ap�s N tentativas
- Alertar time via monitoramento

**Circuit breaker** para depend�ncias externas:

- Fechado ? aberto (falhas > threshold) ? meio-aberto (teste) ? fechado
- Evita cascading failures em sistemas distribu�dos
