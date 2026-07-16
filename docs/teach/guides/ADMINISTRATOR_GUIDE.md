# Scholarium Teach - Administrator Guide

**Edition:** Public pre-alpha 2026.07
**Governance boundary:** No real learner data before the EFVP, legal review, and an explicitly authorized pilot.

## Administrative Responsibility

The administrator configures organization relationships, approved roles, consent operations, retention, aggregate reporting, source partitions, worker boundaries, incident readiness, and evidence of control. Administrative access is not a shortcut into the learner's private graph.

## Identity And Organization Setup

Reuse the existing Scholarium identity. Do not create a parallel Teach user database. Configure learner, teacher, guardian, administrator, school, and commission roles through dated, revocable relationships.

Confirm tenant scope at every access boundary. Teacher access requires a current course relationship. Administrative analytics require an authorized organization scope and aggregation thresholds.

## Consent And Minor Accounts

Maintain separate receipts for learning, personalization, profiling, sharing, and media. Each receipt must preserve purpose, grant or revocation state, actor, time, and applicable guardian responsibility.

The minor-account workflow must reflect the applicable Québec rule and any additional pilot jurisdiction. Legal interpretation belongs to the designated privacy and legal leads, not to an assistant.

## EFVP Pilot Gate

The pilot remains closed until the dossier names a privacy lead and records an approved data-flow map, legal basis by purpose, minor-consent analysis, retention schedule, processor inventory, cross-border assessment, incident procedure, deletion test, re-identification test, and signed residual-risk decision.

Demonstration environments use synthetic data only. A completed engineering document is not legal approval.

## Data Lifecycle Operations

Keep facts, observations, algorithmic hypotheses, recommendations, and human decisions distinct. Configure retention by record purpose and lifecycle. Provide tested access, correction, export, withdrawal, and Teach-domain deletion.

Exceptional access requires two authorized approvals, a narrow purpose, short expiry, and an immutable receipt. It must never become a standing support role.

## Aggregation And Analytics

Administrative assistants receive organization-authorized aggregates only. The minimum cohort is ten learners, and anti-reconstruction checks apply before release. Small-cohort metrics, identities, raw answers, private notes, and individual recommendations are excluded.

Monitor for reconstruction through repeated filters, time windows, cross-tabulation, or exported combinations. A single threshold is necessary but not sufficient.

## Source And Memory Governance

Synthia classifies provenance-bearing source cards. Exactly one graph partition is assigned: approved, preparation, or quarantine. MemoryLake indexes records into the declared partition. Production HippoRAG retrieval reads approved records only and uses `retrieve_dpr`; generation methods are rejected.

Plugins remain stateless. They do not own `MEMORY.md`, a hidden learner profile, a separate taxonomy, or a private long-term store. The central knowledge gateway issues the graph and memory receipt.

## Gate5 And Private Workers

The Cloudflare web bundle does not import pluginpack, FfeD, HippoRAG, FNP-QNN, QuaNTecH-ViD, or V.O.T Guardian. It submits a versioned outbox job to the internal gateway.

Gate5 validates tenant, purpose, consent receipt, schema, signature, plugin manifest, quota, expiry, nonce, revocation, and replay state before invocation. Invalid requests fail closed. Private workers run with bounded process, network, filesystem, CPU, memory, and time scopes.

## Transitional Cryptographic Level

Bouncy Castle 2.6.2 temporarily signs canonical terminal Gate5 receipt digests with Ed25519. The signer receives no learner content and stores no local key. Keys must come from a managed secret boundary.

Quasicrystal coordinates, Hilbert vectors, `D_f`, `dF`, and `i_fractal` are structural evidence only. They never enter KDF, AAD, key, vault, authentication secret, or key-rotation material. Native mechanisms remain research-gated until independently proved.

## Observability And Incident Readiness

Datadog receives technical metrics only: availability, latency, queue depth, retry, circuit state, and bounded outcome metadata. Student content, raw answers, graph records, tokens, keys, and receipts containing personal data are excluded.

Test backup, restore, rotation, revocation, deletion, retry, recovery, and incident communication. Preserve direct evidence for every claimed control.

## Deployment Separation

Deploy Scholarium web, D1, and R2 through the approved Cloudflare path. Keep private workers and their secrets outside the web bundle. cPanel can host domains, redirects, documentation, static artifacts, or a compatible proxy, but must not receive a copied central `.env` or private worker vault.

SSH and deployment credentials are read from the approved local secret source, kept out of command-line arguments and logs, and checked against a known host key.

## Go-Live Checklist

- EFVP and jurisdictional legal gates are signed.
- Synthetic-only restrictions are removed only by an explicit pilot decision.
- Role and tenant tests pass.
- Consent and guardian flows pass.
- Export, correction, withdrawal, and deletion pass.
- Aggregate anti-reconstruction tests pass.
- Gate5 tamper, replay, expiry, revocation, recovery, and concurrency tests pass.
- Secret scans and personal-data log tests pass.
- Backup and restore evidence is current.
- Accessibility paths pass automated and manual review.
- Residual risks and rollback ownership are accepted by named humans.
