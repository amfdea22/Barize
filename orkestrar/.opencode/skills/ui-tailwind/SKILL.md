# ui-tailwind

> **Categoria**: frontend
> **Tags**: tailwind, ui, ux, acessibilidade, responsive, design-system

UI/UX com Tailwind CSS: design tokens, acessibilidade WCAG, responsividade mobile-first, animações e componentes.

## Quando Usar

Use ao criar componentes de interface, aplicar estilos, garantir acessibilidade ou seguir o design system.

## Design Tokens

Usar os tokens definidos no DESIGN.md:

- Cores: `bg-primary`, `text-text-primary`, `border-border`
- Tipografia: `text-base`, `font-medium`, `leading-relaxed`
- Espaçamento: `p-4`, `gap-6`, `space-y-4`
- Border radius: `rounded-lg`
- Sombras: `shadow-sm`, `shadow-md`

```tsx
// ❌ Evitar cores hardcoded
<div className="text-blue-600 bg-white" />

// ✅ Usar tokens do design system
<div className="text-primary bg-background" />
```

## Acessibilidade (WCAG AA)

- Contraste mínimo 4.5:1 (texto normal) / 3:1 (texto grande 18px+)
- Todos elementos interativos com `focus:ring-2`
- Labels em inputs: `<label>` + `htmlFor` ou `aria-label`
- Navegação por teclado: Tab, Enter, Escape, Arrow keys
- `role` apropriado para componentes customizados
- `aria-describedby` para mensagens de erro
- `prefers-reduced-motion` para animações

## Responsividade Mobile-First

```tsx
// Mobile-first: começar pelo mobile, expandir
<div className="
  grid
  grid-cols-1          /* mobile: 1 coluna */
  md:grid-cols-2       /* tablet: 2 colunas */
  lg:grid-cols-3       /* desktop: 3 colunas */
  gap-4
  p-4 md:p-6
">
```

Breakpoints: `sm`(640), `md`(768), `lg`(1024), `xl`(1280), `2xl`(1536)

## Componentes do Design System

**Botões**: `bg-primary text-white hover:bg-primary-hover px-4 py-2 rounded-lg`
**Inputs**: `border border-border rounded-lg focus:ring-2 focus:ring-primary`
**Cards**: `bg-surface border border-border shadow-sm rounded-lg p-6`
**Modais**: `bg-black/50 backdrop-blur-sm` + `bg-surface rounded-xl shadow-xl`
**Sidebar**: `w-64 bg-surface border-r border-border`

## Modo Escuro

```tsx
// Usar prefixo dark: do Tailwind
<div className="
  bg-white
  dark:bg-gray-900
  text-text-primary
  dark:text-gray-100
">
```

- Manter contraste consistente entre temas
- Usar `darkMode: 'class'` no tailwind.config.ts
- Botão de toggle: `onClick={() => document.documentElement.classList.toggle('dark')}`
