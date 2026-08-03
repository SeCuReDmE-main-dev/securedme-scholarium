# D1 Linux proof protocol

`0036_teach_syllabic_engine.sql` and
`0037_teach_engine_privacy_transactions.sql` are exercised only in a disposable
local D1 state. This protocol never reaches a remote D1 database.

Windows Workerd is not the supported proof runtime for this workstation. Its
dependency resolution still traverses the `Z:` workspace and can hang. The
canonical proof is Linux inside the private Multipass VM:

```powershell
cd "Z:\SecuredMe Education suite\securedme-scholarium"
powershell -ExecutionPolicy Bypass -File services/teach-engine/scripts/prove-d1-in-multipass.ps1
```

The script transfers only `tests/d1-linux-harness` into the VM, runs a pinned
Wrangler 4.118.0 through a disposable Node 22 container, then deletes the
harness. It uses an invalid-domain synthetic learner identity only.

The proof establishes:

- all engine and privacy migrations apply;
- a valid attempt with the current checkpoint digest writes successfully;
- a mismatched checkpoint digest is refused by the D1 trigger;
- an organization aggregate below `k=10` is refused by the D1 trigger;
- no remote D1, production account, learner data, audio, or external route is
  touched.

The initial execution on 2026-08-02 passed. The closure execution on
2026-08-02 also passed and returned:

```json
{"status":"passed","runtime":"linux","synthetic_identity_only":true}
```

Wrangler starts Workerd for each command, so the proof is intentionally slower
than the application engine and is a gate test rather than a request-path
benchmark. This proof does not replace the remaining route-level Teach proof,
which still needs a Linux-compatible test identity adapter.
