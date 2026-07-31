# SOP — Standard Operating Procedure

Guia de formato e workflow para Procedimentos Operacionais Padrão.

## Formato Obrigatório

```markdown
# SOP-NNN: Título do Procedimento

**Status**: `active` | `review` | `deprecated`
**Responsável**: [agente] | [papel]
**Última revisão**: YYYY-MM-DD
**Frequência**: [daily | weekly | per-release | on-demand]

---

## 1. Objetivo

O que este procedimento padroniza e por que ele existe.

## 2. Pré-requisitos

- [ ] Ferramenta A instalada (versão >= X)
- [ ] Acesso ao recurso B
- [ ] Permissão C concedida

## 3. Passos do Procedimento

### 3.1 [Etapa 1]
1. Comando ou ação
2. Verificação intermediária
3. ...

### 3.2 [Etapa 2]
...

## 4. Verificação Pós-Execução

- [ ] Saída esperada obtida?
- [ ] Log sem erros?
- [ ] Estado do sistema conforme esperado?

## 5. Rollback / Reversão

Caso algo dê errado, como desfazer:

1. Comando de reversão
2. Verificação de reversão

## 6. Referências

- SDD-NNN (se aplicável)
- Comando /fluxo relacionado
- ADR-NNN
```

## Workflow

```
1. /sop "título"              → Cria SOP-001 em active/ (status: draft)
2. Revisão @devops-engineer   → Valida procedimento (opcional)
3. Usuário aprova              → Status: active
4. Execução (sempre que necessário) → Passos seguidos, checklist validado
5. Revisão periódica           → Atualiza ou move para deprecated/
6. /sops SOP-001 deprecate     → Move para deprecated/ (status: deprecated)
```

## Guardrails

- **Scope Guard**: procedimento operacional está no escopo?
- **Pre-flight**: passos são reproduzíveis? rollback está definido?
- **Validation**: procedimento foi testado e validado?
- **Security**: procedimento expõe dados sensíveis? requer aprovação?
