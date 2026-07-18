# Visual surgery deployment evidence

Status: validated live
Date: 2026-07-17
Project: `appgprj_6a51f67c975881919f3d0930b2a9e868`

## Production release

- Custom domain: `https://www.scholarium.securedme.ca`
- Sites URL: `https://securedme-scholarium.jean-sebastien.chatgpt.site`
- Saved and deployed version: 59
- Version ID: `appgprj_6a51f67c975881919f3d0930b2a9e868~appgver_1e11cb5a0fe08191b55a8762ad07bd47`
- Deployment ID: `appgdep_6a5b6ac5b67881918baec7a20929736f`
- Source commit: `2ebad0505f1b743b440fe2997e2a20f7a1102551`
- Deployment status: succeeded
- Deployment timestamp: `2026-07-18T12:00:57.080004+00:00`

The public archive contained only `dist` and `.openai/hosting.json`. It was
scanned before upload and contained no `.env`, `node_modules`, support widget,
local Windows path, or local file-scheme URL. Local Geist and Instrument Serif font
files are bundled in the release.

## Protected rollback

- Immediate rollback target: Sites version 58
- Rollback version ID: `appgprj_6a51f67c975881919f3d0930b2a9e868~appgver_cc5d88a2a64081918db1e8df6abda671`
- Versions 57 through 51 remain retained as historical recovery points.
- cPanel was not used as the application runtime and no cPanel filesystem
  mutation was required for this release.

## Domain state

- `www.scholarium.securedme.ca`: live through the existing custom-domain path.
- HTTPS validation returned `ssl_verify_result=0`.
- The cPanel operator reported complete API and SSH readiness without exposing
  secret values.
- D1 `DB` and R2 `MEDIA` remain OpenAI Sites bindings; they were not copied to
  cPanel.

## Operator readiness

- `/`: HTTP 200, no browser console errors, no horizontal overflow.
- `/app`: HTTP 200, no browser console errors, no horizontal overflow.
- `/teach`: HTTP 200, no browser console errors, no horizontal overflow.
- `/api/health`: HTTP 200.
- Desktop and 390x844 mobile checks passed in dark and light presentation.
- Base, Autism Calm, ADHD Sprint, and Deep Work changed the global page state.
- Teach student, teacher, and organization role identities were verified.

## Release rule

Version 59 remains production while all smoke gates stay green. Any future
build, HTTP, console, network, authentication, or visual smoke failure triggers
rollback to version 58 before further diagnosis.
