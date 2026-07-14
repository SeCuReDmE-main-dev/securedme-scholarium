import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { providerConsents, users } from "../../../db/schema";
import { getProviderCapability } from "../../../lib/provider-capabilities";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

type ConsentInput = { provider?: unknown; scopes?: unknown; status?: unknown };

function requestedScopes(value: unknown, allowed: readonly string[]) {
  if (value === undefined) return [...allowed];
  if (!Array.isArray(value) || value.length > 16 || value.some((scope) => typeof scope !== "string")) throw new Error("scopes must be a short string array");
  const scopes = [...new Set(value.map((scope) => scope.trim()).filter(Boolean))];
  if (scopes.some((scope) => !allowed.includes(scope))) throw new Error("Requested scopes are not available for this provider");
  return scopes;
}

async function account() {
  const identity = await getPlatformIdentity();
  if (!identity) return null;
  const db = await getDb();
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1);
  return user ? { db, user } : null;
}

export async function GET() {
  try {
    const current = await account();
    if (!current) return signInRequired();
    const consents = await current.db.select({ grantedAt: providerConsents.grantedAt, provider: providerConsents.provider, revokedAt: providerConsents.revokedAt, scopes: providerConsents.scopes, status: providerConsents.status, updatedAt: providerConsents.updatedAt }).from(providerConsents).where(eq(providerConsents.userId, current.user.id));
    return Response.json({ consents }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load provider consent records" }, { status: 500 });
  }
}

/** Explicit consent is required before any provider-owned handoff is prepared. */
export async function PUT(request: Request) {
  try {
    const current = await account();
    if (!current) return signInRequired();
    const input = await request.json() as ConsentInput;
    if (typeof input.provider !== "string") return Response.json({ error: "provider is required" }, { status: 400 });
    const capability = getProviderCapability(input.provider);
    if (!capability) return Response.json({ error: "Unsupported provider" }, { status: 400 });
    if (input.status !== undefined && input.status !== "granted") return Response.json({ error: "Use DELETE to revoke a provider consent" }, { status: 400 });
    const scopes = requestedScopes(input.scopes, capability.scopes);
    const now = new Date().toISOString();
    await current.db.insert(providerConsents).values({ consentVersion: "v1", grantedAt: now, id: crypto.randomUUID(), provider: capability.id, revokedAt: null, scopes: JSON.stringify(scopes), status: "granted", updatedAt: now, userId: current.user.id }).onConflictDoUpdate({
      target: [providerConsents.userId, providerConsents.provider],
      set: { consentVersion: "v1", grantedAt: now, revokedAt: null, scopes: JSON.stringify(scopes), status: "granted", updatedAt: now },
    });
    return Response.json({ consent: { provider: capability.id, scopes, status: "granted" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to record provider consent";
    return Response.json({ error: message }, { status: /scopes|provider/.test(message) ? 400 : 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const current = await account();
    if (!current) return signInRequired();
    const provider = new URL(request.url).searchParams.get("provider");
    if (!provider || !getProviderCapability(provider)) return Response.json({ error: "A supported provider is required" }, { status: 400 });
    const now = new Date().toISOString();
    await current.db.update(providerConsents).set({ revokedAt: now, status: "revoked", updatedAt: now }).where(and(eq(providerConsents.userId, current.user.id), eq(providerConsents.provider, provider)));
    return Response.json({ provider, status: "revoked" });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to revoke provider consent" }, { status: 500 });
  }
}
