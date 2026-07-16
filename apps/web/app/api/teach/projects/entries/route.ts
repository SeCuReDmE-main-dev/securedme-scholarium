import { getDb } from "../../../../../db";
import { getPlatformIdentity, signInRequired } from "../../../../../lib/platform-identity";
import { createProjectEntry, deleteProjectEntry } from "../../../../../lib/teach-social-service";

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    return Response.json({ entry: await createProjectEntry(await getDb(), identity.userId, await request.json() as Record<string, unknown>) }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Project entry could not be created." }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const id = new URL(request.url).searchParams.get("id")?.slice(0, 180) ?? "";
    await deleteProjectEntry(await getDb(), identity.userId, id);
    return Response.json({ deleted: true });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Project entry could not be deleted." }, { status: 403 }); }
}
