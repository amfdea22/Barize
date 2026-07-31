# /test-quality

Analisa a qualidade dos testes do projeto.

## Usage

```
/test-quality                  → Executa analise completa e mostra relatorio
/test-quality setup-mutation   → Gera configuracao base do Stryker para mutation testing
/test-quality score            → Retorna score resumido para integracao com PR Quality
```

## Execucao (ACAO REAL — faca isto)

1. **Leia o arquivo de cobertura** (`coverage-summary.json` ou `coverage/coverage-summary.json`) se existir
2. **Analise a estrutura de testes** do projeto:
   - Conte arquivos de teste por diretorio (use `find`/`grep`)
   - Meça assertion density (quantas `expect`/`assert` por arquivo de teste)
   - Calcule test-to-code ratio (linhas de teste / linhas de codigo)
3. **Para `setup-mutation`:** Gere um arquivo `stryker.conf.json` basico
4. **Para `score`:** Calcule um score (0-100) baseado em: cobertura, assertion density, test-to-code ratio
5. **Exiba relatorio** com metricas agregadas e arquivos abaixo do threshold

## Guardrails

- Nao substitui revisao humana da qualidade dos testes
- Coverage data e opcional — analise estrutural funciona sem ele
