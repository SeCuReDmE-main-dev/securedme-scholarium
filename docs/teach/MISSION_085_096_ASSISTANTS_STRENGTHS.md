# Missions 085-096 - Assistants Et Miroir Des Forces

Generated: 2026-07-15T19:36:17.4510197Z

Gate G8 is passed on synthetic education data. Learner, teacher and
administrative assistants cooperate through explicit projections while the
learner's private graph and raw answers remain isolated. The strength mirror
produces contestable learning hypotheses, not diagnoses or fixed labels.

## Activated tranche

- Architecture: RagGgE Architectural Integrity Design
- Contracts: RagGgE Interface and Contract Validation
- Risk: RagGgE Technical Risk Assessment
- Classification: Synthia Session
- Plugin surfaces: SecuredMe Education Controller, Synthia Adapter, central
  memory boundary and local FfeD/Gate5 adapter boundary

## Action evidence

| Action | Direct evidence | Result |
| --- | --- | --- |
| 085 | Existing AlgoQuest outbox and idempotency tests | The durable, versioned outbox remains the only AlgoQuest delivery path. |
| 086 | Learner assistant graph service and API | Each learner receives an owner-only graph record with create, read and delete operations. |
| 087 | Teacher projection contract and API | Teachers receive bounded learning summaries without private graph records or raw answers. |
| 088 | Administrative projection contract and API | Administrators receive authorized aggregates only; cohorts below ten are suppressed. |
| 089 | Assistant exchange envelope | Purpose, consent, course relationship, seven-day expiry, idempotency and receipt are enforced. |
| 090 | Weekly objective contract, table and API | Objectives validate the school year, target date and learner ownership. |
| 091 | Intervention preference contract, table and API | Frequency, contexts, quiet hours and silence are user-controlled; `off` implies zero interventions. |
| 092 | Strength source kinds | Declared, observed and proposed strengths are recorded; observed and proposed items await learner review. |
| 093 | Strength evidence model | Evidence, contradiction, confidence, age, expiry and learner correction are retained. |
| 094 | Soccer-to-mathematics bridge | Spatial success proposes a bounded learning experiment and never claims proof of a fixed intelligence. |
| 095 | Learner strength controls | Accept, reformulate, contest, expire and delete are implemented. |
| 096 | Contract tests for assistant language | Diagnostic labels, automatic flattery and forced positivity are rejected. |

## Runtime proof

- `npm test`: production build passed; 68 tests passed and none failed.
- Focused Teach contract suite: 18 tests passed.
- `npm run lint`: zero errors; 30 existing warnings remain.
- `git diff --check`: passed with line-ending notices only.
- Six new signed-out API probes returned `401`.
- OpenAPI 3.1 exposes the six new canonical paths.

## Persistence proof

An in-memory SQLite migration probe created 19 Teach-domain tables, including
the four assistant, objective and intervention tables. It confirmed the
`learner_correction` column, inserted one graph, one exchange and one weekly
objective, and rejected a duplicate exchange idempotency key.

## Synthia proof

The live Synthia education classifier returned zero admitted terms for the G8
term set and performed no promotion. The product therefore relies on explicit
versioned contracts and does not claim autonomous taxonomy authority. The
preserved classification hierarchy is:

`I -> I_system^S -> H_lex -> G_lex -> I_lexicon`

## Evidence integrity

Machine-readable evidence:
`docs/teach/evidence/mission-085-096-assistants-strengths.json`

SHA-256:
`897A80EA39682F5E57214B266C77ED81045F7AC6740ED4C7A2A05F8B37A33EC0`

## Interpretation boundary

All validation used synthetic education data. No autonomous teaching,
clinical, disciplinary or administrative authority is claimed. Human review,
learner correction and the existing EFVP gate remain mandatory before a real
school pilot.
