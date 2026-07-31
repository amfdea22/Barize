---
name: code-review
description: 'Multi-engine code review closeout with scope governance, contract isolation, and parallel test support.'
---

# Code Review

Execute structured code review como gate de closeout antes de commit/PR. Esta skill implementa revisão multi-engine com governança de escopo, isolamento de engine e verificação de regressão.

Use quando:

- O usuário pedir revisão de código antes de finalizar um commit/PR
- Após edições não-triviais de código, antes de commit/ship
- Revisando branch local ou PR branch após correções
- Precisar verificar se alterações não introduzem riscos fora do escopo

## Contrato de Revisão

- Trate o resultado da revisão como consultivo. Nunca aplique cegamente.
- Verifique cada achado lendo o caminho de código real e arquivos adjacentes.
- Leia docs/dependências quando o achado depender de comportamento externo.
- Rejeite edge cases irreais, riscos especulativos, reescritas amplas e correções que compliquem desnecessariamente o código.
- Prefira correções pequenas no limite correto de ownership; sem refatoração a menos que melhore claramente a classe de bug.
- Quando um achado aceito mostra uma classe de bug ou padrão repetido, inspecione o escopo atual do PR para instâncias similares antes de corrigir.
- Para supressão de achados de segurança, verifique que achados aceitos permanecem auditáveis: achados suprimidos ficam no output estruturado, output ativo mantém aviso de supressão não-supressível.
- Continue até a revisão estruturada não retornar achados aceitos/acioneis apenas enquanto o trabalho permanecer dentro do escopo original da tarefa.

## Governança de Escopo

Antes da primeira revisão, congele uma baseline de escopo: requisição original ou issue, branch alvo, comportamento esperado, limite de ownership, arquivos alterados e LOC não-teste.

Classifique cada achado:

- **In-scope blocker**: introduzido pelo diff atual, mesmo ownership, corrigível sem mudar o contrato da tarefa.
- **Follow-up**: real mas pertence a classe de bug adjacente, superfície irmã, limpeza ou track de hardening.
- **Stop-and-escalate**: requer novo protocolo/config/storage/contrato de API, ownership diferente, mudança de processo de release ou decisão de design fora da requisição original.

Pare e reporte a quebra de escopo quando:

- Um PR estreito vira mudança de arquitetura, protocolo, migração ou release
- O diff cresce >2x arquivos ou LOC não-teste sem aprovação explícita
- Dois ciclos de patch não convergiram; pause e reclassifique
- A melhor correção é "definir o contrato canônico primeiro" em vez de outra camada de inferência local

## Isolamento de Engine

Quando a revisão roda dentro do repositório sob análise, a engine não deve carregar confiança ou configuração local que o branch controla.

Princípios:

- Workspace vazio e temporário para a engine (não o repositório real)
- Sem arquivos de configuração do projeto
- Sem tools de arquivos/shell que possam vazar contexto
- Apenas o bundle validado é passado para revisão
- WebSearch disponível para docs upstream, sem rede privada

Para revisões locais:

```bash
# Apenas alterações não commitadas
review-tool --mode local
```

Para branches/PRs:

```bash
# Diff contra base
review-tool --mode branch --base origin/main
```

Para commits já mergeados:

```bash
review-tool --mode commit --commit HEAD
```

## Parallel Closeout

É seguro rodar testes e revisão em paralelo:

```bash
review-tool --parallel-tests "npx vitest run --changed"
```

Se testes ou revisão levarem a edições, rerrode testes focados e rerrode a revisão até não haver achados aceitos/acioneis.

## Reporte Final

Inclua:

- Comando de revisão utilizado
- Testes/provas executados
- Achados aceitos/rejeitados com breve justificativa
- Resultado limpo da revisão final, ou por que um achado foi conscientemente rejeitado

Se o helper de revisão retornou 0 achados acionáveis, reporte exatamente essa execução como limpa.
