# Scholarium media-production worker contract

This template is the boundary for an author-controlled worker that can execute the quality contract returned by `/api/v1/video-production-plan`. It is intentionally separate from the public Cloudflare web app.

## Required behavior

1. Accept only a short-lived, signed job manifest and reject expired or replayed manifests.
2. Read media from an author-approved local path or private R2 object; never fetch arbitrary URLs.
3. Apply the requested FFmpeg profile (`libx264`, AAC, `yuv420p`, target dimensions and bitrates) without enlarging a weak cover source.
4. Keep original media and generated derivatives separate, and write SHA-256 hashes to the redacted receipt.
5. Run VideoPrism only when `review.mode` is `local_videoprism` and the author has explicitly confirmed local analysis.
6. Accept the Book Publication Lab podcast package as the audio-stage input: source notes, timed three-role script, show notes, TTS-ready script, and separately synthesized Presenter, Specialist, and Interviewee tracks.
7. Request entitlement from the optional QuaNTecH-ViD provider before rendering. Scholarium exposes its free feature at three completed renders per rolling 24 hours. Eligible Pro, Enterprise, and Premium suite offers may include a higher QuaNTecH-ViD limit through an explicit bundle entitlement. Scholarium badges and feed ranking never influence the provider decision.
6. Return review notes and quality measurements, never raw frames, embeddings, credentials, or private script text.
7. Require a second author confirmation before any provider handoff or publication.

## What this template does not do

- It is not a renderer, queue, storage service, or VideoPrism distribution.
- It does not grant YouTube/TikTok upload permission.
- It does not make copyright, identity, moderation, ranking, or scientific-truth decisions.

`job-manifest.example.json` is synthetic and contains no credentials or real media path.
