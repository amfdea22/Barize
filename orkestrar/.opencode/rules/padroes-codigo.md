# Padrões de Código — {{languageName}}

> Regras de estilo, testes e qualidade para projetos {{languageName}}.
> Gerado automaticamente pelo orkestrar Template Resolver.

## Stack

- **Linguagem:** {{languageName}}
- **Test runner:** {{testFramework}}
- **Mock framework:** {{mockFramework}}
- **Cobertura:** {{coverageCommand}}
- **Source:** `{{sourceDir}}`
- **Test extension:** `{{testExtension}}`

## Convenções Obrigatórias

1. Use {{testFramework}} como runner
2. Testes em arquivo{{testExtension}} em {{testDir}}
3. Use {{mockFramework}} para mocks
4. Cobertura via `{{coverageCommand}}`
5. Siga o style guide da linguagem

## Estrutura de Testes

```
{{sourceDir}}  ← source
{{testDir}}    ← tests
```

## Scripts

| Ação                | Comando               |
| ------------------- | --------------------- |
| Rodar testes        | `{{testCommand}}`     |
| Verificar cobertura | `{{coverageCommand}}` |
| Lint                | `{{lintCommand}}`     |
