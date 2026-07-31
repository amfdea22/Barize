# /retomar <id>

Resume a task card after review — transição `review → executing`.

## Descrição

Retorna um card do estado `review` para `executing` após a conclusão da revisão. O card retoma de onde parou.

## API Reference

```ts
import { getTaskCardManager } from 'src/core/engine/taskcard-manager.js';
const manager = getTaskCardManager({ cwd: process.cwd() });
await manager.init();

const { success, task, error } = await manager.resumeTask('<id>', '<actor>');
```

## Pré-condições

1. O card DEVE estar em estado `review` (validado pelo `StateMachineEngine`)
2. A revisão deve ter sido concluída (ajustes aplicados, se houver)

## Execução (AÇÃO REAL — faça isto)

1. **Use `TaskCardManager.resumeTask()`** que integra validação, transição `review → executing`, audit trail e persistência:
   ```ts
   const { success, task, error } = await manager.resumeTask(taskId, actor);
   ```
2. **Valide o retorno:**
   - Se `error` contém "não está em revisão": "Card <id> está em <status>. Use /review <id> primeiro."
   - Se `error` contém "terminal": estado terminal — não é possível retomar
3. **Se sucesso:** o `TaskCardManager` já atualizou status para `executing`, registrou no histórico e assinou audit trail
4. Reporte: "⚙️ Card <id> retomado após revisão. Continuando execução."
5. Continue o workflow de onde parou

## Guardrails

- **SEMPRE** verifique se a revisão foi concluída antes de retomar
- **NUNCA** retome um card que não está em `review`
