import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { teachGate5Jobs, teachPurposeConsents } from "../../../../db/schema";
import { createGate5Envelope, gate5AdapterRegistry, type Gate5AdapterId } from "../../../../lib/teach-gate5-contracts";
import { getPlatformIdentity, signInRequired } from "../../../../lib/platform-identity";

async function gate5Secret() {
  const { env } = await import("cloudflare:workers");
  const value = env.SCHOLARIUM_GATE5_SECRET as string | undefined;
  return typeof value === "string" && value.length >= 32 ? value : null;
}

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const secret = await gate5Secret();
    if (!secret) return Response.json({ error: "The private Gate5 signing boundary is not configured." }, { status: 503 });
    const input = await request.json() as Record<string, unknown>;
    const consentReceiptId = typeof input.consentReceiptId === "string" ? input.consentReceiptId : "";
    const db = await getDb();
    const [consent] = await db.select().from(teachPurposeConsents).where(and(
      eq(teachPurposeConsents.id, consentReceiptId),
      eq(teachPurposeConsents.userId, identity.userId),
      eq(teachPurposeConsents.status, "granted"),
    )).limit(1);
    if (!consent || (consent.expiresAt && Date.parse(consent.expiresAt) <= Date.now())) return Response.json({ error: "An active owned Teach consent receipt is required." }, { status: 403 });

    const target = String(input.target ?? "") as Gate5AdapterId;
    const envelope = await createGate5Envelope({
      consentReceiptId,
      idempotencyKey: String(input.idempotencyKey ?? ""),
      payload: input.payload,
      purpose: String(input.purpose ?? ""),
      requestId: String(input.requestId ?? ""),
      secret,
      subjectId: identity.userId,
      target,
      tenantId: identity.userId,
    });
    const id = crypto.randomUUID();
    await db.insert(teachGate5Jobs).values({
      id,
      userId: identity.userId,
      target: envelope.target,
      capability: gate5AdapterRegistry[envelope.target].capability,
      requestDigest: envelope.requestDigest,
      idempotencyKey: envelope.idempotencyKey,
      nonce: envelope.nonce,
      envelope: JSON.stringify(envelope),
      expiresAt: envelope.expiresAt,
    }).onConflictDoNothing();
    const [job] = await db.select().from(teachGate5Jobs).where(and(
      eq(teachGate5Jobs.userId, identity.userId), eq(teachGate5Jobs.idempotencyKey, envelope.idempotencyKey),
    )).limit(1);
    if (!job) throw new Error("Gate5 could not persist the pseudonymous outbox job.");
    if (job.requestDigest !== envelope.requestDigest) return Response.json({ error: "Idempotency key is already bound to another Gate5 request." }, { status: 409 });
    return Response.json({
      receipt: {
        schema: "scholarium.gate5-outbox-receipt.v1",
        jobId: job.id,
        target: job.target,
        capability: job.capability,
        requestDigest: job.requestDigest,
        status: job.status,
        expiresAt: job.expiresAt,
        externalAdapterReceivesUserId: false,
      },
    }, { status: job.id === id ? 202 : 200, headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "A valid Gate5 request is required." }, { status: 400 });
  }
}
