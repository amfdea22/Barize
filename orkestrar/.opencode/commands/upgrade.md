# /upgrade

Atualiza a configuração do projeto para a versão mais recente do framework Orkestrarr.

## Execução

1. Executar `Orkestrarr upgrade` (CLI)
2. Fluxo de upgrade:
   - **Detectar** versão atual (de `Orkestrarr.yaml` meta.version)
   - **Comparar** com a versão mais recente disponível
   - **Backup** da configuração atual antes de modificar
   - **Sincronizar** templates do framework
   - **Regenerar** build (`Orkestrarr build`)
3. Flags disponíveis:
   - `--check`: apenas verificar se há atualização disponível (não modifica nada)
   - `--dry-run`: simular o que seria alterado sem aplicar mudanças
   - `--yes`: pular confirmações
4. Reportar mudanças aplicadas

## Guardrails

- **SEMPRE fazer backup antes de modificar (automático).**
- **NÃO atualizar se houver mudanças não commitadas (avisar usuário).**
- **NÃO alterar customizações do usuário no Orkestrarr.yaml.**

## Exemplo

```
/upgrade --check
→ Versão atual: 3.1.1 → Disponível: 3.2.0
→ Execute /upgrade para atualizar.
```
