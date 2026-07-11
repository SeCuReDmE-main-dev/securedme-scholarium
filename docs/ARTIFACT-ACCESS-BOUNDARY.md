# Artifact access boundary

Artifacts are stored separately from a publication record. The public access API deliberately authorizes through the parent publication rather than through a guessable object key.

## Public access

- `GET /api/v1/artifacts?publicationId=…` lists only active artifacts belonging to a public publication. The list exposes a safe filename, content type, byte size, SHA-256 and a route-local download URL; it never exposes the R2 object key.
- Adding `artifactId=…` returns the active object as an attachment, with `Content-Disposition: attachment`, `X-Content-Type-Options: nosniff`, and a bounded public cache header.
- Private, quarantined, removed, missing, inactive, or incorrectly associated artifacts return `404` rather than leaking their storage location.

## Limits

The download route is not a malware-cleanliness assertion, a license grant, or a cryptographic signature of the file. It is a controlled delivery path after the existing upload allow-list and SHA-256 record. Deep scanning, previews, access logs and resumable large-file transfer remain separate launch gates.
