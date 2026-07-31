# /doctor

Executa diagnóstico completo do ambiente e configuração do Orkestrarr.

## Execução

1. Executar `Orkestrarr doctor` (CLI)
2. Verificar:
   - **Ambiente**: Node.js versão, npm versão, sistema operacional
   - **Configuração**: `Orkestrarr.yaml` válido (schema Zod)
   - **Estrutura**: diretórios `.opencode/` existentes (agents, commands, rules, skills, memory, taskcards)
   - **Permissões**: arquivos de configuração acessíveis
   - **Dependências**: `node_modules` instalado, versões compatíveis
3. Reportar issues por severidade:
   - 🔴 Erro: bloqueia o funcionamento
   - 🟡 Aviso: não bloqueia mas deve ser corrigido
   - ⚪ Info: sugestão
4. Sugerir correções automáticas quando possível

## Guardrails

- **COMANDO READ-ONLY (diagnóstico). NÃO modificar configuração sem confirmação.**
- **NÃO instalar dependências automaticamente.**

## Exemplo

```
/doctor
→ ✅ Node.js v22.14.0
→ ✅ npm v10.9.2
→ ✅ Orkestrarr.yaml válido
→ 🟡 .opencode/memory/session-state.json desatualizado (29/05)
→ ⚪ Cobertura de testes: 81.3% (threshold: 80%)
```
