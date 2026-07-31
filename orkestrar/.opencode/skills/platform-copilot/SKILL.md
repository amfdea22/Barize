# platform-copilot

> **Categoria**: platform
> **Tags**: copilot, github, platform, copilot-instructions, chat, snippets

GitHub Copilot platform specifics: .github/copilot-instructions.md YAML format, Copilot Config JSON, language-specific rules, snippets, exclusion patterns, and Chat participant behavior.

## Quando Usar

Use ao configurar GitHub Copilot para um projeto, definir regras de sugest�o, configurar exclus�es, customizar chat ou criar snippets contextuais.

## Configuration Format (YAML)

**`.github/copilot-instructions.md`** (instru��es globais):

```markdown
Follow TypeScript strict mode conventions.
Use Vitest for testing with vi.mock() for module mocking.
Prefer functional components with hooks in React.
Commits must follow Conventional Commits format.
```

**`.github/copilot-instructions.yml`** (instru��es estruturadas):

```yaml
version: 1
rules:
  - id: typescript-strict
    description: Use strict TypeScript
    patterns:
      - '**/*.ts'
    instructions: |
      Use strict TypeScript with explicit types.
      Avoid `any`, prefer `unknown`.
      Use `interface` over `type` for object shapes.

  - id: react-patterns
    description: React component patterns
    patterns:
      - '**/*.tsx'
    instructions: |
      Use functional components with hooks.
      Extract logic into custom hooks.
      Use React.memo for expensive renders.
```

## Rules by Language

**Language-specific rules** em `copilot-instructions.yml`:

```yaml
rules:
  - id: node-api
    patterns: ['src/api/**/*.ts']
    instructions: |
      Use Express with async error handling.
      Validate inputs with Zod schemas.
      Return consistent JSON error responses.

  - id: db-queries
    patterns: ['src/db/**/*.ts']
    instructions: |
      Use parameterized queries (never string concat).
      Include EXPLAIN ANALYZE in query comments.
      Use transactions for multi-step operations.

  - id: test-files
    patterns: ['**/*.test.ts']
    instructions: |
      Use describe/it blocks.
      Follow AAA pattern (Arrange, Act, Assert).
      Mock external services, test business logic.
```

- Padr�es usam glob (mesmo formato do .gitignore)
- Regras mais espec�ficas t�m maior prioridade
- M�ltiplas regras aplic�veis s�o combinadas

## Snippets & Examples

Snippets contextuais no `copilot-instructions.md`:

```typescript
// Example: API error handler pattern
class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
}
```

- Snippets devem ser completos e representativos
- At� 3 snippets por se��o (qualidade > quantidade)
- Incluir tanto padr�es corretos quanto anti-patterns

## Exclusion Patterns

**`.github/copilot-exclusions.yml`** (arquivos ignorados):

```yaml
version: 1
exclude:
  - pattern: '*.min.js'
    reason: 'Minified/compiled files'
  - pattern: 'dist/**'
    reason: 'Build output'
  - pattern: 'node_modules/**'
    reason: 'Dependencies'
  - pattern: '*.generated.*'
    reason: 'Code generation output'
  - pattern: 'coverage/**'
    reason: 'Test coverage reports'
  - pattern: '.env*'
    reason: 'Environment files with secrets'
```

- Exclus�es melhoram qualidade das sugest�es (menos ru�do)
- Arquivos de build, depend�ncias e gerados sempre exclu�dos
- Dados sens�veis (.env, secrets) exclu�dos por seguran�a

## Chat Customization

**Comportamento do Chat Copilot** pode ser influenciado:

- **@workspace** � contexto do workspace inteiro
- **#file** � referenciar arquivo espec�fico
- **#codebase** � busca sem�ntica no c�digo

**Instru��es para chat** (em `copilot-instructions.md`):

```
When explaining code, include the broader context of the module.
Prefer Portuguese for explanations, English for code comments.
Always suggest tests when proposing new features.
Reference DESIGN.md tokens when discussing UI components.
```

**Slash commands customizados** (via extens�o):

- `/fix` � sugerir corre��o para erro selecionado
- `/test` � gerar teste para fun��o selecionada
- `/doc` � gerar documenta��o JSDoc

## Best Practices

- **Instru��es curtas e diretas**: Copilot l� as primeiras linhas primeiro
- **Padr�es espec�ficos antes de gen�ricos**: regras mais espec�ficas t�m prioridade
- **Atualizar regularmente**: sincronizar com mudan�as no stack
- **Testar com feedback**: marcar sugest�es �teis/n�o �teis para treinar o modelo
- **Versionar instru��es**: manter no reposit�rio (`.github/copilot-instructions*`)
- ? Regras contradit�rias (Copilot pode ignorar ambas)
- ? Instru��es muito longas (>100 linhas) � Copilot pode n�o processar tudo

# ---- Phase 2: MEDIA priority (Platform, Cloud & Infrastructure) ----
