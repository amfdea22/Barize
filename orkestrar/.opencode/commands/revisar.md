# /revisar

Revisa o código de commits recentes, delegando a análise para o subagente especializado.

## Execução

1. Obter diff dos commits recentes: `git diff HEAD~1` ou especificar range
2. Delegar para `@code-reviewer` com o diff completo
3. `@code-reviewer` deve analisar:
   - **Segurança**: vulnerabilidades OWASP, secrets expostos, inputs não validados
   - **Performance**: complexidade algorítmica, vazamento de memória, queries N+1
   - **Type Safety**: TypeScript strict, tipos corretos, narrowing adequado
   - **Boas Práticas**: SOLID, DRY, nomes descritivos, tratamento de erros
   - **Conformidade**: DESIGN.md (se UI), padrões do projeto
4. Reportar issues por severidade:
   - 🔴 Crítico (bloqueante): deve ser corrigido antes do merge
   - 🟡 Médio: deve ser corrigido no próximo ciclo
   - ⚪ Baixo (nit): sugestão de melhoria

## Guardrails

- **Revisão é READ-ONLY — não modificar código.**
- **Reportar TODAS as issues, mesmo as de baixa severidade.**
- **Se encontrar vulnerabilidade de segurança, PARAR e reportar imediatamente.**

## Exemplo

```
/revisar
→ Analisando diff do último commit...
→ @code-reviewer: 2 issues encontradas:
→ 🔴 src/auth.ts:42 — SQL injection risk (unparameterized query)
→ 🟡 src/utils.ts:15 — Complexidade ciclomática 12 (threshold: 10)
```
