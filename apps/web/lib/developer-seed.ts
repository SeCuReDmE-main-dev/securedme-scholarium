/**
 * Public discovery contract for developers who want to build an independent
 * Scholarium-style community. It deliberately exposes governance requirements
 * and response shape, not a private certified-engine implementation.
 */
export const developerSeedManifest = {
  certifiedEngine: {
    status: "not_provisioned",
    requirement: "A separate engine endpoint, registered seed identity, server-held request key, and public attestation key are required before a seed may claim certified ranking.",
  },
  contractVersion: "scholarium-seed/v1",
  developerObligations: [
    "Keep chronological reading available.",
    "Keep paid reach, global-like popularity, and passive viewing surveillance out of discovery scoring.",
    "Use explicit, reversible favourite and less-like-this signals only for the current person.",
    "Resolve visibility and safety eligibility before ranking.",
    "Return readable reasons and a policy digest with every certified response.",
  ],
  disclosure: "The current repository contains an open reference implementation. It cannot be represented as a trade secret after public disclosure. A future certified engine protects only confidential implementation details kept outside the public repository.",
  seedLocation: "templates/scholarium-seed",
  title: "Scholarium Seed Protocol",
} as const;
