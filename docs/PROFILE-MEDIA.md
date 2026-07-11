# Scholarium profile media

An avatar or profile banner is uploaded only after the account owner selects a file. The API accepts PNG, JPEG, and WebP raster images; it validates the declared MIME type and a small file signature before R2 storage. SVG is intentionally excluded because it can carry active content.

Avatars are capped at 3 MiB and banners at 6 MiB. Media is retrieved through an authenticated, `private, no-store` profile route by default.

An owner may explicitly enable public-profile visibility in profile preferences. Only then can the opaque public profile identifier retrieve the owner-selected avatar or banner, with a short public cache lifetime. The public profile contains the display name, primary role, optional earned verification badge, selected visual style, and already-public publications. It never exposes email, identity-provider subjects, provider tokens, private settings, private work, or media while visibility is disabled.

For a minor account, that setting is accepted only while the same guardian-consent or verified-school relationship required for public publication remains active. If the relationship is absent or revoked, the public profile and its media return as unavailable immediately.
