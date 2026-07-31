# /sdds

COMANDO READ-ONLY: execute as instruções abaixo. Não apenas leia este arquivo.

Lista SDDs (active/approved/completed).

## Execução (AÇÃO REAL — faça isto)

1. **Leia** `.opencode/sdd/index.json` para obter o índice de SDDs
2. Verifique o status de cada SDD nas pastas: `active/`, `approved/`, `completed/`
3. **Exiba uma tabela formatada** com: Título | Status | Data de criação
4. Se houver SDDs em `active/`, sugira prosseguir com revisão e aprovação
5. Se não houver SDDs, informe: "Nenhum SDD encontrado."

## Guardrails

- **READ-ONLY. NÃO modificar nada.**

## Exemplo de saída

```
/sdds
→ Active (1): SDD-024 - UI Design System Harness
→ Approved (0):
→ Completed (3): SDD-021 - ..., SDD-022 - ..., SDD-023 - ...
```
