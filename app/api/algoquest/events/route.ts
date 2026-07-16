import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { algoquestLearningEvents } from "../../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../../lib/platform-identity";
import { teachSchemaVersions } from "../../../../lib/teach-contracts";

function safeText(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const events = await (await getDb()).select({
    id: algoquestLearningEvents.id, eventType: algoquestLearningEvents.eventType, artifactRef: algoquestLearningEvents.artifactRef,
    purpose: algoquestLearningEvents.purpose, status: algoquestLearningEvents.status, createdAt: algoquestLearningEvents.createdAt,
  }).from(algoquestLearningEvents).where(eq(algoquestLearningEvents.userId, identity.userId)).orderBy(desc(algoquestLearningEvents.createdAt)).limit(50);
  return Response.json({ events }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const input = await request.json() as Record<string, unknown>;
  const artifactRef = safeText(input.artifactRef, 300);
  const eventType = safeText(input.eventType, 80);
  const purpose = safeText(input.purpose, 200);
  const idempotencyKey = safeText(input.idempotencyKey, 160);
  if (!artifactRef || !eventType || !purpose || !idempotencyKey) return Response.json({ error: "artifactRef, eventType, purpose, and idempotencyKey are required." }, { status: 400 });
  const db = await getDb();
  const [existing] = await db.select({ id: algoquestLearningEvents.id }).from(algoquestLearningEvents).where(and(eq(algoquestLearningEvents.userId, identity.userId), eq(algoquestLearningEvents.idempotencyKey, idempotencyKey))).limit(1);
  if (existing) return Response.json({ eventId: existing.id, idempotentReplay: true });
  const eventId = crypto.randomUUID();
  await db.insert(algoquestLearningEvents).values({
    id: eventId, userId: identity.userId, eventType, artifactRef, purpose, idempotencyKey,
    payload: JSON.stringify({ schema: teachSchemaVersions.algoquestEvent, rawSecretStored: false }), status: "pending",
  });
  return Response.json({ eventId, idempotentReplay: false, schema: teachSchemaVersions.algoquestEvent }, { status: 201 });
}
