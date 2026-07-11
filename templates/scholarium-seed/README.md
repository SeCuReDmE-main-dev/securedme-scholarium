# Scholarium Seed

This is a developer starter for an independent research and education community. It carries the public contract required to build a respectful discovery surface without copying Scholarium’s public application wholesale.

It provides a typed boundary for a remote certified engine; it does **not** contain a private ranking formula, a live credential, a provider token, or an active engine URL.

## Start

1. Copy this directory into a new repository.
2. Preserve `seed.manifest.json`, attribution, and the SEL-2.0 licensing notices when the licensed material is reused.
3. Add the contract to your server route; never call a discovery engine directly from the browser.
4. Start in chronological mode. Enable a certified engine only after your server has a registered seed identity and server-side request key.

## Two valid paths

| Path | What a developer controls | What may be claimed |
| --- | --- | --- |
| Independent implementation | Its own database, policy, and scoring implementation | “Independent discovery policy” |
| Certified engine connection | Its own community and data boundary; the remote engine signs policy-bound responses | “Certified Plithogenic Engine” only while an attestation verifies |

Do not claim that a deployment uses the certified engine when `DISCOVERY_ENGINE_URL`, `DISCOVERY_SEED_ID`, `DISCOVERY_REQUEST_KEY`, or the engine public key are absent.

## Privacy minimum

- Send a per-seed pseudonymous viewer reference, not an email, provider subject, or raw identity.
- Send only explicit favourites, suppressions, followed topics, eligible candidate metadata, and the requested view.
- Never transmit publication files, private comments, raw watch time, contact books, or biometric data to the engine.
- Treat every engine result as advisory presentation data; safety and moderation remain separate, reviewable decisions.
