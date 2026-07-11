export const SEED_DISCOVERY_CONTRACT = "scholarium-seed/v1";

export type SeedCandidate = {
  id: string;
  publishedAt: string;
  topicSlugs: string[];
  type: "education" | "media" | "project" | "research";
  verificationState: "processing" | "verified" | "unverified";
};

export type ExplicitViewerSignals = {
  favouriteIds: string[];
  followedTopicSlugs: string[];
  lessLikeIds: string[];
  viewerReference: string;
};

export type CertifiedDiscoveryResponse = {
  algorithmVersion: string;
  attestation: { expiresAt: string; keyId: string; policyDigest: string; signature: string; signedPayload: string };
  contractVersion: typeof SEED_DISCOVERY_CONTRACT;
  results: Array<{ classification: SeedCandidate["type"]; id: string; reasons: string[]; scorecard: { explicitSatisfaction: number; personalRelevance: number; researchContext: number } }>;
};

export function isCertifiedDiscoveryResponse(value: unknown): value is CertifiedDiscoveryResponse {
  if (!value || typeof value !== "object") return false;
  const response = value as Partial<CertifiedDiscoveryResponse>;
  return response.contractVersion === SEED_DISCOVERY_CONTRACT
    && typeof response.algorithmVersion === "string"
    && Array.isArray(response.results)
    && Boolean(response.attestation && typeof response.attestation.keyId === "string" && typeof response.attestation.policyDigest === "string" && typeof response.attestation.signature === "string" && typeof response.attestation.signedPayload === "string");
}
