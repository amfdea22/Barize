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

- Language: Python 3.12+
- Framework: Python Puro
- Test framework: pytest
- Package manager: pip
- Architecture: Monolítico
- App type: Front e Back Separados
- CSS Framework: Tailwind CSS (if applicable)
- Source code in: `src/`
- Tests alongside modules: `test_*.py`

## Code Conventions

- [ ] Python type hints (mypy)
- [ ] Commits follow Conventional Commits
- [ ] Public functions must have JSDoc / docstrings
- [ ] Unit tests required for all business logic (pytest)
- [ ] PRs must pass lint + tests before merge
- [ ] UI follows DESIGN.md guidelines (if applicable)

## Architecture

```
your-project/
├── src/   ← source code
├── tests/     ← tests
├── .opencode/      ← Orkestrar framework config
├── AGENTS.md       ← This file
├── DESIGN.md       ← Design system (if applicable)
├── orkestrar.yaml   ← Source of truth (ALWAYS read this!)
└── opencode.json   ← OpenCode config
```

## Commands

| Command                      | Description                                                  |
| ---------------------------- | ------------------------------------------------------------ |
| `/testar`                    | Run test suite and analyze failures                          |
| `/fluxo <task>`              | Start deterministic workflow                                 |
| `/status`                    | Show workflow status and progress                            |
| `/card <description>`        | Create a task card                                           |
| `/cards`                     | List active and backlog cards                                |
| `/card-iniciar <id>`         | Start a task card                                            |
| `/card-concluir <id>`        | Complete a task card                                         |
| `/card-cancelar <id>`        | Cancel a task card                                           |
| `/sop <título>`              | Create new Standard Operating Procedure                      |
| `/sops`                      | List SOPs (active/review/deprecated)                         |
| `/sop-promote <id> <status>` | Promote a SOP to new status (draft→active→review→deprecated) |

## ⚠️ COMMAND EXECUTION PROTOCOL — ABSOLUTE RULE

> **THIS IS THE HIGHEST PRIORITY RULE. It overrides ALL other methodology, classification, and reasoning.**

The OpenCode tool has a built-in behavior: when you type a SLASH COMMAND like `/cards`, it automatically reads the command definition file from `.opencode/commands/` and presents it to the AI agent.

**The tool REMOVES the `/` prefix.** The agent NEVER sees `/cards`. Instead, it sees a file path like `orkestrar/.opencode/commands/cards.md`.

### THE RULE (ABSOLUTE — DO NOT DEBATE)

**ANY** message that references a file path containing `.opencode/commands/` **IS** a slash command execution request.

**Do NOT check if the message starts with `/`.** The tool STRIPS the `/`.

**Do NOT ask "do you want to execute it?"** — JUST EXECUTE.

**Do NOT present the file content back to the user** — they already saw it via the tool.

### WHAT TO DO:

1. **Recognize** `.opencode/commands/` in the message → this is a command
2. **Read** the file content (already loaded or read it yourself)
3. **Execute** the instructions in the file — perform the actions described
4. Apply only **Scope Guard** after execution
5. **Do NOT** apply the development workflow (planning → review → test → merge)

### FAILSAFE:

If you are UNSURE whether a message is a command or a file read: **ASSUME IT IS A COMMAND.** Execute the instructions and let the user correct you if you're wrong. Reading the file content is NEVER more useful than executing the command.

## Limits

- DO NOT modify opencode.json, tsconfig.json without asking
- DO NOT install dependencies without approval
- DO NOT deploy without authorization
- DO NOT rewrite entire files unnecessarily
- DO NOT change architecture without consulting @architect
- DO NOT disable security or lint rules
- DO NOT expose secrets, tokens, or API keys
- DO NOT skip validation gates
- DO NOT ignore guardrails
- DO NOT apply development methodology to management/query commands (/card, /cards, /status, /testar, /doctor, etc.) — each command has a specific restricted behavior
- DO NOT treat command files (`.opencode/commands/*.md`) as file-read requests — they are command execution requests
