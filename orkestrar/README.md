# Templates do Orkestrarr

Este diretório contém os templates usados pelo comando `Orkestrarr init` para
scaffoldar a estrutura do framework em novos projetos.

## Estrutura

| Arquivo / Diretório              | Uso                                                                                      |
| -------------------------------- | ---------------------------------------------------------------------------------------- |
| `Orkestrarr.yaml`                | Configuração principal (fonte única da verdade) — template completo (~835 linhas)        |
| `Orkestrarr.yaml.minimal`        | Versão reduzida (~40 linhas) para começar rapidamente (usar `Orkestrarr init --minimal`) |
| `AGENTS.md`                      | Definição de agentes, comandos e limites da IA                                           |
| `DESIGN.md`                      | Design system com tokens de cores e componentes                                          |
| `.opencode/agents/`              | Prompts para 10 agentes especializados                                                   |
| `.opencode/commands/`            | Documentação de 17 comandos customizados                                                 |
| `.opencode/rules/`               | Regras técnicas (guardrails, workflow, memória, SDD, smallSpec)                          |
| `.opencode/skills/`              | Skills carregáveis sob demanda (10 internas + 3 exemplos técnicos)                       |
| `.opencode/taskcards/index.json` | Índice vazio de task cards                                                               |
| `.opencode/sdd/index.json`       | Índice vazio de SDDs                                                                     |
| `.opencode/smallspec/index.json` | Índice vazio de smallSpecs                                                               |

## Como sincronizar

Após modificar agentes, comandos, regras ou skills no diretório `.opencode/`:

```bash
npm run build:templates
```

Este comando copia o conteúdo de `.opencode/` para `templates/.opencode/`,
mantendo os templates sincronizados com o código real do framework.

## Como usar os templates

```bash
# Scaffold completo
npx Orkestrarr init

# Scaffold mínimo (~40 linhas de config)
npx Orkestrarr init --minimal

# Atualizar templates existentes
npx Orkestrarr init --update
```
