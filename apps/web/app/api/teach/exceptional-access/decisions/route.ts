import { getDb } from "../../../../../db";
import { getPlatformIdentity, signInRequired } from "../../../../../lib/platform-identity";
import { decideExceptionalAccessRequest } from "../../../../../lib/teach-exceptional-access-service";

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    return Response.json(await decideExceptionalAccessRequest(await getDb(), identity.userId, await request.json() as Record<string, unknown>));
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Exceptional access decision rejected." }, { status: 403 }); }
}
