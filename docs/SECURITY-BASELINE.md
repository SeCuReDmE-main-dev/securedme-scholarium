# Scholarium security baseline

## Current runtime boundary

Every response passes through the Cloudflare Worker security boundary. It adds a content security policy, clickjacking protection, MIME sniffing protection, a restrictive permissions policy, referrer protection, and HTTPS transport security.

Authentication routes additionally use `Cache-Control: no-store`. This prevents an OAuth handoff, callback, or sign-out response from being retained by a browser or intermediary cache.

## OAuth controls

- Provider callbacks use a host-only, secure, HttpOnly, SameSite=Lax cookie.
- The PayPal authorization transaction keeps only a random CSRF nonce, expiry, and sanitized relative return path in that transient cookie.
- No OAuth access or refresh token is stored as Scholarium profile data.
- A completed provider session is encrypted before it is stored in the browser cookie.
- Provider identities use a provider-specific subject and are never automatically merged merely because email addresses match.

## Deliberate limits

The current CSP allows self-hosted inline framework hydration and styles. Moving to nonce-based script and style policies requires a framework-compatible build path and must be tested before tightening the policy.

This baseline is pre-alpha protection, not a claim of completed legal, financial, youth-safety, penetration-test, or production-readiness review.
