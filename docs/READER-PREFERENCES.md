# Reader preferences

Scholarium now exposes preparatory account-bound contracts for Phase 21:

- `/api/v1/accessibility-preferences`
- `/api/v1/notification-preferences`
- `/api/v1/translation-preferences`

These endpoints are intentionally marked `prepared_for_persistence`. They validate the user-facing rules before the durable `reader_preferences` migration lands.

## Contract boundaries

- Accessibility keeps keyboard navigation, reduced motion, and screen-reader support explicit.
- Notifications remain opt-in, private, and never become ranking signals.
- Translation keeps the original publication canonical, labels automatic translations, and protects formulas, citations, identifiers, and provenance receipts.
- All three endpoints require the platform identity and return `private, no-store`.

This advances the Phase 21 interface contract without pretending that the durable database migration is complete.
