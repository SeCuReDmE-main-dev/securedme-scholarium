export type AgeBand = "adult" | "minor" | "unknown";
export type GuardianConsentStatus = "active" | "pending" | "revoked" | "none";

export function minorCapabilities(input: { ageBand: AgeBand; guardianConsent: GuardianConsentStatus; organizationVerified: boolean }) {
  const supervised = input.guardianConsent === "active" || input.organizationVerified;
  if (input.ageBand !== "minor") {
    return {
      canJoinLive: true,
      canLinkExternalMedia: true,
      canPublishPublicly: true,
      canReceiveContributions: true,
      canSendDirectMessageToAdults: true,
      defaultProfileVisibility: "public" as const,
    };
  }

  return {
    canJoinLive: supervised,
    // External video platforms can create a public, cross-platform audience.
    // A minor may attach those links only where a guardian or verified school
    // relationship is present; local private artifacts remain available.
    canLinkExternalMedia: supervised,
    canPublishPublicly: supervised,
    canReceiveContributions: false,
    canSendDirectMessageToAdults: false,
    defaultProfileVisibility: "private" as const,
  };
}
