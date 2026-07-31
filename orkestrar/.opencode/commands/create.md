# /create

Scaffold de um novo projeto a partir de templates starter do Orkestrarr.

## Execução

1. Executar `Orkestrarr create` (CLI)
2. Templates disponíveis (dependem da stack configurada):
   - `app`: Aplicação {{languageName}}
   - `lib`: Biblioteca {{languageName}}
   - `minimal`: Projeto mínimo com Orkestrarr
3. Flags:
   - `--template <nome>`: escolher template
   - `--list`: listar templates disponíveis
   - `--no-install`: não executar {{installCommand}}
4. O scaffold cria:
   - Estrutura de diretórios
   - `{{configFiles}}`
   - `.gitignore`
   - Inicializa o Orkestrarr (`Orkestrarr init`)

## Guardrails

- **NÃO sobrescrever projeto existente sem confirmação.**
- **NÃO instalar dependências globalmente.**

## Exemplo

```
/create --template app
→ Scaffolding app em ./my-app...
→ Estrutura criada. Execute {{installCommand}} && {{testCommand}}.
```
