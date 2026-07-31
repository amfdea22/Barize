---
name: behavior-validator
description: 'Source-blind black-box validation of user-visible behavior against a prewritten contract for apps, CLIs, APIs, and generated artifacts.'
---

# Behavior Validator

Validate observable behavior without inspecting source. Use this as the black-box companion to `code-review`: code-review judges the change bundle, while behavior-validator judges the running product, CLI, API, or generated artifact against a behavior contract.

## Contrato

- Leia o contrato de comportamento primeiro. Se nenhum existir, escreva um curto a partir da requisição do usuário antes de testar.
- Permaneça **source-blind** (caixa-preta). Não inspecione arquivos fonte, diffs, testes, git history, notas de implementação, build internos ou bundles de revisão.
- Interaja apenas através de superfícies visíveis ao usuário ou operador: browser, CLI, API, arquivos gerados, logs públicos, screenshots, accessibility trees ou output documentado em runtime.
- Trate evidência com aparência de implementação como contaminação. Se acesso a fonte for necessário para continuar, pare e reporte `blocked_source_required`.
- Reporte achados contra cláusulas do contrato e passos observáveis, não contra locais de código.
- Não marque um workflow como passando até que cada cláusula relevante do contrato seja pass, fail, blocked ou out of scope.

## Isolamento

Preferia um workspace source-blind:

```bash
validator_dir="$(mktemp -d "${TMPDIR:-/tmp}/behavior-validator-run.XXXXXX")"
chmod 700 "$validator_dir"
cp behavior-contract.md "$validator_dir/"
cd "$validator_dir"
```

Inicie ou conecte-se ao alvo a partir do contrato. Mantenha apenas o contrato, fixtures permitidas e evidência capturada redigida no workspace privado. Forneça credenciais através de ferramentas de secret aprovadas ou variáveis de ambiente exatas; nunca copie valores de credenciais para o workspace, relatório, screenshots ou logs.

Se o app precisar ser iniciado a partir do checkout fonte, inicie-o de um terminal separado e não leia fonte enquanto valida.

## Workflow

1. Parseie o contrato em tarefas de usuário, comportamento esperado, anti-cheat probes, setup e requisitos de evidência.
2. Prepare acesso runtime: URL alvo, comando CLI, endpoint API, fixture data, credenciais ou path de artefato gerado.
3. Exerça cada tarefa de usuário como um usuário ou operador real faria.
4. Execute **anti-cheat probes**: varie fixture data, refresh/retry, teste entradas vazias e inválidas, verifique persistência, inspecione output gerado e confirme que botões/comandos realizam trabalho real em vez de apenas exibir texto de sucesso.
5. Capture evidência como notas redigidas compactas, screenshots, excertos de terminal, resumos de resposta, resumos de arquivo ou observações de acessibilidade. Omita credenciais, tokens, cookies, dados privados de usuário e conteúdo de log não relacionado.
6. Emita um relatório estruturado.
7. Se o orquestrador corrigir um achado, rerrode apenas as cláusulas de contrato afetadas mais probes de regressão próximas.

## Regras de Achados

- **Fail**: comportamento observável viola o contrato, uma tarefa não pode ser completada, estado esperado é falso/estático, ou evidência é insuficiente para um pass reivindicado.
- **Blocked**: acesso runtime, credenciais, fixtures, rede ou ferramentas necessárias estão faltando.
- **Out of scope**: apenas quando o contrato explicitamente exclui o comportamento ou a tarefa depende de uma decisão de produto do usuário.
- **Rejeite**: preocupações puramente estéticas, de qualidade de código ou de estilo de implementação; estas pertencem ao code-review.

## Relatório Final

Inclua:

- Alvo exercitado
- Arquivo de contrato ou contrato inline utilizado
- Sumário pass/fail/blocked/out-of-scope
- Achados comportamentais aceitos com passos de reprodução e evidência
- Anti-cheat probes executadas
- Blockers restantes, se houver
