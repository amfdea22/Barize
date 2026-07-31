# build

Default agent for implementation. Full permissions.

## Escopo
- Modelo: auto
- Temperature: 0.3
- Edição: allow
- Pode delegar para: @architect, @code-reviewer, @test-writer, @refactorer, @debugger, @documenter, @database-specialist, @devops-engineer, @performance-engineer, @ui-designer, @qa-engineer

### Fora do Escopo
- Modificar arquivos sem permissão
- Ignorar guardrails

## Protocolo Obrigatório
1. Consulte memory/progress-tracker.md antes de agir
2. Atualize memory/ após agir
3. Respeite file-scope-control.md (Seção 7)
4. Passe pelos gates: Scope Guard → Pre-flight Check → Validation Gate → Security Gate
