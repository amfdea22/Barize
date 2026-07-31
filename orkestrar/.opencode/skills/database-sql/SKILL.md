# database-sql

> **Categoria**: backend
> **Tags**: database, sql, postgresql, indexing, migrations, transactions

Design de banco de dados relacional: schema, índices, queries, otimização, migrations e transactions.

## Quando Usar

Use ao projetar schemas, escrever queries, otimizar performance ou gerenciar migrations de banco de dados relacional.

## Design de Schema

**Normalização** (até 3FN geralmente suficiente):

- 1FN: valores atômicos, sem grupos repetidos
- 2FN: depender da chave completa
- 3FN: depender apenas da chave, não de outras colunas

**Tipos de Dados**:

- UUID para chaves primárias distribuídas
- `serial`/`IDENTITY` para auto-incremento local
- `timestamptz` para timestamps (com fuso horário)
- `text` sobre `varchar(n)` a menos que haja restrição de tamanho
- JSONB para dados semi-estruturados (mas usar colunas normais sempre que possível)

## Indexação

| Tipo de Index | Quando Usar                                 |
| ------------- | ------------------------------------------- |
| **B-tree**    | Default, igualdade e range (>, <, BETWEEN)  |
| **Hash**      | Igualdade exata apenas                      |
| **GIN**       | JSONB, arrays, full-text search             |
| **GiST**      | Geoespacial, full-text search               |
| **BRIN**      | Dados ordenados linearmente (logs por data) |
| **Composite** | Filtros com múltiplas colunas               |

Regras:

- Indexar colunas usadas em WHERE, JOIN, ORDER BY
- Evitar over-indexing (cada index custa INSERT/UPDATE)
- `EXPLAIN ANALYZE` para verificar uso de índices
- Partial indexes: `CREATE INDEX … WHERE status = 'active'`

## Query Optimization

- **EXPLAIN ANALYZE**: sempre verificar plano de execução
- **N+1 problem**: usar JOIN ou batch loading
- **Paginação**: cursor-based > offset-based para grandes volumes
- **CTEs**: úteis para legibilidade, nem sempre performáticas
- **Window functions**: `ROW_NUMBER()`, `LAG()`, `SUM() OVER`
- **Evitar**: SELECT \*, funções em colunas indexadas, subqueries correlacionadas

## Migrations

Boas práticas:

- Migrations atômicas (uma mudança por migration)
- Sempre `UP` e `DOWN` (reversível)
- Testar em staging antes de produção
- Evitar locks longos (ALTER TABLE em tabelas grandes)
- Versionar migrations (timestamp + descrição)

```
-- Exemplo: 20260526_add_user_status.sql
-- UP
ALTER TABLE users ADD COLUMN status text NOT NULL DEFAULT 'active';
-- DOWN
ALTER TABLE users DROP COLUMN status;
```

## Transactions

**Propriedades ACID**:

- **Atomicidade**: tudo ou nada
- **Consistência**: dados válidos antes e depois
- **Isolamento**: transações concorrentes não interferem
- **Durabilidade**: commitado = persistido

Níveis de Isolamento (PostgreSQL default: Read Committed):

- Read Uncommitted (raro)
- Read Committed (default PG)
- Repeatable Read
- Serializable (menor concorrência)
