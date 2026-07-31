# /debt <add|list|close|dashboard>

Gerencia o registro de dívida técnica do projeto.

## Subcomandos

| Subcomando | Descrição |
|------------|-----------|
| `add <descrição>` | Registra novo item de dívida |
| `list` | Lista itens (opcional: --status open) |
| `close <id>` | Marca item como resolvido |
| `dashboard` | Painel resumo da dívida |

## Execução (AÇÃO REAL — faça isto)

1. **Armazene em `.opencode/tech-debt/`** como arquivos JSON individuais ou um único `tech-debt.json`
2. **Para `add`:** Pergunte ao usuario o impacto (low/medium/high), esforco (S/M/L), modulo relacionado; gere um ID incremental e salve
3. **Para `list`:** Leia o arquivo JSON e exiba tabela com ID | Descricao | Impacto | Esforco | Status
4. **Para `close <id>`:** Atualize o status do item para "resolved" no JSON
5. **Para `dashboard`:** Exiba resumo formatado com contagem por status, impacto e esforco

## Guardrails

- Divida deve ser priorizada, nao apenas registrada
- Nao usar como ferramenta de punicao

## Exemplo

```
/debt dashboard
→ 📊 Dívida Técnica: 15 itens
  Abertos: 8 | Em Progresso: 2 | Resolvidos: 5
  Por Impacto: 🔴 Alto 5 | 🟡 Medio 7 | 🟢 Baixo 3
  Por Esforco: S 4 | M 8 | L 3
```
