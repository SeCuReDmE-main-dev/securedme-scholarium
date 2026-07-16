import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { teachWeeklyObjectives } from "../../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../../lib/platform-identity";
import { saveWeeklyObjective } from "../../../../lib/teach-assistant-service";

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const objectives = await (await getDb()).select().from(teachWeeklyObjectives).where(eq(teachWeeklyObjectives.userId, identity.userId)).orderBy(desc(teachWeeklyObjectives.weekStart)).limit(52);
  return Response.json({ objectives }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const objective = await saveWeeklyObjective(await getDb(), identity.userId, await request.json() as Record<string, unknown>);
    return Response.json({ objective }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save the weekly objective." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required." }, { status: 400 });
  await (await getDb()).delete(teachWeeklyObjectives).where(and(eq(teachWeeklyObjectives.id, id), eq(teachWeeklyObjectives.userId, identity.userId)));
  return Response.json({ deleted: id });
}
