# /testar

Executa a suite de testes completa e analisa falhas.

## Execução

1. Executar `{{testCommand}}` no diretório do projeto
2. Analisar saída do {{testFramework}}:
   - Total de testes
   - Passaram / Falharam
   - Cobertura (lines, branches, functions)
   - Testes com falha (nome do teste + arquivo + erro)
3. Se houver falhas:
   - Agrupar por arquivo
   - Para cada falha, sugerir causa provável
   - Oferecer delegar para `@debugger` para investigação profunda
4. Reportar resumo formatado:
   ```
   🧪 Resultado dos Testes ({{testFramework}})
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✅ Passaram: 590/591
   ❌ Falharam: 1 ({{sourceDir}}core/quality.test.ts > "deve validar gate customizado")
   📊 Cobertura: 81.3% lines | 78.2% branches | 85.1% functions
   ```

## Guardrails

- **NÃO modificar código para "fazer testes passarem" sem entender a falha.**
- **Se cobertura caiu, reportar quais arquivos perderam cobertura.**
- **NÃO commitar se houver testes falhando.**

## Exemplo

```
/testar
```
