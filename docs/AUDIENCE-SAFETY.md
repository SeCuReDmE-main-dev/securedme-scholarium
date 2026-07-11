# Audience safety boundaries

Scholarium keeps a scientific and educational feed open without treating every account as interchangeable.

## Enforced now

- An adult or age-unknown account may publish publicly and reference a public YouTube or TikTok URL.
- A minor account without active guardian consent or a verified school relationship creates a **private** publication by default and cannot attach a public external-video URL.
- A supervised minor account may create a public publication and link an external video; direct creator contributions and unsupervised adult messaging remain disabled.
- The public feed only queries public publications, so a private youth publication is not eligible for chronological, following, verified, or discovery modes.

The API derives this decision from the account's active role assignment, current guardian-consent status, and organization verification state. It returns no guardian identity or consent-body data.

## Deliberate limits

This is an implementation safeguard, not a legal determination of age, parental consent, school authorization, or platform safety compliance. A future consent workflow must enforce explicit consent scopes, revocation, retention, school roles, messaging rules, and legal review before youth launch.

