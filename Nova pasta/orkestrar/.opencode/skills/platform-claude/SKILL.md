# platform-claude

> **Categoria**: platform
> **Tags**: claude, anthropic, mcp, platform, claude-code, project-knowledge

Claude Code platform specifics: CLAUDE.md format, MCP (Model Context Protocol), Project Knowledge, tool use, 200K context window, Codex CLI compatibility, Anthropic-specific conventions.

## Quando Usar

Use ao configurar projetos para Claude Code, escrever CLAUDE.md, integrar MCP servers, definir Project Knowledge ou otimizar contexto para a plataforma Anthropic.

## CLAUDE.md Format & Structure

Arquivo de configura��o principal (raiz do projeto):

```markdown
# CLAUDE.md

## Build/Test/Lint

- Build: `npm run build`
- Test: `npx vitest run`
- Lint: `npx eslint .`

## Project Conventions

- TypeScript strict mode
- Commits follow conventional commits
- Tests alongside modules (\*.test.ts)

## Architecture

- Source in src/
- Clean Architecture layers: domain ? application ? infra
```

- **Sintaxe chave:valor** para instru��es diretas
- **Se��es opcionais**: `# Performance`, `# Security`, `# Deployment`
- Linguagem natural, sem YAML/JSON
- Foco em BUILD/TEST/LINT como se��o obrigat�ria

## MCP Integration

**Model Context Protocol** � extens�es via servidores MCP:

```json
{
  "mcpServers": {
    "database": {
      "command": "node",
      "args": ["mcp-server-db.js"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
    }
  }
}
```

- **MCP servers** rodam localmente e exp�em tools/resources
- **Tools**: fun��es que a IA pode chamar (ex: `query_database`)
- **Resources**: dados que a IA pode ler (ex: `file://docs/arch.md`)
- **Prompts**: templates de mensagens pr�-definidos
- Seguran�a: servidores MCP rodam em processo separado

## Project Knowledge

Documenta��o carregada automaticamente no contexto:

- **CLAUDE.md** (sempre carregado)
- **Arquivos no `.claude/`**: knowledge snippets
- **Padr�o**: arquivos .md com markdown simples

```
.claude/
+-- api-patterns.md       ? padr�es de API
+-- domain-rules.md       ? regras de neg�cio
+-- deployment.md         ? instru��es de deploy
```

**Limita��es**:

- M�ximo de conhecimento: ~100KB total
- Ordem de carregamento: alfab�tica
- Snippets > documentos longos (foco)

## Tool Use Patterns

Claude Code usa tools para interagir com o sistema:

- **Bash**: execu��o de comandos (instala��o, build, teste)
- **File operations**: Read, Edit, Write, Glob, Grep
- **Agent delegation**: `@architect`, `@code-reviewer`
- **Skill loading**: `skill("python")` para carregar conhecimento

**Boas pr�ticas**:

- Preferir `Edit` (edi��es cir�rgicas) sobre `Write` (reescrita total)
- Usar `Grep` + `Glob` antes de modificar para entender contexto
- `Bash` para execu��o de comandos confirmados

## Context Window Optimization

Claude Code tem 200K tokens de contexto (~150K palavras):

- **Lazy loading**: skills carregadas sob demanda
- **Memory management**: `decision-log.md`, `progress-tracker.md`
- **Compress�o**: referenciar arquivos por path em vez de embutir
- **Evitar**: logs longos, outputs de bash, arquivos n�o relevantes

**Estrat�gia de contexto**:
| Prioridade | Conte�do | Tamanho |
|------------|----------|---------|
| Always | CLAUDE.md, AGENTS.md, task card ativo | ~5K |
| On demand | Skills relevantes, arquivos alvo | ~20-50K |
| Rare | Hist�rico completo, logs extensos | >50K |

## Platform-Specific Notes

- **Codex CLI compat�vel**: CLAUDE.md � compat�vel com `.codexrc`
- **Claude Code vs API direta**: Code tem tools predefinidos, API � raw
- **Rate limits**: conta gratuita ~100 requests/hora, Pro ~1000/hora
- **MCP Security**: servidores MCP t�m acesso ao sistema de arquivos
- **CLAUDE.md n�o suporta**: vari�veis, condicionais, express�es
- **Project Knowledge**: vis�vel no chat como "Knowledge" expandido
