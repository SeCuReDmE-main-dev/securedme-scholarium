import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { teachAssistantGraphRecords } from "../../../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../../../lib/platform-identity";
import { createAssistantGraphRecord, studentAssistantHome } from "../../../../../lib/teach-assistant-service";

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  return Response.json(await studentAssistantHome(await getDb(), identity.userId), { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const record = await createAssistantGraphRecord(await getDb(), identity.userId, await request.json() as Record<string, unknown>);
    return Response.json({ record }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to create the private assistant record." }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required." }, { status: 400 });
  await (await getDb()).delete(teachAssistantGraphRecords).where(and(eq(teachAssistantGraphRecords.id, id), eq(teachAssistantGraphRecords.userId, identity.userId)));
  return Response.json({ deleted: id });
}
