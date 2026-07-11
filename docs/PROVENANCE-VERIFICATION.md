# Provenance receipt verification

Every version stores a SHA-256 receipt built from the canonical title, abstract, publication ID, version, type, and the server-held author account ID. The author account ID participates in the hash but is never returned by the verification API.

## Public verification

- `GET /api/v1/provenance/verify?publicationId=…&version=…` returns the public receipt and stored hash for a public publication version.
- `POST /api/v1/provenance/verify` accepts `{ publicationId, version, title, abstract }`, recomputes the canonical SHA-256 server-side, and returns only whether it matches. The submitted title and abstract are not persisted.
- Private, removed, and quarantined publications are not available through this public verifier.

## Meaning and limit

A match proves that the supplied text matches the version retained by Scholarium under the listed receipt. It records a platform publication event and supports later comparison; it does **not** establish copyright ownership, author identity in the legal sense, DOI/ISBN registration, originality against the entire web, or a legal conclusion.
