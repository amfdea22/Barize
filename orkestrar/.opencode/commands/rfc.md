# /rfc <título>

Cria uma nova RFC (Request for Comments) para propor mudanças significativas no framework, seguindo o processo colaborativo de 7 seções.

## Execução

1. Verificar se o diretório `.opencode/rfc/` existe; se não, criar estrutura (index.json + pastas proposed/, review/, accepted/, rejected/, withdrawn/)
2. Gerar ID automático RFC-NNNN baseado no nextId do index.json
3. Copiar template de `templates/.opencode/rfcs/0000-template.md` para `.opencode/rfc/proposed/RFC-NNNN.md` preenchendo título, autor (build), data
4. Atualizar index.json: nextId+1, registrar entrada
5. Exibir confirmação: "✓ RFC-NNNN criada em proposed/: <título> (proposed)"

## Comentários

Adicione comentários a uma RFC existente com `/rfc comment RFC-NNNN "seu texto"`.

## Revisão e Decisão

| Comando                  | Descrição                               |
| ------------------------ | --------------------------------------- |
| `/rfc review RFC-NNNN`   | Iniciar revisão (proposed → review)     |
| `/rfc accept RFC-NNNN`   | Aceitar RFC (review → accepted)         |
| `/rfc reject RFC-NNNN`   | Rejeitar RFC (review → rejected)        |
| `/rfc amend RFC-NNNN`    | Solicitar ajustes (review → proposed)   |
| `/rfc withdraw RFC-NNNN` | Retirar proposta (proposed → withdrawn) |

## Guardrails

- APENAS CRIAR A RFC. NÃO implementar o que a RFC propõe.
- NÃO modificar código-fonte baseado na RFC.
- Mínimo de 2 alternativas consideradas.
- Seções de Impacto e Riscos são OBRIGATÓRIAS.
- RFCs accepted viram tarefas no roadmap, não implementação automática.

## Exemplo

```
/rfc Adicionar suporte a Redis como cache distribuído
→ RFC-0001 criado em proposed/: Adicionar suporte a Redis como cache distribuído (proposed)
```
