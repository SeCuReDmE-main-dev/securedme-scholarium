# Scholarium media source audit

## Objective

Reuse the useful ideas from the SecuredMe podcast/video projects and evaluate VideoPrism for a higher-quality, privacy-preserving Scholarium Studio integration.

## Environment / Stack Context

The target is `apps/web`, a React/Vinext Cloudflare Worker surface with an ephemeral `/api/v1/video-production-plan` endpoint. The endpoint currently creates author-facing briefs and intentionally does not upload or render media.

## Research Questions

1. Which parts of the two podcast/video repositories improve author workflow or export quality?
2. Can VideoPrism be embedded safely in the web worker?
3. What contract advances quality without turning semantic review into a truth or ranking system?

## Findings

- **Confirmed by primary sources:** `podcast-to-video` implements browser recording, podcast-to-video composition, waveform/spectrum overlays, a 1920 × 1080 canvas, H.264/AAC output, `yuv420p`, and a shortest-output guard.
- **Confirmed by primary sources:** `video-podcast-tool` exposes standard/high/premium profiles; its high profile is 1920 × 1080 with 5000k video and 192k audio, and it includes trim, transition, and text/image overlay concepts.
- **Confirmed by primary sources:** the public VideoPrism repository is a Python/JAX/Flax package. It publishes video and video-text encoders, including `videoprism_lvt_public_v1_base`, and requires model checkpoints outside the Scholarium web bundle.
- **Inferred from the deployment boundary:** bundling VideoPrism weights into the Cloudflare app would be operationally and privacy-wise wrong. A local, opt-in adapter contract is the defensible first integration.

## Recommended Path

Scholarium now returns a quality contract with standard/high output dimensions, bitrates, codecs, pixel format, safe margins, and a `local_videoprism` review mode. The default remains no analysis. The UI clearly reports that the adapter is prepared but not connected.

## Alternatives Considered

- Copying the old Node/Mongo/FFmpeg services into `apps/web`: rejected because it would introduce a second backend, persistent media handling, and unreviewed provider credentials.
- Bundling VideoPrism in the worker: rejected because the public model requires Python/JAX/Flax and large checkpoints; the worker should not receive raw media by default.
- Treating VideoPrism embeddings as ranking or scientific verification: rejected because representation similarity is not provenance, truth, or authorship evidence.

## Risks / Unknowns

- The two older repositories did not expose a repository license file in the audited source trees; no source code is copied.
- The future local worker still needs signed job manifests, resource limits, cancellation, receipt redaction, and explicit export consent.
- Actual encoder latency and hardware requirements need a separate local benchmark before enabling any production worker.

## Sources

- [podcast-to-video](https://github.com/SeCuReDmE-open-source/podcast-to-video)
- [video-podcast-tool](https://github.com/SeCuReDmE-open-source/video-podcast-tool)
- [YoLo_videoprism](https://github.com/SeCuReDmE-main-dev/YoLo_videoprism)
- [VideoPrism upstream repository](https://github.com/google-deepmind/videoprism)
- [VideoPrism paper](https://arxiv.org/abs/2402.13217)
