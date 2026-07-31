# /card-cancelar <id>

Cancela um task card, removendo-o do fluxo ativo.

## Execução

1. Localizar o card `<id>` em `active/` ou `backlog/`
2. Confirmar cancelamento com o usuário (exceto se flag `--yes`)
3. Mover arquivo para `.opencode/taskcards/cancelled/`
4. Atualizar status no card para `cancelled`
5. Atualizar `.opencode/taskcards/index.json`
6. Registrar cancelamento no `decision-log.md` (ADR)
7. Reportar: "Card TC-NNN cancelado."

## Guardrails

- **Confirmar com o usuário antes de cancelar (a menos que `--yes`).**
- **Se o card estava em active, fazer rollback de mudanças não commitadas.**
- **NÃO deletar o card — mover para cancelled/, preservando histórico.**

## Exemplo

```
/card-cancelar TC-001
→ Tem certeza que deseja cancelar TC-001? (s/N)
```
