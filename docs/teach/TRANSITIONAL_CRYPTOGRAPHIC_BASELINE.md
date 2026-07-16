# Transitional Cryptographic Protection Level

## Status

This is a cross-cutting execution level, not a numbered sub-action. It applies to all 163 actions until the native SecuredMe protection mechanisms pass their own independent threat, interoperability, recovery, and key-custody proofs.

## Layered boundary

1. Browser and Cloudflare surfaces use platform TLS, Web Crypto, authenticated sessions, purpose consent, pseudonymization, D1/R2 provider controls, and Gate5 fail-closed contracts.
2. Private workers accept only signed, expiring, pseudonymous envelopes containing the minimum required data.
3. Gate5 terminal receipts carry an independent Ed25519 signature produced by the private Bouncy Castle adapter.
4. Bouncy Castle receives receipt digests, context, status and opaque job identifiers only. It receives no learner content.
5. Native FfeD, Tenebris and quasicrystal mechanisms remain research-gated until their own evidence closes. They cannot silently replace this baseline.

## Approved temporary use

- Bouncy Castle .NET package `BouncyCastle.Cryptography` 2.6.2 in a private .NET 8 adapter.
- Ed25519 signatures for terminal Gate5 receipts.
- SHA-256 content digests for canonical receipt references.
- Keys injected by a secret manager or KMS; no repository key and no generated local key store.

## Explicit exclusions

- The current `C:\Users\jeans\Desktop\bcctl` state store is not approved because it persists private keys as plaintext Base64 JSON.
- Its `anonymize` command is not approved as pseudonymization because it is an unkeyed deterministic hash.
- Listing an algorithm does not prove that Scholarium safely implements or operates it.
- Bouncy Castle is not added to the browser or Cloudflare JavaScript bundle.
- This level does not claim FIPS validation. The audited source explicitly states that it is the non-FIPS API.
- Post-quantum algorithms listed by the upstream repository remain outside this baseline.
- Geometry, Penrose cells, Hilbert vectors, `D_f`, `dF`, and `i_fractal` never enter KDF, AAD, key, vault, authentication secret or key-rotation material.

## Promotion gate

The level remains active until all of the following are proved: managed key custody, rotation and revocation; cross-runtime signature interoperability; tamper and replay rejection; recovery after key-provider outage; no secret or personal data in logs; and independent review of the replacement mechanism. Failure of the Bouncy Castle sidecar degrades external adapter completion to quarantine; it never causes unsigned acceptance.

## Quarantined prior gateway

The prior `C:\SecuredMe_Brain\gateways\bouncy_castle` implementation was audited separately. Its useful allowlist and timeout patterns were retained conceptually, but direct integration was rejected because its tests mock the cryptographic executable and the discovered `bcctl` is contract-incompatible. See `BOUNCY_CASTLE_GATEWAY_AUDIT.md`.
