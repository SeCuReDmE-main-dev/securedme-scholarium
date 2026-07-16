# Mission 157-161: operations and deployment preparation

Date: 2026-07-15

## Result

| Action | Status | Direct evidence |
| --- | --- | --- |
| 157 | blocked | `code tunnel status` reports no tunnel and no installed service. Authentication is required; no unauthenticated tunnel was started. |
| 158 | completed | Scholarium `/api/health` returned `ok`; three technical DogStatsD metrics reached the healthy local Datadog Agent on loopback UDP; the sender reports `ContainsUserData=false`. |
| 159 | completed | A fresh local synthetic D1 snapshot passed `quick_check`; its SHA-256 was verified during an isolated restore; 76 application tables matched and production was not overwritten. |
| 160 | completed | cPanel health, secret-safe environment audit, domain inventory and dry-run deployment plan were read successfully; no live cPanel write occurred. |
| 161 | completed | Existing Sites project, saved versions, custom-domain state, D1/R2 logical bindings and the private-worker separation were recorded in the deployment runbook. No deployment occurred. |

## Operational corrections

- The visible per-minute PowerShell scheduled task remains disabled and must not
  be re-enabled in an interactive session.
- Datadog emission is explicit and technical-only.
- The tunnel is human administrator access, not mesh or production transport.
- Authentication failure is a visible blocker, not a reason to weaken tunnel
  access.

## Residual blockers

- Action 157 requires an interactive VS Code authentication ceremony.
- The non-`www` custom hostname remains pending SSL validation.
- The public site remains Sites version 53 until the exact validated G14 source
  is committed, pushed, saved as a new Sites version and deployed.
- Real learner data remains prohibited pending the EFVP and legal gate.

