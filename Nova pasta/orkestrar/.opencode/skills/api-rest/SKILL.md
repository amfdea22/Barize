# api-rest

> **Categoria**: backend
> **Tags**: rest, api, openapi, http, design, pagination

Design de APIs RESTful: recursos, métodos, status codes, versionamento, paginação, OpenAPI e HATEOAS.

## Quando Usar

Use ao projetar, implementar ou revisar uma API REST. Também use para documentar endpoints com OpenAPI.

## Princípios RESTful

- **Recursos** (nouns), não ações (verbs): `/users`, não `/getUsers`
- **Métodos HTTP** semânticos: GET (ler), POST (criar), PUT (substituir), PATCH (atualizar parcial), DELETE (remover)
- **Status codes** apropriados: 200, 201, 204, 400, 401, 403, 404, 409, 422, 500
- **Stateless**: cada request contém toda informação necessária
- **Cacheable**: usar headers ETag, Last-Modified, Cache-Control

## Versionamento

**Prefira** versionamento por header `Accept`:

```
Accept: application/vnd.api.v2+json
```

**Alternativa** (mais comum): URL prefixada:

```
/api/v1/users
/api/v2/users
```

**Evite**: versionamento por query string (`?v=1`) ou subdomínio (`v1.api.com`)

## Paginação

**Cursor-based** (recomendado para grandes volumes):

```json
GET /users?cursor=abc123&limit=20
Response: { "data": [...], "nextCursor": "def456" }
```

**Offset-based** (simples, para volumes pequenos):

```json
GET /users?page=1&limit=20
Response: { "data": [...], "total": 100, "page": 1, "pages": 5 }
```

## Documentação com OpenAPI

Estrutura mínima:

```yaml
openapi: 3.1.0
paths:
  /users:
    get:
      summary: Lista usuários
      parameters: [...]
      responses:
        '200':
          description: Lista de usuários
          content:
            application/json: ...
```

## Anti-Patterns

- ❌ Verbos nas URLs (`/getUsers`, `/deleteUser`)
- ❌ Sem paginação (retornar todos registros de uma vez)
- ❌ 200 OK com erro no body (usar status code correto)
- ❌ Aninhamento profundo de recursos (`/a/b/c/d/e`)
- ❌ Ignorar idempotência de PUT e DELETE
