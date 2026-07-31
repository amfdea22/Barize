# Design System — Orkestrarr

Este documento define as diretrizes de design de interface gráfica do projeto. **Todos os agentes devem seguir estas especificações ao criar ou modificar componentes de UI.**

---

## Princípios de Design

- **Consistência**: componentes reutilizáveis, não reinventar padrões
- **Acessibilidade**: WCAG AA mínimo, contraste 4.5:1 para texto normal
- **Simplicidade**: menos é mais. UI limpa, sem ruído visual
- **Responsivo**: mobile-first, breakpoints Tailwind padrão
- **Performance**: componentes leves, evitar re-renders desnecessários

---

## Paleta de Cores

<!-- Paleta sugerida baseada em Tailwind CSS. Ajuste os valores conforme necessário. -->

### Cores Base

| Token             | Cor | Hex       | Dark Mode | Uso                                                      |
| ----------------- | --- | --------- | --------- | -------------------------------------------------------- |
| `primary`         | ██  | `#2563EB` | `#60A5FA` | Botões principais, links, headers, elementos de destaque |
| `primary-hover`   | ██  | `#1D4ED8` | `#3B82F6` | Hover do primary                                         |
| `primary-light`   | ██  | `#DBEAFE` | `#1E3A5F` | Background de elementos com destaque suave               |
| `secondary`       | ██  | `#6B7280` | `#9CA3AF` | Elementos secundários, badges, tags                      |
| `secondary-hover` | ██  | `#4B5563` | `#D1D5DB` | Hover do secondary                                       |

### Cores de Fundo e Superfície

| Token           | Cor | Hex       | Dark Mode | Uso                               |
| --------------- | --- | --------- | --------- | --------------------------------- |
| `background`    | ██  | `#FFFFFF` | `#0F172A` | Fundo da página                   |
| `surface`       | ██  | `#F9FAFB` | `#1E293B` | Cards, modais, sidebar, dropdowns |
| `surface-hover` | ██  | `#F3F4F6` | `#334155` | Hover de superfícies interativas  |
| `border`        | ██  | `#E5E7EB` | `#334155` | Bordas de componentes             |
| `divider`       | ██  | `#E5E7EB` | `#334155` | Linhas divisórias                 |

### Cores de Texto

| Token            | Cor | Hex       | Dark Mode | Uso                                    |
| ---------------- | --- | --------- | --------- | -------------------------------------- |
| `text-primary`   | ██  | `#111827` | `#F1F5F9` | Texto principal (títulos, corpo)       |
| `text-secondary` | ██  | `#6B7280` | `#CBD5E1` | Texto secundário (legendas, metadados) |
| `text-disabled`  | ██  | `#9CA3AF` | `#64748B` | Texto desabilitado                     |
| `text-inverse`   | ██  | `#FFFFFF` | `#0F172A` | Texto sobre fundo escuro               |

### Cores de Status

| Token        | Cor | Hex       | Dark Mode | Uso                                |
| ------------ | --- | --------- | --------- | ---------------------------------- |
| `success`    | ██  | `#16A34A` | `#4ADE80` | Feedback positivo, sucesso         |
| `success-bg` | ██  | `#DCFCE7` | `#14532D` | Background de alertas de sucesso   |
| `warning`    | ██  | `#D97706` | `#FBBF24` | Alertas, avisos                    |
| `warning-bg` | ██  | `#FEF3C7` | `#451A03` | Background de alertas de aviso     |
| `error`      | ██  | `#DC2626` | `#F87171` | Erros, validação negativa          |
| `error-bg`   | ██  | `#FEE2E2` | `#7F1D1D` | Background de alertas de erro      |
| `info`       | ██  | `#2563EB` | `#60A5FA` | Informação                         |
| `info-bg`    | ██  | `#DBEAFE` | `#1E3A5F` | Background de alertas informativos |

### Tailwind Config (exemplo)

```ts
// tailwind.config.ts
export default {
  content: [''./src/**/*.{ts,tsx}''],
  darkMode: ''class'',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: ''#2563EB'',
          hover: ''#1D4ED8'',
          light: ''#DBEAFE'',
          dark: ''#60A5FA'',
          ''''dark-hover'''': ''#3B82F6'',
          ''''dark-light'''': ''#1E3A5F'',
        },
        surface: {
          DEFAULT: ''#F9FAFB'',
          hover: ''#F3F4F6'',
          dark: ''#1E293B'',
          ''''dark-hover'''': ''#334155'',
        },
        success: {
          DEFAULT: ''#16A34A'',
          bg: ''#DCFCE7'',
          dark: ''#4ADE80'',
          ''''dark-bg'''': ''#14532D'',
        },
        warning: {
          DEFAULT: ''#D97706'',
          bg: ''#FEF3C7'',
          dark: ''#FBBF24'',
          ''''dark-bg'''': ''#451A03'',
        },
        error: {
          DEFAULT: ''#DC2626'',
          bg: ''#FEE2E2'',
          dark: ''#F87171'',
          ''''dark-bg'''': ''#7F1D1D'',
        },
        info: {
          DEFAULT: ''#2563EB'',
          bg: ''#DBEAFE'',
          dark: ''#60A5FA'',
          ''''dark-bg'''': ''#1E3A5F'',
        },
      },
    },
  },
};
```

---

## Tipografia

- **Fonte base**: Inter (padrão Tailwind)
- **Fallback**: `system-ui, -apple-system, sans-serif`

### Escala de Tamanhos

| Classe Tailwind | Tamanho | Uso                             |
| --------------- | ------- | ------------------------------- |
| `text-xs`       | 12px    | Metadados, legendas, timestamps |
| `text-sm`       | 14px    | Corpo secundário, labels        |
| `text-base`     | 16px    | Corpo de texto padrão           |
| `text-lg`       | 18px    | Subtítulos, destques            |
| `text-xl`       | 20px    | Títulos de seção                |
| `text-2xl`      | 24px    | Títulos de página               |
| `text-3xl`      | 30px    | Headers de seção principal      |
| `text-4xl`      | 36px    | Headers de página principal     |

### Pesos

| Peso     | Classe                | Uso            |
| -------- | --------------------- | -------------- |
| Regular  | `font-normal` (400)   | Corpo de texto |
| Medium   | `font-medium` (500)   | Labels, botões |
| Semibold | `font-semibold` (600) | Subtítulos     |
| Bold     | `font-bold` (700)     | Títulos        |

### Altura de Linha

- Corpo: `leading-relaxed` (1.625)
- Títulos: `leading-tight` (1.25)
- Código: `leading-normal` (1.5)

---

## Espaçamento & Layout

### Grid

- Usar grid do Tailwind: `grid grid-cols-{n} gap-{size}`
- Breakpoints padrão: `sm` (640), `md` (768), `lg` (1024), `xl` (1280), `2xl` (1536)
- Mobile-first: definir colunas para mobile e expandir com breakpoints

### Padding e Margin

- Usar escala do Tailwind: `p-4`, `m-2`, `gap-6`, etc.
- Consistência: mesmos valores para componentes similares
- Cards: `p-6` (padrão), `p-4` (compacto)
- Seções: `gap-6` entre elementos, `space-y-4` entre linhas

### Largura Máxima

- Container principal: `max-w-7xl mx-auto`
- Formulários: `max-w-md` ou `max-w-lg`
- Modais: `max-w-lg` (padrão), `max-w-2xl` (grande)

---

## Referência Visual

> Todo agente @ui-designer DEVE consultar os mockups visuais em `ui/templates/` antes de implementar qualquer componente. Esta seção mapeia cada página/componente ao seu mockup correspondente.

### Mapa de Templates

| Página/Componente   | Mockup Principal                             | Mobile | Tablet | Desktop |
| ------------------- | -------------------------------------------- | ------ | ------ | ------- |
| Dashboard Principal | `ui/templates/layout/example-dashboard.html` | —      | —      | —       |
| Card Component      | `ui/templates/components/example-card.html`  | —      | —      | —       |
| Button Component    | — (criar mockup antes de implementar)        | —      | —      | —       |
| Login               | — (criar mockup antes de implementar)        | —      | —      | —       |
| ...                 | ...                                          | ...    | ...    | ...     |

### Regras de Fidelidade

1. **Layout**: posicionamento e proporções DEVEM corresponder ao mockup (±5px de tolerância)
2. **Cores**: DEVEM usar EXATAMENTE os tokens de `ui/tokens/colors.json` — nunca cores hardcoded
3. **Tipografia**: DEVEM seguir `ui/tokens/typography.json` (fonte, tamanho, peso, line-height)
4. **Espaçamento**: DEVEM usar a escala de `ui/tokens/spacing.json` (unidade base 4px)
5. **Responsividade**: SE houver mockup mobile, DEVE ser seguido fielmente
6. **Desvios**: TODO desvio DEVE ser justificado por escrito no formato: "Desvio: [X]. Motivo: [Y]. Impacto: [Z]"

### ⚠️ Regra de Ouro

> **Se não existe mockup para a tarefa, o agente DEVE criá-lo primeiro.**
> Mockups são a única fonte da verdade visual. Implementar sem mockup é proibido.

---

## Componentes

### Botões

| Variante  | Classes Base                                                | Uso                 |
| --------- | ----------------------------------------------------------- | ------------------- |
| Primary   | `bg-primary text-white hover:bg-primary-hover`              | Ação principal      |
| Secondary | `bg-secondary text-white hover:bg-secondary-hover`          | Ação secundária     |
| Outline   | `border border-primary text-primary hover:bg-primary-light` | Ação alternativa    |
| Ghost     | `text-primary hover:bg-primary-light`                       | Ação sutil          |
| Danger    | `bg-error text-white hover:opacity-90`                      | Ação destrutiva     |
| Disabled  | `bg-gray-300 text-gray-500 cursor-not-allowed`              | Estado desabilitado |

Tamanhos: `px-4 py-2 text-sm` (md), `px-3 py-1.5 text-xs` (sm), `px-6 py-3 text-base` (lg)

### Inputs

- Borda: `border border-border rounded-lg`
- Foco: `focus:ring-2 focus:ring-primary focus:border-primary`
- Erro: `border-error focus:ring-error`
- Label: `text-sm font-medium text-text-primary mb-1`
- Placeholder: `placeholder-text-disabled`
- Desabilitado: `bg-gray-100 cursor-not-allowed`

### Cards

- Fundo: `bg-surface`
- Borda: `border border-border`
- Sombra: `shadow-sm` (padrão), `shadow-md` (elevado)
- Border radius: `rounded-lg`
- Padding: `p-6`

### Modais

- Overlay: `bg-black/50 backdrop-blur-sm`
- Container: `bg-surface rounded-xl shadow-xl max-w-lg w-full`
- Header: `text-lg font-semibold`
- Fechar: botão ghost no canto superior direito
- Animação: `transition-all duration-200`

### Tabelas

- Header: `bg-gray-50 text-text-secondary text-sm font-medium`
- Linhas: `border-b border-divider`
- Hover: `hover:bg-gray-50`
- Padding: `px-4 py-3`

### Navegação / Sidebar

- Item ativo: `bg-primary-light text-primary font-medium`
- Item inativo: `text-text-secondary hover:bg-surface-hover`
- Ícone: `w-5 h-5 mr-3`
- Largura: `w-64` (padrão), `w-56` (compacto)

---

## Modo Escuro

- Usar prefixo `dark:` do Tailwind para todas as cores
- Manter contraste consistente entre temas claro e escuro
- Cores dark mode seguem a mesma estrutura de tokens

```tsx
// Exemplo de componente com suporte a dark mode
<div className="bg-white dark:bg-gray-900 text-text-primary dark:text-gray-100">
```

---

## Animações e Transições

| Tipo       | Classe                           | Duração |
| ---------- | -------------------------------- | ------- |
| Fade in    | `animate-fadeIn`                 | 200ms   |
| Slide down | `animate-slideDown`              | 300ms   |
| Hover      | `transition-colors duration-150` | 150ms   |
| Modal      | `transition-all duration-200`    | 200ms   |

- Usar `ease-in-out` como easing padrão
- Preferir animações sutis — nada chamativo
- Respeitar `prefers-reduced-motion`

---

## Acessibilidade

- Contraste mínimo 4.5:1 para texto normal, 3:1 para texto grande (18px+)
- Estados de foco visíveis em todos os elementos interativos
- Labels e `aria-labels` em todos os inputs e botões de ícone
- Suporte a navegação por teclado (Tab, Enter, Escape, Arrow keys)
- `role` e `aria-*` apropriados para componentes customizados
- Texto alternativo (`alt`) em todas as imagens
- Mensagens de erro associadas via `aria-describedby`

---

## Tailwind CSS — Convenções

- Usar classes utilitárias do Tailwind — evitar CSS customizado
- Customizações no `tailwind.config.ts` com `theme.extend`
- Preferir `@apply` apenas em casos de repetição excessiva
- Nomes de classes customizadas seguem padrão kebab-case
- Cores customizadas definidas como tokens no `tailwind.config.ts`

```ts
// Exemplo de configuração tailwind.config.ts
// Veja a seção "Paleta de Cores > Tailwind Config" para o config completo
export default {
  content: [''./src/**/*.{ts,tsx}''],
  darkMode: ''class'',
  theme: {
    extend: {
      colors: {
        primary: ''#2563EB'',
        secondary: ''#6B7280'',
        surface: ''#F9FAFB'',
        success: ''#16A34A'',
        warning: ''#D97706'',
        error: ''#DC2626'',
        info: ''#2563EB'',
      },
    },
  },
};
```

---

## Responsividade

- Mobile-first: começar pelo layout mobile, expandir com breakpoints
- Esconder/mostrar elementos: `hidden md:block`
- Grid responsivo: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Fontes responsivas: `text-sm md:text-base`
- Padding responsivo: `p-4 md:p-6`

---

## Diretrizes para Agentes

Ao criar ou modificar componentes de UI:

1. **Sempre** consulte este DESIGN.md antes de escrever CSS ou JSX
2. Use os tokens de cor definidos na paleta — nunca cores hardcoded
3. Siga os padrões de componente da seção de Componentes
4. **Consulte os mockups em `ui/templates/` antes de implementar** (ver seção Referência Visual)
5. Garanta acessibilidade (contraste, foco, labels)
6. Suporte dark mode usando prefixo `dark:`
7. Teste responsividade nos breakpoints definidos
8. Prefira componentes do design system a criar novos do zero
