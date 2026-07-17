# Visual surgery risk register

| Risk | Severity | Control | Gate |
| --- | --- | --- | --- |
| API regression during client decomposition | Critical | Preserve fetch paths, payloads, and tests | G5 |
| Cross-role data exposure | Critical | Server permission tests and negative cases | G7/G8 |
| Re-identification in organization views | Critical | Cohort threshold 10 and aggregate-only UI | G8 |
| Parallel Scholarium work overwritten | High | Branch isolation, targeted patches, diff review | G1/G9 |
| Stitch mock presented as live capability | High | Product truth registry and claim review | G2/G4 |
| Theme or Access controls affect only their panel | High | Root `data-theme` and `data-access` selectors | G3/G9 |
| Mobile overlap or inaccessible controls | High | Desktop/tablet/mobile Playwright and keyboard QA | G3/G9 |
| Secrets or local paths packaged | Critical | Secret scan and package manifest | G9 |
| cPanel deployment without rollback | Critical | Backup before mutation and live probes | G9 |
| External Loi 25 review misrepresented | Critical | Preserve Teach action 048 as blocked | All |
| Tunnel authorization misrepresented | Medium | Preserve Teach action 157 as blocked | All |

Any critical permission, privacy, build, responsive, or secret failure blocks deployment.
