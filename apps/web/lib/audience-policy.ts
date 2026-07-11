export type AgeBand = "adult" | "minor" | "unknown";
export type GuardianConsentStatus = "active" | "pending" | "revoked" | "none";

export function minorCapabilities(input: { ageBand: AgeBand; guardianConsent: GuardianConsentStatus; organizationVerified: boolean }) {
  const supervised = input.guardianConsent === "active" || input.organizationVerified;
  if (input.ageBand !== "minor") {
    return { canJoinLive: true, canReceiveContributions: true, canSendDirectMessageToAdults: true, defaultProfileVisibility: "public" as const };
  }

  return {
    canJoinLive: supervised,
    canReceiveContributions: false,
    canSendDirectMessageToAdults: false,
    defaultProfileVisibility: "private" as const,
  };
}
