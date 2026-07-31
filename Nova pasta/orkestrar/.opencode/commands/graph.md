# /graph <mermaid|dot|table>

Gera visualizacao do grafo de dependencias entre modulos.

## Subcomandos

| Subcomando | Descricao |
|------------|-----------|
| `mermaid` | Gera fluxograma Mermaid (flowchart LR) |
| `dot` | Gera grafo DOT (Graphviz) |
| `table` | Tabela de fan-in/fan-out/instabilidade |

## Execucao (ACAO REAL — faca isto)

1. **Analise os arquivos do projeto** usando `grep` e `find` para mapear imports/dependencias entre modulos
2. **Para `mermaid`:** Gere um diagrama Mermaid (`flowchart LR`) manualmente baseado nos imports identificados
3. **Para `dot`:** Gere um grafo DOT manualmente baseado na analise de dependencias
4. **Para `table`:** Liste cada modulo com metricas de fan-in (quantos importam dele) e fan-out (quantos ele importa)

## Guardrails

- O grafo representa apenas as dependencias REAIS identificadas no codigo
- Ciclos detectados devem ser destacados como comentarios no diagrama

## Exemplo

```
/graph mermaid
→ \`\`\`mermaid
  flowchart LR
    core_types --> core_engine
    ...
\`\`\`
```
