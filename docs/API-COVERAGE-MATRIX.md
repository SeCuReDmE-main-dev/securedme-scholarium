# API coverage matrix

This matrix records the current canonical `/api/v1` resource surface for Scholarium and its documentation boundary.

## Coverage rule

- Every non-auth `apps/web/app/api/**/route.ts` resource route must appear in the OpenAPI contract at `/api/v1/openapi.json`.
- `/api/auth/*` is intentionally excluded from that rule because provider consoles persist those callback URLs externally.
- Product callbacks and signed webhooks still belong to the versioned resource contract when they are part of the platform product surface.

## Current covered routes

| Route | Methods | OpenAPI | Primary documentation |
| --- | --- | --- |
| `/api/v1/academia-migrations` | `GET`, `POST` | yes | [ACADEMIA-MIGRATION.md](ACADEMIA-MIGRATION.md) |
| `/api/v1/account` | `GET` | yes | [ACCOUNT-DATA-RIGHTS.md](ACCOUNT-DATA-RIGHTS.md) |
| `/api/v1/account/export` | `GET` | yes | [ACCOUNT-DATA-RIGHTS.md](ACCOUNT-DATA-RIGHTS.md) |
| `/api/v1/artifacts` | `GET`, `POST` | yes | [ARTIFACT-ACCESS-BOUNDARY.md](ARTIFACT-ACCESS-BOUNDARY.md) |
| `/api/v1/author-identifiers` | `GET`, `PUT`, `DELETE` | yes | [AUTHOR-IDENTIFIERS.md](AUTHOR-IDENTIFIERS.md) |
| `/api/v1/author-metrics` | `GET` | yes | [ACADEMIC-PROFILE-AND-ALERTS.md](ACADEMIC-PROFILE-AND-ALERTS.md) |
| `/api/v1/citation-alerts` | `GET`, `POST`, `DELETE` | yes | [ACADEMIC-PROFILE-AND-ALERTS.md](ACADEMIC-PROFILE-AND-ALERTS.md) |
| `/api/v1/collection-items` | `GET`, `PUT`, `DELETE` | yes | [PERSONAL-COLLECTIONS.md](PERSONAL-COLLECTIONS.md) |
| `/api/v1/collections` | `GET`, `POST`, `DELETE` | yes | [PERSONAL-COLLECTIONS.md](PERSONAL-COLLECTIONS.md) |
| `/api/v1/developer-seed` | `GET` | yes | [DEVELOPER-SEED-PROTOCOL.md](DEVELOPER-SEED-PROTOCOL.md) |
| `/api/v1/feed-feedback` | `PUT` | yes | [FEED-RANKING-ARCHITECTURE.md](FEED-RANKING-ARCHITECTURE.md) |
| `/api/v1/guardian-consents` | `GET`, `POST`, `PUT`, `DELETE` | yes | [AUDIENCE-SAFETY.md](AUDIENCE-SAFETY.md) |
| `/api/v1/health` | `GET` | yes | [SECURITY-BASELINE.md](SECURITY-BASELINE.md) |
| `/api/v1/integrations` | `GET`, `POST` | yes | [CODE-COLLABORATION-BOUNDARY.md](CODE-COLLABORATION-BOUNDARY.md) |
| `/api/v1/local-insights` | `GET` | yes | [AUDIENCE-SAFETY.md](AUDIENCE-SAFETY.md) |
| `/api/v1/media-links` | `GET`, `POST` | yes | [VIDEO-INTEGRATION-BOUNDARY.md](VIDEO-INTEGRATION-BOUNDARY.md) |
| `/api/v1/media-webhook-events` | `GET` | yes | [VIDEO-INTEGRATION-BOUNDARY.md](VIDEO-INTEGRATION-BOUNDARY.md) |
| `/api/v1/onboarding` | `POST` | yes | [AUDIENCE-SAFETY.md](AUDIENCE-SAFETY.md) |
| `/api/v1/openapi.json` | `GET` | yes | [API-VERSIONING.md](API-VERSIONING.md) |
| `/api/v1/orcid-guidance` | `GET` | yes | [AUTHOR-IDENTIFIERS.md](AUTHOR-IDENTIFIERS.md) |
| `/api/v1/payments/paypal/order` | `GET`, `POST` | yes | [PAYMENT-ARCHITECTURE.md](PAYMENT-ARCHITECTURE.md) |
| `/api/v1/payments/paypal/return` | `GET` | yes | [PAYMENT-ARCHITECTURE.md](PAYMENT-ARCHITECTURE.md) |
| `/api/v1/profile-media` | `GET`, `POST` | yes | [PROFILE-MEDIA.md](PROFILE-MEDIA.md) |
| `/api/v1/profile-preferences` | `GET`, `PUT` | yes | [PROFILE-MEDIA.md](PROFILE-MEDIA.md) |
| `/api/v1/profile-sections` | `GET`, `POST`, `PUT`, `DELETE` | yes | [ACADEMIC-PROFILE-AND-ALERTS.md](ACADEMIC-PROFILE-AND-ALERTS.md) |
| `/api/v1/provider-capabilities` | `GET` | yes | [WEBAUTH-AND-SCHOLAR-DISCOVERY.md](WEBAUTH-AND-SCHOLAR-DISCOVERY.md) |
| `/api/v1/provider-consents` | `GET`, `PUT`, `DELETE` | yes | [WEBAUTH-AND-SCHOLAR-DISCOVERY.md](WEBAUTH-AND-SCHOLAR-DISCOVERY.md) |
| `/api/v1/provenance/verify` | `GET`, `POST` | yes | [PROVENANCE-VERIFICATION.md](PROVENANCE-VERIFICATION.md) |
| `/api/v1/public-profiles/{publicId}` | `GET` | yes | [AUTHOR-FOLLOWING-BOUNDARY.md](AUTHOR-FOLLOWING-BOUNDARY.md) |
| `/api/v1/publication-interactions` | `GET`, `POST`, `DELETE` | yes | [PUBLICATION-SAFETY-BOUNDARY.md](PUBLICATION-SAFETY-BOUNDARY.md) |
| `/api/v1/publication-moderation` | `GET` | yes | [PUBLICATION-SAFETY-BOUNDARY.md](PUBLICATION-SAFETY-BOUNDARY.md) |
| `/api/v1/publication-relationships` | `GET`, `POST` | yes | [PUBLICATION-RELATIONSHIPS.md](PUBLICATION-RELATIONSHIPS.md) |
| `/api/v1/publications` | `GET`, `POST` | yes | [PUBLICATION-FORMATS.md](PUBLICATION-FORMATS.md) |
| `/api/v1/publications/{publicationId}/versions` | `GET`, `POST` | yes | [PUBLICATION-VERSIONING.md](PUBLICATION-VERSIONING.md) |
| `/api/v1/quantech-render-request` | `GET`, `POST` | yes | [MEDIA-PRODUCTION-INTEGRATION.md](MEDIA-PRODUCTION-INTEGRATION.md) |
| `/api/v1/quanthor-formalization` | `GET`, `POST` | yes | [PUBLICATION-FORMATS.md](PUBLICATION-FORMATS.md) |
| `/api/v1/ranking-preferences` | `GET`, `PUT` | yes | [FEED-RANKING-ARCHITECTURE.md](FEED-RANKING-ARCHITECTURE.md) |
| `/api/v1/repository-links` | `GET`, `POST` | yes | [CODE-COLLABORATION-BOUNDARY.md](CODE-COLLABORATION-BOUNDARY.md) |
| `/api/v1/search` | `GET` | yes | [RESEARCH-SEARCH-BOUNDARY.md](RESEARCH-SEARCH-BOUNDARY.md) |
| `/api/v1/search-alerts` | `GET`, `POST`, `DELETE` | yes | [ACADEMIC-PROFILE-AND-ALERTS.md](ACADEMIC-PROFILE-AND-ALERTS.md) |
| `/api/v1/scholar-indexing-status` | `GET` | yes | [WEBAUTH-AND-SCHOLAR-DISCOVERY.md](WEBAUTH-AND-SCHOLAR-DISCOVERY.md) |
| `/api/v1/topic-follows` | `GET`, `PUT`, `DELETE` | yes | [FEED-RANKING-ARCHITECTURE.md](FEED-RANKING-ARCHITECTURE.md) |
| `/api/v1/user-follows` | `GET`, `PUT`, `DELETE` | yes | [AUTHOR-FOLLOWING-BOUNDARY.md](AUTHOR-FOLLOWING-BOUNDARY.md) |
| `/api/v1/verified-subscription` | `GET`, `POST` | yes | [PAYMENT-ARCHITECTURE.md](PAYMENT-ARCHITECTURE.md) |
| `/api/v1/video-production-plan` | `POST` | yes | [MEDIA-PRODUCTION-INTEGRATION.md](MEDIA-PRODUCTION-INTEGRATION.md) |
| `/api/v1/webauth-handoff-requests` | `GET`, `POST` | yes | [WEBAUTH-AND-SCHOLAR-DISCOVERY.md](WEBAUTH-AND-SCHOLAR-DISCOVERY.md) |
| `/api/v1/webhooks/paypal` | `POST` | yes | [PAYMENT-ARCHITECTURE.md](PAYMENT-ARCHITECTURE.md) |
| `/api/v1/webhooks/youtube` | `GET`, `POST` | yes | [VIDEO-INTEGRATION-BOUNDARY.md](VIDEO-INTEGRATION-BOUNDARY.md) |

## Excluded auth routes

These routes are intentionally not represented as canonical product resources in OpenAPI:

- `/api/auth/github/callback`
- `/api/auth/github/start`
- `/api/auth/google/callback`
- `/api/auth/google/signout`
- `/api/auth/google/start`
- `/api/auth/paypal/callback`
- `/api/auth/paypal/start`
- `/api/auth/signout`

## Enforcement

The rendered contract suite includes automated checks that every non-auth route under `apps/web/app/api` is present in the OpenAPI contract and that its exported HTTP methods match the documented methods. A missing path or mismatched method set is a test failure.
