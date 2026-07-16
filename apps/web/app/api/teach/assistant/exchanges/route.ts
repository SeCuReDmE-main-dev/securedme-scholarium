import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { teachAssistantExchanges } from "../../../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../../../lib/platform-identity";
import { createAssistantExchange, listAssistantExchanges } from "../../../../../lib/teach-assistant-service";

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  return Response.json({ exchanges: await listAssistantExchanges(await getDb(), identity.userId), rawGraphIncluded: false }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const result = await createAssistantExchange(await getDb(), identity.userId, await request.json() as Record<string, unknown>);
    return Response.json(result, { status: result.idempotentReplay ? 200 : 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to prepare the assistant exchange." }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const input = await request.json() as Record<string, unknown>;
  const id = typeof input.id === "string" ? input.id.trim().slice(0, 180) : "";
  if (!id) return Response.json({ error: "id is required." }, { status: 400 });
  const db = await getDb();
  const [exchange] = await db.select({ expiresAt: teachAssistantExchanges.expiresAt }).from(teachAssistantExchanges).where(and(
    eq(teachAssistantExchanges.id, id),
    eq(teachAssistantExchanges.recipientUserId, identity.userId),
  )).limit(1);
  if (!exchange) return Response.json({ error: "Assistant exchange not found." }, { status: 404 });
  if (Date.parse(exchange.expiresAt) <= Date.now()) return Response.json({ error: "Assistant exchange expired." }, { status: 410 });
  const receivedAt = new Date().toISOString();
  await db.update(teachAssistantExchanges).set({ status: "received", receivedAt }).where(eq(teachAssistantExchanges.id, id));
  return Response.json({ id, status: "received", receivedAt, receipt: true });
}
