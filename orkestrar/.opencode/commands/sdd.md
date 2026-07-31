# /sdd <título: string>

Criação INSTANTÂNEA de SDD em backlog — ID auto-incrementado `SDD-001`.

## ⚠️ REGRA: Usar TaskCardManager.createTask(). SEMPRE.

## Execução

1. **Use `TaskCardManager.createTask()`**:
   ```ts
   const manager = getTaskCardManager({ harness: adapter });
   manager.init();
   const task = manager.createTask({ title: '<título>', taskType: 'sdd' }, 'user');
   // task = { id: 'SDD-001', title: '<título>', status: 'backlog', ... }
   ```
2. Informe: "✅ SDD **SDD-001** criado em backlog."
3. Sugira: "Use `/sdd-iniciar SDD-001` para analisar."

## Guardrails
- **NUNCA** crie arquivos .md manualmente
- **NUNCA** preencha seções de análise na criação
