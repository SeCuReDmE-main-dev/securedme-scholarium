# Google Stitch Prompt — SecuredMe Scholarium

Design a complete, production-oriented responsive website concept for **Scholarium**, the SecuredMe Education research-and-learning commons.

## Product identity

Scholarium is an open, education-first and research-first platform where people can publish research notes, white papers, project updates, teaching artifacts, datasets, presentations, short videos, and open-source project context.

Its primary promise is:

**Turn knowledge into traceable evidence.**

Supporting promise:

**Publish with context. Learn in public. Keep discovery free.**

The product is in **public pre-alpha**. The design must communicate honesty, trust, provenance, learning, and human continuity. It must not look like a generic SaaS landing, a crypto product, a social popularity network, or an AI hype page.

## Non-negotiable product principles

- No pay-to-rank.
- Core publishing and discovery remain free.
- Provenance receipts do not replace DOI, ISBN, copyright registration, ethics approval, or legal advice.
- Human review remains human.
- QuaNthoR is a non-blocking structural coach, not a proof authority or publishing gatekeeper.
- Personal insight settings are off by default and remain local in the browser.
- Tool and provider connections are consent-first.
- Do not imply that currently gated provider operations are already launched.
- Do not invent usage metrics, certifications, scientific results, user counts, performance claims, or moderation capabilities.

## Technical environment

The implementation target is:

- React 19
- Vinext
- TypeScript
- Cloudflare Workers
- Drizzle / D1
- R2-compatible media contracts
- Geist for body and UI
- Instrument Serif for display typography

Generate a design that can be implemented as reusable React components. Dark and light themes must use the same DOM and content structure. Only design tokens change.

## Visual direction

Create a sophisticated **Evidence Commons** aesthetic.

The visual language combines:

- premium editorial publishing;
- public research library;
- quiet institutional technology;
- archival paper surfaces;
- deep navy evidence panels;
- electric blue and cyan provenance lines;
- violet for formalization and semantic connection;
- restrained gold for durable receipts and stewardship;
- geometric source graphs;
- timestamp and receipt motifs;
- clean knowledge networks;
- human authorship and readable work.

Avoid:

- cheap neon cyberpunk;
- gamer aesthetics;
- flat bootstrap cards;
- excessive glassmorphism;
- generic AI brains;
- fake dashboards;
- attention-economy visual language;
- social “like” counters;
- giant asset-board galleries on the public home.

## Canonical design tokens

### Light theme

- Page background: `#F7F8FC`
- Warm paper: `#F4F1E8`
- Surface: `#FFFFFF`
- Soft surface: `#EEF3FF`
- Primary text: `#10172F`
- Muted text: `#63708A`
- Border: `#DFE4EF`
- Primary blue: `#2157EE`
- Bright blue: `#1A73FF`
- Cyan: `#23B8FF`
- Soft cyan: `#1FD4DC`
- Violet: `#6F42FF`
- Gold: `#FFC857`

### Dark theme

- Page background: `#080D1C`
- Surface: `#0D1530`
- Raised surface: `#111B3D`
- Primary text: `#F7F9FF`
- Muted text: `#B8C2DF`
- Border: subtle blue-white at 18% opacity
- Use the same blue, cyan, violet, and gold accents

## Typography

- Display headings: Instrument Serif, elegant and editorial.
- Body/interface: Geist, precise and highly readable.
- Hero headline should feel literary, serious, and modern.
- Use uppercase kickers with wide letter spacing.
- Avoid excessive all-caps.

## Required page structure

### 1. Header

Include:

- official Scholarium brand mark;
- Product;
- How it works;
- Trust;
- Organizations;
- Public source;
- primary CTA: `Enter Scholarium`.

Header behavior:

- clean and quiet;
- mobile menu;
- optional discreet theme toggle;
- optional discreet Neurodivergent Access control;
- SecuredMe root is a secondary route.

### 2. Hero

Left column:

- kicker: `SECUREDME EDUCATION / PUBLIC PRE-ALPHA`
- headline: `Turn knowledge into traceable evidence.`
- body: `A free social commons for research, learning, and organizational work — built so publications, people, context, and provenance can remain connected.`
- primary CTA: `Explore Scholarium`
- secondary CTA: `See the workflow`
- tertiary link: `View public source`

Right column:

Create a refined product illustration showing:

`Idea → structure → sources → publication → provenance receipt`

The visual should resemble a real publication workflow, not an abstract AI image.

Use:

- source nodes;
- a readable publication card;
- version history;
- license;
- attached files;
- provenance receipt;
- timestamp;
- subtle connection lines.

Do not bake copy into the illustration. Leave HTML text outside the image.

### 3. Editorial promise section

Centered editorial statement:

**A platform that respects the work and the learner.**

Supporting paragraph explaining that Scholarium preserves the process behind work: source, people, method, questions, context, and the next learner.

### 4. Three-part workflow

Three equal cards:

1. `Share more than a post`
2. `Make form a learning tool`
3. `Keep contribution human`

Each card must include:

- numeric marker;
- line icon;
- title;
- concise paragraph;
- action link.

### 5. Trust by Design

Full-width dark institutional section.

Left:

- kicker;
- strong editorial heading;
- explanation of no paid reach.

Right:

Three stacked principles:

1. Identity with boundaries
2. Provenance first
3. Privacy that stays local

Visuals should use source-chain geometry and receipt motifs, not shields everywhere.

### 6. Publication artifact demonstration

Show one realistic, accessible publication record with:

- title;
- author;
- affiliation;
- publication type;
- source list;
- files;
- version;
- license;
- review status;
- processing state;
- provenance timestamp;
- receipt ID;
- visibility;
- contextual notes.

Use neutral sample content and clearly mark it as an example. Do not invent platform metrics.

### 7. Organizational continuity

Create a two-column section.

Left:

- headline about building a research network rather than another document archive;
- explanation of durable context and team handoff.

Right:

- evidence graph;
- version timeline;
- contributor sequence;
- source-linked artifact;
- provenance trail.

### 8. SecuredMe suite bridge

Explain the distinction:

- SecuredMe = suite root and ecosystem map.
- Scholarium = active publishing, discovery, formalization, and learning commons.

Include:

- primary CTA: `Open Scholarium`
- secondary CTA: `Explore SecuredMe root`

### 9. Public pre-alpha boundary

A clear, calm disclosure panel.

Include:

- public pre-alpha;
- no paid ranking;
- provider operations remain gated;
- moderation and youth-flow operations are not fully launched;
- external integrations remain incomplete;
- provenance receipts do not replace formal legal or scholarly registration.

This section must build trust, not feel like a warning wall.

### 10. Final CTA

Headline:

**Bring a question. Leave with a clearer next step.**

CTA:

`Enter Scholarium`

Secondary:

`View the public repository`

### 11. Footer

Columns:

- Product
- Publishing
- Trust
- Developers
- Legal

Include links for:

- GitHub repository;
- Privacy;
- Feedback;
- SEL-2.0;
- Public calendar;
- SecuredMe root.

## Interaction details

- Use subtle source-line drawing animation.
- Use restrained card lift.
- Use a provenance receipt stamp animation once.
- Respect `prefers-reduced-motion`.
- No auto-playing carousels.
- No flashing or constant particle effects.
- Focus states must be obvious.
- Interactive targets must be at least 44px.

## Accessibility

Design for WCAG AA.

Include a discreet, expandable Neurodivergent Access control compatible with:

- Base
- Autism Calm
- ADHD Sprint
- Deep Work
- Dyslexia Support
- Reduced Motion
- Low Stimulation

The control must be available but must not dominate the landing.

## Responsive requirements

### Desktop

- Max content width: 1180px
- Hero: two columns
- Three workflow cards in one row
- Trust section: two columns
- Publication artifact: wide editorial card

### Tablet

- Hero stacks
- Trust stacks
- Workflow becomes 2+1 or stacked

### Mobile

- Do not shrink the desktop screenshot
- Recompose every section
- Copy first, visual second
- Full-width primary CTA
- Single-column cards
- Compact metadata chips
- Footer becomes stacked or accordion

## Asset guidance

Use repository assets as references, not as mandatory full-page screenshots.

Known asset families:

- canonical final logo;
- dark and light badge ladders;
- campaign banners;
- icon boards;
- education endorsement strip;
- B2B hooks.

Do not place the entire brand vault on the public home. Create a separate `/brand` or `/press-kit` concept for the full gallery.

Use text-free visual assets wherever possible. All canonical titles, labels, buttons, statuses, and legal copy must remain HTML text.

## Output requested from Stitch

Generate:

1. Full desktop light landing
2. Full desktop dark landing
3. Tablet layout
4. Mobile layout
5. Component inventory
6. Design tokens
7. Key reusable React component suggestions
8. Accessibility annotations
9. Asset placement map

The result must feel like a premium open research institution and public knowledge commons—not a conventional social network and not a generic SaaS template.
