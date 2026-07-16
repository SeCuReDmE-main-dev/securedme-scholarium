import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { teachPurposeConsents } from "../../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../../lib/platform-identity";

const purposes = ["learning", "personalization", "profiling", "sharing", "media"] as const;

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const consents = await (await getDb()).select().from(teachPurposeConsents).where(eq(teachPurposeConsents.userId, identity.userId));
  return Response.json({ consents, supportedPurposes: purposes }, { headers: { "cache-control": "private, no-store" } });
}

export async function PUT(request: Request) {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const input = await request.json() as Record<string, unknown>;
  const purpose = typeof input.purpose === "string" && purposes.includes(input.purpose as typeof purposes[number]) ? input.purpose as typeof purposes[number] : null;
  if (!purpose) return Response.json({ error: "A supported Teach purpose is required." }, { status: 400 });
  const expiresAt = typeof input.expiresAt === "string" && Number.isFinite(Date.parse(input.expiresAt)) ? new Date(input.expiresAt).toISOString() : null;
  const now = new Date().toISOString();
  const db = await getDb();
  await db.insert(teachPurposeConsents).values({ id: crypto.randomUUID(), userId: identity.userId, purpose, status: "granted", expiresAt, grantedAt: now, updatedAt: now }).onConflictDoUpdate({
    target: [teachPurposeConsents.userId, teachPurposeConsents.purpose],
    set: { status: "granted", expiresAt, grantedAt: now, revokedAt: null, updatedAt: now },
  });
  return Response.json({ purpose, status: "granted", expiresAt });
}

export async function DELETE(request: Request) {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const purpose = new URL(request.url).searchParams.get("purpose");
  if (!purpose || !purposes.includes(purpose as typeof purposes[number])) return Response.json({ error: "A supported purpose is required." }, { status: 400 });
  const revokedAt = new Date().toISOString();
  await (await getDb()).update(teachPurposeConsents).set({ status: "revoked", revokedAt, updatedAt: revokedAt }).where(and(eq(teachPurposeConsents.userId, identity.userId), eq(teachPurposeConsents.purpose, purpose)));
  return Response.json({ purpose, status: "revoked", revokedAt });
}
