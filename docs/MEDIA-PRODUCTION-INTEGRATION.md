# Scholarium media production integration

## What was adopted

Scholarium now exposes a renderer-neutral quality contract for its author-led Podcast & Video Studio:

- the old podcast-to-video idea contributes a cover-image plus audio-visual waveform/spectrum direction;
- the video-podcast tool contributes explicit standard/high output profiles and 1080p delivery targets;
- VideoPrism contributes an opt-in semantic review adapter for sampled scenes, the author-approved script, and cited sources.

The contract is returned by `/api/v1/video-production-plan`. It does not upload, render, or publish media. A future author-controlled worker can consume the contract and execute FFmpeg locally or in an explicitly selected private environment.

## Quality boundary

High quality remains available in the free author workflow. The current high profile is 1920 × 1080 for landscape, 1080 × 1920 for portrait, or 1080 × 1080 for square, with H.264/AAC, `yuv420p`, 5000k video, and 192k audio. Standard profiles remain available for low-bandwidth delivery. A weak cover is never enlarged to pretend it is high resolution.

VideoPrism is not a pixel enhancer. Its public repository describes a JAX/Flax video and video-text encoder (`videoprism_lvt_public_v1_base` is the selected adapter model) for representation, retrieval, classification, localization, captioning, and question answering. Scholarium therefore labels its output as semantic review notes only; it cannot decide scientific truth, authorship, moderation, ranking, or identity.

## Privacy and deployment boundary

- `reviewMode=none` performs no media analysis.
- `reviewMode=local_videoprism` only prepares a local adapter contract; the web worker does not download model weights or receive raw media.
- The adapter is reported as `not_connected` until an author-controlled worker is configured.
- Provider publishing remains an explicit handoff; Scholarium does not silently upload to YouTube, TikTok, or another platform.
- The old repositories were audited for behavior, not copied into the Cloudflare app. Their current source trees did not expose a repository license file, so no source code is redistributed from them here. VideoPrism is Apache-2.0 and is referenced by contract, not bundled.

## Next implementation gate

Implement a separate local worker with signed, expiring job manifests, an R2/local input option, FFmpeg execution, and a redacted review receipt. Keep that worker outside the public web bundle and require an author confirmation before any media leaves the local boundary.
