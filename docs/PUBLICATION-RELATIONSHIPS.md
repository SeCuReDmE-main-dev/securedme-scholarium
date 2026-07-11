# Publication source relationships

Scholarium lets an author declare that a publication is derived from, translates, versions, imports a record from, or cites another work. The declaration preserves a canonical HTTPS source URL, optional source title, upstream license, relationship type, statement and timestamp.

This is an attribution and provenance record, not an automated copyright ruling, originality verdict, or scientific-truth judgment. The author remains responsible for having permission to reuse source material and for selecting a compatible license.

`POST /api/v1/publication-relationships` is account-bound and accepts only publications owned by the signed-in account. `GET` exposes relationships only when the Scholarium publication itself is public. Private source declarations remain private and are included in the account's portable export.

Owner-confirmed Academia imports automatically receive an `imports_record_from` relationship pointing to the original Academia.edu record. Scholarium does not claim that the import date replaces the source platform's publication history.
