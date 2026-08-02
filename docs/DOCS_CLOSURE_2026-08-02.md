# Docs Closure - 2026-08-02

## Scope

This note closes the current developer-documentation slice for the SeCuReDmE Education suite. It records the public documentation state, the native landing replacements, and the remaining approval boundary before any live domain switch.

## Native Landing Commits

| Tool | Repository | Commit | Status |
| --- | --- | --- | --- |
| FNP-QNN | `SeCuReDmE-main-dev/FNP-QNN-MVP` | `441d9ae` | Native simulator surface pushed to `main` |
| QuaNThoR | `SeCuReDmE-main-dev/QuaNThoR` | `46dd417` | Native documentation landing pushed to `main` |
| V.O.T Guardian | `SeCuReDmE-main-dev/V.O.T-Guardian` | `28780cf` | Native review surface pushed to `main` |

## QA Evidence

- Local Playwright destination QA passed for desktop and mobile on all three landing surfaces.
- Result set: 0 horizontal overflow, 0 broken images, 0 self-screenshot images, validated QuaNThoR route interaction, validated V.O.T Guardian decision interaction.
- `git diff --check` passed before commit for all three landing repositories.

## Public Documentation

- GitHub Actions run: `30718619027`
- Head SHA: `3c59642aedf68f25264b47882a3d937f9973854e`
- Conclusion: success
- Public mirror: `https://securedme-main-dev.github.io/securedme-scholarium/`

Validated public routes:

- `https://securedme-main-dev.github.io/securedme-scholarium/`
- `https://securedme-main-dev.github.io/securedme-scholarium/en/`
- `https://securedme-main-dev.github.io/securedme-scholarium/fr/`
- `https://securedme-main-dev.github.io/securedme-scholarium/es/`
- `https://securedme-main-dev.github.io/securedme-scholarium/en/prompts/index.html`
- `https://securedme-main-dev.github.io/securedme-scholarium/en/getting-started/15-minute-tutorial.html`
- `https://securedme-main-dev.github.io/securedme-scholarium/en/media/video-library.html`
- `https://securedme-main-dev.github.io/securedme-scholarium/fr/getting-started/15-minute-tutorial.html`
- `https://securedme-main-dev.github.io/securedme-scholarium/es/media/video-library.html`

## Remaining Boundary

The public GitHub Pages mirror is validated. Switching or redirecting `docs.securedme.ca` remains a live-domain operation and requires explicit human approval.
