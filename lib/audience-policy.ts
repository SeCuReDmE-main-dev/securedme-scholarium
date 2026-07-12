export type AgeBand = "adult" | "minor" | "unknown";
export type GuardianConsentStatus = "active" | "pending" | "revoked" | "none";
export const guardianConsentScopes = ["public_publication", "external_media", "live"] as const;
export type GuardianConsentScope = (typeof guardianConsentScopes)[number];

export function parseGuardianConsentScopes(value: string): GuardianConsentScope[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((scope): scope is GuardianConsentScope => typeof scope === "string" && guardianConsentScopes.includes(scope as GuardianConsentScope)))];
  } catch {
    return guardianConsentScopes.includes(value as GuardianConsentScope) ? [value as GuardianConsentScope] : [];
  }
}

export function minorCapabilities(input: { ageBand: AgeBand; guardianConsent: GuardianConsentStatus; guardianScopes: readonly GuardianConsentScope[]; organizationVerified: boolean }) {
  const scopeIsApproved = (scope: GuardianConsentScope) => input.organizationVerified || (input.guardianConsent === "active" && input.guardianScopes.includes(scope));
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
    canJoinLive: scopeIsApproved("live"),
    // External video platforms can create a public, cross-platform audience.
    // A minor may attach those links only where a guardian or verified school
    // relationship is present; local private artifacts remain available.
    canLinkExternalMedia: scopeIsApproved("external_media"),
    canPublishPublicly: scopeIsApproved("public_publication"),
    canReceiveContributions: false,
    canSendDirectMessageToAdults: false,
    defaultProfileVisibility: "private" as const,
  };
}
