# /sop-promote <id> <status>

Promote a SOP to new status (draft→active→review→deprecated)

## Execução

1. Validar que `<id>` está no formato `SOP-NNN`
2. Validar que `<status>` é um dos valores válidos: `draft`, `active`, `review`, `deprecated`
3. Verificar se a SOP existe via `SopManager.get(id)`
4. Validar a transição via `isValidTransition(currentStatus, newStatus)`
5. Executar `SopManager.transition(id, newStatus)`
6. Exibir resultado da transição (old → new, título, responsável)

## Transições Permitidas

| De → Para      | active | review |  deprecated  |
| -------------- | :----: | :----: | :----------: |
| **draft**      |   ✅   |   ✅   |      ❌      |
| **active**     |   —    |   ✅   |      ✅      |
| **review**     |   ✅   |   —    |      ✅      |
| **deprecated** |   ❌   |   ❌   | — (terminal) |

## Guardrails

- **Validar formato SOP-NNN**
- **Validar que a SOP existe antes de transicionar**
- **Validar que a transição é permitida** (draft→active, draft→review, active→review, active→deprecated, review→active, review→deprecated)
- **Não permitir transições de/para status inexistentes**

## Exemplo

```
/sop-promote SOP-001 deprecated
→ ✓ SOP-001 ● active → ╳ deprecated
  Título: Exemplo de Procedimento
  Responsável: João Silva
```

## Notas

- O comando usa o mesmo `SopManager` do CLI `orkestrar sop promote`
- O arquivo `.md` da SOP é movido entre diretórios se o status mudar de categoria
- Status `deprecated` é terminal — não pode ser alterado
