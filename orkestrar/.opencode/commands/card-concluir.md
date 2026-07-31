# /card-concluir <id: string>

Completa um card — APENAS usuário pode finalizar (verified → completed).

## ⚠️ REGRA: NENHUM agente pode auto-finalizar.

## Execução

### Pré-condições
- Card DEVE estar em `verified` (testes passaram)
- Card NÃO pode estar em estado terminal

### Checklist final
- [ ] `npx tsc --noEmit` — compila?
- [ ] `npx vitest run` — testes passam?
- [ ] `git diff --name-only` — só arquivos esperados?

### Execução
```ts
const { success, error } = await manager.completeTask('<id>', 'user');
```

### Confirmação do usuário
```
Card <id> - <título> — VERIFICADO
Testes: X/Y passaram
Deseja finalizar? (sim/nao)
```
- **AGUARDE resposta.**
- Se "sim" → `completeTask()` + commit
- Se "não" → `startTask()` (volta para executing)
