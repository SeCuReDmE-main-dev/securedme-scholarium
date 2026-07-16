import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { teachMediaRequests } from "../../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../../lib/platform-identity";
import { mediaDailyLimits } from "../../../../lib/teach-contracts";
import { prepareTeachMediaRequest } from "../../../../lib/teach-service";

async function mediaManifestSecret() {
  const { env } = await import("cloudflare:workers");
  const value = env.SCHOLARIUM_MEDIA_MANIFEST_SECRET as string | undefined;
  return typeof value === "string" && value.length >= 32 ? value : null;
}

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const requests = await (await getDb()).select().from(teachMediaRequests).where(eq(teachMediaRequests.userId, identity.userId)).orderBy(desc(teachMediaRequests.createdAt)).limit(20);
  return Response.json({ limits: mediaDailyLimits, requests }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const secret = await mediaManifestSecret();
    if (!secret) return Response.json({ error: "The private media worker signing key is not configured." }, { status: 503 });
    const prepared = await prepareTeachMediaRequest(await getDb(), identity.userId, await request.json(), secret);
    return Response.json({ prepared }, { status: 201, headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to prepare Teach media.";
    return Response.json({ error: message }, { status: message.includes("quota") ? 429 : 400 });
  }
}
