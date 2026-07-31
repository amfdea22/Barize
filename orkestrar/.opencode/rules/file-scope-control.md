# File Scope Control

Controla quais arquivos cada agente pode tocar durante uma tarefa. A seção 7 dos task cards é a âncora técnica deste sistema.

## Regra Fundamental

**Antes de editar qualquer arquivo, o agente DEVE:**

1. Identificar qual task card está ativo (`.opencode/taskcards/active/`)
2. Ler a **Seção 7 (Arquivos Envolvidos)** do card
3. Verificar se o arquivo alvo está na lista
4. Se NÃO estiver: PARE e reporte ao usuário

## Enforcement

| Camada        | Mecanismo                                                            |
| ------------- | -------------------------------------------------------------------- |
| **Contrato**  | Seção 7 do task card lista arquivos explicitamente                   |
| **Protocolo** | Todo agente com `edit: allow` deve verificar seção 7 antes de editar |
| **Validação** | Validation Gate: `git diff` para detectar arquivos fora da lista     |
| **Rollback**  | Se violou, `/voltar` + `/card-concluir` rejeitado                    |
| **Registro**  | Violação registrada em `decision-log.md`                             |

## Implementação no Validation Gate

```
git diff --name-only HEAD
```

Compare a saída com a seção 7 do card ativo. Qualquer arquivo fora da lista:

1. Reporte a violação
2. Pergunte ao usuário como proceder
3. Registre em `decision-log.md`
4. Não conclua o card até resolver

## Exceções

- **Config de projeto** (opencode.json, tsconfig.json): só com permissão explícita
- **Arquivos de build**: se o build gerar arquivos fora da lista, documente
- **Dependências**: `package-lock.json` pode ser modificado por `npm install` mesmo se não estiver na lista
