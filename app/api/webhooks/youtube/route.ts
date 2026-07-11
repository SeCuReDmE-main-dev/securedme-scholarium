import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { externalIdentities, mediaWebhookEvents } from "../../../../db/schema";
import { sha256Hex, validYouTubeWebhookSignature, youtubeAtomEvent, youtubeTopicChannelId } from "../../../../lib/youtube-webhook";

const MAXIMUM_ATOM_BYTES = 128_000;

async function webhookConfiguration() {
  const { env } = await import("cloudflare:workers");
  return { hmacSecret: env.YOUTUBE_WEBHOOK_HMAC_SECRET as string | undefined, verifyToken: env.YOUTUBE_WEBHOOK_VERIFY_TOKEN as string | undefined };
}

function noStore(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("cache-control", "no-store");
  return new Response(response.body, { headers, status: response.status, statusText: response.statusText });
}

/** PubSubHubbub subscription callback. It is intentionally public but fails closed without configured secrets. */
export async function GET(request: Request) {
  const configuration = await webhookConfiguration();
  if (!configuration.verifyToken) return noStore(Response.json({ error: "YouTube webhook is not configured." }, { status: 503 }));
  const query = new URL(request.url).searchParams;
  const topicChannelId = youtubeTopicChannelId(query.get("hub.topic"));
  if (query.get("hub.mode") !== "subscribe" || query.get("hub.verify_token") !== configuration.verifyToken || !topicChannelId) {
    return noStore(Response.json({ error: "Webhook challenge was not accepted." }, { status: 403 }));
  }
  const challenge = query.get("hub.challenge");
  if (!challenge || challenge.length > 2_048) return noStore(Response.json({ error: "Webhook challenge is missing." }, { status: 400 }));
  return noStore(new Response(challenge, { headers: { "content-type": "text/plain; charset=utf-8" } }));
}

/** Receive only HMAC-authenticated Atom notifications for a previously linked channel. */
export async function POST(request: Request) {
  const configuration = await webhookConfiguration();
  if (!configuration.hmacSecret) return noStore(Response.json({ error: "YouTube webhook is not configured." }, { status: 503 }));
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (!Number.isFinite(contentLength) || contentLength > MAXIMUM_ATOM_BYTES) return noStore(Response.json({ error: "Webhook payload is too large." }, { status: 413 }));
  const atom = await request.text();
  if (new TextEncoder().encode(atom).byteLength > MAXIMUM_ATOM_BYTES) return noStore(Response.json({ error: "Webhook payload is too large." }, { status: 413 }));
  if (!(await validYouTubeWebhookSignature(atom, request.headers.get("x-hub-signature"), configuration.hmacSecret))) {
    return noStore(Response.json({ error: "Webhook signature was not accepted." }, { status: 403 }));
  }
  const event = youtubeAtomEvent(atom);
  if (!event) return noStore(Response.json({ error: "Webhook payload does not contain a supported YouTube event." }, { status: 400 }));
  const db = await getDb();
  const [channel] = await db.select({ userId: externalIdentities.userId }).from(externalIdentities).where(and(eq(externalIdentities.provider, "youtube_channel"), eq(externalIdentities.externalId, event.channelId))).limit(1);
  if (!channel) return noStore(Response.json({ error: "YouTube channel is not linked to a Scholarium account." }, { status: 404 }));
  const payloadHash = await sha256Hex(atom);
  await db.insert(mediaWebhookEvents).values({ deliveryStatus: "recorded", eventType: "youtube_atom", externalEventId: event.videoId, externalSubjectId: event.channelId, id: crypto.randomUUID(), payloadHash, provider: "youtube", receivedAt: new Date().toISOString(), userId: channel.userId }).onConflictDoNothing({ target: [mediaWebhookEvents.provider, mediaWebhookEvents.externalEventId, mediaWebhookEvents.payloadHash] });
  return noStore(Response.json({ event: "recorded", provider: "youtube", videoId: event.videoId }, { status: 202 }));
}
