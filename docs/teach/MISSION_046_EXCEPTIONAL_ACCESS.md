# Mission 046 - Exceptional access under dual control

Date: 2026-07-15 (America/Toronto)

## Contract

Exceptional access is a bounded support mechanism, not a surveillance route.
An active administrator may request access only for a learner enrolled in the
same organization. The request requires a supported scope, an incident
reference, a justification of at least 40 characters, and an expiry between
five minutes and four hours.

The requester and learner cannot approve the request. Two distinct active
administrators in the same organization must independently approve it. Any
denial closes the request. An approved request can be consumed exactly once.

## Returned data

- `learning_support_summary`: bounded pedagogical summary without answers.
- `privacy_request_support`: record counts without content.
- `security_incident_metadata`: record counts without content.

The route never returns a private assistant graph or raw learner answers.

## Audit and lifecycle

Every request, approval, denial, and use writes a SHA-256 digest event. Account
export includes requests concerning the account plus decisions and digest-only
events. Security audit records follow the documented legal retention schedule
instead of being silently removed by Teach-domain deletion.

## Validation

- Contract and static integration tests: `4/4` passed.
- Vinext production build: passed; both exceptional-access routes included.
- D1 rehearsal from zero: `35/35` migrations applied.
- SQLite `PRAGMA quick_check`: `ok`.
- Application tables: 78.
- New tables: request, approval, audit event.
- Unique `(request_id, approver_user_id)` index: present.

Human review remains mandatory. This mechanism does not authorize grading,
discipline, diagnosis, hidden monitoring, or access outside the organization.
