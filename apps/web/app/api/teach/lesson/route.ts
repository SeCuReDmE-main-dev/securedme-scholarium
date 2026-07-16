import { getDb } from "../../../../db";
import { getPlatformIdentity, signInRequired } from "../../../../lib/platform-identity";
import { assistanceLevels, spanishHourValidationScenario, spanishStarterLesson } from "../../../../lib/teach-contracts";
import { getSpanishSessionState, getTeacherSpanishSummary, recordSpanishAttempt } from "../../../../lib/teach-service";

export async function GET(request: Request) {
  const view = new URL(request.url).searchParams.get("view") ?? "lesson";
  const identity = await getPlatformIdentity();
  if (view === "summary" || view === "state") {
    if (!identity) return signInRequired();
    const db = await getDb();
    const payload = view === "summary"
      ? { summary: await getTeacherSpanishSummary(db, identity.userId) }
      : { state: await getSpanishSessionState(db, identity.userId) };
    return Response.json(payload, { headers: { "cache-control": "private, no-store" } });
  }
  return Response.json({
    lesson: spanishStarterLesson,
    assistanceLevels,
    validationScenario: spanishHourValidationScenario,
    persistenceAvailable: Boolean(identity),
    persistence: "Sign in to persist attempts, delayed review, and exact checkpoints.",
  }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const input = await request.json() as Record<string, unknown>;
    const objectiveId = typeof input.objectiveId === "string" ? input.objectiveId : "";
    const recorded = await recordSpanishAttempt(await getDb(), identity.userId, objectiveId, input);
    return Response.json({ recorded }, { status: 201, headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to record learning attempt.";
    return Response.json({ error: message }, { status: message.includes("Unknown") ? 404 : 400 });
  }
}
