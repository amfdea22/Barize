---
name: Velocity Dark
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#bac9cc'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#849396'
  outline-variant: '#3b494c'
  surface-tint: '#00daf3'
  primary: '#c3f5ff'
  on-primary: '#00363d'
  primary-container: '#00e5ff'
  on-primary-container: '#00626e'
  inverse-primary: '#006875'
  secondary: '#ffcf8f'
  on-secondary: '#452b00'
  secondary-container: '#feaa00'
  on-secondary-container: '#684300'
  tertiary: '#f2e9ff'
  on-tertiary: '#3c0090'
  tertiary-container: '#d9c8ff'
  on-tertiary-container: '#6c00f7'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#9cf0ff'
  primary-fixed-dim: '#00daf3'
  on-primary-fixed: '#001f24'
  on-primary-fixed-variant: '#004f58'
  secondary-fixed: '#ffddb3'
  secondary-fixed-dim: '#ffb950'
  on-secondary-fixed: '#291800'
  on-secondary-fixed-variant: '#624000'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d1bcff'
  on-tertiary-fixed: '#23005b'
  on-tertiary-fixed-variant: '#5700c9'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-display:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 12px
  touch-target: 48px
---

## Brand & Style

This design system is engineered for the high-velocity, low-light environment of modern nightlife management. The brand personality is professional yet high-energy, mirroring the expertise of a master mixologist. The aesthetic combines **Modern Minimalism** with **Cyber-Infused accents**, utilizing deep charcoal surfaces to reduce eye strain while employing vibrant neon light-sources to guide the user's focus. 

The visual direction prioritizes "glanceability"—the ability for a bartender to capture critical information in a split second. By leveraging high-contrast interactive elements against a desaturated base, the UI feels like a premium tool that is both sophisticated and incredibly functional.

## Colors

The palette is anchored in a "True Black" and "Deep Charcoal" foundation to ensure the hardware blends into the bar environment. 

- **Primary (Electric Blue):** Used for primary actions, active states, and navigation highlights. It represents flow and precision.
- **Secondary (Neon Amber):** Reserved for high-priority alerts, calls to action (like "Send Order"), and notifications. It provides a warm, urgent contrast to the cool primary blue.
- **Surface Strategy:** Use `surface-1` for main navigation areas and `surface-2` for cards or list items. `surface-3` should be reserved for interactive hover states or elevated modals.
- **Contrast:** Maintain a minimum 7:1 contrast ratio for all functional text to ensure legibility behind a dark bar.

## Typography

This design system utilizes **Inter** for its exceptional legibility and neutral, professional tone. To lean into the technical nature of inventory and pour management, **JetBrains Mono** is introduced for labels and data-heavy displays (like quantities and timestamps).

- **Headings:** Should always be Bold (700) or SemiBold (600) to stand out against dark backgrounds.
- **Readability:** Increase tracking (letter-spacing) slightly for smaller labels to prevent "clumping" in low-light settings.
- **Numerical Data:** Use the `data-display` style for inventory counts and prices to ensure digits are easily distinguishable.

## Layout & Spacing

The layout follows a **Fluid Grid** model with tight spacing to maximize information density for expert users.

- **Grid:** Use a 12-column grid for desktop and a 4-column grid for mobile/handheld POS devices.
- **Rhythm:** A 4px baseline shift is used. All margins and paddings must be multiples of 4px.
- **Touch Targets:** Despite the compact visual style, interactive elements (buttons, toggles) must maintain a minimum 48px height/width to accommodate fast-paced "tap-and-go" interactions behind the bar.
- **Density:** Use "Compact" density for lists and tables to minimize scrolling during busy shifts.

## Elevation & Depth

In this dark-themed design system, depth is conveyed through **Tonal Layering** and **Neon Glows** rather than traditional shadows.

- **Stacking:** Elements closer to the user are lighter in color. The base background is the darkest, with modals and popovers using `surface-3`.
- **Inner Glows:** For active states or "Neon" elements, use a subtle `0px 0px 8px` outer glow with 30% opacity of the accent color to simulate light emission.
- **Outlines:** Use 1px "ghost borders" (10% white) to define boundaries between dark containers without adding visual bulk. 
- **Z-Index:** Clear separation must be maintained for the "Order Sidebar" which should sit at a higher elevation than the product grid.

## Shapes

The shape language is **Rounded**, striking a balance between modern friendliness and professional structure.

- **Components:** Standard buttons and input fields use a `0.5rem` (8px) radius.
- **Cards:** Product tiles and order cards use `1rem` (16px) to create a clear container identity.
- **Indicators:** Status pills and selection chips should use the **Pill-shaped** (full round) style to contrast against the more structural rectangular elements.

## Components

### Buttons
- **Primary:** Background in Electric Blue, text in Black (#000000) for maximum legibility.
- **Secondary (Alert):** Background in Neon Amber, text in Black.
- **Ghost:** Transparent background with an Electric Blue 1px border.

### Input Fields
- Darker than the surface they sit on. Use a 2px Electric Blue bottom border for the active state to simulate a "glowing" cursor line.

### Cards (Product Tiles)
- Large, easy-to-tap squares with centered text. Use high-contrast category colors (e.g., a small neon stripe on the left edge) to differentiate between Spirits, Beers, and Cocktails.

### Inventory Lists
- Zebra-striping is discouraged. Instead, use thin `surface-3` separators. Quantities should be displayed in `label-md` (JetBrains Mono) for a technical feel.

### Selection Chips
- High-contrast active states. When a modifier (e.g., "Extra Ice") is selected, the chip should "glow" with the Primary Electric Blue.

### Modals
- Full-screen or large centered overlays with a heavy backdrop blur (20px) to keep the bartender's focus entirely on the current task while maintaining environmental context.