# TypeScript

> **Categoria**: linguagem
> **Tags**: typescript, tipagem, generics, interfaces

TypeScript é um superset tipado do JavaScript que compila para JS puro. Adiciona tipos estáticos, interfaces, genéricos e decorators.

## Quando Usar

Use ao definir tipos complexos, criar interfaces compartilhadas, ou garantir type safety em operações críticas.

## Padrões de Tipo

- Preferir `type` para uniões e interseções
- Usar `interface` para objetos que podem ser estendidos
- Evitar `any` — preferir `unknown` quando o tipo é incerto
- Usar `as const` para literais e enums

## Genéricos

```typescript
function getFirst<T>(arr: T[]): T | undefined {
  return arr[0];
}
```
