export const VERIFIED_CONTRIBUTOR_MONTHLY_CENTS = 99;
export const VERIFIED_CONTRIBUTOR_MONTHLY_LABEL = "$0.99/month";

export function canActivateVerifiedContributor(input: { documentStatus: string | null; passkeyVerifiedAt: string | null }) {
  return input.documentStatus === "verified" && Boolean(input.passkeyVerifiedAt);
}
