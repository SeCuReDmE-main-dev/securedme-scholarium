# Audience safety boundaries

Scholarium keeps a scientific and educational feed open without treating every account as interchangeable.

## Enforced now

- An adult or age-unknown account may publish publicly and reference a public YouTube or TikTok URL.
- A minor account without active guardian consent or a verified school relationship creates a **private** publication by default and cannot attach a public external-video URL.
- Guardian consent is time-bounded and scoped separately for public publications, external media, and Lives. The guardian must activate a pending request with a document-verified account and verified passkey; either the minor or guardian can revoke it.
- A supervised minor account may use only the scopes granted by the guardian; a verified school relationship remains a separate supervised route. Direct creator contributions and unsupervised adult messaging remain disabled.
- The public feed only queries public publications, so a private youth publication is not eligible for chronological, following, verified, or discovery modes.

The API derives this decision from the account's active role assignment, current guardian-consent scopes and expiry, and organization verification state. Consent records returned to either participant omit the other participant's identity and consent body.

## Deliberate limits

This is an implementation safeguard, not a legal determination of age, parental consent, school authorization, or platform safety compliance. A future school-consent workflow must add school roles, retention rules, messaging rules, and legal review before youth launch.
