# /cards

**COMANDO**: execute as instruções abaixo. **Não apenas leia este arquivo** — realize as ações descritas.

List active, backlog and cancelled task cards

## Execução (AÇÃO REAL — faça isto)

AÇÃO REAL — faça a listagem abaixo, não apenas leia este arquivo.

1. Leia `index.json` na pasta de task cards para obter o índice
2. Separe os cards por status usando o campo `status` no index.json
3. Exiba em FORMATO DE TABELA com colunas alinhadas exatamente como abaixo:

### ▶️ Active (N)
| ID | Título | Prioridade |
|----|--------|------------|
| TC-XXX | Título do card | high |

### 📥 Backlog (N)
| ID | Título | Prioridade |
|----|--------|------------|
| TC-XXX | Título do card | medium |

### ✅ Completed (N)
TC-001, TC-002, TC-003 (apenas IDs, sem tabela)

### ❌ Cancelled (N)
TC-001 (Título), TC-012 (Título)

4. Regras:
   - **Active**: emoji ▶️, tabela completa
   - **Backlog**: emoji 📥, tabela completa
   - **Completed**: emoji ✅, apenas IDs separados por vírgula
   - **Cancelled**: emoji ❌, IDs com título entre parênteses
5. Se uma categoria estiver vazia, mostre "Nenhum"
6. Sugira o próximo card a iniciar (se houver backlog)
7. Se NÃO houver cards em NENHUMA categoria, mostre "Nenhum card encontrado."


## Guardrails

- **READ-ONLY. NÃO modificar nada.**
- **NÃO iniciar implementação de itens listados.**
- **NÃO alterar status de itens.**
