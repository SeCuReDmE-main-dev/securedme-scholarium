import { getDb } from "../../../../db";
import { getPlatformIdentity, signInRequired } from "../../../../lib/platform-identity";
import { addCircleMember, createLearningCircle, listLearningCircles } from "../../../../lib/teach-social-service";

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  return Response.json({ circles: await listLearningCircles(await getDb(), identity.userId) }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    return Response.json({ circle: await createLearningCircle(await getDb(), identity.userId, await request.json() as Record<string, unknown>) }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Learning circle could not be created." }, { status: 400 }); }
}

export async function PUT(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    return Response.json({ membership: await addCircleMember(await getDb(), identity.userId, await request.json() as Record<string, unknown>) });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Circle invitation could not be completed." }, { status: 403 }); }
}
