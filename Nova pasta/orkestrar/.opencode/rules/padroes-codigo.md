# Padrões de Código — Python 3.12+

> Regras de estilo, testes e qualidade para projetos Python 3.12+.
> Gerado automaticamente pelo orkestrar Template Resolver.

## Stack

- **Linguagem:** Python 3.12+
- **Test runner:** pytest
- **Mock framework:** unittest.mock
- **Cobertura:** pytest --cov
- **Source:** `src/`
- **Test extension:** `test_*.py`

## Convenções Obrigatórias

1. Use pytest como runner
2. Testes em arquivotest_*.py em tests/
3. Use unittest.mock para mocks
4. Cobertura via `pytest --cov`
5. Siga o style guide da linguagem

## Estrutura de Testes

```
src/  ← source
tests/    ← tests
```

## Scripts

| Ação                | Comando               |
| ------------------- | --------------------- |
| Rodar testes        | `pytest -x --tb=short`     |
| Verificar cobertura | `pytest --cov` |
| Lint                | `ruff check .`     |
