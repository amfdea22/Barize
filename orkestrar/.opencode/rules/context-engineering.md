# Context Engineering

Técnicas para gerenciar o contexto da IA de forma eficiente, evitando desperdício de tokens e garantindo que a informação certa esteja disponível no momento certo.

## Princípios

1. **Lazy Loading**: só carregue informação quando necessário. Skills são carregadas sob demanda via `skill()`.
2. **Context Budgeting**: cada agente tem um escopo definido. Não carregue contexto de áreas irrelevantes.
3. **Prompt Compression**: use `{file:path}` para referenciar arquivos grandes em vez de embutir conteúdo.
4. **Separation of Concerns**: contexte de projeto em `AGENTS.md`, regras em `rules/`, skills em `skills/`, comandos em `commands/`.
5. **Tiered Context**:
   - **Sempre carregado**: `AGENTS.md`, `DESIGN.md`, `opencode.json` (via `instructions`)
   - **Carregado por demanda**: skills específicas para a tarefa
   - **Carregado por agente**: cada subagente só carrega seu prompt especializado

## Técnicas

### 1. Modularização de Instruções

- `AGENTS.md` contém APENAS o essencial do projeto
- Regras detalhadas em arquivos separados em `.opencode/rules/`
- Skills carregadas via `skill()` quando o agente precisa

### 2. Referências a Arquivos

```json
"instructions": ["AGENTS.md", "DESIGN.md", ".opencode/rules/*.md"]
```

Arquivos de regras são carregados uma vez no contexto do sistema, não repetidos.

### 3. Compaction Inteligente

- `auto: true` — compacta automaticamente quando o contexto está cheio
- `tail_turns: 5` — preserva as últimas 5 interações sem compactar
- `reserved: 10000` — buffer de segurança para evitar overflow durante compactação
- `prune: true` — remove outputs antigos de ferramentas para economizar tokens

### 4. Escopo por Agente

Cada agente tem:

- Um prompt enxuto (não repete informações do AGENTS.md)
- Permissões restritas ao que precisa fazer
- Acesso a skills relevantes apenas para sua função

### 5. Memory Management

- `session-state.json` mantém estado leve (não polui contexto narrativo)
- `decision-log.md` evita que decisões passadas precisem ser relembradas
- `context-map.md` evita re-análise de arquivos já cobertos

## Anti-Patterns

- **Context stuffing**: colocar todas as regras em um único arquivo gigante
- **Prompt repetition**: repetir as mesmas instruções em múltiplos agentes
- **Skill dumping**: carregar todas as skills disponíveis sem necessidade
- **Historical bloat**: manter histórico completo de todas as ações no contexto ativo
