# /sops

COMANDO READ-ONLY: execute as instruções abaixo. Não apenas leia este arquivo.

Lista SOPs (active/review/deprecated).

## Execução (AÇÃO REAL — faça isto)

1. **Leia** `.opencode/sop/index.json` para obter o índice de SOPs
2. Verifique cada SOP nas pastas: `active/`, `review/`, `deprecated/`
3. **Exiba uma tabela formatada** com: Título | Status | Data de criação
4. SOPs em `review/` precisam de promoção via `/sop-promote`
5. Se não houver SOPs, informe: "Nenhum SOP encontrado."

## Guardrails

- **READ-ONLY. NÃO modificar nada.**
