# Guardrails — Barreiras de Proteção

Sistema de proteção que impede a IA de agir fora do escopo definido, garantir qualidade e segurança.

## Níveis de Guardrail

### Nível 1: Escopo (Scope Guard)

Antes de qualquer ação, o agente DEVE verificar se a tarefa está dentro do seu escopo definido.

```
Checklist de Escopo:
[ ] A tarefa está dentro da minha descrição/função?
[ ] Eu tenho permissão para modificar os arquivos envolvidos?
[ ] A tarefa não viola os LIMITES DA IA no AGENTS.md?
```

Se qualquer resposta for NÃO, o agente DEVE parar e perguntar ao usuário.

### Nível 2: Pré-voo (Pre-flight Check)

Antes de modificar arquivos, o agente DEVE verificar:

```
Pre-flight Checklist:
[ ] Eu entendi o código existente? (li os arquivos relevantes)
[ ] Minha mudança não quebra funcionalidades existentes?
[ ] Os testes atuais passam? (execute antes)
[ ] A mudança segue os padrões do projeto? (AGENTS.md, DESIGN.md, coding-standards)
[ ] Não estou modificando arquivos de configuração sem permissão?
```

### Nível 3: Validação (Validation Gate)

Após modificar, o agente DEVE validar:

```
Validation Gate:
[ ] Código compila sem erros (TypeScript strict)
[ ] Lint passa sem warnings/errors
[ ] Testes passam (vitest/jest)
[ ] Nenhum arquivo não-intencional foi modificado (git diff)
[ ] A mudança é consistente com o DESIGN.md (se aplicável)
```

### Nível 4: Segurança (Security Gate)

Para operações sensíveis:

```
Security Gate:
[ ] Nenhum secret/token está sendo exposto no código ou commit
[ ] Nenhuma dependência vulnerável está sendo introduzida
[ ] Nenhuma regra de segurança está sendo desativada
[ ] Nenhum endpoint/rota está sendo exposto sem autenticação
```

## Regras de Negação Explícita (Deny Rules)

### Operações Sempre Negadas

| Operação                                | Motivo                     |
| --------------------------------------- | -------------------------- |
| `rm -rf`                                | Destrutivo demais          |
| Modificar `opencode.json` sem permissão | Configuração do harness    |
| Modificar `tsconfig.json` sem permissão | Configuração do compilador |
| Desativar lint/security rules           | Segurança                  |
| Instalar dependências sem aprovação     | Controle de dependências   |
| Expor secrets em código/commit          | Segurança                  |

### Operações que SEMPRE Precisam de Aprovação

| Operação                  | Motivo                    |
| ------------------------- | ------------------------- |
| Deploy                    | Impacto em produção       |
| Push para main/master     | Risco de quebrar produção |
| Modificar CI/CD pipelines | Infraestrutura            |
| Migrations de banco       | Risco de perda de dados   |

## Guardrails por Agente

| Agente              | Guardrails Ativos                                     |
| ------------------- | ----------------------------------------------------- |
| `build`             | Scope + Pre-flight + Validation + Security            |
| `plan`              | Scope (read-only enforcement)                         |
| `revisor`           | Scope (read-only enforcement)                         |
| `@code-reviewer`    | Scope (read-only, não modificar)                      |
| `@test-writer`      | Scope + Validation (testes devem passar)              |
| `@refactorer`       | Scope + Pre-flight + Validation (testes antes/depois) |
| `@debugger`         | Scope + Security (não introduzir vulnerabilidades)    |
| `@architect`        | Scope (read-only enforcement)                         |
| `@documenter`       | Scope (apenas documentação)                           |
| `@security-auditor` | Scope + Security                                      |

## Violações e Recuperação

1. **Violação de Guardrail**: O agente DEVE parar imediatamente e informar o usuário
2. **Rollback**: Se uma modificação violou guardrails, usar `/undo` para reverter
3. **Registro**: A violação deve ser registrada no `decision-log.md`
4. **Correção**: O usuário decide como proceder
