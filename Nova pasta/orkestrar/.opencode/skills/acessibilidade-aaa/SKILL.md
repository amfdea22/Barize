# acessibilidade-aaa

> **Categoria**: security
> **Tags**: acessibilidade, wcag, aaa, contraste, screen-reader, cognitive

WCAG AAA accessibility: beyond AA level, contrast ratios 7:1, sign language, extended audio descriptions, keyboard-only navigation, screen reader optimization, cognitive accessibility.

## Quando Usar

Use ao projetar para acessibilidade m�xima (AAA), auditar contraste 7:1, implementar navega��o por teclado avan�ada, ou otimizar para leitores de tela e defici�ncias cognitivas.

## WCAG AAA Requirements

**N�vel AAA** � crit�rios adicionais ao AA:
| Crit�rio | AA | AAA |
|----------|----|-----|
| Contraste (texto normal) | 4.5:1 | **7:1** |
| Contraste (texto grande) | 3:1 | **4.5:1** |
| Contraste (componentes UI) | 3:1 | **3:1** (mesmo) |
| Texto redimension�vel | 200% | **500%** |
| Espa�amento entre linhas | 1.5 | **1.5** (mesmo) |
| Linguagem de sinais | N�o requerido | **Obrigat�rio** (v�deos) |
| �udio descri��o estendida | Requerido (alguns) | **Todos** v�deos |
| Tempo para ler conte�do | N�o especificado | **Sem timeout** (ou ajust�vel) |

**Crit�rios exclusivos AAA**:

- **3.1.3**: Palavras incomuns explicadas (gloss�rio)
- **3.1.4**: Abrevia��es expandidas (primeiro uso)
- **3.1.5**: N�vel de leitura abaixo do 9� ano (ensino fundamental)
- **3.2.5**: Mudan�as de contexto apenas com solicita��o do usu�rio

## Enhanced Contrast (7:1)

**Contraste 7:1 para texto normal** � ferramentas de verifica��o:

- **WebAIM Contrast Checker**: validar pares de cores
- **Axe DevTools**: auditoria autom�tica de contraste
- **Paciello Group Colour Contrast Analyser**: desktop tool

**Estrat�gias para atingir 7:1**:

```tsx
// ? Contraste insuficiente (~3.5:1)
<p className="text-gray-500">Secondary text</p>

// ? Contraste AAA (~7.5:1)
<p className="text-gray-800 dark:text-gray-200">Readable text</p>

// ? Links com cor apenas (dif�cil para daltonismo)
<span className="text-blue-500">Saiba mais</span>

// ? Links com underline + cor AAA
<a href="#" className="text-blue-700 underline hover:text-blue-900">
  Saiba mais
</a>
```

**Paletas seguras para AAA**:

```typescript
// Preto sobre branco: 21:1 (sempre AAA)
// Azul escuro (#000C44) sobre branco: ~17:1
// Branco sobre azul escuro: ~17:1
// Evitar: cinza claro sobre branco (< 4.5:1)
const aaaSafe: Record<string, string> = {
  'text-primary': '#111827', // quase preto
  'text-secondary': '#374151', // cinza escuro (evitar gray-400+)
  'text-disabled': '#6B7280', // apenas para disabled (n�o cr�tico)
};
```

## Keyboard & Screen Reader

**Navega��o por teclado AAA**:

```tsx
// Todo interativo deve ser acess�vel por teclado
const CustomSelect = () => {
  return (
    <div
      role="listbox"
      tabIndex={0}
      aria-label="Select option"
      onKeyDown={(e) => {
        switch (e.key) {
          case 'ArrowDown':
            focusNext();
            break;
          case 'ArrowUp':
            focusPrevious();
            break;
          case 'Enter':
          case ' ':
            selectItem();
            break;
          case 'Escape':
            close();
            break;
        }
      }}
    >
      {options.map((opt) => (
        <div key={opt.value} role="option" aria-selected={opt.selected} tabIndex={-1}>
          {opt.label}
        </div>
      ))}
    </div>
  );
};
```

**Screen reader optimization**:

```tsx
// Texto oculto para leitores de tela (s� vis�vel para SR)
<span className="sr-only">
  Bot�o de compartilhar nas redes sociais
</span>

// Live region para mudan�as din�micas
<div
  aria-live="polite"
  aria-atomic="true"
>
  {notification}
</div>

// Skip to main content (obrigat�rio AAA)
<a href="#main-content" className="skip-link">
  Pular para conte�do principal
</a>
```

**Testes com leitores**:

- VoiceOver (macOS): `Cmd + F5`
- NVDA (Windows): gratuito, mais usado
- JAWS (Windows): pago, market share enterprise

## Cognitive Accessibility

**Diretrizes para defici�ncias cognitivas**:

- **Linguagem simples**: frases curtas, voz ativa, termos comuns
- **Navega��o previs�vel**: mesma estrutura em todas as p�ginas
- **Sem anima��es**: `prefers-reduced-motion` respeitado
- **Foco vis�vel**: `focus-visible` sempre destacado
- **Ajuda contextual**: tooltips, help icons, exemplos
- **Tempo suficiente**: sem timeouts autom�ticos (ou ajust�vel)

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Suporte a leitura**:

```tsx
// Bot�o para aumentar fonte
<button
  onClick={() => setFontSize(s => s + 0.25)}
  aria-label="Aumentar tamanho da fonte"
>
  A+
</button>

// Modo de alto contraste
<div className={highContrast ? 'contrast-high' : ''}>
  {children}
</div>
```

## Auditing Tools

| Ferramenta                 | Tipo            | Cobre AAA?                         |
| -------------------------- | --------------- | ---------------------------------- |
| **axe DevTools**           | Extension/CLI   | Sim (regras AAA)                   |
| **Lighthouse**             | Chrome DevTools | Parcial (AA principalmente)        |
| **WAVE**                   | Extension       | Sim (AAA guidelines)               |
| **Accessibility Insights** | Extension       | Sim (testes manuais + autom�ticos) |
| **Pa11y**                  | CLI             | Sim (configur�vel)                 |

**Comando axe-core (CLI)**:

```bash
npx @axe-core/cli https://example.com --tags wcag2aa,wcag2aaa
```

**GitHub Actions**:

```yaml

```
