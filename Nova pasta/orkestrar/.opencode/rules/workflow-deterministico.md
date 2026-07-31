# Workflow Determinístico

Define fluxos de trabalho previsíveis e repetíveis com etapas claras, gates de validação e handoffs explícitos entre agentes.

## O Que é Workflow Determinístico

Diferente de uma IA agindo livremente, o workflow determinístico:

- Segue **etapas pré-definidas** (não inventa o fluxo)
- Tem **gates de validação** entre etapas (não pula etapas)
- Faz **handoff explícito** entre agentes (não muda de contexto sem aviso)
- Produz **resultados previsíveis** (mesma entrada = mesma sequência)

## Regra de Classificação

| Tipo         | Exemplos                                                                  | Comportamento                                                                                                        |
| ------------ | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **COMANDO**  | `/cards`, `/sdds`, `/smallspecs`, `/sops`, `/status`, `/testar`, `/fluxo` | **Leia o arquivo em `.opencode/commands/<comando>.md` e EXECUTE as instruções. Não apenas leia — realize as ações.** |
| **CONSULTA** | Perguntas, análises, discussões, pedidos de informação                    | Resposta direta, sem workflow                                                                                        |
| **TAREFA**   | Implementação, correção, refatoração, card, SDD, smallSpec                | **Workflow automático**                                                                                              |
| **AMBÍGUA**  | Quando não for possível classificar                                       | Perguntar ao usuário                                                                                                 |

**⚠️ REGRA ABSOLUTA**: QUALQUER mensagem que referencie `.opencode/commands/` no caminho do arquivo é automaticamente um COMANDO. O tool REMOVE o `/` do comando antes de apresentar ao agente — então o agente NUNCA vê `/cards`, ele vê `orkestrar/.opencode/commands/cards.md`. O agente DEVE ler e EXECUTAR as instruções — não apenas apresentar o conteúdo. Após executar, aplicar apenas Scope Guard. Pular etapas do workflow determinístico.

**NÃO verifique se a mensagem começa com `/`** — o tool SEMPRE remove o prefixo `/`.

**NÃO pergunte "quer executar?"** — apenas EXECUTE.

**Read-only commands** (cards, sdds, smallspecs, sops, status): listar informações em formato de tabela. Não modificar nada, não iniciar implementação.

**Action commands** (card, card-iniciar, card-concluir, card-cancelar, sdd, smallspec, sop, sop-promote, testar, checkpoint, voltar, fluxo): executar as ações descritas.

## Workflow Padrão: Desenvolvimento de Feature

```
[PLANEJAMENTO] → [APROVAÇÃO] → [IMPLEMENTAÇÃO] → [REVISÃO] → [TESTES] → [MERGE]
```

### 1. PLANEJAMENTO

**Agente**: `plan` (primário) ou `@architect` (subagent)
**Ação**: Analisar requisitos, projetar solução, documentar ADR
**Gate**: Usuário aprova o plano → avança

### 2. IMPLEMENTAÇÃO

**Agente**: `build` (primário)
**Ação**: Escrever código seguindo o plano aprovado
**Gate**: Código compila e lint passa → avança

### 3. REVISÃO

**Agente**: `revisor` (primário) ou `@code-reviewer` (subagent)
**Ação**: Revisar segurança, performance, boas práticas
**Gate**: Revisão aprovada sem issues críticas → avança

### 4. TESTES

**Agente**: `@test-writer` (se precisar criar) + `build` (para executar)
**Ação**: Escrever/atualizar testes, executar suite completa
**Gate**: 100% dos testes passando → avança

### 5. MERGE

**Agente**: `build`
**Ação**: Commitar seguindo Conventional Commits
**Gate**: Commit criado com mensagem padronizada

## Workflow Alternativo: Correção de Bug

```
[REPRODUÇÃO] → [DIAGNÓSTICO] → [CORREÇÃO] → [VERIFICAÇÃO]
```

### 1. REPRODUÇÃO

**Agente**: `@debugger`
**Gate**: Bug reproduzido consistentemente

### 2. DIAGNÓSTICO

**Agente**: `@debugger`
**Gate**: Causa raiz identificada

### 3. CORREÇÃO

**Agente**: `@debugger` (edit: ask) ou `build` (edit: allow)
**Gate**: Correção implementada

### 4. VERIFICAÇÃO

**Agente**: `build`
**Gate**: Bug não reproduz mais + testes passam

## Comandos de Workflow

| Comando       | Função                                   |
| ------------- | ---------------------------------------- |
| `/fluxo`      | Inicia um workflow para uma tarefa       |
| `/status`     | Mostra em qual etapa do workflow estamos |
| `/checkpoint` | Salva um checkpoint do progresso atual   |
| `/voltar`     | Retrocede à etapa anterior após falha    |

## Rollback

Se uma etapa falhar, use `/voltar` para retroceder à etapa anterior. O comando:

1. Lê `session-state.json` para identificar a etapa atual
2. Move cards de `active/` para `backlog/` com status `pending`
3. Registra o rollback em `decision-log.md`
4. Atualiza `progress-tracker.md` e `session-state.json`

Exemplo: se a IMPLEMENTAÇÃO falhou no Validation Gate, `/voltar` retorna ao PLANEJAMENTO para ajustes.

## Regras

1. Cada etapa deve ser concluída antes de passar para a próxima
2. Gates de validação são obrigatórios — não pule etapas
3. Handoffs entre agentes devem ser explícitos e registrados no decision-log
4. Se uma etapa falhar, volte à etapa anterior, não avance
5. Checkpoints podem ser usados para salvar progresso intermediário
6. O workflow é um guia, não uma camisa de força — adapte conforme necessário, mas documente a adaptação
