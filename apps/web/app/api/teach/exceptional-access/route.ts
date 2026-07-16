import { getDb } from "../../../../db";
import { getPlatformIdentity, signInRequired } from "../../../../lib/platform-identity";
import { consumeExceptionalAccessRequest, createExceptionalAccessRequest, listExceptionalAccess } from "../../../../lib/teach-exceptional-access-service";

export async function GET() {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    return Response.json(await listExceptionalAccess(await getDb(), identity.userId), { headers: { "cache-control": "private, no-store" } });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Exceptional access denied." }, { status: 403 }); }
}

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    return Response.json({ request: await createExceptionalAccessRequest(await getDb(), identity.userId, await request.json() as Record<string, unknown>) }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Exceptional access request rejected." }, { status: 400 }); }
}

export async function PUT(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    return Response.json(await consumeExceptionalAccessRequest(await getDb(), identity.userId, await request.json() as Record<string, unknown>));
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Exceptional access not admitted." }, { status: 403 }); }
}
