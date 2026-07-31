# /smallspec <título: string>

Criação INSTANTÂNEA de smallSpec em backlog — ID auto-incrementado `SP-001`.

## ⚠️ REGRA: Usar TaskCardManager.createTask(). SEMPRE.

## Execução

1. **Use `TaskCardManager.createTask()`**:
   ```ts
   const manager = getTaskCardManager({ harness: adapter });
   manager.init();
   const task = manager.createTask({ title: '<título>', taskType: 'smallspec' }, 'user');
   // task = { id: 'SP-001', title: '<título>', status: 'backlog', ... }
   ```
2. Informe: "✅ SmallSpec **SP-001** criado em backlog."
3. Sugira: "Use `/smallspec-iniciar SP-001` para analisar."

## Guardrails
- **NUNCA** crie arquivos .md manualmente
- **NUNCA** preencha user stories na criação
