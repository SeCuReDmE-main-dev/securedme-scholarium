# Scholarium Design System and Product Landing Specification

**Repository:** `SeCuReDmE-main-dev/securedme-scholarium`
**Status:** Public pre-alpha
**Primary surface:** `https://www.scholarium.securedme.ca`
**Implementation target:** Vinext / React 19 / Cloudflare Workers
**Document purpose:** Canonical design and UX contract for the public Scholarium landing and its reusable product surfaces.

---

## 1. Product Definition

Scholarium is an **education-first, research-first social commons** for publishing and discovering work with context, attribution, provenance, version history, source material, and explicit human authority.

### Core promise

> Turn knowledge into traceable evidence.

### Supporting promise

> Publish with context. Learn in public. Keep discovery free.

### Product invariants

1. **No pay-to-rank.**
2. **Free core publishing and discovery.**
3. **Provenance without legal overclaiming.**
4. **Human review remains human.**
5. **Privacy by default and local-only personal insights.**
6. **QuaNthoR is a coach, not a publishing gatekeeper.**
7. **External connections are consent-first.**
8. **Pre-alpha limitations must remain visible and honest.**

### What Scholarium is not

- Not a popularity-driven social network.
- Not a pay-to-win academic platform.
- Not a substitute for DOI, ISBN, copyright registration, ethics review, or scientific authority.
- Not a code editor replacing GitHub.
- Not a production moderation or youth-safety operation yet.
- Not a biometric identity store.
- Not a provider-token collection surface.

---

## 2. Current Technical Context

### Framework

- Vinext
- React 19
- TypeScript
- Cloudflare Workers
- D1 for structured records
- R2-compatible media metadata contract
- Drizzle ORM
- Tailwind 4 available, but the current interface also relies on global CSS

### Existing canonical typography

- **Display:** Instrument Serif
- **Interface / body:** Geist

### Existing core product surfaces

- Signal feed
- Publishing studio
- Research notes
- White papers
- Project updates
- Short videos
- Teaching artifacts
- Typed file upload contracts
- SHA-256 provenance metadata
- Profiles and themes
- Consent-first integrations
- QuaNthoR coaching
- Local-only privacy insights
- Versioned `/api/v1` resource contract

---

## 3. Design Thesis

Scholarium should feel like a **living public library, research atelier, and evidence ledger**, not a conventional SaaS dashboard.

The experience must communicate:

- intellectual seriousness without academic intimidation;
- public openness without visual noise;
- provenance without bureaucratic heaviness;
- human authorship without popularity theatrics;
- advanced technology without “AI magic” claims;
- continuity between beginner learning, professional research, teaching, and open-source work.

### Desired emotional register

- Calm
- Serious
- Generous
- Investigative
- Human
- Durable
- Transparent
- Hopeful

### Avoid

- Cheap neon cyberpunk
- Generic blue SaaS cards
- Social-media engagement bait
- Crypto aesthetics
- Excessive gamification
- “AI knows best” messaging
- Fake scientific graphs
- Fake activity counters
- Fake user statistics
- Decorative complexity that hides the publication workflow

---

## 4. Visual Direction

### Concept

**The Evidence Commons**

A refined interface combining:

- editorial typography;
- archival paper surfaces;
- deep navy institutional panels;
- subtle electric blue and cyan provenance signals;
- violet as a formalization / knowledge-link accent;
- restrained gold only for durable milestones, receipts, and stewardship;
- geometric linework inspired by publication graphs, source links, and timestamped receipts.

### Visual hierarchy

1. Human work
2. Context and source trail
3. Publication structure
4. Provenance receipt
5. Discovery controls
6. Platform identity

The brand asset system should support the product, not dominate it.

---

## 5. Canonical Color Tokens

```css
:root {
  --sch-paper: #F7F8FC;
  --sch-paper-warm: #F4F1E8;
  --sch-surface: #FFFFFF;
  --sch-surface-soft: #EEF3FF;
  --sch-ink: #10172F;
  --sch-muted: #63708A;
  --sch-line: #DFE4EF;

  --sch-blue: #2157EE;
  --sch-blue-bright: #1A73FF;
  --sch-cyan: #23B8FF;
  --sch-cyan-soft: #1FD4DC;
  --sch-violet: #6F42FF;
  --sch-navy: #0B1230;
  --sch-night: #0B0E1A;
  --sch-gold: #FFC857;

  --sch-success: #11866A;
  --sch-warning: #A66C00;
  --sch-danger: #C83A4A;
}

[data-theme="dark"] {
  --page-bg: #080D1C;
  --page-surface: #0D1530;
  --page-surface-raised: #111B3D;
  --page-text: #F7F9FF;
  --page-muted: #B8C2DF;
  --page-line: rgba(174, 194, 255, 0.18);
  --page-shadow: rgba(0, 0, 0, 0.42);
}

[data-theme="light"] {
  --page-bg: #F7F8FC;
  --page-surface: #FFFFFF;
  --page-surface-raised: #EEF3FF;
  --page-text: #10172F;
  --page-muted: #63708A;
  --page-line: #DFE4EF;
  --page-shadow: rgba(11, 18, 48, 0.10);
}
```

### Color usage rules

- Blue = primary action and active navigation.
- Cyan = provenance, connection, trace, live system status.
- Violet = formalization, semantic linking, QuaNthoR guidance.
- Gold = stewardship, durable receipt, verified contribution metadata; never ranking.
- Green = successful processing or accepted validation.
- Amber = processing, incomplete context, or attention required.
- Red = blocked action or failed validation only.

---

## 6. Typography

### Display type

**Instrument Serif**

Use for:

- landing H1/H2;
- publication titles;
- major editorial statements;
- evidence and provenance storytelling.

### Interface type

**Geist**

Use for:

- navigation;
- buttons;
- metadata;
- form controls;
- status labels;
- body text;
- compact educational explanations.

### Scale

```css
--type-hero: clamp(3.8rem, 7vw, 6.4rem);
--type-h1: clamp(2.8rem, 5vw, 4.4rem);
--type-h2: clamp(2.1rem, 4vw, 3.5rem);
--type-h3: clamp(1.35rem, 2vw, 2rem);
--type-body-lg: 1.075rem;
--type-body: 0.9375rem;
--type-small: 0.75rem;
--type-micro: 0.625rem;
```

### Text rules

- Avoid all-caps body copy.
- Kicker labels may use uppercase with wide tracking.
- Keep line length between 52 and 72 characters.
- Use italics only for editorial emphasis.
- Never encode canonical text inside decorative images.

---

## 7. Layout System

### Desktop container

- Max width: `1180px`
- Horizontal page gutter: `24px`
- Wide trust / manifesto sections may span the viewport.
- Landing sections should use 80–140px vertical rhythm depending on hierarchy.

### Grid

- 12-column desktop grid
- 8-column tablet grid
- 4-column mobile grid

### Breakpoints

```css
--bp-mobile: 480px;
--bp-tablet: 850px;
--bp-desktop: 1080px;
--bp-wide: 1440px;
```

### Core page structure

1. Header
2. Hero
3. Product promise
4. Three-part workflow
5. Trust-by-design section
6. Publishing artifact demonstration
7. Organizational continuity
8. SecuredMe suite bridge
9. Pre-alpha status and public-source boundary
10. Final CTA
11. Footer

### Important restructuring rule

The current landing mounts a large brand-system gallery containing banners, badges, logo drafts, and icon boards. These assets are useful for internal validation but should **not dominate the canonical public landing**.

Move the full asset gallery to one of:

- `/brand`
- `/design-system`
- `/press-kit`
- `/docs/brand`

The public home should showcase the product, not the asset vault.

---

## 8. Component Specifications

### 8.1 Header

**Purpose:** Orientation and trust.

Content:

- official Scholarium mark;
- Product;
- How it works;
- Trust;
- Organizations;
- Public source;
- Enter Scholarium.

Rules:

- Sticky only after the hero begins scrolling.
- Do not overload with tier navigation.
- “Enter Scholarium” is the primary action.
- SecuredMe root is a secondary route, not the primary brand.

---

### 8.2 Hero

**Canonical copy**

- Kicker: `SECUREDME EDUCATION / PUBLIC PRE-ALPHA`
- H1: `Turn knowledge into traceable evidence.`
- Body: `A free social commons for research, learning, and organizational work — built so publications, people, context, and provenance can remain connected.`
- Primary CTA: `Explore Scholarium`
- Secondary CTA: `See the workflow`
- Tertiary link: `View public source`

**Composition**

- Left: canonical HTML copy.
- Right: publication-flow illustration or product UI composition.
- Do not use a large brand-board screenshot as the dominant hero visual.
- The visual must show a clear relationship:
  `Idea → structure → sources → publication → provenance receipt`.

---

### 8.3 Product Promise

Headline:

> A platform that respects the work and the learner.

Use one centered editorial block with no more than 90 words.

---

### 8.4 Three-Part Workflow

Cards:

1. **Share more than a post**
2. **Make form a learning tool**
3. **Keep contribution human**

Each card contains:

- number;
- title;
- concise body;
- one action link;
- one coherent line icon.

Do not use fabricated metrics.

---

### 8.5 Trust by Design

Dark institutional section.

Three principles:

1. Identity with boundaries
2. Provenance first
3. Privacy that stays local

Visual requirement:

- quiet, serious, and high contrast;
- no glowing security clichés;
- use source-chain geometry and receipt motifs.

---

### 8.6 Artifact Demonstration

Show one realistic publication object:

- title;
- author and affiliation;
- source list;
- file types;
- version;
- license;
- review state;
- provenance timestamp;
- receipt identifier;
- visibility status.

All data must be labelled as example content or use neutral placeholders.

---

### 8.7 Organizational Continuity

Purpose:

- demonstrate durable context;
- show handoff between people and teams;
- show provenance chain without implying legal certification.

Use an evidence graph, version timeline, or source-linked project card.

---

### 8.8 Suite Bridge

Explain:

- SecuredMe = suite map and broader ecosystem;
- Scholarium = publishing, discovery, context, formalization, learning commons.

Primary action:
- Open Scholarium

Secondary:
- Explore SecuredMe root

---

### 8.9 Pre-Alpha Boundary

Must visibly state:

- public pre-alpha;
- no paid ranking;
- provider operations still gated;
- moderation and youth-flow operations not yet launched;
- external service execution incomplete;
- provenance receipt is not DOI/ISBN/copyright registration.

---

### 8.10 Footer

Columns:

- Product
- Publishing
- Trust
- Developers
- Legal

Include:

- GitHub repository;
- Privacy;
- Feedback;
- SEL-2.0;
- Public calendar;
- SecuredMe root.

---

## 9. Asset System

### Existing canonical repository paths

```text
/brand/campaigns/landing-hero-dark.webp
/brand/identity/scholarium-logo-system.webp
/brand/icons/scholarium-icon-pack-dark.webp
/brand/education/securedme-education-banner-dark-thin.webp
/brand/logos/final/1.webp
/brand/logos/draft/1.webp
/brand/logos/draft/2.webp
/brand/b2b-hooks/1.webp
/brand/b2b-hooks/2.webp
/brand/campaigns/web/1.webp ... /10.webp
/brand/badges/dark/1.webp ... /10.webp
/brand/badges/light/1.webp ... /10.webp
/brand/icons/1.webp ... /10.webp
```

### Asset usage policy

- Existing boards are references, not necessarily direct production UI assets.
- Extract or regenerate individual symbols as transparent, text-free files.
- Never place unreadable board screenshots inside small product cards.
- Avoid embedding explanatory text in image files.
- Use images for:
  - editorial illustration;
  - product atmosphere;
  - emblem / mark;
  - decorative source graph;
  - campaign social output.
- Use HTML/CSS for:
  - labels;
  - titles;
  - buttons;
  - metadata;
  - statuses;
  - metrics;
  - legal language.

### Required production kit

```text
scholarium-home-full-dark.webp
scholarium-home-full-light.webp
scholarium-home-hero-dark-no-text.webp
scholarium-home-hero-light-no-text.webp
scholarium-logo-dark.svg
scholarium-logo-light.svg
scholarium-publication-flow-dark.svg
scholarium-publication-flow-light.svg
scholarium-provenance-receipt-dark.svg
scholarium-provenance-receipt-light.svg
scholarium-trust-icons-dark.svg
scholarium-trust-icons-light.svg
scholarium-suite-bridge-dark.webp
scholarium-suite-bridge-light.webp
scholarium-cta-dark-no-text.webp
scholarium-cta-light-no-text.webp
```

---

## 10. Theme Pairing Contract

Dark and light themes must be compositional twins.

Do not change:

- DOM order;
- section count;
- copy;
- icon meaning;
- image crop;
- card count;
- navigation;
- illustration geometry;
- responsive behavior.

Only change:

- background;
- surface color;
- text color;
- border contrast;
- shadow intensity;
- glow intensity;
- tonal treatment of the same asset.

---

## 11. Accessibility

### Minimum standard

- WCAG AA contrast.
- Keyboard-visible focus.
- Semantic landmarks.
- Reduced-motion support.
- No essential information encoded only through color.
- Alt text describing function, not decorative appearance.
- Form error summaries.
- 44px minimum interactive target.
- No autoplay audio/video.
- No animated background required for comprehension.

### Neurodivergent Access Console compatibility

Reserve a discreet control area for:

- Base
- Autism Calm
- ADHD Sprint
- Deep Work
- Dyslexia Support
- Reduced Motion
- Low Stimulation

The console must not dominate the landing.

---

## 12. Motion

Allowed:

- subtle source-line drawing;
- receipt stamp fade-in;
- gentle parallax under 8px;
- soft card elevation;
- restrained hero background drift.

Disallowed:

- constant particle storms;
- rapid pulsing;
- large auto-rotating carousels;
- flashing glows;
- motion that obscures reading.

Respect `prefers-reduced-motion`.

---

## 13. Responsive Behavior

### Tablet

- Header nav collapses.
- Hero becomes one column.
- Visual follows copy.
- Three workflow cards stack or become 2+1.
- Trust section becomes one column.

### Mobile

- No miniature desktop screenshot.
- Hero copy remains first.
- Primary CTA full width.
- Cards become single column.
- Metadata chips wrap.
- Asset galleries are excluded from public home.
- Footer becomes accordion or stacked groups.

---

## 14. Implementation Rules

1. Do not redesign the product’s invariants.
2. Do not publish unverified numbers.
3. Do not imply production readiness.
4. Do not treat QuaNthoR as a proof authority.
5. Do not suggest identity documents or biometrics are stored.
6. Do not imply provider integrations are live unless configured.
7. Keep `/api/v1` as the canonical public API family.
8. Preserve the no-pay-to-rank message.
9. Keep user insight data local by default.
10. Never expose deployment secrets or internal infrastructure.

---

## 15. Acceptance Checklist

### Product accuracy

- [ ] No pay-to-rank is explicit.
- [ ] Free core publishing is explicit.
- [ ] Provenance is described without legal overclaiming.
- [ ] Human authority is explicit.
- [ ] Pre-alpha boundaries are visible.
- [ ] QuaNthoR is shown as a coach.
- [ ] Consent-first integrations are clear.

### Visual quality

- [ ] Editorial, not generic SaaS.
- [ ] Dark and light are structural twins.
- [ ] No fake metrics.
- [ ] No baked-in canonical text.
- [ ] Asset boards do not dominate the home.
- [ ] Product workflow is visible in the hero.
- [ ] Mobile is intentionally composed.

### Accessibility

- [ ] WCAG AA contrast.
- [ ] Keyboard focus.
- [ ] Reduced motion.
- [ ] Semantic regions.
- [ ] Clear labels.
- [ ] No essential color-only meaning.

### Engineering

- [ ] React components are modular.
- [ ] CSS tokens are centralized.
- [ ] No duplicated dark/light DOM.
- [ ] Images are responsive and optimized.
- [ ] Existing tests remain valid.
- [ ] No secrets or private deployment data enter the repository.

---

## 16. Recommended Component Tree

```text
ScholariumLanding
├── ScholariumHeader
├── HeroEvidenceFlow
├── PromiseStatement
├── WorkflowTriptych
├── TrustByDesign
├── PublicationArtifactDemo
├── OrganizationalContinuity
├── SuiteBridge
├── PreAlphaBoundary
├── FinalCTA
└── ScholariumFooter
```

---

## 17. Final Design Statement

Scholarium should look like a place where serious work can begin informally, become structured without losing its author’s voice, and remain connected to the evidence and people that gave it meaning.

The visual system must make **context, provenance, learning, and human continuity** feel more valuable than attention, ranking, or spectacle.
