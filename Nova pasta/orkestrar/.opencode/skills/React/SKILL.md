# React

> **Categoria**: frontend
> **Tags**: react, jsx, hooks, ui, componentes

React é uma biblioteca JavaScript para construção de interfaces de usuário componentizadas. Abrange hooks, contexto, suspense e o ecossistema React.

## Quando Usar

Use ao desenvolver componentes React, gerenciar estado com hooks, ou otimizar performance de renderização.

## Padrões Comuns

- Componentes funcionais com hooks
- Estado local com useState / useReducer
- Efeitos colaterais com useEffect
- Contexto global com useContext + createContext
- Memoização com useMemo e useCallback

## Exemplo Rápido

```tsx
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount((c) => c + 1)}>Cliques: {count}</button>;
}
```
