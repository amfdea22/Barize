# /adrs

Lista todos os Architecture Decision Records (ADRs), agrupados por status.

## Execução (AÇÃO REAL — faça isto)

1. **Busque ADRs** nos seguintes diretórios (verifique qual existe):
   - `.opencode/adr/` (caminho relativo ao projeto)
   - `orkestrar/.opencode/adr/` (caminho alternativo via orkestrar/)

2. **Para cada diretório encontrado**, verifique subpastas de status:
   - `active/` — ADRs em draft
   - `approved/` — ADRs aprovados
   - `deprecated/` — ADRs obsoletos
   - Também verifique arquivos `.md` diretamente na raiz do diretório ADR

3. **Leia cada arquivo `.md`** encontrado e extraia:
   - **ID** — do título (`ADR-NNN`) ou do nome do arquivo
   - **Título** — da primeira linha `# ADR-NNN: Título` ou do nome do arquivo
   - **Status** — do campo `status:` no conteúdo (draft, approved, deprecated) ou da subpasta
   - **Data** — do campo `date:` no conteúdo
   - **Deciders** — do campo `deciders:` se disponível

4. **Exiba uma tabela formatada** seguindo este modelo:

   ```
   📋 Architecture Decision Records
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📝 Active (2):
   ┌────────┬──────────────────────────────┬──────────┬────────────┐
   │ ID     │ Título                       │ Status   │ Data       │
   ├────────┼──────────────────────────────┼──────────┼────────────┤
   │ ADR-01 │ Use PostgreSQL               │ draft    │ 2026-07-24 │
   │ ADR-02 │ RBAC case-insensitive        │ draft    │ 2026-07-24 │
   └────────┴──────────────────────────────┴──────────┴────────────┘

   ✅ Approved (3):
   ┌────────┬──────────────────────────────┬──────────┬────────────┐
   │ ADR-03 │ Rate Limiting Strategy       │ approved │ 2026-07-20 │
   │ ADR-04 │ Cache Architecture           │ approved │ 2026-07-18 │
   │ ADR-05 │ Authentication Flow          │ approved │ 2026-07-15 │
   └────────┴──────────────────────────────┴──────────┴────────────┘

   ❌ Deprecated (1):
   ┌────────┬──────────────────────────────┬────────────┬────────────┐
   │ ADR-02 │ RBAC case-sensitive          │ deprecated │ 2026-07-24 │
   └────────┴──────────────────────────────┴────────────┴────────────┘

   📊 Total: 6 ADRs
   💡 Use `/adr <título>` para criar um novo ADR
   ```

5. **Se não houver ADRs**, exiba:
   ```
   Nenhum ADR encontrado.
   💡 Use `/adr <título>` para criar o primeiro ADR do projeto.
   ```

## Guardrails

- **READ-ONLY. NÃO modificar nada.**
- **NÃO criar ADRs** (use `/adr` para isso)
- **NÃO alterar status de ADRs existentes**

## Exemplo de saída

```
/adrs
📋 Architecture Decision Records
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 Active (2):
  ADR-01 | Use PostgreSQL | draft | 2026-07-24
  ADR-02 | RBAC case-insensitive | draft | 2026-07-24
✅ Approved (1):
  ADR-03 | Governance Engine | approved | 2026-07-23
📊 Total: 3 ADRs
```
