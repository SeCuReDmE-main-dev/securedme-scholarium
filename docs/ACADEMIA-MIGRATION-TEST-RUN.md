# Academia.edu migration rehearsal

This runbook closes the first migration gate before using a real account. It tests the same three-item contract that will be used for the account owner's publications, while keeping the fixture synthetic.

## Gate A — synthetic rehearsal

- Use `templates/academia-migration/three-publications.example.json` as the source fixture.
- In the authenticated Scholarium UI, open **Migrate**.
- Convert each fixture record to the displayed pipe-delimited line format.
- Confirm ownership for the fixture only, create the private review, and confirm that all three items start as `private` and `pending`.
- Leave one item unselected, keep one item private, and mark one item public only for the rehearsal.
- Commit the selection and record the three resulting statuses and publication IDs.
- Start a second review and confirm it is independent; never reuse an imported publication as a new source record.

## Gate B — owner account, three works

Only after Gate A succeeds, the account owner may repeat the flow with three records copied while signed in to their own Academia.edu account. Do not provide Scholarium with provider credentials. Review each canonical source URL and confirm the visibility choice individually.

Evidence to capture:

| Check | Expected evidence |
| --- | --- |
| Ownership | Explicit owner/authorized confirmation in the migration request |
| Privacy | Draft items private before commit; no public profile bypass |
| Provenance | One declared `imports_record_from` relationship per imported work |
| Safety | Source platform URL retained; Scholarium receipt described as provenance, not legal proof |
| Idempotency | A second commit cannot re-import already imported pending items |

## Stop conditions

Stop the run if a source URL is not HTTPS Academia.edu, ownership is unclear, a private item appears in public discovery, a provider token is requested, or a relationship is presented as a copyright/truth verdict. Record the issue before changing the source data.
