import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { mediaWebhookEvents, users } from "../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

/** Owner-only evidence that a configured provider callback reached Scholarium. */
export async function GET(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const provider = new URL(request.url).searchParams.get("provider") ?? "youtube";
    if (provider !== "youtube") return Response.json({ error: "Unsupported media provider" }, { status: 400 });

    const db = await getDb();
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1);
    if (!user) return Response.json({ error: "Create a Scholarium account before reading provider delivery traces" }, { status: 404 });

    const events = await db.select({ channelId: mediaWebhookEvents.externalSubjectId, eventType: mediaWebhookEvents.eventType, receivedAt: mediaWebhookEvents.receivedAt, status: mediaWebhookEvents.deliveryStatus, videoId: mediaWebhookEvents.externalEventId }).from(mediaWebhookEvents).where(and(eq(mediaWebhookEvents.userId, user.id), eq(mediaWebhookEvents.provider, provider))).orderBy(desc(mediaWebhookEvents.receivedAt)).limit(20);
    return Response.json({ events, provider, retention: "The raw provider payload is never retained; this is a minimal owner-only delivery trace." }, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    console.error("Provider webhook trace read failed", { message: error instanceof Error ? error.message : "Unknown error" });
    return Response.json({ error: "Unable to read provider delivery traces" }, { status: 500 });
  }
}
