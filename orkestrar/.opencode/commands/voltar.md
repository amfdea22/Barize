# /voltar

Retrocede à etapa anterior do workflow após uma falha.

## Execução

1. Ler `session-state.json` para identificar a etapa atual do workflow
2. Identificar a etapa anterior na sequência:
   - MERGE → TESTES
   - TESTES → REVISÃO
   - REVISÃO → IMPLEMENTAÇÃO
   - IMPLEMENTAÇÃO → PLANEJAMENTO
3. Mover cards ativos de `active/` para `backlog/` com status `pending`
4. Registrar rollback no `decision-log.md`:
   ```
   ## Rollback: Etapa X → Etapa Y
   - Data: YYYY-MM-DD
   - Motivo: [gate que falhou]
   - Cards afetados: TC-NNN
   ```
5. Atualizar `session-state.json`: nova etapa, incrementar contador de rollbacks
6. Atualizar `progress-tracker.md`
7. Reportar: "Rollback concluído. Voltando para etapa Y. Cards movidos para backlog."

## Guardrails

- **Rollback NÃO desfaz código já escrito — apenas reorganiza o fluxo.**
- **Registrar SEMPRE o motivo do rollback no decision-log.**
- **Máximo de 3 rollbacks consecutivos — depois disso, pedir intervenção do usuário.**

## Exemplo

```
/voltar
→ Etapa atual: IMPLEMENTAÇÃO (Validation Gate falhou)
→ Retrocedendo para PLANEJAMENTO...
→ Card TC-005 movido para backlog.
→ Rollback registrado em decision-log.md.
```
