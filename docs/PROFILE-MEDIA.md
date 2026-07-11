# Scholarium profile media

An avatar or profile banner is uploaded only after the account owner selects a file. The API accepts PNG, JPEG, and WebP raster images; it validates the declared MIME type and a small file signature before R2 storage. SVG is intentionally excluded because it can carry active content.

Avatars are capped at 3 MiB and banners at 6 MiB. Media is retrieved through an authenticated, `private, no-store` profile route. It is not made public simply because it has been uploaded; public-profile media needs a separate visibility decision and review.
