# platform-codex

> **Categoria**: platform
> **Tags**: codex, openai, platform, cli, sandbox, codex-cli

OpenAI Codex CLI specifics: Codex config format, sandbox execution, CLI-first workflow, stateless design, file modification patterns, platform limitations.

## Quando Usar

Use ao configurar projetos para OpenAI Codex CLI, definir instru��es de sandbox, otimizar workflow CLI-first ou entender limita��es da plataforma.

## Configuration Format

**`.codexrc`** (instru��es do projeto, raiz do reposit�rio):

```json
{
  "model": "gpt-4o-codex",
  "temperature": 0.2,
  "system": [
    "You are a software engineer working on an observability framework.",
    "Follow TypeScript strict mode conventions.",
    "Use Vitest for testing.",
    "Commits must follow Conventional Commits."
  ],
  "include": ["src/**", "tests/**", "package.json"],
  "exclude": ["node_modules/**", "dist/**", "coverage/**"]
}
```

**Formato**: JSON simples (n�o YAML)

- `model`: modelo espec�fico (gpt-4o-codex, o3-codex)
- `system`: array de instru��es de sistema
- `include`/`exclude`: globs para controle de contexto
- `temperature`: 0.0-1.0 (padr�o 0.2 para c�digo)

## Sandbox Environment

Codex CLI executa em **sandbox seguro**:

- **Filesystem virtual**: c�pia isolada do projeto
- **Network**: limitado por regras de seguran�a
- **Bash**: execu��o de comandos rastreada e limitada

**Modelo de execu��o**:

```
1. Codex CLI recebe tarefa
2. Sandbox monta snapshot do reposit�rio
3. IA executa ferramentas (bash, fs) no sandbox
4. Mudan�as s�o aprovadas pelo usu�rio
5. Se aprovadas, aplicadas no FS real
```

**Seguran�a**:

- Sem acesso a secrets do host
- Sem persist�ncia entre sess�es (stateless)
- Comandos bash s�o auditados
- Rollback autom�tico se necess�rio

**Boas pr�ticas**:

- Configurar `include` para reduzir contexto desnecess�rio
- Usar `exclude` para evitar vazamento de dados sens�veis
- Definir `system` instru��es para comportamento esperado

## CLI Workflow

**Comandos principais** (CLI-first):

```bash
# Iniciar sess�o interativa
codex

# Executar tarefa �nica
codex "Add validation to the user registration endpoint"

# Revisar PR
codex "Review this PR for security issues" --diff

# Modo batch (sem confirma��o)
codex "Fix all lint errors" --auto

# Especificar arquivos de contexto
codex "Refactor this module" --files src/services/user.ts
```

**Flags �teis**:

- `--model`: escolher modelo (gpt-4o-codex, o3-codex)
- `--temperature`: controlar criatividade
- `--max-tokens`: limitar resposta
- `--diff`: mostrar diff das mudan�as
- `--review`: modo revis�o (sugest�es, n�o edi��es)
- `--verbose`: logging detalhado

## File Modification Patterns

Codex CLI modifica arquivos de forma **cir�rgica**:

```
# Estrat�gia de modifica��o
1. Ler arquivo completo (entender contexto)
2. Identificar local exato da mudan�a
3. Fazer edi��o m�nima (linhas espec�ficas)
4. Verificar sintaxe do resultado
```

**Padr�es recomendados**:

- **Edi��es pequenas**: modificar fun��o, n�o o arquivo todo
- **Refatora��es**: passo a passo (pequenas mudan�as encadeadas)
- **Cria��o**: novos arquivos apenas quando necess�rio
- **Dele��o**: evitar remo��o de c�digo sem confirma��o

**Exemplo de fluxo**:

```bash
# 1. Criar nova fun��o
codex "Criar fun��o validateEmail em src/utils/validation.ts"

# 2. Adicionar teste
codex "Adicionar teste para validateEmail"

# 3. Verificar lint
codex "Rodar lint e corrigir erros" --auto
```

## API Integration

**Codex via OpenAI API** (uso program�tico):

```python
from openai import OpenAI

client = OpenAI()
response = client.responses.create(
    model="gpt-4o-codex",
    input="Add error handling to this function",
    tools=[{
        "type": "function",
        "function": {
            "name": "read_file",
            "parameters": {"type": "object", "properties": {
                "path": {"type": "string"}
            }}
        }
    }]
)
```

**Tools dispon�veis na API**:
| Tool | Fun��o | Par�metros |
|------|--------|------------|
| `read_file` | Ler arquivo | `path: string` |
| `write_file` | Escrever arquivo | `path, content: string` |
| `edit_file` | Editar trecho | `path, old_string, new_string: string` |
| `bash` | Executar comando | `command: string` |
| `glob` | Buscar arquivos | `pattern: string` |
| `grep` | Buscar texto | `pattern, path: string` |

- **Rate limits**: 500 RPM (tier 5), 10K RPM (tier 5+)
- **Custo**: ~$0.01 por requisi��o simples (gpt-4o-codex)
- **Stateless**: cada chamada � independente

## Limitations & Best Practices

| Limita��o                     | Impacto                             | Mitiga��o                                 |
| ----------------------------- | ----------------------------------- | ----------------------------------------- |
| Stateless                     | N�o lembra de sess�es anteriores    | Usar `.codexrc` com `system` instructions |
| Sem MCP                       | N�o suporta extens�es customizadas  | Usar tools nativas + scripts              |
| Sandbox isolado               | Sem acesso a recursos locais        | Configurar ferramentas via bash           |
| Sem colabora��o multi-arquivo | Dificuldade em refatora��es grandes | Dividir em tarefas at�micas               |

**Boas pr�ticas**:

- **Instru��es curtas e espec�ficas**: "Adicione valida��o com Zod ao endpoint POST /users"
- **Contexto focado**: incluir apenas arquivos relevantes
- **Tarefas at�micas**: 1 tarefa por chamada CLI
- **Revis�o sempre**: `--diff` para ver mudan�as antes de aplicar
- **CI/CD integration**: `codex "..." --auto` em pipelines

**Compara��o com outras plataformas**:
| Caracter�stica | Codex CLI | Claude Code | Copilot |
|---------------|-----------|-------------|---------|
| Modelo | gpt-4o-codex | claude-3.5-sonnet | GPT-4/Claude |
| Sandbox | Sim (isolado) | Sim (supervis�o) | IDE nativo |
| Config | `.codexrc` (JSON) | `CLAUDE.md` (markdown) | `copilot-instructions.*` |
| Tools | bash, fs, glob, grep | bash, fs, glob, grep, MCP | IDE built-in |
