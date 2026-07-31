# School safety HITL contract (issue #5)

Status: implemented behind closed pre-alpha gates on 2026-07-31.

This contract implements the local, human-in-the-loop school-safety workflow
without enabling real learner data or external Datadog writes. The youth legal
review and a live Datadog validation remain release gates. Until both are
approved, no production organization may activate a school-safety policy.

## Authority boundary

| Actor | Create | Read | Triage or assign | Resolve or close | Appeal |
| --- | --- | --- | --- | --- | --- |
| Student with an active organization role | Yes | Own cases only | No | No | Own resolved case |
| Teacher with an active organization role | Yes | Own cases only | No | No | Own resolved case |
| Authorized administrator | No reporter privilege implied | Cases in active assigned tenants | Yes | Yes | Review only when independent |
| Datadog | No | Redacted metadata only | No | No | No |
| AI or agent | No authority | No raw evidence | No | No | No |

Revoking the active school assignment removes reporter or administrator access.
A historical role stored on a case never grants current access.

## State contract

Normal states are ordered as:

`received -> triaged -> assigned -> under_review -> action_pending -> resolved -> appealed -> closed`

Exceptional states are `urgent_escalation`, `insufficient_information`,
`duplicate`, `withdrawn`, and `telemetry_degraded`. The explicit transition
matrix in `apps/web/lib/teach-safety-case-contracts.ts` denies every transition
that is not listed. `telemetry_degraded` is also represented on the independent
telemetry axis so an external outage cannot block the local case workflow.

Teachers and students cannot adjudicate. A reporter may only withdraw their own
eligible case or appeal their own resolved case. An appeal cannot be reviewed
by its appellant or by the administrator who resolved the case.

## Storage and integrity

Migration `0035_teach_school_safety_cases.sql` creates seven D1 tables:

- versioned, inactive-by-default synthetic school policies;
- private evidence records;
- organization-scoped cases that reference evidence by opaque identifier;
- assignment history;
- append-only transition events;
- appeals;
- a redacted Datadog outbox.

Event update and deletion are rejected by D1 triggers. Event sequences,
idempotency keys, active policies, pending appeals, source reports, and evidence
references have database uniqueness constraints. Each transition is
optimistically versioned and linked to the previous event hash.

The evidence body remains in the private Scholarium D1 surface. Reporter API
projections omit event hashes, administrative reason codes, owner details, and
raw evidence. Administrative APIs still never return the raw evidence body.

The policy timings and retention values in this pre-alpha schema are synthetic
test defaults, not legal requirements.

## API and interface

Canonical endpoints:

- `POST/GET /api/v1/teach/safety-cases`
- `GET /api/v1/teach/safety-cases/{caseId}`
- `POST /api/v1/teach/safety-cases/{caseId}/transitions`
- `POST /api/v1/teach/safety-cases/{caseId}/appeals`
- `POST /api/v1/teach/safety-cases/reconcile`

Existing community reports remain compatible. They create a linked HITL case
only when an organization is explicitly supplied, the reporter has an active
school role, an active synthetic policy exists, and the feature gate is open.

The Teach `Aide` tab provides an accessible private report form, age-adapted
tracking, an organization-scoped administrative queue, a transition view, and
the appeal flow. With the gate closed it displays an explicit pre-alpha message
and sends no case content elsewhere.

## Datadog boundary

Datadog synchronization is disabled unless all of these are true:

1. `SCHOLARIUM_SAFETY_CASES_ENABLED=true`;
2. `DATADOG_CASE_SYNC_ENABLED=true`;
3. `SCHOLARIUM_SAFETY_EXTERNAL_WRITE_APPROVED=APPLY:DATADOG_CASES`;
4. the remaining Datadog identifiers and credentials are present at runtime;
5. an authorized tenant administrator repeats the same confirmation on the
   bounded reconciliation route.

Only opaque case and tenant references, normalized category and proposed
severity, state, timestamps, service, environment, policy version, and a
normalized outcome may leave Scholarium. No identity, report text, evidence,
private conversation, diagnosis, individual score, or automated accusation is
included.

The outbox is independent of the local case transaction. Delivery has bounded
timeouts, retries, exponential backoff, a degraded telemetry indicator, and a
deterministic title search before create so an ambiguous retry can reconcile an
existing Datadog case rather than create a duplicate. Live behavior still
requires its separate external validation gate.

## Validation record

Validated on Windows with Node.js `24.18.1`, npm `11.16.0`, and the workspace
Python `3.10.11`:

- production build: pass;
- complete Node test suite: 136 passed, 0 failed;
- ESLint: 0 errors, 17 pre-existing warnings;
- `npm audit`: 0 known vulnerabilities;
- migration replay: 36 migrations, 7 required tables, 2 append-only triggers,
  legacy report preserved, integrity `ok`;
- local HTTP smoke: `/`, `/teach`, and `/api/v1/health` return 200;
- closed-gate smoke: `/api/v1/teach/safety-cases` returns 503 with
  `SCHOOL_SAFETY_CASES_DISABLED`;
- Settings Operator: 263 assignments, 263 unique keys, no duplicate; both
  feature flags are explicitly `false`, external approval and Datadog case
  identifiers are empty, and `DD_APP_KEY` is classified as a secret in the
  corrected canonical plugin source;
- Datadog tests use simulated transports only; no live mutative request was
  issued;
- no cPanel mutation and no Synthia moderation path were used.

## Release gates that remain open

- youth legal review for jurisdiction, notification, retention, evidence, and
  real-minor-data rules;
- live Datadog Case Management validation using approved synthetic data and a
  separately confirmed write window.

Issue #5 must remain open until both gates have recorded approval and evidence.
