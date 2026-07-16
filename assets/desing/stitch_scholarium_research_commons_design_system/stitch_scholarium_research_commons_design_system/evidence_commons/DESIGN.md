---
name: Evidence Commons
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f9'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f2ff'
  surface-container: '#ebedff'
  surface-container-high: '#e4e7ff'
  surface-container-highest: '#dce1ff'
  on-surface: '#131a32'
  on-surface-variant: '#434655'
  inverse-surface: '#292f48'
  inverse-on-surface: '#eff0ff'
  outline: '#747687'
  outline-variant: '#c3c5d8'
  surface-tint: '#0f4ee6'
  primary: '#003fc6'
  on-primary: '#ffffff'
  primary-container: '#2157ee'
  on-primary-container: '#e0e4ff'
  inverse-primary: '#b7c4ff'
  secondary: '#00658f'
  on-secondary: '#ffffff'
  secondary-container: '#1eb6fd'
  on-secondary-container: '#004462'
  tertiary: '#520ee3'
  on-tertiary: '#ffffff'
  tertiary-container: '#6b3cfb'
  on-tertiary-container: '#e9e1ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001551'
  on-primary-fixed-variant: '#0039b5'
  secondary-fixed: '#c8e6ff'
  secondary-fixed-dim: '#87ceff'
  on-secondary-fixed: '#001e2e'
  on-secondary-fixed-variant: '#004c6d'
  tertiary-fixed: '#e6deff'
  tertiary-fixed-dim: '#cbbeff'
  on-tertiary-fixed: '#1d0061'
  on-tertiary-fixed-variant: '#4a00d4'
  background: '#faf8ff'
  on-background: '#131a32'
  surface-variant: '#dce1ff'
  paper-cool: '#F7F8FC'
  paper-warm: '#F4F1E8'
  surface-soft: '#EEF3FF'
  navy-ink: '#0B1230'
  night-bg: '#080D1C'
  stewardship-gold: '#FFC857'
  provenance-cyan: '#23B8FF'
  formalization-violet: '#6F42FF'
typography:
  hero-lg:
    fontFamily: Instrument Serif
    fontSize: 6.4rem
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  hero-lg-mobile:
    fontFamily: Instrument Serif
    fontSize: 3.8rem
    fontWeight: '400'
    lineHeight: '1.1'
  headline-h1:
    fontFamily: Instrument Serif
    fontSize: 4.4rem
    fontWeight: '400'
    lineHeight: '1.2'
  headline-h1-mobile:
    fontFamily: Instrument Serif
    fontSize: 2.8rem
    fontWeight: '400'
    lineHeight: '1.2'
  headline-h2:
    fontFamily: Instrument Serif
    fontSize: 3.5rem
    fontWeight: '400'
    lineHeight: '1.3'
  headline-h3:
    fontFamily: Geist
    fontSize: 2rem
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Geist
    fontSize: 1.075rem
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: '1.6'
  label-caps:
    fontFamily: Geist
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.08em
  metadata-micro:
    fontFamily: Geist
    fontSize: 0.625rem
    fontWeight: '500'
    lineHeight: '1.2'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 24px
  margin-desktop: 80px
  margin-mobile: 16px
  section-v-rhythm-lg: 140px
  section-v-rhythm-sm: 80px
  container-max-width: 1180px
---

## Brand & Style

This design system embodies the **Evidence Commons**—a sophisticated synthesis of premium editorial publishing and quiet, institutional technology. It is designed to feel like a living public library or a high-end research atelier rather than a typical SaaS dashboard.

The aesthetic is **Minimalist and Editorial**, characterized by:
- **Intellectual Seriousness:** High-contrast typography and generous whitespace that respects the reader's focus.
- **Institutional Trust:** A structural grid and geometric linework inspired by archival ledgers and publication graphs.
- **Human Warmth:** Tactile "paper" surfaces that provide a comfortable, durable reading environment.
- **Technological Precision:** Subtle electric accents (Cyan and Violet) that denote live system states and semantic connections without resorting to "cyberpunk" clichés.

The target emotional response is one of calm, transparency, and durability. Every element should feel intentional, avoiding decorative complexity in favor of functional clarity.

## Colors

The palette is divided into "ink" and "paper" roles to maintain the editorial narrative.

### Usage Semantic Logic:
- **Primary Blue (#2157EE):** Reserved for primary actions, active navigation, and critical interaction points.
- **Provenance Cyan (#23B8FF):** Used for trace elements, source links, connection lines, and live system status.
- **Formalization Violet (#6F42FF):** Applied to semantic linking, AI/coaching guidance, and knowledge-bridge metadata.
- **Stewardship Gold (#FFC857):** A restrained accent for durable milestones, verified receipts, and high-tier institutional status. Never used for gamified "ranking."

### Theme Pairing:
The light and dark modes are **structural twins**.
- **Light Mode:** Uses `--sch-paper` (#F7F8FC) for the background to simulate clean stock, with `--sch-surface` (#FFFFFF) for raised components.
- **Dark Mode:** Uses `--sch-night` (#080D1C) for deep background immersion and `--page-surface` (#0D1530) for interface panels.

## Typography

The typographic system relies on a sharp contrast between **Instrument Serif** (Editorial/Human) and **Geist** (Technical/Interface).

- **Instrument Serif:** Used exclusively for high-level storytelling, publication titles, and editorial headers. It represents the "Human Work."
- **Geist:** A highly legible sans-serif used for the functional interface, metadata, body text, and labeling. It represents the "System Infrastructure."

**Rules:**
- **Line Length:** Maintain a measure of 52–72 characters for body text to ensure readability.
- **Kicker Labels:** Use the `label-caps` style for small headers above H1s (e.g., "PUBLIC PRE-ALPHA").
- **Metadata:** Interface labels should be set in Geist to maintain a clear distinction from the content being published.

## Layout & Spacing

The layout is a **Fixed Grid** system that prioritizes generous vertical breathing room to convey a sense of calm and importance.

- **Desktop:** 12-column grid with a max-width of 1180px. Section vertical spacing ranges from 80px to 140px.
- **Tablet:** 8-column grid. Hero sections reflow to a single column.
- **Mobile:** 4-column grid with 16px margins. Interactive targets are maintained at a minimum of 44px.

**Rhythm:**
Use the `section-v-rhythm-lg` for transitions between major conceptual blocks (e.g., Hero to Workflow). Use `section-v-rhythm-sm` for transitions between related feature sets. Content should reflow logically—Copy first, followed by supporting visuals.

## Elevation & Depth

Elevation is primarily communicated through **Tonal Layers** and **Low-Contrast Outlines** rather than aggressive shadows. This reinforces the "flat paper" aesthetic.

- **Surface Tiers:** In light mode, containers use a white background against the light gray/blue page background. In dark mode, raised containers use slightly lighter navy tones (`#111B3D`).
- **Borders:** Use `--sch-line` (#DFE4EF in light / 18% opacity blue in dark) for structural separators. Borders should feel like pencil lines on paper—precise and thin.
- **Ambient Shadows:** Shadows are reserved for floating elements (menus, tooltips). They must be extra-diffused and low-opacity, using a navy tint (`rgba(11, 18, 48, 0.10)`) to avoid a "dirty" look.
- **Geometric Linework:** Use cyan and violet lines to represent connections between objects, creating depth through network mapping rather than z-index stacking.

## Shapes

The shape language is **Geometric and Professional**. We use a "Soft" roundedness (4px) to take the edge off the technical interface while maintaining a disciplined, institutional feel.

- **Standard Elements:** 4px radius (Buttons, Input Fields).
- **Raised Cards:** 8px radius (Publication Cards, Workflow Triptych).
- **Interactive Metadata:** 12px radius (Provenance Chips).
- **Iconography:** Use hexagonal motifs and portal symbols to represent connected knowledge nodes.

## Components

### Buttons
- **Primary:** Solid `--sch-blue` with white Geist text. 4px roundedness.
- **Secondary:** Ghost style with `--sch-line` border and geist text.
- **Tertiary:** Link-style with a small trailing arrow (→) and primary blue color.

### Cards
Cards should feel like archival documents. They use a white (light mode) or deep navy (dark mode) background with a subtle 1px border.
- **Publication Card:** Must include metadata chips (License, Visibility, Review State) and a provenance timestamp.

### Chips & Labels
- **Provenance Chips:** Use `--sch-cyan` accents.
- **Status Labels:** Success (Green), Warning (Amber), Danger (Red) using the defined semantic colors. Use these sparingly to maintain a calm interface.

### Input Fields
Clean, Geist-driven fields with a 1px border. Focus states use a 2px `--sch-blue` outline with no glow.

### Provenance Receipt
A specific "Durable" component using the stewardship gold (#FFC857) for iconography and receipt IDs. It should feel distinct from common UI cards—more like a digital certificate or seal.
