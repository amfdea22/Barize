# /review <id> [--reason "<motivo>"]

Request review of a task card — transição para `review`.

## Descrição

Move um card ativo para o estado `review`, permitindo que o usuário solicite revisão de qualquer estado (`pending`, `executing`, `testing`, `tested`). Após a revisão, use `/retomar <id>` para retornar à execução.

## API Reference

```ts
import { getTaskCardManager } from 'src/core/engine/taskcard-manager.js';
const manager = getTaskCardManager({ cwd: process.cwd() });
await manager.init();

const { success, task, error } = await manager.reviewTask('<id>', '<actor>', '<reason>');
// task.statusHistory contém o estado anterior
```

## Pré-condições

1. O card DEVE estar em um estado ativo (`pending`, `executing`, `testing`, `tested` — validado pelo `StateMachineEngine`)
2. O card NÃO pode estar em estado terminal ou já em `review`

## Execução (AÇÃO REAL — faça isto)

1. **Use `TaskCardManager.reviewTask()`** que integra validação de estado, audit trail e persistência:
   ```ts
   const { success, task, error } = await manager.reviewTask(taskId, actor, reason);
   ```
2. **Valide o retorno:**
   - Se `error` contém "terminal": "Card <id> está em estado terminal. Não é possível revisar."
   - Se `error` contém "já está em revisão": "Card <id> já está em revisão."
3. **Se sucesso:** `TaskCardManager` já registrou o status anterior (`task.statusHistory`), atualizou o índice e assinou o audit trail
4. Se aplicável: salve checkpoint do estado atual
5. Reporte: "👀 Card <id> movido para revisão. Motivo: <reason>. Use /retomar <id> após revisão."

## Guardrails

- **NUNCA** mova para review sem motivo claro
- **SEMPRE** use `TaskCardManager.reviewTask()` para garantir registro do estado anterior
