# Scholarium Backup And Recovery Runbook

Status: pre-alpha local and deployment preparation. Real learner data remains prohibited before EFVP and legal validation.

## Local Backup

Run `scripts/teach/Backup-ScholariumLocal.ps1`. The script creates a consistent SQLite snapshot under `Desktop\Private\ScholariumBackups`, verifies it with `PRAGMA quick_check`, records a SHA-256 manifest, and retains the seven newest backup directories by default.

Backups are private recovery material. They are excluded from Git, Datadog, plugin payloads, browser tunnels and public documentation.

## Restore Rehearsal

Run `scripts/teach/Test-ScholariumRestore.ps1 -BackupDirectory <private-path>`. The rehearsal verifies the manifest hash, restores into a new isolated SQLite file, runs `quick_check`, and compares the application-table count. It never overwrites the active local or remote database.

## Deletion And Retention

- Rotation accepts only directories below the configured private backup root.
- Retention deletion uses resolved literal paths and refuses path escape.
- A legal hold overrides rotation and must be recorded outside the application payload.
- Production deletion must include D1 records, R2 objects, derived indexes, queued jobs, backup-expiry scheduling and a completion receipt without learner content.

## Secret Rotation

Rotate provider secrets in their managed secret stores, not in backups. Order: create replacement, deploy dual-read where supported, verify, revoke old credential, test failure behavior, and record only key identifiers and timestamps. Never place key material in Datadog, Git, cPanel command arguments or evidence files.

## Incident Recovery

1. Stop affected writes and isolate the failing adapter.
2. Preserve technical evidence without learner content.
3. Verify the selected backup hash and retention status.
4. Restore into an isolated target and run schema, migration, integrity and smoke checks.
5. Obtain the required human authorization before replacing an active database.
6. Reconcile queued jobs and revoke stale signed envelopes.
7. Resume traffic gradually and monitor availability, latency, queue depth and error rate.
8. Record recovery time, data-loss window and residual limits.

Remote Cloudflare D1 and R2 backup commands remain deployment-gated until the real account and EFVP-approved data boundary are selected.
