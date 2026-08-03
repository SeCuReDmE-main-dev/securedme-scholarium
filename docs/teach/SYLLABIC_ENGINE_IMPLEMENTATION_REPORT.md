# Scholarium Teach syllabic engine surgery

## Delivered in the repository

- Deterministic Python decision core with canonical JSON, SHA-256 receipts, replay, strict Pydantic contracts and immutable block registry.
- First compiled `castellano-latam-neutral@1.0.0` pack following syllable, sound, composition, reading and writing.
- D1 migration and Drizzle schema for canonical sessions, idempotent attempts, immutable receipts and derived outbox events.
- HMAC-authenticated TypeScript client with timeout and circuit breaker.
- Canonical API routes for session, card, attempt, progress and adult-consented ephemeral audio.
- A syllable-first Teach surface with peripheral syllables, composition controls, sound playback and active-plus-two card loading.
- PostgreSQL content-catalog SQL, optional Timescale telemetry SQL and an observation-only CodeProject.AI adapter manifest.
- OpenAPI documentation, ADRs, traceability and a separate surgery execution state that does not rewind the historical 163-action program.

## Verification evidence

- Python deterministic engine: 32 tests passed with `PYTHONPATH=services/teach-engine/src` under Python 3.13. The root `.venv` remains Python 3.10.11 and is not the engine proof runtime.
- Teach engine web contracts: 9 tests passed with Node test.
- Settings contract: valid, with 17 declared settings and 9 compose/deployment references verified.
- D1 local proof: passed in the private Linux Multipass harness with synthetic identity only. Windows `workerd` on the `Z:` volume is not the accepted proof runtime.
- Vinext production build: passed and includes the `/api/teach/engine/*` routes.
- ESLint: completed with no errors after the test variable rename; sixteen existing warnings remain.
- GitHub Pages public documentation routes: reachable with HTTP 200 during the closure check.
- `git diff --check`: passed, with line-ending warnings only.
- Pack reproducibility: two compilations produced `sha256:d95b28a584aa13f608eaed1262a7e6d6f24ae573163cf98855a1fe761ff8b26d`.
- OCI image: built from the verified Python 3.12.11 digest and ran as the unprivileged `engine` user.
- Runtime health: loaded `castellano-latam-neutral@1.0.0` with the expected digest and confirmed that no canonical learner state is stored.
- Runtime HMAC: accepted a signed decision and deterministically advanced the synthetic checkpoint to `sound-ma-series`.
- Runtime audio: observed a synthetic adult-consented WAV without retention or mastery authority; the same signal under a minor profile returned `minor_pilot_blocked`.

## Gates still open

- Route-level Teach proof still requires a Linux-compatible test identity adapter. The current D1 proof validates migrations and transaction guards, not the full production route path.
- The required alpha secrets are not yet created through Settings Operator, so the private compose stack remains intentionally stopped.
- No HTTPS private ingress is active.
- No backup/restore drill has passed.
- CodeProject.AI live API contract has not been verified and remains disabled.
- TimescaleDB/PostgreSQL runtime services are not accepted as alpha evidence yet; they remain catalog/telemetry infrastructure to prove, not pedagogical authority.
- Full Playwright accessibility/device gate remains open.
- Real-minor audio and pilot use remain prohibited pending qualified EFVP, Loi 25 and France/EU reviews.

The implementation is closed as pre-alpha evidence and blocked for alpha. The repository now contains the bounded architecture and a testable first layer; it is not yet an authorized production pilot.
