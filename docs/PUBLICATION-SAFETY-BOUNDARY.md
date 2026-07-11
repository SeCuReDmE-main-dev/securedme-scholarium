# Publication safety boundary

Scholarium's first automatic publication control is deliberately narrow. It protects authors against accidental disclosure of credential-shaped values; it does not decide whether a scientific claim, a person, a research field, or an idea is true, valuable, or acceptable.

## Enforced behavior

- A title or abstract containing a private-key marker or a narrow pattern associated with a GitHub, Google, AWS, Slack, or OpenAI-style secret is saved privately with status `quarantined`.
- The publication still receives its account-bound provenance receipt and immutable first version, so the author can preserve the work while removing the exposure.
- Scholarium records only a reason code such as `possible_private_key` or `possible_api_secret`; it does not copy the suspected secret into the moderation record.
- Public feeds already exclude `quarantined` publications. An external YouTube/TikTok URL is not attached while the new publication is quarantined.
- The author can read minimal reason codes at `/api/v1/publication-moderation?publicationId=…`; access is bound to the author identity.

## Deliberate limits

This is not a malware scanner, plagiarism determination, age determination, defamation ruling, or scientific fact-checker. Those capabilities require separate evidence, governance, review workflows, and legal controls. The automatic action is scoped to preventing immediate credential exposure.
