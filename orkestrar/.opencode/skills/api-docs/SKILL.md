# api-docs

> **Categoria**: backend
> **Tags**: openapi, swagger, typedoc, jsdoc, redoc, stoplight, documentation

Documenta��o de API: gera��o e design-first com OpenAPI/Swagger, TypeDoc/JSDoc para c�digo, Redoc/Stoplight para visualiza��o, changelog autom�tico e m�tricas de qualidade de documenta��o.

## Quando Usar

Use ao projetar, documentar ou revisar uma API. Tamb�m use para gerar documenta��o interativa, automatizar changelog ou medir qualidade da documenta��o existente.

## OpenAPI � Gera��o e Design-First

**Design-First** (recomendado): especificar API antes de implementar.

```yaml
openapi: 3.1.0
info:
  title: Users API
  version: 1.0.0
  description: API para gerenciamento de usu�rios
paths:
  /users:
    get:
      summary: Listar usu�rios
      parameters:
        - name: page
          in: query
          description: N�mero da p�gina
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          description: Itens por p�gina
          schema:
            type: integer
            default: 20
            maximum: 100
      responses:
        '200':
          description: Lista de usu�rios
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
        '400':
          description: Erro de valida��o
```
