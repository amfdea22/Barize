# /sbom [json|table]

Gera Software Bill of Materials (SBOM) no formato SPDX 2.3.

## Subcomandos

| Subcomando | Descricao |
|------------|-----------|
| `json` | Gera SBOM completo em JSON (SPDX 2.3) |
| `table` | Exibe tabela resumo das dependencias |

## Execucao (ACAO REAL — faca isto)

1. **Use `npm list --json`** (ou `pip list --format=json`, `go list -m`, etc. conforme a stack) para obter a lista de dependencias do projeto
2. **Para `json`:** Transforme a saida de `npm list` no formato SPDX 2.3 com:
   - SPDXID, name, versionInfo, supplier (NOASSERTION), licenseConcluded (NOASSERTION)
   - Salve em `.opencode/security/sbom-spdx.json`
3. **Para `table`:** Extraia nome, versao, tipo (prod/dev) e exiba como tabela

## Guardrails

- Licencas de dependencias sao marcadas como NOASSERTION (nao inspecionadas)
- Para SBOM CycloneDX, use /security sbom

## Exemplo

```
/sbom table
→ # SBOM — orkestrar@3.7.0
  | Package | Version | License | Type |
  | vitest  | 1.6.0   | ?       | dev  |
```
