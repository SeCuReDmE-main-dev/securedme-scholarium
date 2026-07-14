# Scholarium vs Academia.edu Auth and Publication Benchmark

## Objective

Compare the current Scholarium authentication, publication, migration, and indexing architecture against Academia.edu and the natural Google Scholar indexing path.

## Codebase Context

Scholarium is a Vinext/React app deployed through Sites with a versioned `/api/v1` surface. The current implementation includes ChatGPT/OpenAI identity headers, Google/GitHub/PayPal OAuth, profile preferences, public publications, provenance, source relationships, Academia migration drafts, project starter requests, and provider integration placeholders.

## Product / Tool Thesis

Scholarium should not copy Academia.edu as a paywalled researcher network. It should become a proof-first scholarly commons: public publication pages, transparent discovery, owner-controlled migration, Education-suite handoff, provenance receipts, and Google Scholar-compatible metadata.

## Repo Evidence Map

- `apps/web/app/chatgpt-auth.ts`: OpenAI/ChatGPT identity through trusted platform headers.
- `apps/web/lib/google-oauth.ts`: Google OAuth with PKCE, state, encrypted cookies, and verified email check.
- `apps/web/lib/platform-identity.ts`: provider-subject identity boundary; no email auto-merge.
- `apps/web/lib/integration-catalog.ts`: Codex/OpenAI, Antigravity/Gemini, Google Drive, YouTube, Academia, Synthia, QuaNthoR, and Life Science integration records.
- `apps/web/app/api/academia-migrations/route.ts`: private, owner-confirmed Academia import drafts.
- `apps/web/app/api/project-starter/route.ts`: provider-gated private project starter from attributed repositories.
- `apps/web/app/api/openapi.json/route.ts`: canonical API contract.

## Research Questions

- Is Google login as complete as the OpenAI entry?
- What would make Codex/OpenAI and Antigravity/Gemini tool entry feel native?
- Which Academia.edu capabilities remain absent?
- How should Scholarium connect naturally to Google Scholar?

## Benchmark Methodology

This is a product and architecture benchmark, not a performance benchmark. It compares user-visible scholarly workflows, trust boundaries, indexing hygiene, and migration capabilities.

## Market Landscape

Academia.edu provides researcher profiles, paper hosting, readers, recommendations, analytics, alerts, and premium discovery/insight features. Google Scholar is not a social product to integrate with directly; it indexes scholarly pages that satisfy crawler and bibliographic metadata expectations.

## Comparator Profiles

Academia.edu:

- Product framing: researcher network and paper-discovery platform.
- Overlap: profile, publication, migration, reader analytics, alerts.
- Mismatch: Scholarium rejects pay-to-rank and centers provenance/education tooling.
- Evidence label: partially confirmed by official support/product material.

Google Scholar:

- Product framing: scholarly search index.
- Overlap: public scholarly pages and metadata.
- Mismatch: no normal push API or social account integration path.
- Evidence label: confirmed by primary Google Scholar webmaster guidance.

## Benchmark Validity Analysis

The comparison is valid for publication workflow, profile completeness, indexing readiness, and migration experience. It is not valid to compare Scholarium's current pre-alpha traffic, recommendation quality, or citation graph against mature Academia.edu network effects.

Acceptable claims:

- Scholarium has safer provenance and ranking principles than a paywalled discovery model.
- Scholarium needs publication-page SEO and Scholar metadata before claiming natural Google Scholar visibility.
- Google login is implemented, but Google suite capabilities are not fully architected.

Unacceptable claims:

- Scholarium is already at Academia.edu feature parity.
- Google Scholar is "connected" without indexable pages and metadata.
- Google login automatically implies Drive/YouTube/Scholar integration.

## Comparative Benchmark Matrix

| Product | Category | Strongest differentiator | Scholarium overlap | Benchmark dimension | Evidence label |
| --- | --- | --- | --- | --- | --- |
| Scholarium | scholarly commons | provenance, no pay-to-rank, Education-suite handoff | current target | trust and workflow completeness | confirmed by local repo |
| Academia.edu | researcher network | existing network, readers, analytics, alerts | partial | migration and profile parity | partial primary evidence |
| Google Scholar | scholarly search | crawlable scholarly index | future indexing target | metadata/indexing compliance | confirmed by primary source |

## Benchmark Map

| Target | Outcome | Dimension | Market link | Tier |
| --- | --- | --- | --- | --- |
| `getPlatformIdentity` | stable account identity | auth trust boundary | provider login expectations | first-tier |
| `google-oauth.ts` | Google identity entry | OAuth completeness | Google ecosystem entry | first-tier |
| `integration-catalog.ts` | tool capability surface | provider handoff clarity | Codex/Antigravity/Drive/YouTube | first-tier |
| `academia-migrations` | owner-confirmed import | migration friction | Academia.edu portability | first-tier |
| future publication pages | Google Scholar visibility | metadata compliance | Google Scholar inclusion | first-tier |
| future analytics alerts | reader/citation awareness | product parity | Academia.edu premium insights | second-tier |

## Recommended First Benchmark Scenario

Implement a Google Scholar-ready publication page and test it with three publication types: research article, white paper, and book. Measure whether each page exposes canonical URL, authors, abstract, publication date, identifiers, PDF URL where public, and citation metadata.

## Execution Harness

No Python benchmark harness was run in this turn. The next harness should fetch local rendered publication pages and assert Google Scholar-compatible metadata.

## Measured Results

Research-only status. No performance results.

## Measurement Plan

- Add fixtures for public publications.
- Render public publication detail pages.
- Parse HTML and verify `citation_*` metatags.
- Verify robots and sitemap include public scholarly pages.
- Verify private publications and private artifacts are excluded.

## Recommended Benchmark Priorities

1. Scholarly indexing compliance.
2. Google provider capability registry.
3. Academia migration parity.
4. Reader/citation alert model.
5. Profile completeness and public author pages.

## Risks / Unknowns

- Google Scholar indexing is not guaranteed even with correct metadata.
- Academia.edu exact premium feature behavior can change.
- Public artifacts must not bypass youth, moderation, or privacy rules.
- Google Drive/YouTube scopes require separate consent and revocation paths.

## Sources

- Google Scholar Inclusion Guidelines for Webmasters: https://scholar.google.com/intl/en/scholar/inclusion.html
- Academia.edu public site and support center: https://www.academia.edu/ and https://support.academia.edu/
- Local Scholarium repo files listed in the Repo Evidence Map.
