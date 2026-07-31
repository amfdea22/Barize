# /fluxo <tarefa>

Inicia o workflow determinístico completo para uma tarefa de desenvolvimento.

## Execução

1. Registrar tarefa no `session-state.json` com etapa inicial: `PLANEJAMENTO`
2. Atualizar `progress-tracker.md` com nova entrada
3. Executar etapas em sequência:

   **Etapa 1 — PLANEJAMENTO**:
   - Delegar para `@architect` ou `@plan`
   - Analisar requisitos, projetar solução, documentar ADR
   - Gate: usuário aprova o plano → avança

   **Etapa 2 — IMPLEMENTAÇÃO**:
   - Escrever código seguindo o plano aprovado
   - Gate: código passa no type check ({{typeCheckCommand}}) e lint ({{lintCommand}}) → avança

   **Etapa 3 — REVISÃO**:
   - Delegar para `@code-reviewer`
   - Revisar segurança, performance, boas práticas
   - Gate: revisão aprovada sem issues críticas → avança

   **Etapa 4 — TESTES**:
   - Delegar para `@test-writer` (se precisar criar)
   - Executar suite completa (`{{testCommand}}`)
   - Gate: 100% dos testes passam → avança

   **Etapa 5 — MERGE**:
   - Commitar seguindo Conventional Commits
   - Gate: commit criado com mensagem padronizada

## Auto-Retry
Se um gate falhar: até 3 tentativas de correção automática antes de pedir intervenção do usuário.

## Rollback
Se falha persistir: `/voltar` retrocede à etapa anterior.

## Guardrails

- **Cada etapa deve ser concluída antes de passar para a próxima.**
- **Gates de validação são obrigatórios — não pular.**
- **Handoffs entre agentes devem ser explícitos e registrados no decision-log.**
- **Atualizar `session-state.json` a cada transição de etapa.**

## Exemplo

```
/fluxo Corrigir bug de timeout na conexão com banco de dados
```
