# SDD — Software Design Document

Guia de formato e workflow para documentos de design de software.

## Formato Obrigatório

```markdown
# SDD-NNN: Título

**Status**: `draft` | `review` | `approved` | `in_progress` | `completed`
**Autor**: build
**Criado em**: YYYY-MM-DD

---

## 1. Contexto

Problema que motiva este documento.

## 2. Objetivos e Não-Objetivos

- **Goals**: o que o sistema deve fazer
- **Non-goals**: o que está explicitamente fora de escopo

## 3. Arquitetura Proposta

### 3.1 Visão Geral

### 3.2 Diagrama (textual)

### 3.3 Data Model / API

### 3.4 Fluxo de Dados

## 4. Alternativas Consideradas

| Alternativa | Prós | Contras | Decisão |
| ----------- | ---- | ------- | ------- |

## 5. Segurança

Autenticação, autorização, criptografia, dados sensíveis.

## 6. Plano de Implementação

- Fase 1: descrição
- Fase 2: descrição

## 7. Checklist de Revisão

- [ ] Arquitetura validada com @architect
- [ ] Segurança revisada com @security-auditor
- [ ] Impacto em componentes existentes mapeado
- [ ] ADR registrado em decision-log.md
- [ ] DESIGN.md seguido (se UI)

## 8. Referências
```

## Workflow

```
1. /sdd "título"       → Cria SDD-001 em active/ (status: draft)
2. @architect revisa    → Opcional, valida arquitetura
3. Usuário aprova       → Move para approved/ (status: approved)
4. build implementa     → Status: in_progress
5. Testes + revisão     → Validation Gate
6. /sdds SDD-001 concluir → Move para completed/ (status: completed)
```

## Guardrails

- **Scope Guard**: arquitetura está no escopo?
- **Pre-flight**: alternativas foram consideradas? segurança foi avaliada?
- **Validation**: plano implementado conforme SDD?
- **Security**: obrigatório — toda SDD deve ter seção de segurança
