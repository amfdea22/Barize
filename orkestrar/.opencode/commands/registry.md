# /registry

Gerencia o registry local de skills, agentes e plugins do Orkestrarr.

## Execução

1. Executar `Orkestrarr registry <subcomando>` (CLI)
2. Subcomandos disponíveis:
   - `init`: inicializar registry local no projeto
   - `publish <item>`: publicar skill/agente/plugin no registry
   - `search <termo>`: buscar itens no registry
   - `list`: listar todos os itens publicados
   - `install <item>`: instalar item do registry no projeto
   - `remove <item>`: remover item instalado
   - `info <item>`: informações detalhadas sobre um item
3. Registry é baseado em arquivos `.opencode/registry/`, versionado com git

## Guardrails

- **NÃO publicar secrets ou tokens no registry.**
- **Verificar compatibilidade de versão ao instalar.**

## Exemplo

```
/registry search react
→ Encontrados 2 itens:
→ react-hooks (skill) — Padrões de React Hooks
→ react-components (plugin) — Biblioteca de componentes
```
