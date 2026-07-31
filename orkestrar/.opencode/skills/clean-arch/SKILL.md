# clean-arch

> **Categoria**: architecture
> **Tags**: clean-architecture, hexagonal, ddd, ports-and-adapters, solid

Clean Architecture e Hexagonal Architecture: entidades, casos de uso, adaptadores de interface, invers�o de depend�ncia, portas e adaptadores, comunica��o entre camadas e estrat�gia de testes.

## Quando Usar

Use ao projetar a arquitetura de um novo servi�o, refatorar sistemas legados com alto acoplamento, ou garantir testabilidade e isolamento de camadas.

## Estrutura em Camadas

Clean Architecture divide o sistema em c�rculos conc�ntricos:

```
+-----------------------------+
�   Frameworks & Drivers      �  -- Infra (DB, HTTP, Queue)
� +-------------------------+ �
� �  Interface Adapters     � �  -- Controllers, Presenters, Gateways
� � +---------------------+ � �
� � �  Application (Use Cases)�  -- Casos de Uso, Orquestra��o
� � � +-----------------+ � � �
� � � �   Domain        � � � �  -- Entidades, Value Objects, Regras
� � � +-----------------+ � � �
� � +---------------------+ � �
� +-------------------------+ �
+-----------------------------+
```

**Regra de Depend�ncia**: depend�ncias APENAS para dentro (nunca para fora).
Camadas externas dependem de internas, nunca o contr�rio.

## Princ�pio da Invers�o de Depend�ncia (DIP)

O DIP � o motor da Clean Architecture:

```
? Acoplamento: Service ? PostgreSQLRepository (concreto)
? DIP: Service ? RepositoryInterface ? PostgreSQLRepository
```

- **M�dulos de alto n�vel** (domain, use cases) NUNCA importam m�dulos de infra
- **Abstra��es** s�o definidas onde s�o USADAS (dom�nio), n�o onde s�o IMPLEMENTADAS (infra)
- Injete depend�ncias no construtor ou via factory pattern

```typescript
// Dom�nio define a abstra��o
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

// Caso de uso usa a abstra��o
export class CreateUserUseCase {
  constructor(private readonly repo: UserRepository) {}

  async execute(input: CreateUserInput): Promise<User> {
    const user = User.create(input);
    await this.repo.save(user);
    return user;
  }
}

// Infra implementa o contrato
export class PostgresUserRepository implements UserRepository {
  async findById(id: string): Promise<User | null> {
    /* SQL */
  }
  async save(user: User): Promise<void> {
    /* SQL */
  }
}
```

## Ports & Adapters (Hexagonal)

**Ports** (interfaces / contratos) � definem como o core se comunica com o mundo externo:

- **Inbound ports**: `CreateUserUseCase` (exposto para controllers)
- **Outbound ports**: `UserRepository`, `EmailSender` (consumido pelo core)

**Adapters** (implementa��es concretas) � conectam o core � infraestrutura:

- **Inbound adapters**: `HttpController`, `QueueConsumer`, `CliHandler`
- **Outbound adapters**: `PostgresUserRepository`, `SmtpEmailSender`, `S3FileStorage`

```
[HTTP Controller] --port--? [CreateUserUseCase] --port--? [UserRepository]
     ?                           ?                          ?
 Inbound Adapter              Core Domain              Outbound Adapter (Postgres)
```

## Comunica��o Entre Camadas

| Dire��o              | Mecanismo                 | Exemplo                                     |
| -------------------- | ------------------------- | ------------------------------------------- |
| Controller ? UseCase | Chama m�todo p�blico      | `createUserUseCase.execute(input)`          |
| UseCase ? Repository | Chama m�todo da porta     | `this.repo.save(user)`                      |
| UseCase ? Entidade   | Cria ou consulta entidade | `User.create(props)`                        |
| Entidade ? UseCase   | Retorna resultado         | `const result = user.changeEmail(newEmail)` |
| UseCase ? Presenter  | Retorna DTO de sa�da      | `return { id: user.id, status: 'created' }` |

**DTOs** (Data Transfer Objects) s�o objetos simples de input/output que cruzam as fronteiras.
Mantenha-os independentes de framework (sem anota��es de ORM ou serializa��o).

## Estrat�gia de Testes

A Clean Architecture foi projetada para testabilidade m�xima:

| Camada                 | O que testar                     | Como                   | Isolamento                    |
| ---------------------- | -------------------------------- | ---------------------- | ----------------------------- |
| **Domain**             | Entidades, Value Objects, regras | Testes unit�rios puros | Nenhum mock necess�rio        |
| **Application**        | Use Cases, orquestra��o          | Testes unit�rios       | Mock apenas portas (outbound) |
| **Interface Adapters** | Controllers, presenters          | Testes de integra��o   | Mock use cases                |
| **Infrastructure**     | Reposit�rios, gateways           | Testes de integra��o   | Banco real ou container       |

```typescript
// Testando use case com mock da porta (outbound)
describe('CreateUserUseCase', () => {
  it('should create a user when valid input is provided', async () => {
    const mockRepo: UserRepository = {
      findById: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const useCase = new CreateUserUseCase(mockRepo);
    const result = await useCase.execute({
      name: 'John',
      email: 'john@test.com',
    });
    expect(result.id).toBeDefined();
    expect(mockRepo.save).toHaveBeenCalledOnce();
  });
});
```

## Exemplo em TypeScript

Estrutura de pastas seguindo Clean Architecture:

```
src/
+-- domain/
�   +-- entities/
�   �   +-- user.ts              ? Entidade com regras de neg�cio
�   +-- value-objects/
�       +-- email.ts             ? Value Object com valida��o
+-- application/
�   +-- ports/
�   �   +-- inbound/
�   �   �   +-- create-user.use-case.ts  ? Interface do caso de uso
�   �   +-- outbound/
�   �       +-- user.repository.ts      ? Interface do reposit�rio
�   +-- use-cases/
�       +-- create-user.use-case.ts     ? Implementa��o do caso de uso
+-- infrastructure/
�   +-- adapters/
�   �   +-- postgres/
�   �       +-- user.repository.ts      ? Implementa��o concreta
�   +-- http/
�       +-- controllers/
�       �   +-- user.controller.ts
�       +-- routes/
�           +-- user.routes.ts
+-- main.ts                              ? Composition root (DI)
```

Composition root: local onde todas as depend�ncias s�o "wired up":

```typescript
const userRepo = new PostgresUserRepository(pool);
const createUser = new CreateUserUseCase(userRepo);
const controller = new UserController(createUser);
```
