import { getDb } from "../../../../db";
import { getPlatformIdentity, signInRequired } from "../../../../lib/platform-identity";
import { buildLearningRecap } from "../../../../lib/teach-social-service";

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    return Response.json({ recap: await buildLearningRecap(await getDb(), identity.userId, await request.json() as Record<string, unknown>) }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Learning recap could not be built." }, { status: 400 }); }
}
