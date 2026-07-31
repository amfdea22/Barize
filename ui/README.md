# ui/README.md

> Fonte única da verdade visual do projeto.
> **Todo agente @ui-designer DEVE começar por este diretório.**

## Propósito

A pasta ui/ centraliza todos os artefatos visuais do projeto, separando **mockups** (o que deve ser feito) de **componentes implementados** (o que foi feito). Ela é a ponte entre o DESIGN.md (diretrizes) e o código final.

## Estrutura

`ui/
├── README.md              ← Este arquivo — índice e regras
├── templates/             ← MOCKUPS — a única fonte da verdade visual
│   ├── layout/            ← Mockups de layout (dashboard, login, etc.)
│   ├── components/        ← Mockups de componentes (botões, cards, tabelas)
│   └── responsive/        ← Versões mobile/tablet/desktop dos mockups
├── components/            ← COMPONENTES IMPLEMENTADOS (output do agente)
│   ├── button/
│   ├── card/
│   └── ...
├── tokens/                ← Tokens canônicos extraídos do DESIGN.md
│   ├── colors.json
│   ├── typography.json
│   └── spacing.json
└── pages/                 ← Páginas completas implementadas
    └── dashboard/`

## Fluxo de Trabalho do Agente @ui-designer

1. **Ler DESIGN.md** — ponto de entrada obrigatório
2. **Explorar ui/templates/** — buscar mockup correspondente à tarefa
3. **Carregar tokens de ui/tokens/** — valores canônicos de cor, tipografia, espaçamento
4. **Implementar seguindo o mockup RELIGIOSAMENTE**
5. **Justificar desvios por escrito** — sem justificativa, é falha
6. **Validar fidelidade visual** — checklist de 10 itens
7. **Salvar componente em ui/components/**

## ⚠️ Regra de Ouro

> **Se não existe mockup para a tarefa, CRIE-O PRIMEIRO.**
> Mockups são a única fonte da verdade visual. Nunca implemente sem referência.

## Responsabilidades

- ui/templates/ → Mantido por @ui-designer ao projetar novas interfaces
- ui/components/ → Output do @ui-designer após implementação
- ui/tokens/ → Sincronizado com DESIGN.md (source of truth)
- ui/pages/ → Composição de componentes em páginas completas
