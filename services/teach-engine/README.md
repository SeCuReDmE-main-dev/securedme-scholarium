# Scholarium Teach engine

This bounded service evaluates versioned Teach attempts. It does not own
identity, consent or canonical learner state. Scholarium sends a complete
checkpoint and receives a replayable `DecisionReceipt`.

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install -e ".[test]"
.venv\Scripts\python -m pytest
```

The initial pack is `castellano-latam-neutral@1.0.0`. Raw research data and
Google Drive are not runtime dependencies.

## Private alpha infrastructure

`infra/compose/compose.alpha.yml` keeps engine, data, object storage and
CodeProject observers isolated. It uses TimescaleDB only for derived temporal
events; D1 remains the canonical learner record. CodeProject is profile-gated
and cannot change mastery. Start it only with a temporary environment file
written by the Settings Operator:

```powershell
.\scripts\alpha-infrastructure.ps1 -Action up -EnvFile C:\secure-temp\teach-alpha.env
```

The file must supply only alpha infrastructure secrets. It is not the suite
`.env`, it must not be committed, and it must not contain learner data.

For the isolated Multipass VM, the secret file must first be issued through the
Settings Operator. The deployment script refuses files without the three
required engine/database secrets and verifies that Compose declares no host
ports:

```powershell
.\scripts\deploy-multipass-alpha.ps1 -EnvFile C:\secure-temp\teach-alpha.env -Start
```
