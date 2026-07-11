import { and, eq, or } from "drizzle-orm";
import { getDb } from "../../../db";
import { guardianConsents, profileVerifications, users } from "../../../db/schema";
import { accountAudience } from "../../../lib/account-audience";
import { guardianConsentScopes, parseGuardianConsentScopes, type GuardianConsentScope } from "../../../lib/audience-policy";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";
import { canActivateVerifiedContributor } from "../../../lib/verified-subscription";

type ConsentInput = { action?: unknown; consentId?: unknown; expiresAt?: unknown; guardianAccountId?: unknown; scopes?: unknown };

function scopesFromInput(value: unknown): GuardianConsentScope[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > guardianConsentScopes.length) return null;
  const scopes = [...new Set(value.filter((scope): scope is GuardianConsentScope => typeof scope === "string" && guardianConsentScopes.includes(scope as GuardianConsentScope)))];
  return scopes.length === value.length ? scopes : null;
}

function validatedExpiry(value: unknown) {
  if (typeof value !== "string") return null;
  const timestamp = Date.parse(value);
  const now = Date.now();
  if (!Number.isFinite(timestamp) || timestamp < now + 86_400_000 || timestamp > now + 366 * 86_400_000) return null;
  return new Date(timestamp).toISOString();
}

function publicConsent(record: { createdAt: string; expiresAt: string | null; id: string; revokedAt: string | null; scope: string; status: string }) {
  return { createdAt: record.createdAt, expiresAt: record.expiresAt, id: record.id, revokedAt: record.revokedAt, scopes: parseGuardianConsentScopes(record.scope), status: record.status };
}

export async function GET() {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const db = await getDb();
    const consents = await db.select({ createdAt: guardianConsents.createdAt, expiresAt: guardianConsents.expiresAt, id: guardianConsents.id, revokedAt: guardianConsents.revokedAt, scope: guardianConsents.scope, status: guardianConsents.status })
      .from(guardianConsents)
      .where(or(eq(guardianConsents.minorUserId, identity.userId), eq(guardianConsents.guardianUserId, identity.userId)));
    return Response.json({ consents: consents.map(publicConsent), supportedScopes: guardianConsentScopes });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load guardian consents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const input = await request.json() as ConsentInput;
    const guardianAccountId = typeof input.guardianAccountId === "string" ? input.guardianAccountId.trim() : "";
    const scopes = scopesFromInput(input.scopes);
    const expiresAt = validatedExpiry(input.expiresAt);
    if (!guardianAccountId || guardianAccountId.length > 160 || guardianAccountId === identity.userId || !scopes || !expiresAt) {
      return Response.json({ error: "Provide a different guardian account ID, one or more supported scopes, and an expiry between 1 day and 366 days." }, { status: 400 });
    }
    const db = await getDb();
    const audience = await accountAudience(db, identity.userId);
    if (audience.ageBand !== "minor") return Response.json({ error: "Only a minor account may request guardian consent." }, { status: 403 });
    const [guardian] = await db.select({ id: users.id }).from(users).where(eq(users.id, guardianAccountId)).limit(1);
    if (!guardian) return Response.json({ error: "Guardian account was not found." }, { status: 404 });
    const now = new Date().toISOString();
    const record = { createdAt: now, expiresAt, guardianUserId: guardian.id, id: crypto.randomUUID(), minorUserId: identity.userId, scope: JSON.stringify(scopes), status: "pending" };
    await db.insert(guardianConsents).values(record);
    return Response.json({ consent: publicConsent({ ...record, revokedAt: null }), nextStep: "The guardian must sign in, complete document-and-passkey verification, then activate this request." }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create guardian consent request" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const input = await request.json() as ConsentInput;
    if (input.action !== "activate" || typeof input.consentId !== "string") return Response.json({ error: "Use action activate with a consentId." }, { status: 400 });
    const db = await getDb();
    const [consent] = await db.select().from(guardianConsents).where(and(eq(guardianConsents.id, input.consentId), eq(guardianConsents.guardianUserId, identity.userId), eq(guardianConsents.status, "pending"))).limit(1);
    if (!consent) return Response.json({ error: "Pending guardian consent was not found." }, { status: 404 });
    if (!consent.expiresAt || Date.parse(consent.expiresAt) <= Date.now()) return Response.json({ error: "This consent request has expired and must be created again." }, { status: 409 });
    const [verification] = await db.select({ passkeyVerifiedAt: profileVerifications.passkeyVerifiedAt, status: profileVerifications.status }).from(profileVerifications).where(eq(profileVerifications.userId, identity.userId)).limit(1);
    if (!verification || !canActivateVerifiedContributor({ documentStatus: verification.status, passkeyVerifiedAt: verification.passkeyVerifiedAt })) {
      return Response.json({ error: "Guardian activation requires document verification and a verified passkey." }, { status: 403 });
    }
    await db.update(guardianConsents).set({ status: "active" }).where(eq(guardianConsents.id, consent.id));
    return Response.json({ consent: publicConsent({ ...consent, status: "active" }) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to activate guardian consent" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const consentId = new URL(request.url).searchParams.get("consentId");
    if (!consentId) return Response.json({ error: "consentId is required." }, { status: 400 });
    const db = await getDb();
    const [consent] = await db.select().from(guardianConsents).where(eq(guardianConsents.id, consentId)).limit(1);
    if (!consent || (consent.minorUserId !== identity.userId && consent.guardianUserId !== identity.userId)) return Response.json({ error: "Guardian consent was not found." }, { status: 404 });
    const revokedAt = new Date().toISOString();
    await db.update(guardianConsents).set({ revokedAt, status: "revoked" }).where(eq(guardianConsents.id, consent.id));
    return Response.json({ consent: publicConsent({ ...consent, revokedAt, status: "revoked" }) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to revoke guardian consent" }, { status: 500 });
  }
}
