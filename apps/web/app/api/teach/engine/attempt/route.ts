import { getDb } from "../../../../../db";
import { submitEngineAttempt } from "../../../../../lib/teach-engine-service";
import { getPlatformIdentity, signInRequired } from "../../../../../lib/platform-identity";

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const idempotencyKey = request.headers.get("idempotency-key") ?? "";
    const input = await request.json() as Record<string, unknown>;
    const result = await submitEngineAttempt(await getDb(), identity.userId, { ...input, idempotencyKey });
    return Response.json(result, { status: result.replayed ? 200 : 201, headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to submit the attempt.";
    // A reused idempotency key with different content is a state conflict, not
    // malformed input. Clients must create a new attempt key after correcting it.
    const status = message.includes("idempotency") ? 409 : message.includes("circuit") || message.includes("configured") ? 503 : 409;
    return Response.json({ error: message, canonicalProgressChanged: false }, { status, headers: { "cache-control": "private, no-store" } });
  }
}
