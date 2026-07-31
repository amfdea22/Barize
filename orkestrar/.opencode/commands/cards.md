# /cards

COMANDO READ-ONLY. Lista task cards em FORMATO DE TABELA com emojis.

## Execução (AÇÃO REAL — faça a listagem)

1. Use `TaskCardManager.listCards()` para obter todos os cards
2. Agrupe por status e exiba em TABELA MARKDOWN:

```
## ▶️ Active (N)

| ID | Título | Prioridade |
|----|--------|------------|
| TC-001 | Implementar login | high |

## 📥 Backlog (N)

| ID | Título | Prioridade |
|----|--------|------------|
| TC-002 | Melhorar cobertura | medium |

## ✅ Completed (N)

TC-003, TC-004 (apenas IDs)

## ❌ Cancelled (N)

TC-001 (Título do card)
```

3. **Mapeamento de status para emoji:**
   - `backlog` → 📥 | `analyzing` → 🔍 | `ready` → ⏳
   - `executing` → ⚙️ | `testing` → 🧪 | `verified` → ✅
   - `completed` → ✔️ | `cancelled` → ❌ | `review` → 👀

4. Se categoria vazia → "Nenhum"
5. Sugira próximo card a iniciar (se houver backlog)

## Guardrails

- **READ-ONLY. NÃO modificar nada.**
- **NÃO iniciar implementação.**
- **NÃO alterar status de cards.**
