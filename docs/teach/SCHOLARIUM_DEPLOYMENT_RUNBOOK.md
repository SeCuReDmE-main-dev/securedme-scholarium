# Scholarium deployment runbook

Status: pre-alpha deployment preparation. This runbook does not authorize real
learner data or claim production readiness.

## Deployment ownership

| Surface | Owner | Allowed content | Prohibited content |
| --- | --- | --- | --- |
| Sites / Cloudflare | Scholarium web application | Vinext bundle, D1 binding `DB`, R2 binding `MEDIA`, managed runtime variables | local `.env`, private keys, research runtimes |
| cPanel | domain and compatibility edge | DNS, redirects, static documentation, bounded static artifacts, compatible reverse proxy | D1/R2 data, central environment, worker vaults, raw learner data |
| Gate5 private gateway | internal execution boundary | pseudonymous jobs, expiring manifests, receipts and technical status | public browser access, copied OAuth secrets |
| Private workers | bounded specialist execution | Synthia, memory, HippoRAG retrieval, FNP-QNN, media and Tenebris adapters | Cloudflare bundle imports, cPanel public execution |

Scholarium communicates with private engines through versioned Gate5 contracts.
It does not import their runtimes into the web bundle.

## Domain transition

The SecuredMe Education registry defines `scholarium.securedme.ca` as the
official domain. Current Sites evidence shows:

- `www.scholarium.securedme.ca`: active, SSL active, current public origin;
- `scholarium.securedme.ca`: pending provider validation and pending SSL.

Until the non-`www` hostname becomes active, the valid `www` hostname remains
the operational canonical origin. Do not redirect traffic to a hostname whose
certificate is pending. After the non-`www` hostname is active:

1. validate HTTPS and the application health route on both hosts;
2. update OAuth callback allowlists and application canonical metadata in one
   reviewed change;
3. make `scholarium.securedme.ca` canonical;
4. apply a permanent redirect from `www` to the canonical host;
5. verify authentication, media, sitemap and API routes after the redirect;
6. retain the previous Sites version for immediate rollback.

No DNS, redirect or certificate mutation is performed by this preparation
pass.

## Sites and Cloudflare release

The existing Sites project is recorded in
`apps/web/.openai/hosting.json`. The file contains only its opaque project id
and logical bindings:

- D1: `DB`;
- R2: `MEDIA`.

Runtime values belong in the Sites environment manager. The repository may
contain variable names in `.env.example`, but never values. Release order:

1. pass secret scan, lint, build, tests, migrations and OpenAPI checks;
2. create atomic commits and push the exact validated source;
3. package the pushed commit with the Sites hosting metadata and migrations;
4. save one Sites version tied to that commit;
5. deploy only that saved version;
6. poll deployment status and run health, authentication and visual smoke
   checks;
7. roll back to the prior saved version if any gate fails.

The currently deployed baseline is Sites version 53, commit
`f3fbcc8fdc3a3cdce5ed56eaa2dc51f0050323d0`. Versions 52 and 51 remain
available as historical rollback points. This runbook does not assert that
their data schemas are forward-compatible; a database rollback requires a
separate migration assessment.

## cPanel paths

| Purpose | Proposed cPanel path or behavior |
| --- | --- |
| Canonical domain | preserve the existing `scholarium.securedme.ca` domain record |
| Temporary public origin | keep `www.scholarium.securedme.ca` on Sites while apex SSL is pending |
| Redirect | apply only after both hosts are HTTPS-valid and OAuth callbacks are updated |
| Documentation | publish static, non-sensitive documentation under the Education suite path |
| Static artifacts | permit reviewed public assets only; reject databases, backups and `.env` files |
| Proxy | allow only a bounded HTTPS proxy with explicit upstream, timeout and header policy |

The cPanel operator remains dry-run for this pass. SSH and API credentials are
read from the central environment by the operator and are never copied into
commands, reports or repository files.

## Private worker boundary

- Gate5 accepts versioned, consent-bound, pseudonymous requests.
- Private workers are not discoverable through cPanel static paths.
- Tenebris remains a private adapter. Datadog may receive purge duration,
  technical status, violation counters and policy version only.
- Datadog receives no learner content, raw answer, voice signal, token, key,
  private receipt or graph record.
- Worker failure must be explicit and recoverable; the web application must not
  silently substitute an unvalidated local engine.

## Rollback and incident order

1. stop publication and new private-worker jobs;
2. preserve technical evidence without learner payloads;
3. roll back the Sites version when the web bundle is at fault;
4. isolate the worker when a private adapter is at fault;
5. verify D1/R2 compatibility before any data restore;
6. rotate a compromised credential through its managed provider;
7. record the incident, recovery proof and residual limitation.

