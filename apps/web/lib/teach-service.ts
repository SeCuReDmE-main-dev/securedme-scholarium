import { and, count, desc, eq } from "drizzle-orm";
import {
  learningAttempts,
  learningHints,
  learningObjectives,
  learningQuestions,
  learningReminders,
  teachCheckpoints,
  teachCourses,
  teachLessons,
  teachMediaRequests,
  teachModules,
  users,
} from "../db/schema";
import {
  assistanceLevels,
  assistancePayload,
  evaluateLearningAttempt,
  reminderForState,
  spanishStarterLesson,
  teacherSessionSummary,
  type AssistanceLevel,
  type LearningAttemptInput,
  type MasteryState,
} from "./teach-contracts";
import {
  createSignedMediaJobManifest,
  sourceBoundMediaDraft,
  type TeachMediaGenerationInput,
} from "./teach-media-contracts";

type ScholariumDb = Awaited<ReturnType<typeof import("../db").getDb>>;

function starterIds(userId: string) {
  return {
    courseId: `teach-spanish-${userId}`,
    moduleId: `spanish-foundations-module-${userId}`,
    lessonId: `spanish-daily-conversation-01-${userId}`,
  };
}

export async function ensureSpanishStarterLesson(db: ScholariumDb, userId: string) {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new Error("Create your Scholarium profile before persisting a Teach session.");
  const ids = starterIds(userId);
  const now = new Date().toISOString();

  await db.insert(teachCourses).values({
    id: ids.courseId,
    ownerId: userId,
    title: "Espagnol conversationnel",
    subject: "spanish",
    locale: "es",
    status: "active",
    updatedAt: now,
  }).onConflictDoNothing();
  await db.insert(teachModules).values({
    id: ids.moduleId,
    courseId: ids.courseId,
    title: spanishStarterLesson.module.title,
    position: spanishStarterLesson.module.position,
    status: "active",
    updatedAt: now,
  }).onConflictDoNothing();
  await db.insert(teachLessons).values({
    id: ids.lessonId,
    courseId: ids.courseId,
    moduleId: ids.moduleId,
    title: spanishStarterLesson.title,
    durationMinutes: spanishStarterLesson.durationMinutes,
    status: "active",
    updatedAt: now,
  }).onConflictDoNothing();
  for (const [position, objective] of spanishStarterLesson.objectives.entries()) {
    await db.insert(learningObjectives).values({
      id: `${ids.lessonId}-${objective.id}`,
      lessonId: ids.lessonId,
      notion: objective.notion,
      prompt: objective.prompt,
      targetAnswer: objective.answer,
      translation: objective.translation,
      phoneticHelp: objective.phonetic,
      position,
    }).onConflictDoNothing();
    const objectiveId = `${ids.lessonId}-${objective.id}`;
    await db.insert(learningQuestions).values({
      id: `${objectiveId}-${objective.question.id}`,
      objectiveId,
      prompt: objective.prompt,
      contextKey: objective.question.contextKey,
      kind: objective.question.kind,
      position: 0,
    }).onConflictDoNothing();
    for (const [hintPosition, level] of assistanceLevels.filter((candidate) => candidate !== "wait").entries()) {
      const payload = assistancePayload(objective, level);
      await db.insert(learningHints).values({
        id: `${objectiveId}-${level}`,
        objectiveId,
        assistanceLevel: level,
        content: payload.content.join(" | "),
        position: hintPosition,
        exposesTarget: payload.exposesTarget,
      }).onConflictDoNothing();
    }
  }
  return ids;
}

export async function recordSpanishAttempt(db: ScholariumDb, userId: string, objectiveSlug: string, input: LearningAttemptInput) {
  const ids = await ensureSpanishStarterLesson(db, userId);
  const objective = spanishStarterLesson.objectives.find((candidate) => candidate.id === objectiveSlug);
  if (!objective) throw new Error("Unknown Spanish starter objective.");
  const objectiveId = `${ids.lessonId}-${objective.id}`;
  const now = new Date();
  const [previous] = await db.select({ createdAt: learningAttempts.createdAt, resultingState: learningAttempts.resultingState })
    .from(learningAttempts)
    .where(and(eq(learningAttempts.userId, userId), eq(learningAttempts.objectiveId, objectiveId)))
    .orderBy(desc(learningAttempts.createdAt))
    .limit(1);
  const previousAt = previous ? Date.parse(previous.createdAt) : Number.NaN;
  const recallDelaySeconds = Number.isFinite(previousAt) ? Math.max(0, Math.floor((now.getTime() - previousAt) / 1_000)) : 0;
  const result = evaluateLearningAttempt({
    ...input,
    targetAnswer: objective.answer,
    expectedQuestionId: objective.question.id,
    delayedRecall: recallDelaySeconds >= 600,
    recallDelaySeconds,
    restartedWithoutConfusion: Boolean(previous && previous.resultingState !== "review" && recallDelaySeconds >= 60),
    transferDemonstrated: false,
  });
  const reminder = reminderForState(result.nextState, now);
  const attemptId = crypto.randomUUID();
  const questionId = `${objectiveId}-${objective.question.id}`;

  await db.insert(learningAttempts).values({
    id: attemptId,
    userId,
    objectiveId,
    questionId,
    submittedQuestionId: result.questionId,
    answer: typeof input.answer === "string" ? input.answer.slice(0, 600) : "",
    assistanceLevel: result.assistanceLevel,
    answerMatches: result.answerMatches,
    contextMatched: result.contextMatched,
    delayedRecall: result.delayedRecall,
    restartedWithoutConfusion: result.restartedWithoutConfusion,
    transferDemonstrated: result.transferDemonstrated,
    errorCode: result.errorCode,
    confusionCode: result.confusionCode,
    recallDelaySeconds: result.recallDelaySeconds,
    responseTimeMs: result.responseTimeMs,
    resultingState: result.nextState,
  });
  await db.insert(learningReminders).values({
    id: crypto.randomUUID(),
    userId,
    objectiveId,
    attemptId,
    cadence: reminder.cadence,
    dueAt: reminder.dueAt,
    status: "scheduled",
  });
  await db.insert(teachCheckpoints).values({
    userId,
    lessonId: ids.lessonId,
    objectiveId,
    questionId,
    masteryState: result.nextState,
    assistanceLevel: result.assistanceLevel,
    phase: "attempt",
    sessionElapsedSeconds: Math.floor(result.responseTimeMs / 1_000),
    nextReviewAt: reminder.dueAt,
    updatedAt: now.toISOString(),
  }).onConflictDoUpdate({
    target: teachCheckpoints.userId,
    set: {
      objectiveId,
      questionId,
      masteryState: result.nextState,
      assistanceLevel: result.assistanceLevel,
      phase: "attempt",
      sessionElapsedSeconds: Math.floor(result.responseTimeMs / 1_000),
      nextReviewAt: reminder.dueAt,
      updatedAt: now.toISOString(),
    },
  });
  return { result, reminder, objectiveId, questionId };
}

export async function getSpanishSessionState(db: ScholariumDb, userId: string) {
  const ids = starterIds(userId);
  const [checkpoint] = await db.select().from(teachCheckpoints).where(eq(teachCheckpoints.userId, userId)).limit(1);
  const reminders = await db.select({
    cadence: learningReminders.cadence,
    dueAt: learningReminders.dueAt,
    objectiveId: learningReminders.objectiveId,
    status: learningReminders.status,
  }).from(learningReminders).where(eq(learningReminders.userId, userId)).orderBy(learningReminders.dueAt);
  return { courseId: ids.courseId, lessonId: ids.lessonId, checkpoint: checkpoint ?? null, reminders };
}

export async function getTeacherSpanishSummary(db: ScholariumDb, userId: string) {
  const rows = await db.select({
    assistanceLevel: learningAttempts.assistanceLevel,
    confusionCode: learningAttempts.confusionCode,
    createdAt: learningAttempts.createdAt,
    errorCode: learningAttempts.errorCode,
    objectiveId: learningAttempts.objectiveId,
    recallDelaySeconds: learningAttempts.recallDelaySeconds,
    responseTimeMs: learningAttempts.responseTimeMs,
    resultingState: learningAttempts.resultingState,
    transferDemonstrated: learningAttempts.transferDemonstrated,
  }).from(learningAttempts).where(eq(learningAttempts.userId, userId)).orderBy(learningAttempts.createdAt);
  return teacherSessionSummary(rows.map((row) => ({
    ...row,
    assistanceLevel: row.assistanceLevel as AssistanceLevel,
    resultingState: row.resultingState as MasteryState,
  })));
}

async function mediaDigest(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return `sha256:${[...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export async function prepareTeachMediaRequest(
  db: ScholariumDb,
  userId: string,
  input: TeachMediaGenerationInput & { providerProjectManifestPath?: unknown },
  manifestSecret: string,
) {
  const draft = await sourceBoundMediaDraft(input);
  const requestedDay = new Date().toISOString().slice(0, 10);
  const [usage] = await db.select({ total: count() }).from(teachMediaRequests).where(and(
    eq(teachMediaRequests.userId, userId),
    eq(teachMediaRequests.kind, draft.kind),
    eq(teachMediaRequests.requestedDay, requestedDay),
  ));
  const limit = draft.limit.dailyCount;
  if ((usage?.total ?? 0) >= limit) throw new Error(`Daily ${draft.kind} quota reached.`);
  const requestId = crypto.randomUUID();
  const manifest = await createSignedMediaJobManifest({
    draft,
    providerProjectManifestPath: typeof input.providerProjectManifestPath === "string" ? input.providerProjectManifestPath : undefined,
    requestId,
    secret: manifestSecret,
    userId,
  });
  const manifestDigest = await mediaDigest(JSON.stringify(manifest));
  await db.insert(teachMediaRequests).values({
    id: requestId,
    userId,
    kind: draft.kind,
    sourceRef: draft.source.ref,
    sourceKind: draft.source.kind,
    sourceTitle: draft.source.title,
    sourceContextDigest: await mediaDigest(draft.source.context),
    evidenceRefs: JSON.stringify(draft.source.evidenceRefs),
    sourceIds: JSON.stringify(draft.source.sourceIds),
    scriptDigest: draft.script.digest,
    providerLimitSource: draft.limit.source,
    durationMinutes: draft.durationMinutes,
    manifestExpiresAt: manifest.expiresAt,
    manifestDigest,
    requestedDay,
    status: "prepared",
  });
  return { ...draft, requestId, remainingToday: limit - (usage?.total ?? 0) - 1, manifest, manifestDigest };
}
