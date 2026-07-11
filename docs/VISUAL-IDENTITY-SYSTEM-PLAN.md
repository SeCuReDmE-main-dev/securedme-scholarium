# Scholarium visual identity system

## Decision

Scholarium uses the supplied **folio / portal / embedded S** mark as its product identity and the SecuredMe Education materials as its suite endorsement. The system is dark-first, accessible in light contexts, and deliberately separates earned recognition from payment.

**Status:** implementation-ready plan; source assets remain untouched in `assets/`.

## Brand invariants

1. **Product before suite.** `Scholarium` is the product name in the primary header; `SecuredMe Education` is the endorsement.
2. **Knowledge, provenance, impact.** The three words are a message hierarchy, not decoration.
3. **Recognition is earned.** No badge, halo, gold treatment, or feed privilege may be bought.
4. **No biometric implication.** The network-node motif represents connected work and provenance, never identity verification or surveillance.
5. **Quiet reading wins.** The gold/nebula treatment belongs to campaign surfaces, milestones, and optional profile decoration—not every reading surface.

## Asset register and role map

| Source collection | Existing files | Role after curation | First use |
| --- | --- | --- | --- |
| `logo final concept/1.png` | 1 square master | Primary product mark reference | favicon, app icon, avatar fallback, extension icon master |
| `logo concept draft/*.png` | 2 square drafts | Archive only; do not ship without an explicit selection | design history |
| `securedme/education/*logo*.png` | light and dark square marks | Suite endorsement, never a replacement for Scholarium mark | footer, suite switcher, partner pages |
| `securedme/education/*banner*.png` | 2 wide banners | Education-suite campaign/announcement strip | suite hub and institutional pages |
| `web banner/1.png`–`10.png` | 10 × 1672×941 | Hero, landing campaign, social-preview candidates | landing page and release stories |
| `b2b banner hook/1.png`–`2.png` | 2 × 1122×1402 | Institutional/teacher or partner story artwork | partner and school outreach pages |
| `icon asset pack/1.png`–`10.png` | 10 square boards | Source reference for app-icon and shortcut family | product navigation and browser extension |
| `badge/dark/1.png`–`10.png` | 10 dark square boards | Earned-status catalogue on dark UI | profile, public profile, recognition page |
| `badge/light/1.png`–`10.png` | 10 light square boards | The same catalogue for light/export contexts | public pages, PDFs, embeds |
| `video/*` | 1 media item | Editorial/video case-study source | Studio and launch media only |

## Design tokens

The supplied SecuredMe Education board establishes the starting palette. These tokens must be tested against WCAG 2.2 contrast before a final token file is committed.

| Token | Intended value | Use |
| --- | --- | --- |
| `ink-950` | `#080E1A` | primary dark surface |
| `ink-900` | `#161B6A` | deep navy panel/anchor |
| `blue-500` | `#1473FF` | primary action and provenance signal |
| `violet-500` | `#6F42FF` | collaboration/formalization signal |
| `gold-500` | `#FFC857` | earned milestone only |
| `mist-100` | `#D9DDE5` | soft text/surface |
| `paper-0` | `#FFFFFF` | light-mode base |

Use blue for navigation and verified provenance, violet for co-creation and QuaNThoR guidance, and gold only for earned milestones. Never use gold as a subscription affordance.

## The visual system

### 1. Mark family

- **Primary mark:** the Scholarium `S` portal from `logo final concept/1.png`.
- **Wordmark:** “Scholarium” in a calm UI sans for application chrome; use the supplied editorial serif only for campaign/hero headlines.
- **Small mark:** one-color simplified portal `S`; it must remain legible at 16 px before it becomes the favicon.
- **Suite endorsement:** `SecuredMe Education` appears in the footer, suite launcher, and institutional material at a smaller visual weight.

### 2. Icons

Create a 24 px semantic icon set derived from the supplied `icon asset pack`, not from emoji glyphs. The initial map is:

| Product area | Icon concept | Accent |
| --- | --- | --- |
| Signal | connected orbit | blue |
| Library | folio/document | mist |
| Studio | lens/waveform | violet |
| Formalize / QuaNThoR | pen + structured diamond | violet |
| Saved | bookmark/folio | mist |
| Migration | two-way provenance path | blue |
| Verify | shield/checked source | blue |
| Collaborate | three-node network | violet |

The existing Unicode navigation symbols are a temporary fallback only. Do not embed raster full-size boards as UI icons.

### 3. Banners

- **Landing hero:** choose exactly one `web banner` master and place copy outside the artwork when the artwork already contains text.
- **Profile banner:** user-owned image; offer Scholar Navy, Electric Blue, Violet, and neutral-gradient defaults. Do not impose brand artwork on personal profiles.
- **Institutional banner:** use one `b2b banner hook` asset plus an editable partner lockup.
- **Education suite banner:** use the supplied thin dark/light pair at the suite boundary, never as the Scholarium home hero.
- **Social preview:** derive an Open Graph card from the selected hero, with title and product promise rendered in HTML/CSS or a dedicated image, not duplicated over embedded artwork text.

### 4. Earned badge system

The ten supplied badge pairs become a visual catalogue, but no image becomes active until its criterion is explicitly defined. Recommended sequence:

1. Spark — first connected tool or first verified contribution.
2. Connector — cross-tool link with author consent.
3. Structure — complete formalization fields.
4. Contributor — constructive community contribution.
5. Curator — reusable public collection or reading list.
6. Research steward — source-led publication maintenance.
7. Collaborator — verified co-authored work.
8. Mentor — credited learning support.
9. Provenance keeper — sustained attribution hygiene.
10. Commons builder — long-term open contribution.

Every badge needs: a public name, plain-language criterion, issuing event, evidence pointer, revocation rule, dark/light asset, alt text, and `public | private` user preference. Payment must never appear in any criterion.

### 5. Accessibility and performance gate

- Ship WebP/AVIF derivatives plus PNG fallbacks; retain originals outside the application public path.
- Prepare `1x`, `2x`, and responsive sizes for every approved banner.
- Require meaningful alt text; decorative nebula/linework uses empty alt text.
- Verify light/dark contrast, focus ring visibility, 200% text zoom, reduced-motion treatment, and a 16 px favicon test.
- Set byte budgets: icon ≤ 30 KB WebP/PNG where practical, badge ≤ 80 KB, profile default ≤ 160 KB, hero ≤ 350 KB responsive candidate.

## Implementation sequence

| Phase | Deliverable | Dependency | Done when |
| --- | --- | --- | --- |
| 0. Preserve | asset manifest with hash, dimensions, owner, source, and usage status | none | no original is renamed, overwritten, or placed blindly in production |
| 1. Select | one primary logo, one hero, one B2B banner, and ten named badges | visual review | each selected item has a product role and owner |
| 2. Derive | optimized icon, favicon, wordmark lockups, WebP/AVIF sets | phase 1 | all derivatives pass size and legibility gates |
| 3. Tokenize | CSS variables and component tokens | phase 1 | dark/light modes use the same semantic token names |
| 4. Integrate | landing, app shell, profile editor, public profile, badge cards, extension listing | phases 2–3 | no raw numbered asset path appears in product code |
| 5. Govern | badge registry, alt-text registry, visual QA checklist | phase 4 | earned criteria and visibility controls are testable |
| 6. Publish | social card, GitHub README/Store imagery, partner kit | phase 4 | every public surface uses the same selected mark and promise |

## File organization after selection

Keep the existing `assets/` directory as the source vault. Add only curated derivatives:

```text
assets/
  source-vault/                 # existing supplied work; read-only policy
  curated/
    brand/mark/{dark,light,mono}/
    brand/wordmark/{dark,light}/
    icons/{16,24,32,48,128}/
    badges/{spark,...,commons-builder}/{dark,light}/
    banners/{landing,institutional,suite}/
    social/
  manifest.json
```

## Technology decision

Use the current application stack and static optimized assets first (**Tier 1**): no design-system dependency, icon SaaS, or dynamic image service is needed. Add a vector source-of-truth only when the selected primary mark has been approved for production. Re-evaluate an image CDN only if the asset catalogue or traffic creates measurable delivery latency or bandwidth pressure.

## Immediate next four actions

1. Choose the primary `web banner` by visual review and name it `landing-hero`.
2. Map the ten badge images to the above registry after confirming the visual order.
3. Produce optimized derivatives and a machine-readable manifest; preserve all masters.
4. Replace the application’s temporary glyph navigation with the curated 24 px icon set and wire the selected logo/hero into the landing page.
