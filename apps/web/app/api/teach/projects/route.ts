import { getDb } from "../../../../db";
import { teachProjectEntries, teachProjectThreads } from "../../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../../lib/platform-identity";
import { createProjectThread, listProjectThreads } from "../../../../lib/teach-social-service";
import { and, eq } from "drizzle-orm";

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  return Response.json({ projects: await listProjectThreads(await getDb(), identity.userId) }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    return Response.json({ project: await createProjectThread(await getDb(), identity.userId, await request.json() as Record<string, unknown>) }, { status: 201 });
  } catch (error) { return Response.json({ error: error instanceof Error ? error.message : "Project thread could not be created." }, { status: 400 }); }
}

export async function DELETE(request: Request) {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const id = new URL(request.url).searchParams.get("id")?.slice(0, 180) ?? "";
  const db = await getDb();
  const [owned] = await db.select({ id: teachProjectThreads.id }).from(teachProjectThreads).where(and(eq(teachProjectThreads.id, id), eq(teachProjectThreads.ownerUserId, identity.userId))).limit(1);
  if (!owned) return Response.json({ error: "Project thread not found for this owner." }, { status: 404 });
  await db.delete(teachProjectEntries).where(eq(teachProjectEntries.projectId, id));
  await db.delete(teachProjectThreads).where(eq(teachProjectThreads.id, id));
  return Response.json({ deleted: true });
}
