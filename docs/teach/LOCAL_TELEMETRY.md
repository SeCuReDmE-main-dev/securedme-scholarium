# Local technical telemetry and private safety cases

Datadog is no longer an active school-safety transport. Scholarium owns the
private case records, evidence references, role and organization checks,
append-only decisions, assignment and independent appeal review. A collector
does not decide cases or replace this history.

The server exports bounded OTLP/HTTP JSON counters only: `service.name`, a
closed environment label, one of `create`, `transition`, `appeal`, and a count.
It excludes case IDs, tenant references, categories, severity, case state,
report text, identities, prompts, diagnoses and private evidence. This is
server technical telemetry, separate from consented public PostHog events.

Telemetry is off by default. The configured endpoint must be a literal
loopback address on port 4318 with `/v1/metrics`, without credentials, query or
redirects. The collector must share the server's runtime/network namespace.
A local laptop collector is not reachable through a Cloudflare Worker;
hosted Workers retain disabled telemetry until an approved deployment topology
supports a local collector. No collector has been activated in production.

`SCHOLARIUM_SAFETY_CASES_ENABLED` remains a separate, fail-closed product gate.
Synthetic policies, institutional rules, legal review and youth conditions
still apply. A collector failure degrades `telemetryStatus` and schedules a
bounded retry; it does not change the case state, evidence or human decision.
Reconciliation needs a signed-in administrator in the case organization and
the explicit `APPLY:LOCAL_TELEMETRY` confirmation. It processes at most ten
rows, with a compare-and-swap delivery lease and eight attempts. Counters can
be duplicated after an ambiguous delivery/crash, so they are technical
observability and never a definitive count of legal or school decisions.

Migration `0038_teach_safety_request_binding.sql` adds a nullable private
request digest to the delivery journal. It does not delete historical cases,
append-only events or legacy external references. New requests bind the exact
normalized input to an organization-scoped key; changed retries are refused.
Legacy retries without a digest need review. Legacy case-oriented telemetry
payloads are never sent by the new exporter. This migration is prepared only;
applying it to a real database needs the deployment and backup procedure.

Validation: the Node tests exercise the actual case service against SQLite
through D1's prepared-statement and atomic-batch interface. They cover private
organization visibility, exact/changed retries, appeal repetition, independent
reviewers, immutable events, outage handling and rejection of legacy payloads.
The transport tests use synthetic collectors. They do not certify institution,
legal, child-protection or production readiness.

See the [OTLP specification](https://opentelemetry.io/docs/specs/otlp/) for the
JSON transport and partial-success response.
