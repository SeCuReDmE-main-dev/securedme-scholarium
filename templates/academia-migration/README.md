# Scholarium Academia.edu migration seed

This template is a safe, owner-confirmed input contract for a small migration rehearsal. It is deliberately metadata-only: Scholarium does not ask for an Academia.edu password, cookie, session token, or bulk-scraping permission.

## Use

1. Sign in to the Academia.edu account that owns the works.
2. Copy the title, short abstract, canonical public record URL, and topics for up to three works.
3. Open **Scholarium → Migrate** and paste one pipe-delimited record per line:

   `Title | short abstract | https://www.academia.edu/... | topic one, topic two`

4. Confirm ownership or explicit authorization.
5. Create the private review, inspect every item, and choose visibility one item at a time.
6. Import only the selected records. Imported records remain private unless the author explicitly chooses public visibility and the account's safety policy permits it.

`three-publications.example.json` is a synthetic, non-user fixture for exercising the three-item shape. It is not a scrape and must never be treated as a real person's publication list.

## Boundaries

- The source platform remains authoritative for its own publication history.
- A Scholarium import creates a declared `imports_record_from` relationship and a new Scholarium provenance receipt; it does not make a copyright or scientific-truth ruling.
- Public discovery never bypasses WebAuth, private profiles, migration drafts, or authenticated APIs.
- Do not create a profile for another person from an email address alone.
