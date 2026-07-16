# Scholarium QuaNTecH-ViD private adapter

This loopback-only adapter consumes
`scholarium.quantech-media-job.v1`, verifies its dedicated HMAC signature,
rejects expired or replayed nonces, checks the QuaNTecH-ViD 2.0 health
surface, and validates an author-approved local project manifest.

It does not render or publish from the validation command. Render submission
remains a later explicit provider-dispatch action, and external publication
requires a separate `scholarium.media-publication-confirmation.v1` receipt.

The secret is read from `SCHOLARIUM_MEDIA_MANIFEST_SECRET`; it never belongs
in a job manifest, command argument, receipt, log, or repository file.

```powershell
$env:SCHOLARIUM_MEDIA_MANIFEST_SECRET = '<load from the central environment>'
python .\adapters\quantech-vid\worker_adapter.py .\path\to\job-manifest.json
```

Only `http://127.0.0.1:7476` is accepted. The adapter reports project
metadata and digests, not raw script text, media frames, provider credentials,
student identifiers, or voice vectors.
