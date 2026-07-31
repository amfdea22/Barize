---
name: agent-handoff
description: 'Clipboard-ready handoff prompt for delegating investigation or task continuation to another agent.'
---

# Agent Handoff

Write a clipboard-ready prompt for another agent to investigate, discuss, or work on a specific task. Use when delegating via `@agent` ou quando o usuário pedir `handoff <tarefa>`.

## Quando Usar

Use handoff quando:

- O usuário pede "handoff <tarefa>", "delegue isto", "passe para @agent"
- Uma tarefa requer expertise diferente da atual
- O escopo atual precisa de investigação por outro agente antes de decisão
- Um agente especializado precisa de contexto para continuar uma tarefa

Não use handoff para:

- Subtarefas simples dentro do mesmo escopo (apenas delegue via @nome)
- Perguntas que o agente atual pode responder diretamente
- Decisões que já foram discutidas e aprovadas

## Workflow

1. **Identifique a tarefa** do texto do usuário. Se for apenas um rótulo curto, infira do repositório atual, discussão recente, branch, issue/PR vinculado e contexto óbvio próximo.
2. **Reúna contexto suficiente**: identidade do repo/produto, issue/PR/branch relevantes, módulos prováveis, constraints e sintomas conhecidos. Não execute a revisão completa do agente receptor nem decida a direção técnica final para ele.
3. **Escreva um prompt autônomo** para um agente fresco. Use o template abaixo.
4. **Copie o prompt completo** para a área de transferência (clipboard).
5. **Resposta final**: confirmação breve com o título da tarefa. Não cole o prompt completo a menos que o usuário peça.

## Template de Prompt

```
Quero discutir e possivelmente trabalhar em: <título curto da tarefa>

Contexto:
- <contexto portátil do repo/produto>
- <o que disparou esta tarefa>
- <estado atual conhecido, nomes de branch/issue/PR se relevante>
- <restrições importantes e limites de ownership>

Antes de qualquer implementação:
- Encontre o repositório certo a partir do diretório atual.
- Leia as instruções locais do agente/repo (AGENTS.md, orkestrar.yaml).
- Inspecione código, docs, testes, commits recentes e estado de issue/PR.
- Decida se a tarefa ainda é real, se a direção proposta é boa ideia.
- Aponte suposições desatualizadas e riscos ocultos.

Tarefa:
- <o que investigar ou implementar se a revisão suportar>
- <comportamento esperado ou critérios de decisão>
- <não-objetivos>

Validação:
- <testes/checks/provas esperados>
- <qual evidência deve ser incluída>

Saída:
- Comece com seus achados de revisão e recomendação.
- Depois dê o plano proposto ou resumo do patch.
- Se editar código, mantenha escopo e reporte a prova exata executada.
- Não faça push, merge, feche issues/PRs a menos que explicitamente instruído.
```

## Regras do Prompt

O prompt deve:

- Começar uma **discussão**, não uma ordem de comando
- Pedir ao agente receptor **revisão independente extensa** antes de mudar qualquer coisa
- Deixar claro que o agente receptor é **dono da revisão**
- **Evitar caminhos de arquivo**. Use âncoras portáteis: repo owner/name, nomes de módulo, URLs de issue/PR, nomes de branch, símbolos públicos, comandos, chaves de config, texto de erro
- Incluir contexto suficiente para orientação sem "brain dump"
- Incluir constraints, não-objetivos e formato da saída esperada
- Instruir o agente a **re-verificar estado live** do repo/GitHub/CI
- Instruir o agente a **não fazer push/merge** a menos que explicitamente autorizado

## Clipboard

No macOS:

```sh
pbcopy < /tmp/handoff-prompt.txt
```

No Windows:

```powershell
Get-Content /tmp/handoff-prompt.txt | Set-Clipboard
```

No Linux:

```sh
xclip -sel clip < /tmp/handoff-prompt.txt
```

## Quality Bar

- Nenhum fato inventado. Marque fatos revisados como tal apenas após verificação.
- Sem vazamento de caminhos. Reescreva qualquer caminho como símbolo, módulo, URL ou termo de busca.
- Contexto suficiente para um agente fresco se orientar; sem "brain dump" gigante.
- Primeira instrução real ao agente receptor: revise, discuta, avalie.
