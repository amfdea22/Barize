# smallSpec

Guia de formato e workflow para small-specs de features médias.

## Formato Obrigatório

```markdown
# MS-NNN: Título

**Status**: `draft` | `approved` | `in_progress` | `completed`
**Criado em**: YYYY-MM-DD

---

## User Stories

- US-01: Como [papel], quero [funcionalidade] para [benefício].
- US-02: ...

## Critérios de Aceitação

- [ ] Condição 1
- [ ] Condição 2

## Technical Approach

Breve descrição (3-5 linhas).

## Arquivos a Modificar

- `src/file.ts` — o que fazer

## Edge Cases

- Caso 1: o que acontece se X?

## Dependências

- TC-NNN: descrição (se aplicável)

## Checklist

- [ ] Testes criados/atualizados
- [ ] Lint passa
- [ ] Cobertura mínima 80%
- [ ] Comportamento existente preservado
```

## Workflow

```
1. /smallspec "título"       → Cria MS-001 em active/ (status: draft)
2. Usuário revisa + aprova  → Status: approved
3. build implementa          → Status: in_progress
4. Testes + lint             → Validation Gate
5. Concluir                  → Move para completed/
```

## Guardrails

- **Scope Guard**: feature está em módulo existente?
- **Pre-flight**: user stories são claras? edge cases considerados?
- **Validation**: testes passam? comportamento preservado?
