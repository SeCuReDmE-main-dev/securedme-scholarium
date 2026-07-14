# Academic profile and alert boundary

## Author-controlled profile context

`/api/v1/profile-sections` lets an account owner create biography, affiliation, teaching, service, and project sections. Each record is private by default and can be made public only by its owner. Public profiles expose only sections marked public.

`/api/v1/author-metrics` returns limited first-party counts for a public profile: public works, verified works, visible comments, and reactions. It excludes passive readership, geography, off-platform tracking, third-party citations, payment data, and paid reach.

## Explicit alerts

- `search-alerts` records an account's explicit query/topic subscription and cadence.
- `citation-alerts` records an author's preference for one of their own publications.

These are preference ledgers. They do not fabricate a citation count, scrape third-party accounts, or use passive behavior to rank content. Delivery workers and source-specific citation verification remain separate launch-gated work.

## Academia migration compatibility

The profile and alert surfaces complement the existing owner-confirmed Academia migration review. They do not accept Academia passwords, browser cookies, or session tokens, and imported work remains private by default until the owner selects visibility.
