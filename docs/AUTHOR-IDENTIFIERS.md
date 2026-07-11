# Author identifiers and ORCID

Scholarium treats an ORCID iD as an author-identity aid, not as a substitute for the platform provenance receipt or a copyright registration.

## Free registration guidance

Any researcher can register an ORCID iD for free at [orcid.org/register](https://orcid.org/register). ORCID describes the iD as a persistent 16-character HTTPS identifier with an ISO 7064 MOD 11-2 checksum. Scholarium accepts either the full URI or the formatted identifier, validates that checksum, and stores the normalized full URI. [ORCID: identifier structure](https://support.orcid.org/hc/en-us/articles/360006897674-Structure-of-the-ORCID-Identifier) · [ORCID: free for researchers](https://info.orcid.org/ufaqs/i-am-a-researcher-can-i-use-orcid-for-free/)

## Claimed is not authenticated

The current profile form accepts a **self-claimed**, checksum-valid ORCID iD. It is private to the account and included in the account export. It does not appear on public profiles, does not alter a provenance receipt, and does not establish paternity by itself.

An authenticated iD requires a configured ORCID OAuth client, a redirect, and the researcher’s consent. ORCID explicitly distinguishes authenticated iDs obtained through OAuth from manually entered or otherwise unauthenticated iDs. Until that integration exists, Scholarium must not show a manual claim as verified. [ORCID: collect authenticated iDs](https://info.orcid.org/documentation/collecting-and-sharing-orcid-ids/) · [ORCID: display guidance](https://info.orcid.org/documentation/integration-guide/orcid-id-display-guidelines/)

## Privacy and safety

- The author identifier API is account-bound and `private, no-store`.
- An ORCID claim can be removed at any time.
- The iD has a strict checksum format, but checksum validity does not prove account ownership.
- Profile verification, guardian rules, public-profile visibility, and payment status remain separate systems.
