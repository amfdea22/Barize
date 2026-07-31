# /checkpoint

Salva um checkpoint do progresso atual na memória persistente.

## Execução

1. Coletar estado atual:
   - Tarefa em execução (de `session-state.json`)
   - Etapa do workflow
   - Arquivos modificados (via `git diff --name-only`)
   - Métricas: testes passando, cobertura, lint status
2. Gerar ID do checkpoint (CP-NNN, incrementando do último)
3. Registrar em `session-state.json` na lista `checkpoints`:
   ```json
   {
     "id": "CP-NNN",
     "data": "YYYY-MM-DDTHH:MM:SSZ",
     "agente": "build",
     "commit": "(hash ou 'uncommitted')",
     "mensagem": "descrição do progresso",
     "resumo": { "tarefas_concluidas": N, "decisoes": N, "arquivos_modificados": N }
   }
   ```
4. Atualizar `progress-tracker.md` com referência ao checkpoint
5. Atualizar `context-map.md` com arquivos modificados
6. Reportar: "Checkpoint CP-NNN salvo. X tarefas, Y decisões, Z arquivos."

## Guardrails

- **Salvar estado antes de operações arriscadas (refatoração grande, merge复杂).**
- **Checkpoints são incrementais — nunca substituir CPs anteriores.**
- **Incluir mensagem descritiva para facilitar restauração futura.**

## Exemplo

```
/checkpoint
→ CP-027 salvo. 91 tarefas concluídas, 26 decisões, 22 arquivos modificados.
```
