import { and, eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { guardianConsents, organizations, roleAssignments } from "../db/schema";
import { minorCapabilities, type AgeBand, type GuardianConsentStatus } from "./audience-policy";

type Database = DrizzleD1Database<typeof import("../db/schema")>;

function consentIsCurrent(consent: { expiresAt: string | null }) {
  return !consent.expiresAt || new Date(consent.expiresAt).getTime() > Date.now();
}

/**
 * Resolves only the account-level facts required to apply youth safeguards.
 * It intentionally does not return guardian identities or consent content to
 * API callers. Consent scope enforcement belongs in the future consent route.
 */
export async function accountAudience(db: Database, userId: string) {
  const [assignment] = await db
    .select({ ageBand: roleAssignments.ageBand, organizationId: roleAssignments.organizationId })
    .from(roleAssignments)
    .where(and(eq(roleAssignments.userId, userId), eq(roleAssignments.status, "active")))
    .limit(1);
  const ageBand = (assignment?.ageBand === "adult" || assignment?.ageBand === "minor" ? assignment.ageBand : "unknown") as AgeBand;
  const [consent] = await db
    .select({ expiresAt: guardianConsents.expiresAt })
    .from(guardianConsents)
    .where(and(eq(guardianConsents.minorUserId, userId), eq(guardianConsents.status, "active")))
    .limit(1);
  const [organization] = assignment?.organizationId
    ? await db.select({ verificationStatus: organizations.verificationStatus }).from(organizations).where(eq(organizations.id, assignment.organizationId)).limit(1)
    : [];
  const guardianConsent: GuardianConsentStatus = consent && consentIsCurrent(consent) ? "active" : "none";
  const organizationVerified = organization?.verificationStatus === "verified";

  return {
    ageBand,
    guardianConsent,
    organizationVerified,
    capabilities: minorCapabilities({ ageBand, guardianConsent, organizationVerified }),
  };
}
