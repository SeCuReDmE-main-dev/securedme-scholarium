import { getDb } from "../../../../db";
import { getPlatformIdentity, signInRequired } from "../../../../lib/platform-identity";
import { createRecognition, listRecognitions, reviewRecognition } from "../../../../lib/teach-social-service";

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  return Response.json({ recognitions: await listRecognitions(await getDb(), identity.userId) }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    return Response.json({ recognition: await createRecognition(await getDb(), identity.userId, await request.json() as Record<string, unknown>) }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Recognition could not be created." }, { status: 400 }); }
}

export async function PUT(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    return Response.json({ recognition: await reviewRecognition(await getDb(), identity.userId, await request.json() as Record<string, unknown>) });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Recognition review could not be saved." }, { status: 403 }); }
}
