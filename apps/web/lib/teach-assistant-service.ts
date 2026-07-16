import { and, desc, eq, inArray, or } from "drizzle-orm";
import {
  learningAttempts,
  roleAssignments,
  strengthObservations,
  teachAssistantExchanges,
  teachAssistantGraphRecords,
  teachCourses,
  teachEnrollments,
  teachInterventionPreferences,
  teachPurposeConsents,
  teachWeeklyObjectives,
} from "../db/schema";
import {
  adminAssistantProjection,
  assistantExchangeEnvelopeContract,
  assistantGraphRecordContract,
  interventionPreferencesContract,
  masteryStates,
  teacherSessionSummary,
  weeklyObjectiveContract,
  type AssistanceLevel,
  type MasteryState,
} from "./teach-contracts";

type ScholariumDb = Awaited<ReturnType<typeof import("../db").getDb>>;

function parseStringArray(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

async function stablePseudonym(scope: string, userId: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${scope}:${userId}`));
  return `learner_${[...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 20)}`;
}

export async function studentAssistantHome(db: ScholariumDb, userId: string) {
  const now = Date.now();
  const [graphRows, objectives, preferences] = await Promise.all([
    db.select().from(teachAssistantGraphRecords).where(and(eq(teachAssistantGraphRecords.userId, userId), eq(teachAssistantGraphRecords.status, "active"))).orderBy(desc(teachAssistantGraphRecords.updatedAt)).limit(100),
    db.select().from(teachWeeklyObjectives).where(eq(teachWeeklyObjectives.userId, userId)).orderBy(desc(teachWeeklyObjectives.weekStart)).limit(52),
    db.select().from(teachInterventionPreferences).where(eq(teachInterventionPreferences.userId, userId)).limit(1),
  ]);
  return {
    schema: "scholarium.student-assistant-home.v1",
    graph: graphRows.filter((row) => !row.expiresAt || Date.parse(row.expiresAt) > now),
    weeklyObjectives: objectives,
    interventionPreferences: preferences[0]
      ? interventionPreferencesContract({ ...preferences[0], contexts: parseStringArray(preferences[0].contexts) })
      : interventionPreferencesContract({}),
    visibility: "private_owner_only",
    authorityBoundary: "The learner owns this graph. Other assistants receive only explicit bounded projections.",
  };
}

export async function createAssistantGraphRecord(db: ScholariumDb, userId: string, input: Record<string, unknown>) {
  const record = assistantGraphRecordContract(input);
  if (!record.subjectRef || !record.summary || !record.provenanceRef) throw new Error("subjectRef, summary, and provenanceRef are required.");
  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  await db.insert(teachAssistantGraphRecords).values({
    id,
    userId,
    recordKind: record.recordKind,
    subjectRef: record.subjectRef,
    summary: record.summary,
    provenanceRef: record.provenanceRef,
    status: "active",
    expiresAt: record.expiresAt,
    createdAt: now,
    updatedAt: now,
  });
  return { id, ...record };
}

async function studentProjection(db: ScholariumDb, userId: string) {
  const [attempts, strengths, objectives] = await Promise.all([
    db.select({ confusionCode: learningAttempts.confusionCode, resultingState: learningAttempts.resultingState }).from(learningAttempts).where(eq(learningAttempts.userId, userId)),
    db.select({ category: strengthObservations.category }).from(strengthObservations).where(and(eq(strengthObservations.userId, userId), eq(strengthObservations.status, "active"))),
    db.select({ id: teachWeeklyObjectives.id }).from(teachWeeklyObjectives).where(and(eq(teachWeeklyObjectives.userId, userId), or(eq(teachWeeklyObjectives.status, "planned"), eq(teachWeeklyObjectives.status, "active")))),
  ]);
  const objectiveStateCounts = Object.fromEntries(masteryStates.map((state) => [state, attempts.filter((row) => row.resultingState === state).length]));
  return {
    objectiveStateCounts,
    confusionCodes: [...new Set(attempts.map((row) => row.confusionCode).filter((code) => code !== "none"))],
    acceptedStrengthCategories: [...new Set(strengths.map((row) => row.category))],
    weeklyObjectiveCount: objectives.length,
  };
}

async function activeEnrollment(db: ScholariumDb, courseId: string, userId: string, role: string) {
  const [row] = await db.select({ id: teachEnrollments.id }).from(teachEnrollments).where(and(
    eq(teachEnrollments.courseId, courseId),
    eq(teachEnrollments.userId, userId),
    eq(teachEnrollments.role, role),
    eq(teachEnrollments.status, "active"),
  )).limit(1);
  return Boolean(row);
}

export async function createAssistantExchange(db: ScholariumDb, senderUserId: string, input: Record<string, unknown>) {
  const courseId = typeof input.courseId === "string" ? input.courseId.trim().slice(0, 180) : "";
  const recipientUserId = typeof input.recipientUserId === "string" ? input.recipientUserId.trim().slice(0, 180) : "";
  const senderRole = input.senderRole === "teacher_assistant" ? "teacher_assistant" : "student_assistant";
  const recipientRole = senderRole === "student_assistant" ? "teacher_assistant" : "student_assistant";
  if (!courseId || !recipientUserId || recipientUserId === senderUserId) throw new Error("A distinct recipient and course are required.");
  const senderEnrollmentRole = senderRole === "student_assistant" ? "student" : "teacher";
  const recipientEnrollmentRole = recipientRole === "student_assistant" ? "student" : "teacher";
  if (!await activeEnrollment(db, courseId, senderUserId, senderEnrollmentRole) || !await activeEnrollment(db, courseId, recipientUserId, recipientEnrollmentRole)) {
    throw new Error("Both assistants require an active relationship in the same course.");
  }

  const consentUserId = senderRole === "student_assistant" ? senderUserId : recipientUserId;
  const consentReceiptId = typeof input.consentReceiptId === "string" ? input.consentReceiptId.trim().slice(0, 160) : "";
  const [consent] = await db.select({ id: teachPurposeConsents.id, expiresAt: teachPurposeConsents.expiresAt }).from(teachPurposeConsents).where(and(
    eq(teachPurposeConsents.id, consentReceiptId),
    eq(teachPurposeConsents.userId, consentUserId),
    eq(teachPurposeConsents.purpose, "sharing"),
    eq(teachPurposeConsents.status, "granted"),
  )).limit(1);
  if (!consent || (consent.expiresAt && Date.parse(consent.expiresAt) <= Date.now())) throw new Error("An active learner sharing consent receipt is required.");

  const requestedExpiry = typeof input.expiresAt === "string" ? Date.parse(input.expiresAt) : Number.NaN;
  const maximumExpiry = Date.now() + 7 * 24 * 60 * 60 * 1_000;
  if (!Number.isFinite(requestedExpiry) || requestedExpiry <= Date.now() || requestedExpiry > maximumExpiry) throw new Error("expiresAt must be within the next seven days.");
  const projection = senderRole === "student_assistant"
    ? await studentProjection(db, senderUserId)
    : { recommendation: input.recommendation };
  const envelope = assistantExchangeEnvelopeContract({
    ...input,
    senderRole,
    recipientRole,
    projection,
    consentReceiptId,
  });
  if (!envelope.valid || !envelope.idempotencyKey) throw new Error("A valid purpose, expiry, and idempotency key are required.");

  const [existing] = await db.select({ id: teachAssistantExchanges.id }).from(teachAssistantExchanges).where(and(
    eq(teachAssistantExchanges.senderUserId, senderUserId),
    eq(teachAssistantExchanges.idempotencyKey, envelope.idempotencyKey),
  )).limit(1);
  if (existing) return { exchangeId: existing.id, idempotentReplay: true, envelope };

  const exchangeId = crypto.randomUUID();
  await db.insert(teachAssistantExchanges).values({
    id: exchangeId,
    senderUserId,
    recipientUserId,
    courseId,
    senderRole,
    recipientRole,
    purpose: envelope.purpose,
    projection: JSON.stringify(envelope.projection),
    consentReceiptId,
    idempotencyKey: envelope.idempotencyKey,
    expiresAt: envelope.expiresAt,
    status: "prepared",
  });
  return { exchangeId, idempotentReplay: false, envelope };
}

export async function listAssistantExchanges(db: ScholariumDb, userId: string) {
  const now = new Date().toISOString();
  const rows = await db.select().from(teachAssistantExchanges).where(or(
    eq(teachAssistantExchanges.senderUserId, userId),
    eq(teachAssistantExchanges.recipientUserId, userId),
  )).orderBy(desc(teachAssistantExchanges.createdAt)).limit(100);
  return rows.filter((row) => row.expiresAt > now).map((row) => ({
    id: row.id,
    courseId: row.courseId,
    senderRole: row.senderRole,
    recipientRole: row.recipientRole,
    purpose: row.purpose,
    projection: JSON.parse(row.projection) as unknown,
    expiresAt: row.expiresAt,
    status: row.status,
    createdAt: row.createdAt,
    receivedAt: row.receivedAt,
    direction: row.senderUserId === userId ? "sent" : "received",
    rawGraphIncluded: false,
  }));
}

export async function teacherAssistantView(db: ScholariumDb, teacherUserId: string) {
  const teacherCourses = await db.select({ courseId: teachEnrollments.courseId }).from(teachEnrollments).where(and(
    eq(teachEnrollments.userId, teacherUserId),
    eq(teachEnrollments.role, "teacher"),
    eq(teachEnrollments.status, "active"),
  ));
  const courseIds = [...new Set(teacherCourses.map((row) => row.courseId))];
  if (!courseIds.length) return { schema: "scholarium.teacher-assistant-view.v1", learners: [], rawGraphIncluded: false, rawAnswersIncluded: false };
  const enrollments = await db.select({ courseId: teachEnrollments.courseId, userId: teachEnrollments.userId }).from(teachEnrollments).where(and(
    inArray(teachEnrollments.courseId, courseIds),
    eq(teachEnrollments.role, "student"),
    eq(teachEnrollments.status, "active"),
  ));
  const enrolledStudentIds = [...new Set(enrollments.map((row) => row.userId))];
  const learningConsents = enrolledStudentIds.length ? await db.select({ expiresAt: teachPurposeConsents.expiresAt, userId: teachPurposeConsents.userId }).from(teachPurposeConsents).where(and(
    inArray(teachPurposeConsents.userId, enrolledStudentIds),
    eq(teachPurposeConsents.purpose, "learning"),
    eq(teachPurposeConsents.status, "granted"),
  )) : [];
  const studentIds = [...new Set(learningConsents.filter((row) => !row.expiresAt || Date.parse(row.expiresAt) > Date.now()).map((row) => row.userId))];
  const rows = studentIds.length ? await db.select({
    userId: learningAttempts.userId,
    assistanceLevel: learningAttempts.assistanceLevel,
    confusionCode: learningAttempts.confusionCode,
    createdAt: learningAttempts.createdAt,
    errorCode: learningAttempts.errorCode,
    objectiveId: learningAttempts.objectiveId,
    recallDelaySeconds: learningAttempts.recallDelaySeconds,
    responseTimeMs: learningAttempts.responseTimeMs,
    resultingState: learningAttempts.resultingState,
    transferDemonstrated: learningAttempts.transferDemonstrated,
  }).from(learningAttempts).where(inArray(learningAttempts.userId, studentIds)) : [];
  const learners = await Promise.all(studentIds.map(async (studentId) => ({
    learnerPseudonym: await stablePseudonym(`teacher:${teacherUserId}`, studentId),
    summary: teacherSessionSummary(rows.filter((row) => row.userId === studentId).map((row) => ({
      ...row,
      assistanceLevel: row.assistanceLevel as AssistanceLevel,
      resultingState: row.resultingState as MasteryState,
    }))),
  })));
  return {
    schema: "scholarium.teacher-assistant-view.v1",
    learners,
    rawGraphIncluded: false,
    rawAnswersIncluded: false,
    authorityBoundary: "The teacher assistant supplies bounded pedagogical summaries for human review, never autonomous grading or discipline.",
  };
}

export async function administrativeAssistantView(db: ScholariumDb, userId: string) {
  const administrativeRoles = ["administrator", "school_admin", "commission_admin"];
  const [assignment] = await db.select({ organizationId: roleAssignments.organizationId, role: roleAssignments.role }).from(roleAssignments).where(and(
    eq(roleAssignments.userId, userId),
    eq(roleAssignments.status, "active"),
    inArray(roleAssignments.role, administrativeRoles),
  )).limit(1);
  if (!assignment?.organizationId) throw new Error("An active administrative organization role is required.");
  const courses = await db.select({ id: teachCourses.id }).from(teachCourses).where(eq(teachCourses.organizationId, assignment.organizationId));
  const courseIds = courses.map((row) => row.id);
  const students = courseIds.length ? await db.select({ userId: teachEnrollments.userId }).from(teachEnrollments).where(and(
    inArray(teachEnrollments.courseId, courseIds),
    eq(teachEnrollments.role, "student"),
    eq(teachEnrollments.status, "active"),
  )) : [];
  const enrolledStudentIds = [...new Set(students.map((row) => row.userId))];
  const learningConsents = enrolledStudentIds.length ? await db.select({ expiresAt: teachPurposeConsents.expiresAt, userId: teachPurposeConsents.userId }).from(teachPurposeConsents).where(and(
    inArray(teachPurposeConsents.userId, enrolledStudentIds),
    eq(teachPurposeConsents.purpose, "learning"),
    eq(teachPurposeConsents.status, "granted"),
  )) : [];
  const studentIds = [...new Set(learningConsents.filter((row) => !row.expiresAt || Date.parse(row.expiresAt) > Date.now()).map((row) => row.userId))];
  const attempts = studentIds.length ? await db.select({ resultingState: learningAttempts.resultingState }).from(learningAttempts).where(inArray(learningAttempts.userId, studentIds)) : [];
  const masteryCounts = Object.fromEntries(masteryStates.map((state) => [state, attempts.filter((row) => row.resultingState === state).length]));
  return adminAssistantProjection({ cohortSize: studentIds.length, masteryCounts, interventionCount: 0 });
}

export async function saveWeeklyObjective(db: ScholariumDb, userId: string, input: Record<string, unknown>) {
  const objective = weeklyObjectiveContract(input);
  if (!objective.title || !objective.subject || !objective.schoolYear || !objective.weekStart || !objective.targetDate) throw new Error("title, subject, schoolYear, weekStart, and targetDate are required.");
  const weekStart = Date.parse(objective.weekStart);
  const targetDate = Date.parse(objective.targetDate);
  if (targetDate < weekStart || targetDate > weekStart + 14 * 24 * 60 * 60 * 1_000) throw new Error("targetDate must fall within the two-week objective window.");
  const requestedId = typeof input.id === "string" && input.id.trim() ? input.id.trim().slice(0, 180) : "";
  const id = requestedId || crypto.randomUUID();
  const now = new Date().toISOString();
  if (requestedId) {
    const [owned] = await db.select({ id: teachWeeklyObjectives.id }).from(teachWeeklyObjectives).where(and(eq(teachWeeklyObjectives.id, requestedId), eq(teachWeeklyObjectives.userId, userId))).limit(1);
    if (!owned) throw new Error("Weekly objective not found for this learner.");
    await db.update(teachWeeklyObjectives).set({
      title: objective.title,
      subject: objective.subject,
      schoolYear: objective.schoolYear,
      weekStart: objective.weekStart,
      targetDate: objective.targetDate,
      status: objective.status,
      evidenceRefs: JSON.stringify(objective.evidenceRefs),
      updatedAt: now,
    }).where(and(eq(teachWeeklyObjectives.id, requestedId), eq(teachWeeklyObjectives.userId, userId)));
    return { id, ...objective };
  }
  await db.insert(teachWeeklyObjectives).values({
    id,
    userId,
    title: objective.title,
    subject: objective.subject,
    schoolYear: objective.schoolYear,
    weekStart: objective.weekStart,
    targetDate: objective.targetDate,
    status: objective.status,
    evidenceRefs: JSON.stringify(objective.evidenceRefs),
    createdAt: now,
    updatedAt: now,
  });
  return { id, ...objective };
}

export async function saveInterventionPreferences(db: ScholariumDb, userId: string, input: Record<string, unknown>) {
  const preferences = interventionPreferencesContract(input);
  await db.insert(teachInterventionPreferences).values({
    userId,
    frequency: preferences.frequency,
    contexts: JSON.stringify(preferences.contexts),
    quietMode: preferences.quietMode,
    quietUntil: preferences.quietUntil,
    maxDailyInterventions: preferences.maxDailyInterventions,
    updatedAt: new Date().toISOString(),
  }).onConflictDoUpdate({
    target: teachInterventionPreferences.userId,
    set: { frequency: preferences.frequency, contexts: JSON.stringify(preferences.contexts), quietMode: preferences.quietMode, quietUntil: preferences.quietUntil, maxDailyInterventions: preferences.maxDailyInterventions, updatedAt: new Date().toISOString() },
  });
  return preferences;
}
