import { and, desc, eq, isNotNull } from "drizzle-orm";
import { getDb } from "../../../db";
import { profileVerifications, quantechRenderRequests, users } from "../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";
import { prepareQuantechRenderRequest, type QuantechRenderInput } from "../../../lib/quantech-render-request";

async function currentAccount() {
  const identity = await getPlatformIdentity();
  if (!identity) return null;
  const db = await getDb();
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1);
  return user ? { db, user } : null;
}

export async function GET() {
  try {
    const account = await currentAccount();
    if (!account) return signInRequired();
    const requests = await account.db
      .select({
        aspect: quantechRenderRequests.aspect,
        createdAt: quantechRenderRequests.createdAt,
        entitlementStatus: quantechRenderRequests.entitlementStatus,
        handoffUrl: quantechRenderRequests.handoffUrl,
        id: quantechRenderRequests.id,
        provider: quantechRenderRequests.provider,
        qualityPreset: quantechRenderRequests.qualityPreset,
        reviewMode: quantechRenderRequests.reviewMode,
        scriptDigest: quantechRenderRequests.scriptDigest,
        sourceUrlCount: quantechRenderRequests.sourceUrlCount,
        status: quantechRenderRequests.status,
      })
      .from(quantechRenderRequests)
      .where(eq(quantechRenderRequests.userId, account.user.id))
      .orderBy(desc(quantechRenderRequests.createdAt))
      .limit(12);
    return Response.json({ requests }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load QuaNTecH request history" }, { status: 500 });
  }
}

/** Prepares a minimal provider handoff contract. No raw script, file, token, or ranking state is forwarded here. */
export async function POST(request: Request) {
  let input: QuantechRenderInput;
  try {
    input = (await request.json()) as QuantechRenderInput;
  } catch {
    return Response.json({ error: "A valid QuaNTecH render request is required." }, { status: 400 });
  }

  if (input.aspect !== undefined && input.aspect !== "landscape" && input.aspect !== "portrait" && input.aspect !== "square") return Response.json({ error: "aspect must be landscape, portrait, or square" }, { status: 400 });
  if (input.script !== undefined && typeof input.script !== "string") return Response.json({ error: "script must be plain text" }, { status: 400 });
  if (input.title !== undefined && typeof input.title !== "string") return Response.json({ error: "title must be plain text" }, { status: 400 });
  if (input.qualityPreset !== undefined && input.qualityPreset !== "standard" && input.qualityPreset !== "high") return Response.json({ error: "qualityPreset must be standard or high" }, { status: 400 });
  if (input.reviewMode !== undefined && input.reviewMode !== "none" && input.reviewMode !== "local_videoprism") return Response.json({ error: "reviewMode must be none or local_videoprism" }, { status: 400 });

  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();

    const db = await getDb();
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1);
    if (!user) return Response.json({ error: "Create your Scholarium profile before preparing a QuaNTecH handoff." }, { status: 404 });

    const [verification] = await db
      .select({ status: profileVerifications.status, passkeyVerifiedAt: profileVerifications.passkeyVerifiedAt })
      .from(profileVerifications)
      .where(and(eq(profileVerifications.userId, user.id), isNotNull(profileVerifications.passkeyVerifiedAt)))
      .limit(1);

    const prepared = await prepareQuantechRenderRequest(input, {
      accountReady: true,
      documentStatus: verification?.status ?? null,
      passkeyVerifiedAt: verification?.passkeyVerifiedAt ?? null,
    });

    await db.insert(quantechRenderRequests).values({
      aspect: input.aspect === "portrait" || input.aspect === "square" ? input.aspect : "landscape",
      entitlementStatus: prepared.entitlement.status,
      handoffUrl: prepared.handoffUrl,
      id: prepared.requestId,
      provider: prepared.provider,
      qualityPreset: input.qualityPreset === "high" ? "high" : "standard",
      reviewMode: input.reviewMode === "local_videoprism" ? "local_videoprism" : "none",
      scriptDigest: prepared.payloadBoundary.scriptDigest,
      sourceUrlCount: prepared.payloadBoundary.sourceUrlCount,
      status: prepared.status,
      userId: user.id,
    });

    return Response.json({ prepared }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to prepare QuaNTecH render request" }, { status: 500 });
  }
}
