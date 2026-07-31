# /architect

COMANDO: execute as instruções abaixo. Não apenas leia este arquivo.

AI-assisted architectural analysis and ADR suggestions

## Execução (AÇÃO REAL — faça isto)

1. **Delegue para @architect** a análise arquitetural
2. Forneça contexto completo: estrutura do projeto, pergunta do usuário
3. O @architect deve:
   a. Analisar arquitetura atual (padrões, diretórios, dependências)
   b. Identificar riscos e pontos de melhoria
   c. Sugerir padrões de projeto aplicáveis
   d. Documentar decisões como ADR em memory/decision-log.md
   e. Avaliar impacto entre componentes
4. Apresente resultado com recomendações

## Guardrails

- Delegue **para o subagente @architect** — não tente fazer a análise você mesmo
