# qa-testing

> **Categoria**: patterns
> **Tags**: testing, tdd, quality, coverage, property-based, fuzzing

Estratégia e engenharia de testes: TDD, pirâmide de testes, coverage, property-based testing, fuzzing e QA gates.

## Quando Usar

Use ao planejar estratégia de testes, escrever testes, analisar cobertura ou configurar gates de qualidade.

## Pirâmide de Testes

```
            ╱╲
           ╱ E2E ╲         ← poucos, lentos, caros
          ╱────────╲
         ╱ Integration ╲   ← médios, moderados
        ╱────────────────╲
       ╱   Unit Tests     ╲ ← muitos, rápidos, baratos
      ╱────────────────────╲
```

- **Unit**: 70% dos testes — lógica pura, sem I/O
- **Integration**: 20% — módulos + fronteiras (HTTP, DB)
- **E2E**: 10% — fluxos completos

## AAA Pattern (Arrange-Act-Assert)

```typescript
describe('CheckpointManager.save()', () => {
  it('should persist checkpoint to disk when valid data is provided', async () => {
    // Arrange
    const store = new JsonFileStore(tmpDir);
    const manager = new CheckpointManager(store);
    const data = { id: 'CP-001', message: 'test' };

    // Act
    const result = await manager.save(data);

    // Assert
    expect(result.id).toBe('CP-001');
    expect(fs.existsSync(path.join(tmpDir, 'CP-001.json'))).toBe(true);
  });
});
```

## O que Testar

✅ **Sempre**:

- Lógica de negócio (sempre)
- Casos felizes (happy path)
- Edge cases (valores limite, null, undefined, vazio)
- Casos de erro (validação, exceções)

❌ **Nunca**:

- Código de terceiros/bibliotecas
- Tipos TypeScript (compilador verifica)
- Configuração
- Código trivial (getters/setters sem lógica)
- Implementação interna (teste comportamento observável)

## Mocks e Stubs

- Mock apenas fronteiras do sistema: HTTP, banco, sistema de arquivos
- Preferir valores reais a mocks sempre que possível
- `vi.mock()` do Vitest para módulos externos
- Restaurar mocks entre testes (`afterEach`)
- `vi.fn()` para funções espiãs
- Evitar mocks deep (acoplamento a implementação)

## Property-Based Testing

Em vez de exemplos fixos, testar propriedades invariantes:

```typescript
import fc from 'fast-check';
it('should invert twice to original', () => {
  fc.assert(
    fc.property(fc.string(), (original) => {
      const inverted = invert(original);
      expect(invert(inverted)).toBe(original);
    }),
  );
});
```

## QA Gates

| Gate | Threshold | Ação |

## Coverage Thresholds

| Métrica    | Mínimo | Bom | Excelente |
| ---------- | ------ | --- | --------- |
| Lines      | 75%    | 85% | 95%+      |
| Branches   | 70%    | 80% | 90%+      |
| Functions  | 80%    | 90% | 95%+      |
| Statements | 75%    | 85% | 95%+      |
