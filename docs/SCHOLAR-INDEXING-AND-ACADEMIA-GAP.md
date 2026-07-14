# Scholarium Auth, Academia.edu Gap, and Google Scholar Indexing

## Current State

Scholarium is now a deployed pre-alpha with a versioned `/api/v1` contract, a public app surface, provider sign-in paths, publication creation, provenance, repository links, Academia migration drafts, project starter requests, funding drafts, DOI/Zenodo drafts, and account export.

Live deployment evidence should be rechecked before launch claims. The last verified production URL was `https://www.scholarium.securedme.ca`, with `/api/v1/openapi.json` returning the `project-starter` contract.

## Auth Entry Points

### OpenAI / ChatGPT Entry

Status: strongest current entry.

Current implementation:

- `apps/web/app/chatgpt-auth.ts` reads platform headers: `oai-authenticated-user-email`, `oai-authenticated-user-full-name`, and encoding metadata.
- `apps/web/lib/platform-identity.ts` gives this path first priority.
- User identity is stable by hashed email under a `siwc_` account key.

Strengths:

- No app-managed OAuth secret exchange is required inside Scholarium.
- The provider session remains outside the app.
- Return paths are sanitized.
- This path is the cleanest match for Codex/OpenAI WebAuth.

Weaknesses:

- It depends on the hosting/runtime injecting trusted OpenAI identity headers.
- It does not yet create a rich external identity record in `external_identities`.
- It is not yet connected to a broader token-governor or consent ledger beyond account identity.

### Google Entry

Status: usable, but less complete than OpenAI as a platform door.

Current implementation:

- `apps/web/lib/google-oauth.ts` implements Google OAuth with PKCE, state, encrypted cookies, and userinfo validation.
- Google requires verified email and stable `sub`.
- The session is stored in an encrypted `__Host-scholarium-google-session` cookie.

Strengths:

- PKCE and state are implemented.
- Session cookie is host-only, secure, httpOnly, and SameSite=Lax.
- Email auto-merge is explicitly avoided by using `provider:subject`.

Weaknesses:

- The Google path is only identity login today. It does not yet become a full Google suite bridge.
- Drive, YouTube, Google Scholar-friendly publication metadata, and Antigravity/Gemini handoff are still separate pending-consent records.
- There is no current provider capability registry that says what Google can do after login.
- There is no revocation UI, device/session list, or consent audit per Google capability yet.

### Codex and Antigravity Tool Doors

Status: metadata-ready, not fully live-connected.

Current surfaces:

- `.codex/webauth-template.json`
- `.antigravity/webauth-template.json`
- `.codex/securedme-adapter-map.json`
- `.antigravity/securedme-adapter-map.json`
- `apps/web/lib/integration-catalog.ts`

Current rule:

- Codex/OpenAI and Antigravity/Gemini are represented as `provider.web_auth` integrations.
- They must not store OAuth tokens, cookies, browser sessions, API keys, `.env` values, or client secrets.
- They preserve the hierarchy `I -> I_system^S -> D_f -> dF -> i_fractal`.

Next architecture:

- Add a `provider_capabilities` contract that separates login, tool handoff, content export, and model-assisted review.
- Add a `webauth_handoff_requests` table for Codex/OpenAI and Antigravity/Gemini.
- Keep all provider sessions browser-owned.
- Store only consent state, scope names, request ids, timestamps, and redacted summaries.

## Academia.edu Gap

Academia.edu is not only a repository. It is a researcher profile, publication, reader-discovery, analytics, alert, and networking product.

Scholarium already has:

- public publications
- user profiles with explicit public visibility
- topic follows
- publication interactions
- collections
- source relationships
- Academia migration draft route
- ORCID guidance and private ORCID claim
- DOI/Zenodo deposit draft
- provenance receipts
- anti-pay-to-rank ranking controls
- project starter requests from attributed repositories

Main missing Academia.edu-like capabilities:

- rich researcher profile sections: affiliations, CV, fields, coauthors, grants, teaching, services
- paper detail pages optimized for external indexing
- citation/mention alerts
- readership analytics and geography/affiliation summaries
- recommendation emails and saved search alerts
- bulk import from Academia exports, ORCID, DOI, arXiv, Zenodo, Google Scholar profile URLs
- profile-to-profile recommendations and private messages
- institutional pages and labs
- search alerts by author/topic/publication
- page-level SEO and scholarly metadata for each public work
- inbound citation graph and "related papers"

Scholarium differentiators to protect:

- no pay-to-rank
- provenance-first publication receipts
- transparent discovery scoring
- provider-gated project starters
- Education-suite formalization through QuaNthoR and Synthia
- public/private boundary by owner choice
- migration flow that never receives Academia passwords, cookies, or session data

## Google Scholar Natural Connection

Google Scholar has no normal social-platform API for pushing papers into its index. The correct path is publisher/repository hygiene: public scholarly pages that Google Scholar can crawl and parse.

Required Scholarium architecture:

- canonical public publication page at `/p/{publicationId}` or `/publication/{slug}`
- stable author page at `/profile/{publicId}`
- one public abstract page per scholarly work
- full bibliographic metadata in HTML meta tags
- stable PDF/download URL when the file is public
- citation graph and reference list rendered as text
- `robots.txt` allowing scholarly pages
- sitemap index for publications, authors, and updated works
- no login wall for public abstract pages
- DOI, ORCID, arXiv, ISBN, Zenodo identifiers rendered visibly when available
- canonical URL tags and version links
- language/original-canonical labels for translations

Suggested Google Scholar meta tags:

```html
<meta name="citation_title" content="..." />
<meta name="citation_author" content="..." />
<meta name="citation_publication_date" content="YYYY/MM/DD" />
<meta name="citation_abstract_html_url" content="https://www.scholarium.securedme.ca/publication/..." />
<meta name="citation_pdf_url" content="https://www.scholarium.securedme.ca/api/v1/artifacts?..." />
<meta name="citation_doi" content="..." />
<meta name="citation_keywords" content="..." />
```

Do not fake Google Scholar affiliation. Scholarium should expose compliant pages and let indexing happen naturally.

## Recommended Next Tranches

## Implemented foundation slice

The first scholarly-discovery and Academia-parity slice is now implemented locally:

- public `/publication/{publicationId}` pages emit canonical and `citation_*` metadata;
- `robots.txt`, `/sitemap.xml`, and `/sitemap-publications.xml` expose only owner-enabled public work;
- `/api/v1/scholar-indexing-status` reports crawl prerequisites without claiming third-party indexing;
- provider capabilities, explicit consent records, and consent-gated Codex/Antigravity WebAuth handoff records are available;
- author-controlled profile sections, transparent first-party author metrics, and explicit private search/citation alert preferences are available.

Still launch-gated: external citation-source verification, alert delivery workers, DOI/ORCID-authenticated metadata rendering, public full-text artifact availability, organization/lab pages, and bulk account exports from third-party providers.

1. Scholarly indexing contract

Create public publication pages, metadata renderer, robots/sitemap, and tests that assert `citation_*` tags for scholarly publication types.

2. Provider capability registry

Separate provider login from provider tools. Google login should unlock capability status for Drive, YouTube, Antigravity/Gemini, and Scholar-friendly indexing without mixing tokens.

3. Academia parity queue

Add `profile_sections`, `author_metrics_snapshots`, `search_alerts`, and `citation_alerts` as owner-controlled records. Keep analytics private and excluded from ranking.

4. Migration importer hardening

Turn the current Academia migration draft into a structured import review table with title, abstract, authors, PDF reference, public/private choice, source URL, and duplicate/provenance checks.

5. Scholarium differentiator layer

Add "Why this is better than Academia" only as product truth after implementation: provenance receipt, no pay-to-rank, project starter, formalization guide, and Google Scholar-ready page.

## Evidence Labels

- Current Scholarium auth state: confirmed by local repo source.
- Current Scholarium API surface: confirmed by live OpenAPI and local route files.
- Academia.edu gaps: partially confirmed by official product/support material and partially inferred from public product behavior.
- Google Scholar connection path: confirmed by Google Scholar inclusion guidance.

## Sources

- Google Scholar Inclusion Guidelines for Webmasters: https://scholar.google.com/intl/en/scholar/inclusion.html
- Academia.edu public product and support pages: https://www.academia.edu/ and https://support.academia.edu/
- Scholarium local repo evidence: `apps/web/app/chatgpt-auth.ts`, `apps/web/lib/google-oauth.ts`, `apps/web/lib/platform-identity.ts`, `apps/web/lib/integration-catalog.ts`, `apps/web/app/api/openapi.json/route.ts`
