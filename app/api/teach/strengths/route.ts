import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { strengthObservations } from "../../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../../lib/platform-identity";
import { soccerMathBridge, strengthObservationContract } from "../../../../lib/teach-contracts";

function safeText(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export async function GET() {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const observations = await (await getDb()).select().from(strengthObservations).where(eq(strengthObservations.userId, identity.userId)).orderBy(desc(strengthObservations.updatedAt));
  return Response.json({ observations, exampleBridge: soccerMathBridge() }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const observation = strengthObservationContract(await request.json());
    if (!observation.category || !observation.statement || !observation.evidence) return Response.json({ error: "category, statement, and evidence are required." }, { status: 400 });
    const now = new Date().toISOString();
    const proposedExpiry = new Date(Date.now() + 90 * 24 * 60 * 60 * 1_000).toISOString();
    const record = {
      id: crypto.randomUUID(), userId: identity.userId, category: observation.category, statement: observation.statement,
      evidence: observation.evidence, contradiction: observation.contradiction, confidenceBasisPoints: Math.round(observation.confidence * 10_000),
      learnerCorrection: observation.learnerCorrection, sourceKind: observation.sourceKind, status: observation.status,
      expiresAt: observation.expiresAt ?? (observation.status === "pending_student_review" ? proposedExpiry : null), createdAt: now, updatedAt: now,
    };
    await (await getDb()).insert(strengthObservations).values(record);
    return Response.json({ observation: record, authorityBoundary: observation.authorityBoundary }, { status: 201 });
  } catch {
    return Response.json({ error: "A valid strength observation is required." }, { status: 400 });
  }
}

export async function PUT(request: Request) {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const input = await request.json() as Record<string, unknown>;
  const id = safeText(input.id, 180);
  const legacyStatus = typeof input.status === "string" && ["active", "contested", "expired", "pending_student_review"].includes(input.status) ? input.status : "";
  const action = typeof input.action === "string" && ["accept", "reformulate", "contest", "expire"].includes(input.action) ? input.action : "";
  const status = action === "accept" || action === "reformulate" ? "active" : action === "contest" ? "contested" : action === "expire" ? "expired" : legacyStatus;
  const statement = safeText(input.statement, 500);
  const learnerCorrection = safeText(input.learnerCorrection, 1_200);
  if (!id || !status || (action === "reformulate" && (!statement || !learnerCorrection))) return Response.json({ error: "id and accept, reformulate, contest, or expire are required; reformulation also needs statement and learnerCorrection." }, { status: 400 });
  const db = await getDb();
  const [existing] = await db.select({ id: strengthObservations.id }).from(strengthObservations).where(and(eq(strengthObservations.id, id), eq(strengthObservations.userId, identity.userId))).limit(1);
  if (!existing) return Response.json({ error: "Strength observation not found." }, { status: 404 });
  const update = {
    status,
    ...(statement ? { statement } : {}),
    ...(learnerCorrection ? { learnerCorrection } : {}),
    ...(status === "expired" ? { expiresAt: new Date().toISOString() } : {}),
    updatedAt: new Date().toISOString(),
  };
  await db.update(strengthObservations).set(update).where(eq(strengthObservations.id, id));
  return Response.json({ id, status, learnerControlled: true });
}

export async function DELETE(request: Request) {
  const identity = await getPlatformIdentity();
  if (!identity) return signInRequired();
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return Response.json({ error: "id is required." }, { status: 400 });
  await (await getDb()).delete(strengthObservations).where(and(eq(strengthObservations.id, id), eq(strengthObservations.userId, identity.userId)));
  return Response.json({ deleted: id });
}
