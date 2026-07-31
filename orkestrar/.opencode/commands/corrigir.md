# /corrigir <descrição>

Investiga e corrige um bug usando o workflow de debug.

## Execução

1. Delegar para `@debugger` com a descrição do bug
2. Workflow determinístico de bugfix (4 etapas):

   **Etapa 1 — REPRODUÇÃO**:
   - Entender o bug pela descrição
   - Reproduzir o erro consistentemente
   - Gate: bug reproduzido → avança

   **Etapa 2 — DIAGNÓSTICO**:
   - Analisar logs, stack traces
   - Isolar módulo afetado
   - Identificar causa raiz com precisão
   - Gate: causa raiz encontrada → avança

   **Etapa 3 — CORREÇÃO**:
   - Implementar fix com escopo mínimo
   - Não refatorar código não-relacionado
   - Gate: correção implementada → avança

   **Etapa 4 — VERIFICAÇÃO**:
   - Bug não reproduz mais
   - Testes existentes passam
   - Novo teste de regressão (se aplicável)
   - Gate: verificação ok → concluir

3. Registrar fix no `decision-log.md`

## Guardrails

- **Corrigir APENAS o bug reportado — não aproveitar para refatorar outras coisas.**
- **Sempre adicionar teste de regressão para o bug corrigido.**
- **Se a causa raiz for arquitetural, sugerir criar SDD em vez de remendo.**

## Exemplo

```
/corrigir Erro 500 ao enviar formulário com campos acentuados
```
