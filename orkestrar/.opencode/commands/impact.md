# /impact <descrição>

Analisa o impacto potencial de uma mudanca antes da implementacao.

## Execução (AÇÃO REAL — faça isto)

1. **Extraia a descrição** do argumento
2. **Identifique os módulos diretamente alterados** baseado na descricao
3. **Analise o impacto manualmente** examinando:
   - Quem importa os módulos alterados (use `grep` para encontrar dependencias)
   - Testes existentes que cobrem a funcionalidade
   - Interfaces públicas que podem mudar
4. **Exiba o resultado formatado:**
   - Risco geral: 🔴 Alto / 🟡 Medio / 🟢 Baixo
   - Modulos indiretamente afetados (com nivel de impacto)
   - Testes de regressao sugeridos (com caminhos e prioridade)
   - Sugestao: criar ADR se risco for alto (/adr)

## Guardrails

- **READ-ONLY. NÃO modificar código.**
- Nao substitui revisao humana

## Exemplo de saída

```
/impact "Modificar governance engine"
→ 🔴 Risco ALTO
  Diretos: core/governance
  Indiretos (4): core/engine (alto), core/infra (medio),
    adapters (medio), core/harness (baixo)
  Testes sugeridos: 3 (2 unit, 1 integration)
  💡 Considere criar um ADR para documentar esta decisão
```
