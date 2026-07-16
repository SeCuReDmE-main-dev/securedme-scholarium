# Bouncy Castle gateway audit

## Classification

- Source: `C:\SecuredMe_Brain\gateways\bouncy_castle`
- Commit: `4cb41cba74880a310042a1153635000442b52181`
- Branch: `PaQBoT`
- Status for Scholarium: **quarantine - not approved for direct integration**
- Audit mode: read-only; existing parent-worktree changes were preserved.

## Useful design material

- Explicit operation allowlist.
- Ten-second subprocess timeout.
- Raw-tool and mutation surfaces require two independent flags.
- UNC keystore paths are blocked by default.
- Python layer performs no direct network call.
- Fourteen focused unit tests pass.

These are reusable design patterns, not proof that the gateway performs safe cryptography.

## Blocking evidence

1. The tests mock every `bcctl` invocation. They prove request shaping and guards, not encryption, signing, key rotation, interoperability or secure key custody.
2. The gateway expects `bcctl <op> --request-b64 ... --keystore ...`. The only resolved local executable, `bcctl 2.6.2-ffed.1`, returned `unknown_command` for `crypto_status` and exit code 1. Its SHA-256 at audit was `c2f9abd4e4c1d524aabcb2e16cdd3660c6b38d6175ec6701d1e259aed72ef571`.
3. The resolved `bcctl` source persists Ed25519 private keys in plaintext Base64 JSON. A filename ending in `.json.enc` does not prove encryption.
4. `main.py` loads and immediately discards the adapter, then runs a heartbeat. It does not start the adapter or expose a proven request loop. `GATEWAY_TOKEN` is loaded but not validated or used there.
5. The Dockerfile defines no non-root user, health check, read-only filesystem, capability drop, pinned image digest or proven `bcctl` installation.
6. The adapter health payload exposes the keystore path. Scholarium does not need this path in ordinary health responses.
7. `raw_tool`, key mutations, dataset anonymization, encryption and decryption create a much larger authority surface than Scholarium's temporary receipt-signature requirement.
8. `anonymize_dataset` accepts raw records before the gateway boundary, contrary to Scholarium's pseudonymize-before-external-adapter rule.
9. `require_pq` checks whether an algorithm name appears in a status list; it does not prove the selected operation used a post-quantum construction correctly.

## Decision

Do not import this gateway, its container, its mutation surface or its keystore model into Scholarium. Retain it as quarantined source material. The approved temporary extraction is narrower: a private Bouncy Castle 2.6.2 adapter signs canonical Gate5 terminal receipt digests with Ed25519, receives keys from an external secret/KMS boundary, persists no key, accepts no raw learner content and exposes no raw-tool command.

Reconsider the original gateway only after a real compatible `bcctl` implementation, end-to-end cryptographic vectors, managed-key proofs, container hardening, authenticated transport and failure/recovery tests exist.
