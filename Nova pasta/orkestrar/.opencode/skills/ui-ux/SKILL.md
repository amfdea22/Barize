# ui-ux

> **Categoria**: frontend
> **Tags**: ui, ux, accessibility, wcag, design-system, responsive, components

Design de interface e experiência do usuário: Design Tokens, acessibilidade WCAG AA, design responsivo mobile-first, padrões de componentes, formulários, estados de loading/erro/empty e Core Web Vitals.

## Quando Usar

Use ao projetar componentes de UI, revisar acessibilidade, implementar design system, criar layouts responsivos ou otimizar experiência do usuário.

## Design Tokens

Tokens são a fonte única de verdade para decisões de design. Eles garantem consistência visual em toda a aplicação.

```css
/* Tokens de cores — semânticos, não fixos */
:root {
  /* Primary */
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-primary-text: #ffffff;

  /* Surface */
  --color-surface: #ffffff;
  --color-surface-secondary: #f8fafc;
  --color-surface-tertiary: #f1f5f9;

  /* Text */
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-disabled: #94a3b8;

  /* Feedback */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* Spacing (4px base) */
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;

  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
}
```

### Dark Mode com Tokens

```css
[data-theme="dark"] {
  --color-surface: #0f172a;
  --color-surface-secondary: #1e293b;
  --color-text-primary: #f1f5f9;
  --color-text-secondary: #94a3b8;
  /* Demais tokens invertidos... */
}
```

## Acessibilidade WCAG AA

### Diretrizes Essenciais

```tsx
// 1. Contraste mínimo (ratio 4.5:1 para texto normal)
// Verificar com ferramentas: axe, Lighthouse, WAVE

// 2. Foco visível — NUNCA remover :focus sem alternativa
function Button({ children }: { children: React.ReactNode }) {
  return (
    <button
      className={`
        focus-visible:outline-2 focus-visible:outline-offset-2
        focus-visible:outline-blue-500
        transition-shadow
      `}
    >
      {children}
    </button>
  );
}

// 3. Atributos ARIA essenciais
function Alert({ type, message }: { type: 'error' | 'success'; message: string }) {
  return (
    <div
      role="alert"
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      {message}
    </div>
  );
}

// 4. Navegação por teclado
// - Tab order lógico (tabindex="0" somente para elementos interativos)
// - Skip link: <a href="#main-content" className="sr-only focus:not-sr-only">
// - Todas as ações disponíveis por teclado (Enter, Escape, Arrow keys)

// 5. Textos alternativos
function Image({ alt, src }: { alt: string; src: string }) {
  return <img src={src} alt={alt} />;
  // alt="" para imagens decorativas
  // aria-hidden="true" para ícones decorativos
}
```

### Checklist de Acessibilidade

- [ ] Contraste de cor ≥ 4.5:1 (texto normal), ≥ 3:1 (texto grande)
- [ ] Todos elementos interativos têm foco visível
- [ ] Navegação por teclado completa (Tab, Enter, Escape)
- [ ] `role` e `aria-*` corretos para componentes dinâmicos
- [ ] Textos alternativos em todas as imagens
- [ ] Formulários com `<label>` associado
- [ ] Mensagens de erro claras e programaticamente ligadas ao campo
- [ ] Suporte a zoom até 200% sem perda de funcionalidade
- [ ] Movimento, animação respeita `prefers-reduced-motion`

## Design Responsivo (Mobile-First)

```css
/* Mobile-first: base = mobile, media queries para desktop */

/* Grid responsivo */
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 640px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Tipografia fluida com clamp() */
h1 {
  font-size: clamp(1.5rem, 4vw, 2.5rem);
  line-height: 1.2;
}

/* Touch targets mínimos 44x44px (WCAG) */
.button-icon {
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

## Component Patterns

### Componente Base: Loading / Error / Empty / Success

```tsx
type State<T> =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'empty' }
  | { status: 'success'; data: T };

function DataView<T>({ state, renderItem }: {
  state: State<T[]>;
  renderItem: (item: T) => React.ReactNode;
}) {
  switch (state.status) {
    case 'loading':
      return <Skeleton lines={3} />;
    case 'error':
      return <ErrorState message={state.error} onRetry={() => {}} />;
    case 'empty':
      return <EmptyState message="Nenhum registro encontrado." />;
    case 'success':
      return <ul>{state.data.map(renderItem)}</ul>;
  }
}
```

### Form UX Patterns

```tsx
// Validação em tempo real com feedback visual
function FormField({ label, error, children }: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      {children}
      {error && (
        <p className="form-error" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </div>
  );
}

// Debounce para evitar validação excessiva
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
```

## Core Web Vitals

| Métrica      | Alvo    | Descrição                          |
|-------------|---------|-------------------------------------|
| LCP         | ≤ 2.5s  | Largest Contentful Paint           |
| FID/INP     | ≤ 100ms | First Input Delay / Interaction    |
| CLS         | ≤ 0.1   | Cumulative Layout Shift            |

Otimizações:
- **LCP**: Otimizar imagens (WebP/AVIF, lazy loading), pré-conectar origens críticas
- **FID/INP**: Reduzir JavaScript blocking, code splitting, lazy load de terceiros
- **CLS**: Definir dimensões explícitas em imagens/iframes, evitar injection assíncrono

```html
<!-- Pré-conexão para origens críticas -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="dns-prefetch" href="https://analytics.example.com" />

<!-- Lazy loading nativo -->
<img src="hero.webp" loading="lazy" width="1200" height="600" alt="Hero" />
```

## Micro-interações e Motion

```css
/* Animações que respeitam preferência do usuário */
@media (prefers-reduced-motion: no-preference) {
  .fade-in {
    animation: fadeIn 0.3s ease-out;
  }

  .slide-up {
    animation: slideUp 0.3s ease-out;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

## Boas Práticas de UI/UX

- **Consistência**: Mesmos padrões visuais em toda a aplicação (Design Tokens)
- **Feedback**: Toda ação do usuário deve ter resposta visual imediata
- **Prevenção de erros**: Confirmar ações destrutivas, desabilitar submit durante envio
- **Recuperação**: Desfazer/refazer, mensagens de erro acionáveis
- **Progressive Disclosure**: Mostrar informações complexas gradualmente
- **Gestalt**: Proximidade, similaridade, continuidade para organizar informação
- **Mobile-first**: Projetar para mobile primeiro, expandir para desktop
- **Performance percebida**: Skeleton screens, optimistic UI, prefetching
