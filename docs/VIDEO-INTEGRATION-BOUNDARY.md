# Video integration boundary

Scholarium supports external video as an attributed reference before it supports video copying or autonomous posting. A YouTube or TikTok URL remains external, attached to an author-owned Scholarium publication, and is subject to the same youth-audience policy as the publication.

Public feed responses include only the provider name and canonical URL for a public publication. The publication card opens that link in a separate tab with `noopener` and `noreferrer`; it never embeds a provider token, proxies the video, or presents a third-party view count as a Scholarium ranking signal.

## YouTube webhook trace

`/api/v1/webhooks/youtube` implements the provider-facing PubSubHubbub callback contract:

1. `GET` accepts a subscription challenge only when `YOUTUBE_WEBHOOK_VERIFY_TOKEN` matches and the topic is exactly a YouTube channel feed.
2. `POST` accepts an Atom feed only when the delivery has a valid `X-Hub-Signature` HMAC generated from `YOUTUBE_WEBHOOK_HMAC_SECRET`.
3. The callback extracts only the channel ID and video ID, hashes the received Atom payload, and stores the minimal delivery trace. It never archives the source video or raw feed.
4. The channel must already be recorded as a `youtube_channel` external identity owned by a Scholarium account. Unknown channel notifications are rejected.

This reflects YouTube's documented channel-feed callback model: notifications cover uploads and title/description updates, with the Atom entry carrying video and channel IDs. [YouTube push notifications](https://developers.google.com/youtube/v3/guides/push_notifications)

## OAuth and publishing boundary

The environment file declares the YouTube OAuth and webhook values but no token is stored in the profile or committed to source. A future provider-audited OAuth callback must write only a secure vault reference in `integration_connections`, link the approved channel identity, and request the `youtube.upload` scope before invoking `videos.insert`. Unverified YouTube API projects restrict new uploads to private visibility. [YouTube upload reference](https://developers.google.com/youtube/v3/docs/videos/insert)

TikTok remains a separate user-confirmed Direct Post handoff. It needs `video.publish` authorization and the provider's audit path for visibility beyond private posting; Scholarium will not substitute a URL form for that consent. [TikTok Direct Post](https://developers.tiktok.com/doc/content-posting-api-reference-direct-post)

## Configuration gate

Do not enable the public callback until these hosted values are set through the deployment environment:

- `YOUTUBE_WEBHOOK_VERIFY_TOKEN` — random callback verification value.
- `YOUTUBE_WEBHOOK_HMAC_SECRET` — random HMAC secret supplied when subscribing at the hub.
- `YOUTUBE_OAUTH_CLIENT_ID`, `YOUTUBE_OAUTH_CLIENT_SECRET`, and `YOUTUBE_OAUTH_REDIRECT_URI` — OAuth application configuration.

Without these values the callback responds `503` and records nothing. This fail-closed behavior is intentional.
