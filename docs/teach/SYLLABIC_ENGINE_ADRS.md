# Scholarium Teach syllabic engine decisions

Status: accepted for pre-alpha implementation.

## ADR-STE-001: D1 remains canonical

Teach attempts, checkpoints, idempotency records and decision receipts are
committed atomically in D1. The Python engine is deterministic and stateless
with respect to canonical learner progression. PostgreSQL catalogs compiled
content; TimescaleDB receives derived telemetry only.

## ADR-STE-002: deterministic decisions

The same block digest, policy digest, previous checkpoint and attempt envelope
must produce the same canonical JSON and SHA-256 decision digest. A behavioral
change requires a new policy or block version. LLM, vector, audio and external
worker outputs cannot authorize a transition.

## ADR-STE-003: immutable extension blocks

Extensions use `scholarium.teach.block-manifest.v1`. Published blocks are
content-addressed and immutable. New blocks are admitted through the registry
after schema, provenance, license, graph and reproducibility gates; arbitrary
Python imports are forbidden.

## ADR-STE-004: fail closed, degrade usefully

Engine failure prevents canonical advancement. Already fetched cards remain
available for consultation. TimescaleDB and CodeProject.AI failures never stop
the deterministic textual lesson. Audio observations are advisory and can
abstain.

## ADR-STE-006: Tiger Cloud is telemetry infrastructure only

The development TimescaleDB service `scholarium-teach-dev` is accepted as a
managed telemetry target for synthetic and derived Teach events. It may store
hypertables, compression and retention policies, and continuous aggregates for
operational observation. It is not a model host, not a learner authority, and
not evidence of alpha readiness by itself.

Education AI tooling remains limited to supervised Codex and Antigravity
workflows. MindsDB, external forecasting services and other model runtimes are
out of scope for Scholarium Teach unless a later reviewed ADR explicitly admits
them.

## ADR-STE-005: voice boundary

Voice is personal data. Audio is processed in bounded memory, is never written
to D1, R2, logs or TimescaleDB, and cannot change mastery. Pre-alpha permits
synthetic fixtures and explicitly consenting adults only. Real-minor use stays
disabled until the EFVP and qualified Quebec and France/EU reviews are signed.

## Scope lock

Only this repository and its Scholarium Teach domain may change. No sibling
Education repository, learner dataset or central secret file is part of this
program.
