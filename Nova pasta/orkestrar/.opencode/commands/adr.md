# /adr <título>

Cria um novo Architecture Decision Record (ADR).

## Execução (AÇÃO REAL — faça isto)

1. **Extraia o título** do argumento (se vazio, pergunte ao usuário)
2. **Pergunte ao usuário** (se não informados):
   - Deciders: quem participou da decisão
   - Contexto: problema, contexto, restrições
   - Decisão: o que foi decidido, específico e concreto
   - Consequências positivas e negativas
   - Riscos e mitigações
   - Alternativas consideradas
3. **Crie o arquivo** no diretório `.opencode/adr/adr-{number}-{title}.md`:
   - Determine o próximo número ADR lendo os arquivos existentes nos diretórios `.opencode/adr/` (e subpastas `active/`, `approved/`, `deprecated/`)
   - Se o diretório `.opencode/adr/` não existir, crie-o
   - Estrutura: título, data, deciders, status (draft), contexto, decisão, consequências, alternativas
4. **Informe o caminho** do ADR criado e o número (ex: `ADR-001`)
5. **Sugira** usar `/adrs` para ver todos os ADRs

## Guardrails

- ADR deve ter pelo menos uma alternativa considerada
- ADR aprovado não pode ser alterado sem novo ADR que o supersede
- Salvar em `.opencode/adr/adr-{number}-{title}.md`

## Exemplo

```
/adr "Use PostgreSQL for Persistence"
→ ADR-001 criado em .opencode/adr/adr-001-use-postgresql-for-persistence.md
→ Status: draft
```
