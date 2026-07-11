# Academia.edu migration boundary

Scholarium offers an **owner-confirmed, browser-assisted** migration path for a person's own Academia.edu publications. It is deliberately not a bulk scraping tool and it does not use a provider token, password, session cookie, or hidden account data.

## Safe import flow

1. The person signs in to both services in their own browser session.
2. They identify their own Academia.edu profile and confirm authorization for that source.
3. Scholarium creates a private review draft from the selected publication metadata.
4. Each item is selected independently and defaults to **private**.
5. Only the final confirmation creates a new Scholarium publication and its provenance receipt. Public visibility requires a separate affirmative choice and the account's existing youth/audience policy must allow it.

The import preserves neither Academia's account session nor its access controls. A Scholarium receipt records the new Scholarium publication event; it does not replace copyright registration, a DOI, or the source platform's own record.

## Public discovery, without WebAuth bypass

Public discovery is possible only for an owner-enabled public Scholarium profile and already-public work. `robots.txt` permits profile routes while excluding account and API routes. No crawler, bot, or unauthenticated request can read private profiles, import drafts, provider connections, or authenticated APIs. This is intentionally not a WebAuth bypass.

## Professor or organization migrations

Do not create a profile, copy publications, or import a colleague's material from an email address alone. Send a consent-first invitation and let the person sign in, confirm source ownership, and choose the specific items and visibility settings. This protects authorship, confidentiality, and the person's control of the profile.
