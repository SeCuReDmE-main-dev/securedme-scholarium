# Scholarium — publication versioning

Every publication starts at version 1 with an immutable SHA-256 provenance receipt. The author can create a new version through `POST /api/v1/publications/{publicationId}/versions` by sending the latest `baseVersion`, a title and an abstract.

The server preserves all earlier versions with their original title, abstract, content hash, timestamp and receipt. It then marks the current public record as `processing` for a new verification pass. A stale `baseVersion` returns `409`; it prevents an author from silently overwriting a newer revision.

Public version history is readable at the same endpoint with `GET`. Versioning changes the current presentation of work; it never deletes or rewrites a prior provenance receipt.
