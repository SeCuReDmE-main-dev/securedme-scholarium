# V.O.T Guardian / Tenebris - Integration Assessment

Generated: 2026-07-15

## Audited source

- Repository: `C:\Users\jeans\Desktop\V.o.T Guardian dev`
- Branch: `master`
- Commit: `6824e8d257f2564db63ac8121f9ecc3c7d0d94eb`
- Worktree at audit: clean
- Core implementation: `developpement/src/core/security/tenebris.py`
- Pipeline integration: `developpement/src/api/main.py`

The source repository was audited read-only. Scholarium must consume a future
versioned adapter and must not import V.O.T Guardian or Tenebris directly into
the Cloudflare application bundle.

## Verified evidence

- Focused Tenebris suite: `7 passed`.
- Tenebris, pipeline, API, E2B manager and Datadog suite: `32 passed` with two
  environment warnings.
- The context manager executes cleanup in `finally` and retains a violation
  state when cleanup fails.
- Tests cover successful cleanup, encryption enabled and disabled, stale
  sandbox failure, key-revocation failure and audit transport failure.

## Actual power of the mechanism

Tenebris has a strong architectural primitive: an ephemeral processing
transaction with a deterministic lifecycle:

`open -> isolate -> process -> purge sandbox -> revoke key -> clear memory -> emit receipt`

The useful mechanism is not the current voice-risk prediction. It is the
ability to make temporary processing a first-class contract whose completion,
degradation or violation can be proved and tested. For Scholarium this can
protect explicitly triggered pronunciation, audio, video, media-generation and
plugin-worker operations while retaining only user-approved educational
evidence.

## Current limits

The current repository is pre-alpha and cannot yet be treated as a production
privacy boundary:

1. `_create_isolated_sandbox` returns a placeholder identifier and
   `_destroy_e2b_sandbox` only logs; the real `E2BSandboxManager` is not used by
   the Tenebris context.
2. A Fernet key is generated and later removed, but it does not encrypt the
   audio, features, temporary files or transport.
3. The API processes audio locally, persists `call_id`, prediction, confidence
   and complete feature vectors in PostgreSQL, and defines no retention TTL or
   deletion proof for those records.
4. The audit hash is a truncated standalone SHA-256 containing a fresh local
   timestamp. It is neither a signed receipt nor a chained immutable log.
5. Datadog delivery is best-effort and its failure is swallowed. The main
   pipeline records `COMPLIANT` and a default destruction duration before the
   context has finished destruction.
6. The 100 ms limit changes a label to `DEGRADED`; it is not an enforced
   deadline or a proof of Loi 25 compliance.
7. Session identifiers use `call_id` plus second-resolution time and can
   collide under concurrent reuse of the same call identifier.
8. `auto_destroy_enabled`, `audit_trail_enabled` and the configurable compliance
   mode are not consistently enforced; Datadog tags remain hard-coded to
   `loi25`.
9. `data_destroyed` is never set to true, then successful sessions are removed,
   so the current compliance report cannot count completed purges.

These limits do not invalidate the mechanism. They define the work required
before Scholarium can trust its receipts.

## Scholarium adapter contract

Tenebris enters Scholarium only behind Gate5 and a private worker boundary.

### Request

`scholarium.ephemeral-processing-request.v1`

- pseudonymous request identifier;
- explicit purpose and operation;
- active consent receipt identifier;
- content digest and media kind, never raw content;
- maximum lifetime and policy version;
- worker capability requested;
- idempotency key and expiry.

### Receipt

`scholarium.ephemeral-processing-receipt.v1`

- request, adapter and policy versions;
- opened, completed and expired timestamps;
- actual worker or sandbox destruction receipt;
- key-revocation receipt from an independent key service;
- temporary-file and memory-cleanup outcomes;
- residual-artifact manifest;
- chained or signed audit digest;
- status `complete`, `degraded` or `violation`;
- no audio, transcript, student name, email, call identifier, model feature
  vector or provider credential.

### Education boundary

- Processing is always user-triggered and consent-bound.
- No passive listening or hidden classroom capture.
- No voice identity, biometric identity or fraud accusation is returned to a
  learner or teacher.
- Pronunciation and media feedback are review artifacts, not grades or
  disciplinary signals.
- Raw media is destroyed; only an explicitly accepted bounded learning result
  may enter Teach memory.
- A failed purge fails closed and prevents publication or durable memory
  admission.

## Mapping to actions 130+

| Action | Tenebris integration work |
| --- | --- |
| 130 | Bind each accepted ephemeral receipt digest to deterministic structural addressing; never bind raw media. |
| 131 | Keep quasicrystal geometry outside KDF, AAD, key vaults and Tenebris key material; use independent standard cryptography. |
| 132 | Test purge failure, tampering, replay, expiry, revocation, duplicate identifiers, concurrency and actual destruction latency. |
| 140 | Diagram Gate5, private worker, key service, ephemeral store, audit receipt and memory-admission boundary. |
| 146 | Validate request, receipt, error, idempotency and version contracts. |
| 148 | Prove that logs, Datadog, plugins and receipts contain no student content or voice-derived identifiers. |
| 152 | Simulate worker, sandbox, key-revocation, audit transport and memory-admission failures. |
| 153 | Add bounded retries, circuit breaker and a dead-letter proof path without retaining raw media. |
| 156 | Preserve commands, test results, residual limits and the V.O.T commit used for validation. |
| 158 | Export technical purge timings and outcome counts only; no content, call ID or feature vector. |
| 159 | Test deletion, key rotation, incident recovery and orphan temporary-artifact reconciliation. |
| 161 | Deploy the adapter as a private worker separated from Cloudflare and public cPanel surfaces. |
| 163 | Refuse final promotion while sandbox destruction, retention deletion and receipt integrity remain simulated. |

## Decision

Integration is accepted as a research-gated private adapter from action 130
onward. Direct import, automatic voice analysis, production privacy claims and
durable storage of raw voice features are rejected.
