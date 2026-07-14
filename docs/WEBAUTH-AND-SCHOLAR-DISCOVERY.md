# WebAuth and scholarly discovery boundary

## What is implemented

- `GET /api/v1/provider-capabilities` publishes the bounded capability catalogue.
- `GET|PUT|DELETE /api/v1/provider-consents` records an account owner's explicit provider-scope decision.
- `GET|POST /api/v1/webauth-handoff-requests` prepares a provider-owned WebAuth handoff only for `codex_openai` and `antigravity_gemini` after consent.
- `/publication/{publicationId}` is a public owner-enabled publication record with canonical and `citation_*` metadata.
- `robots.txt`, `/sitemap.xml`, and `/sitemap-publications.xml` expose crawlable public routes only.
- `GET /api/v1/scholar-indexing-status` reports Scholarium-controlled crawl prerequisites for one public record.

## Non-negotiable boundaries

- Provider login does not grant Drive, YouTube, GitHub, or any other delegated scope by implication.
- Scholarium never stores a raw provider token, provider session, or raw prompt in the handoff ledger.
- Only Codex / OpenAI and Antigravity / Gemini are official AI-assisted school routes.
- A crawlable publication page is not evidence that Google Scholar or another index has crawled or accepted the work.
- Citation metadata and provenance labels make a record easier to interpret; they do not certify research quality, authorship, or scientific truth.

## Natural Google Scholar connection

Google Scholar is reached by publisher hygiene rather than a social-media-style push API: public abstract pages, canonical URLs, readable citation metadata, stable artifact links when the owner has made them public, `robots.txt`, and sitemaps. External indexers decide crawl and inclusion independently.

## Synthia boundary

Synthia may help users trace sources, formalize a review packet, and preserve uncertainty across `I -> I_system^S -> H_lex -> G_lex -> I_lexicon`. It is not a taxonomic, scientific, regulatory, or authorship authority.
