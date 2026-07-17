# Visual surgery deployment evidence

Status: pre-deployment
Date: 2026-07-16
Project: `appgprj_6a51f67c975881919f3d0930b2a9e868`

## Protected baseline

- Current live URL: `https://www.scholarium.securedme.ca`
- Current saved/live baseline: Sites version 55
- Baseline source commit: `5303fb543c5f9e8b6085de8037e67e5e953e7f93`
- Immediate secondary rollback: Sites version 54
- Historical rollback versions retained: 53, 52, 51
- The Teach public-route fix represented by version 55 is present in the
  GitHub baseline through commit `d3ee815`.

## Domain state

- `www.scholarium.securedme.ca`: active, provider active, SSL active.
- `scholarium.securedme.ca`: pending provider validation and SSL validation.
- No redirect or DNS mutation is authorized while the apex hostname remains
  pending.

## Operator readiness

- Central environment exists and has all required cPanel fields.
- cPanel API and SSH access are available without exposing credential values.
- The cPanel inventory contains `scholarium.securedme.ca`.
- D1 `DB` and R2 `MEDIA` remain Sites bindings; they are not copied to cPanel.

## Release rule

The exact validated branch commit must be pushed before it is saved as a Sites
version. Production deployment may target only that saved version. If any
build, HTTP, console, network, authentication, or visual smoke gate fails,
version 55 is the immediate rollback target.
