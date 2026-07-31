# /card <descrição: string>

Criação INSTANTÂNEA de task card em backlog — ID auto-incrementado `TC-001`.

## ⚠️ REGRA: Usar TaskCardManager.createTask(). SEMPRE.

**NUNCA** crie arquivos JSON manualmente. **NUNCA** use `card-<timestamp>`.

## Execução

1. **Use `TaskCardManager.createTask()`**:
   ```ts
   const manager = getTaskCardManager({ harness: adapter });
   manager.init();
   const task = manager.createTask({ title: '<descrição>', taskType: 'card' }, 'user');
   // task = { id: 'TC-001', title: '<descrição>', status: 'backlog', ... }
   ```
2. Informe: "✅ Card **TC-001** criado em backlog."
3. Sugira: "Use `/card-iniciar TC-001` para analisar e implementar."

## Guardrails

- **NUNCA** crie arquivos .json manualmente
- **NUNCA** analise o problema durante a criação
- **SEMPRE** use `TaskCardManager.createTask()`
