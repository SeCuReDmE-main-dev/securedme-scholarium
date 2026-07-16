# Scholarium Bouncy Castle receipt adapter

This private-worker adapter provides a transitional Ed25519 signature layer for Gate5 terminal receipts. It consumes digests only. It does not receive student content, generate pseudonyms, replace TLS, encrypt D1/R2, or use quasicrystal geometry as cryptographic material.

The upstream `C:\Users\jeans\Desktop\bcctl` utility is not used as a key store because its current `state.json` persists private keys in plaintext Base64. This adapter never creates or persists a key. `SCHOLARIUM_BC_ED25519_PRIVATE_KEY_B64` and `SCHOLARIUM_BC_ED25519_PUBLIC_KEY_B64` must be injected from an external secret store; production promotion requires a KMS/HSM or equivalent managed secret boundary.

```powershell
dotnet run --project . -- doctor
dotnet run --project . -- self-test
dotnet run --project . -- sign --context gate5:fnp-qnn --job-id JOB --request-digest sha256:... --receipt-digest sha256:... --status completed
```

The adapter is a temporary independent signature provider. FfeD structural values, Hilbert coordinates, quasicrystal cells, `D_f`, `dF`, and `i_fractal` are prohibited from KDF, AAD, key, vault, authentication, or key-rotation inputs.
