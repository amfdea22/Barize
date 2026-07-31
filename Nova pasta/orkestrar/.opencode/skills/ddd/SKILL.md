# ddd

> **Categoria**: architecture
> **Tags**: ddd, domain-driven-design, aggregates, domain-events, repositories, typescript

Domain-Driven Design: ubiquitous language, bounded context, aggregates, value objects, domain events, repositories, services. Aplica��o pr�tica em TypeScript/Node.js.

## Quando Usar

Use ao modelar dom�nios complexos, definir bounded contexts, projetar aggregates ou implementar DDD em TypeScript.

## Building Blocks

**Value Objects** (imut�veis, comparados por valor):

```typescript
export class Email {
  private constructor(readonly value: string) {}
  static create(raw: string): Result<Email> {
    if (!raw.includes('@')) return fail('Invalid email');
    return ok(new Email(raw.toLowerCase()));
  }
  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

**Entities** (mut�veis, comparados por identidade):

```typescript
export class User {
  constructor(
    readonly id: UserId,
    private name: string,
    private email: Email,
  ) {}
  changeName(name: string) {
    this.name = name;
  }
}
```

**Aggregates** (unidade de consist�ncia transacional):

- Entidade raiz com `id` global, protege invariantes
- Acesso apenas via Aggregate Root
- Refer�ncias a outros aggregates por ID, n�o por objeto

## Bounded Contexts

```
+-----------------+     +-----------------+
�   Sales Context  �     �  Shipping Context �
�   (Order, Cart)  �----?�  (Package, Label) �
+-----------------+     +-----------------+
```

- **Cada contexto tem seu pr�prio modelo**: `Order` no Sales ? `Order` no Shipping
- **Mapa de contextos**: Core (vantagem competitiva), Supporting (apoio), Generic (commodity)
- **Comunica��o**: eventos de integra��o entre contextos
- **Anti-corruption layer**: traduzir modelos em fronteiras
- **Linguagem ub�qua**: time de neg�cio + tech usam os mesmos termos

## Domain Events

```typescript
export interface DomainEvent {
  occurredAt: Date;
  eventName: string;
}

export class OrderPlaced implements DomainEvent {
  readonly occurredAt = new Date();
  readonly eventName = 'order.placed';
  constructor(
    readonly orderId: string,
    readonly customerId: string,
    readonly total: number,
  ) {}
}

// Publica��o no aggregate root
export class Order extends AggregateRoot {
  place(): void {
    // valida��es do dom�nio
    this.addDomainEvent(new OrderPlaced(this.id, this.customerId, this.total));
  }
}
```

- Eventos representam fatos passados (nome no passado: `OrderPlaced`)
- Handler nunca deve modificar o mesmo aggregate que gerou o evento
- Sincronizar dentro do mesmo contexto, ass�ncrono entre contextos

## Repositories

```typescript
// Interface no dom�nio, implementa��o na infra
export interface OrderRepository {
  save(order: Order): Promise<void>
  findById(id: OrderId): Promise<Order | null>
  findByCustomerId(customerId: string): Promise<Order[]>
}

// Implementa��o concreta (infra/data-access)
export class PostgresOrderRepository implements OrderRepository {
  constructor(private db: Pool) {}

  async save(order: Order): Promise<void> {
    // Mapear aggregate ? rows SQL
    const events = order.pullDomainEvents()
    await this.db.transaction(async (tx) => {
      await tx.query('INSERT INTO orders ...', [order.id, ...])
      await tx.query('INSERT INTO outbox ...', [events])
    })
  }
}
```

- Repository por aggregate, nunca por tabela
- Salvar aggregate + domain events em transa��o �nica (outbox pattern)
- Repository retorna aggregates inteiros, n�o DTOs

## Application Services

```typescript
// Caso de uso (orquestra��o)
export class PlaceOrderUseCase {
  constructor(
    private orderRepo: OrderRepository,
    private productRepo: ProductRepository,
    private eventBus: EventBus,
  ) {}

  async execute(dto: PlaceOrderDTO): Promise<Result<OrderDTO>> {
    const products = await this.productRepo.findByIds(dto.productIds);
    if (products.length !== dto.productIds.length) {
      return fail(new NotFoundError('Some products not found'));
    }

    const order = Order.create({
      customerId: dto.customerId,
      products: products.map((p) => ({ id: p.id, price: p.price })),
    });

    if (order.isFail) return fail(order.error);

    await this.orderRepo.save(order.value);
    await this.eventBus.publish(order.value.pullDomainEvents());

    return ok(orderToDTO(order.value));
  }
}
```

- **Use cases**: 1 classe por caso de uso (SRP)
- **Services de dom�nio**: l�gica que n�o cabe em aggregate/value object
- **Services de aplica��o**: orquestra��o, sem regras de neg�cio

## DDD em TypeScript

**Pasta recomendada**:

```
src/
+-- context/
�   +-- orders/
�       +-- domain/
�       �   +-- order.ts          (aggregate)
�       �   +-- order-id.ts       (value object)
�       �   +-- order-repository.ts (interface)
�       �   +-- events/
�       +-- application/
�       �   +-- place-order.usecase.ts
�       +-- infra/
�           +-- postgres-order-repository.ts
```

- **Ferramentas**: `ts-pattern` para pattern matching, `zod` para valida��o
- **CQRS opcional**: commands para escritas, queries para leitura
- **Result pattern**: `Result<T, E>` em vez de exce��es (previs�vel)
- **Pasta `domain/` n�o deve importar nada de `infra/` ou `application/`**
