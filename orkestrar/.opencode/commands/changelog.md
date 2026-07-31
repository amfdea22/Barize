# /changelog [generate|latest]

Gera ou exibe o CHANGELOG.md do projeto a partir de commits Conventional Commits.

## Subcomandos

| Subcomando | Descricao |
|------------|-----------|
| `generate` | Gera changelog completo (keepachangelog) |
| `latest` | Exibe apenas a ultima versao |

## Execucao (ACAO REAL — faca isto)

1. **Use `git log --oneline`** para listar commits recentes com formato Conventional Commits
2. **Agrupe por tipo:** feat, fix, chore, docs, refactor, test, etc.
3. **Para `generate`:** produza um CHANGELOG.md completo no formato Keep a Changelog, organizando por versao (use `git tag --list` para versoes) e tipo de commit
4. **Para `latest`:** exiba apenas a versao mais recente e seus commits

## Guardrails

- Funciona apenas em repositorios git com Conventional Commits
- Sem tags de versao, tudo e listado como "Unreleased"

## Exemplo

```
/changelog generate
→ # Changelog
  ## [Unreleased]
  ### Features
  - **infra:** new graph visualizer (abc1234)
```
