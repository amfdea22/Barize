# /card-iniciar <id: string>

Inicia o workflow de um card: backlog → analyzing → [análise] → ready → [usuário aprova] → executing.

## ⚠️ REGRA: Usar TaskCardManager.startTask(). SEMPRE.

## Execução

### Passo 1: backlog → analyzing
```ts
const manager = getTaskCardManager({ harness: adapter });
manager.init();
const result = await manager.startTask('<id>', 'build');
// Card agora está em 'analyzing'
```

### Passo 2: ANALISAR o problema (AGORA sim!)
Preencha: objective, acceptanceCriteria, filesInvolved, tests.

### Passo 3: analyzing → ready + PERGUNTAR USUÁRIO
```
📋 Análise do card <id> - <título>
Objetivo: ...
Deseja que eu implemente? (sim/nao)
```

### Passo 4: Se usuário aprovou → startTask() novamente (ready → executing)

### Passo 5: Implementar → Testar → verified → /card-concluir

## Guardrails
- **NUNCA** pule a análise
- **NUNCA** implemente sem aprovação do usuário (ready → executing requer user)
