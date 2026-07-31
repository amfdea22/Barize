# Memória Persistente

Sistema de memória que persiste entre sessões, permitindo que os agentes lembrem de decisões, progresso e contexto mesmo após compactação ou reinício.

## Arquitetura da Memória

```
.opencode/memory/
├── decision-log.md      → Registro persistente de decisões (ADRs)
├── progress-tracker.md  → Rastreamento de tarefas e progresso
├── session-state.json   → Estado leve da sessão atual
└── context-map.md       → Mapa de contexto já carregado
```

## Como Cada Arquivo Funciona

### 1. decision-log.md

- **Formato**: ADR (Architecture Decision Record)
- **Quando consultar**: ANTES de tomar qualquer decisão técnica
- **Quando escrever**: APÓS tomar uma decisão importante
- **Exemplo**:

  ```
  ## ADR-003: Escolha do Banco de Dados

  - **Data**: 2026-05-15
  - **Contexto**: Precisamos de um banco para dados relacionais
  - **Decisão**: PostgreSQL pelo ecossistema maduro e suporte a JSON
  - **Consequências**: [+]$`confiabilidade`, [-]$`maior consumo de recursos`
  - **Status**: Aceito
  ```

### 2. progress-tracker.md

- **Formato**: Markdown estruturado com checklists
- **Quando consultar**: No início de cada sessão para saber o que fazer
- **Quando escrever**: Ao iniciar/concluir tarefas
- Mantém o estado entre sessões mesmo após compactação

### 3. session-state.json

- **Formato**: JSON leve
- **Quando consultar**: Para saber o estado atual da sessão
- **Quando escrever**: A cada transição de estado
- Contém: agente atual, tarefa, workflow etapa, checkpoints

### 4. context-map.md

- **Formato**: Markdown tabular
- **Quando consultar**: Antes de analisar um arquivo (já foi analisado?)
- **Quando escrever**: Após analisar ou modificar arquivos
- Evita retrabalho e duplicação de análise

## Regras de Memória

1. **SEMPRE** consulte `decision-log.md` antes de tomar decisões
2. **SEMPRE** consulte `progress-tracker.md` no início de cada sessão
3. **SEMPRE** consulte `context-map.md` antes de analisar arquivos
4. **SEMPRE** atualize `decision-log.md` após decisões importantes
5. **SEMPRE** atualize `progress-tracker.md` ao progredir em tarefas
6. **NUNCA** apague entradas existentes — apenas adicione novas
7. **NUNCA** modifique decisões passadas — marque como "Substituído" se necessário

## Ciclo de Vida da Memória

```
Início da Sessão
    ↓
1. Lê session-state.json (retomar ou começar novo)
2. Lê progress-tracker.md (o que estava pendente)
3. Lê decision-log.md (decisões relevantes)
4. Lê context-map.md (o que já foi coberto)
    ↓
Durante a Sessão
    ↓
1. Atualiza session-state.json a cada transição
2. Atualiza progress-tracker.md ao concluir tarefas
3. Atualiza decision-log.md ao tomar decisões
4. Atualiza context-map.md ao analisar/modificar arquivos
    ↓
Fim da Sessão
    ↓
1. Atualiza progress-tracker.md com status final
2. session-state.json fica como "ocioso" para próxima sessão
```
