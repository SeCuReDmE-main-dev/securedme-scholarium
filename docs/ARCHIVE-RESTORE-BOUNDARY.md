# Archive and restore boundary

Scholarium now has an owner-only archive manifest contract at `/api/v1/archive-manifests`.

The contract supports Phase 20 work without overstating storage automation:

- register a user-controlled archive location such as Google Drive, Microsoft Drive, local sync, or cold R2;
- list only the signed-in account owner's manifests;
- request explicit `restore` or `resync` actions;
- keep public metadata, provenance receipts, and identifiers visible when an original file is unavailable;
- export manifests in the private account-data export.

## Hard boundaries

- The manifest never stores Drive tokens, OAuth refresh secrets, filesystem credentials, or provider private keys.
- Restore and resync requests do not delete R2 objects.
- A restore request does not bypass publication safety, moderation, or provenance checks.
- File bytes are not copied through this manifest route.

This is a durable control surface for archive intent and owner requests. Actual provider workers remain a later implementation phase.
