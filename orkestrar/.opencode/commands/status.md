# /status

Exibe o status completo do workflow atual: etapa, progresso, próximos passos.

## Execução

1. Ler `.opencode/memory/session-state.json`:
   - Agente atual
   - Tarefa em execução
   - Etapa do workflow
   - Último checkpoint
2. Ler `.opencode/memory/progress-tracker.md`:
   - Tarefas concluídas
   - Checklist pendente
   - Próximos passos
3. Ler `.opencode/taskcards/active/` (cards em andamento)
4. Ler `.opencode/taskcards/backlog/` (cards pendentes)
5. Exibir resumo formatado:
   ```
   📊 Status do Orkestrarr
   ━━━━━━━━━━━━━━━━━━━━━
   🎯 Tarefa atual: SDD-007 Fase 5 — SDK + LSP
   📍 Etapa: IMPLEMENTAÇÃO
   🔖 Último checkpoint: CP-026 (2026-05-29)
   ✅ Concluídas: 91 tarefas
   📋 Pendentes: 0
   🔜 Próximo: Fase 5.2 — LSP Server
   ```

## Guardrails

- **COMANDO READ-ONLY. NÃO MODIFICAR NADA.**
- **NÃO iniciar workflow nem implementar nada.**

## Exemplo

```
/status
```
