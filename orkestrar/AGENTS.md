# Project Configuration

> Framework: Orkestrar v1.0.0 — by André M. França
> ⚠️ **SINGLE SOURCE OF TRUTH**: This file + `orkestrar.yaml` define the ENTIRE project stack.
> Agents MUST read both files before making ANY decision about language, tools, or commands.
> Never assume defaults — always derive from these configuration files.

## 🧠 Mandatory Protocol for ALL Agents

Before any action, EVERY agent (build, architect, code-reviewer, test-writer, etc.) MUST:

0. **Read `orkestrar/orkestrar.yaml`** to identify the project stack:
   - Language, framework, test runner, package manager
   - Architecture and application type
   - Build, lint, test, and security commands
   - Code conventions and directory structure
1. **Read `orkestrar/.opencode/memory/progress-tracker.md`** for session context
2. **Read this file (`AGENTS.md`)** for commands, limits and skills
3. **Respect `file-scope-control.md`** (Section 7)
4. **Pass through gates**: Scope Guard → Pre-flight Check → Validation Gate → Security Gate

> 🔑 **orkestrar.yaml is the SINGLE source of executable truth.** AGENTS.md is a readable projection.
> If AGENTS.md and orkestrar.yaml conflict, **orkestrar.yaml prevails**.

## Stack

- Language: {{languageName}}
- Framework: {{frameworkName}}
- Test framework: {{testFramework}}
- Package manager: {{packageManager}}
- Architecture: {{architectureName}}
- App type: {{appTypeName}}
- CSS Framework: {{cssFrameworkName}} (if applicable)
- Source code in: `{{sourceDir}}`
- Tests alongside modules: `{{testExtension}}`

## Code Conventions

- [ ] {{typeCheckMode}}
- [ ] Commits follow Conventional Commits
- [ ] Public functions must have JSDoc / docstrings
- [ ] Unit tests required for all business logic ({{testFramework}})
- [ ] PRs must pass lint + tests before merge
- [ ] UI follows DESIGN.md guidelines (if applicable)

## Architecture

```
your-project/
├── {{sourceDir}}   ← source code
├── {{testDir}}     ← tests
├── .opencode/      ← Orkestrar framework config
├── AGENTS.md       ← This file
├── DESIGN.md       ← Design system (if applicable)
├── orkestrar.yaml   ← Source of truth (ALWAYS read this!)
└── opencode.json   ← OpenCode config
```

## Commands

### Sem argumentos

| Command | Description |
|---------|-------------|
| `/adrs` | Listar ADRs (active/approved/deprecated) |
| `/architect` | Análise arquitetural assistida por IA e sugestões de ADR |
| `/cards` | Listar cartões ativos e no backlog |
| `/checkpoint` | Salvar checkpoint de progresso atual |
| `/create` | Criar novo projeto a partir de template inicial |
| `/doctor` | Executar diagnósticos de instalação |
| `/registry` | Gerenciar registro local de skills/plugins |
| `/revisar` | Revisar código a partir de commits recentes |
| `/sdds` | Listar SDDs (active/approved/completed) |
| `/smallspecs` | Listar smallSpecs (active/completed) |
| `/sops` | Listar SOPs (active/review/deprecated) |
| `/status` | Exibir status do workflow e progresso |
| `/test-quality` | Analisar qualidade dos testes do projeto |
| `/testar` | Executar suite de testes e analisar falhas |
| `/tutorial` | Iniciar tutorial interativo |
| `/upgrade` | Atualizar configuração para versão mais recente |
| `/voltar` | Reverter para etapa anterior do workflow após falha |

### Com argumentos obrigatórios

| Command | Description |
|---------|-------------|
| `/adr <título: string>` | Criar novo Architecture Decision Record (ADR) |
| `/card <descrição: string>` | Criar um cartão de tarefa |
| `/card-cancelar <id: string> [--reason: string]` | Cancelar um cartão de tarefa |
| `/card-concluir <id: string>` | Concluir um cartão de tarefa |
| `/card-iniciar <id: string>` | Iniciar um cartão de tarefa |
| `/corrigir <descrição: string>` | Depurar e corrigir bugs |
| `/direto <pergunta: string>` | ⚠️ DEPRECATED — Ignorar workflow (residual) |
| `/fluxo <tarefa: string>` | Forçar workflow determinístico |
| `/impact <descrição: string>` | Analisar impacto de mudanças |
| `/retomar <id: string>` | Retomar cartão após revisão — review → executing |
| `/review <id: string> [--reason: string]` | Solicitar revisão de cartão de tarefa |
| `/rfc <título: string>` | Criar novo RFC (Request for Comments) |
| `/sdd <título: string>` | Criar novo Software Design Document |
| `/smallspec <título: string>` | Criar nova smallSpec |
| `/sop <título: string>` | Criar novo Standard Operating Procedure |
| `/sop-promote <id: string> <status: string>` | Promover SOP para novo status |

### Com subcomandos

| Command | Description |
|---------|-------------|
| `/arbitrate {resolve\|list\|escalate\|stats}` | Sistema de arbitragem para conflitos entre agentes |
| `/changelog [generate\|latest]` | Gerar ou exibir CHANGELOG do projeto |
| `/debt {add\|list\|close\|dashboard}` | Gerenciar dívida técnica |
| `/graph {mermaid\|dot\|table}` | Visualizar grafo de dependências |
| `/invariants [run\|config\|report]` | Executar invariantes arquiteturais |
| `/knowledge-graph {build\|query\|stats\|mermaid}` | Grafo de conhecimento entre ADRs, SDDs, SOPs |
| `/sbom [json\|table]` | Gerar SBOM (SPDX 2.3) |
