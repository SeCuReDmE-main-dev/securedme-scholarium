import { and, desc, eq, gte, inArray, isNull, lte, ne, or } from "drizzle-orm";
import {
  growthStories,
  learningAttempts,
  learningReminders,
  roleAssignments,
  strengthObservations,
  teachCircleMemberships,
  teachCircles,
  teachCourses,
  teachEnrollments,
  teachInterventionPreferences,
  teachOrganizationScopes,
  teachProjectEntries,
  teachProjectThreads,
  teachPurposeConsents,
  teachRecognitions,
  teachRecaps,
  teachWeeklyObjectives,
} from "../db/schema";
import { masteryStates } from "./teach-contracts";
import {
  learningCircleContract,
  multidimensionalComparisonContract,
  projectEntryContract,
  projectThreadContract,
  recapPeriodContract,
  recognitionContract,
  teachSocialSchemaVersions,
} from "./teach-social-contracts";

type ScholariumDb = Awaited<ReturnType<typeof import("../db").getDb>>;

function parseJson<T>(value: string, fallback: T): T {
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

async function stablePseudonym(scope: string, userId: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${scope}:${userId}`));
  return `learner_${[...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 20)}`;
}

async function activeCircleMembership(db: ScholariumDb, circleId: string, userId: string) {
  const [membership] = await db.select({ id: teachCircleMemberships.id }).from(teachCircleMemberships).where(and(
    eq(teachCircleMemberships.circleId, circleId),
    eq(teachCircleMemberships.userId, userId),
    eq(teachCircleMemberships.status, "active"),
  )).limit(1);
  return Boolean(membership);
}

async function projectAccess(db: ScholariumDb, projectId: string, userId: string) {
  const [project] = await db.select().from(teachProjectThreads).where(eq(teachProjectThreads.id, projectId)).limit(1);
  if (!project) throw new Error("Project thread not found.");
  if (project.ownerUserId === userId) return project;
  if (project.circleId && await activeCircleMembership(db, project.circleId, userId)) return project;
  throw new Error("Project thread access denied.");
}

export async function listProjectThreads(db: ScholariumDb, userId: string) {
  const memberships = await db.select({ circleId: teachCircleMemberships.circleId }).from(teachCircleMemberships).where(and(
    eq(teachCircleMemberships.userId, userId),
    eq(teachCircleMemberships.status, "active"),
  ));
  const circleIds = memberships.map((row) => row.circleId);
  const where = circleIds.length
    ? or(eq(teachProjectThreads.ownerUserId, userId), inArray(teachProjectThreads.circleId, circleIds))
    : eq(teachProjectThreads.ownerUserId, userId);
  const projects = await db.select().from(teachProjectThreads).where(where).orderBy(desc(teachProjectThreads.updatedAt)).limit(100);
  if (!projects.length) return [];
  const entries = await db.select().from(teachProjectEntries).where(inArray(teachProjectEntries.projectId, projects.map((project) => project.id))).orderBy(desc(teachProjectEntries.occurredAt));
  return projects.map((project) => ({
    ...project,
    entries: entries.filter((entry) => entry.projectId === project.id).map((entry) => ({
      id: entry.id,
      projectId: entry.projectId,
      kind: entry.kind,
      label: entry.label,
      reflection: entry.reflection,
      reference: entry.reference,
      status: entry.status,
      occurredAt: entry.occurredAt,
      createdAt: entry.createdAt,
    })),
    contributorIdentifiersIncluded: false,
  }));
}

export async function createProjectThread(db: ScholariumDb, userId: string, input: Record<string, unknown>) {
  const project = projectThreadContract(input);
  if (!project.valid) throw new Error("title and summary are required.");
  if (project.circleId && !await activeCircleMembership(db, project.circleId, userId)) throw new Error("An active circle membership is required.");
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.insert(teachProjectThreads).values({ id, ownerUserId: userId, circleId: project.circleId, title: project.title, summary: project.summary, status: project.status, visibility: project.visibility, createdAt: now, updatedAt: now });
  return { id, ...project, createdAt: now, updatedAt: now };
}

export async function createProjectEntry(db: ScholariumDb, userId: string, input: Record<string, unknown>) {
  const projectId = typeof input.projectId === "string" ? input.projectId.trim().slice(0, 180) : "";
  if (!projectId) throw new Error("projectId is required.");
  await projectAccess(db, projectId, userId);
  const entry = projectEntryContract(input);
  if (!entry.valid) throw new Error("A label and any required reference are required.");
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.batch([
    db.insert(teachProjectEntries).values({ id, projectId, contributorUserId: userId, kind: entry.kind, label: entry.label, reflection: entry.reflection, reference: entry.reference, status: entry.status, occurredAt: entry.occurredAt, createdAt: now }),
    db.update(teachProjectThreads).set({ updatedAt: now }).where(eq(teachProjectThreads.id, projectId)),
  ]);
  return { id, projectId, ...entry, createdAt: now };
}

export async function deleteProjectEntry(db: ScholariumDb, userId: string, entryId: string) {
  const [entry] = await db.select().from(teachProjectEntries).where(eq(teachProjectEntries.id, entryId)).limit(1);
  if (!entry) throw new Error("Project entry not found.");
  const project = await projectAccess(db, entry.projectId, userId);
  if (project.ownerUserId !== userId && entry.contributorUserId !== userId) throw new Error("Only the project owner or entry contributor can delete this entry.");
  await db.delete(teachProjectEntries).where(eq(teachProjectEntries.id, entryId));
}

export async function listLearningCircles(db: ScholariumDb, userId: string) {
  const memberships = await db.select().from(teachCircleMemberships).where(eq(teachCircleMemberships.userId, userId));
  const circleIds = memberships.map((row) => row.circleId);
  const where = circleIds.length ? or(eq(teachCircles.ownerUserId, userId), inArray(teachCircles.id, circleIds)) : eq(teachCircles.ownerUserId, userId);
  const circles = await db.select().from(teachCircles).where(where).orderBy(desc(teachCircles.updatedAt)).limit(100);
  return circles.map((circle) => ({ ...circle, membership: memberships.find((row) => row.circleId === circle.id) ?? null }));
}

export async function createLearningCircle(db: ScholariumDb, userId: string, input: Record<string, unknown>) {
  const circle = learningCircleContract(input);
  if (!circle.valid) throw new Error("title and purpose are required.");
  if (circle.organizationId) {
    const [assignment] = await db.select({ id: roleAssignments.id }).from(roleAssignments).where(and(eq(roleAssignments.userId, userId), eq(roleAssignments.organizationId, circle.organizationId), eq(roleAssignments.status, "active"))).limit(1);
    if (!assignment) throw new Error("An active organization role is required.");
  }
  if (circle.courseId) {
    const [enrollment] = await db.select({ role: teachEnrollments.role }).from(teachEnrollments).where(and(eq(teachEnrollments.userId, userId), eq(teachEnrollments.courseId, circle.courseId), eq(teachEnrollments.status, "active"))).limit(1);
    if (!enrollment || (circle.kind === "class" && enrollment.role !== "teacher")) throw new Error("An active teacher course relationship is required for a class circle.");
  }
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db.batch([
    db.insert(teachCircles).values({ id, ownerUserId: userId, organizationId: circle.organizationId, courseId: circle.courseId, kind: circle.kind, title: circle.title, purpose: circle.purpose, visibility: circle.visibility, membershipMode: circle.membershipMode, status: "active", createdAt: now, updatedAt: now }),
    db.insert(teachCircleMemberships).values({ id: crypto.randomUUID(), circleId: id, userId, role: "owner", status: "active", joinedAt: now }),
  ]);
  return { id, ...circle, status: "active", createdAt: now };
}

export async function addCircleMember(db: ScholariumDb, ownerUserId: string, input: Record<string, unknown>) {
  const circleId = typeof input.circleId === "string" ? input.circleId.trim().slice(0, 180) : "";
  const userId = typeof input.userId === "string" ? input.userId.trim().slice(0, 180) : "";
  const [circle] = await db.select({ id: teachCircles.id }).from(teachCircles).where(and(eq(teachCircles.id, circleId), eq(teachCircles.ownerUserId, ownerUserId), eq(teachCircles.status, "active"))).limit(1);
  if (!circle || !userId) throw new Error("Only the active circle owner can invite a member.");
  const now = new Date().toISOString();
  await db.insert(teachCircleMemberships).values({ id: crypto.randomUUID(), circleId, userId, role: "member", status: "active", joinedAt: now }).onConflictDoUpdate({ target: [teachCircleMemberships.circleId, teachCircleMemberships.userId], set: { status: "active", joinedAt: now } });
  return { circleId, userId, status: "active" };
}

export async function listRecognitions(db: ScholariumDb, userId: string) {
  return db.select().from(teachRecognitions).where(eq(teachRecognitions.recipientUserId, userId)).orderBy(desc(teachRecognitions.createdAt)).limit(100);
}

export async function createRecognition(db: ScholariumDb, issuerUserId: string, input: Record<string, unknown>) {
  const recipientUserId = typeof input.recipientUserId === "string" ? input.recipientUserId.trim().slice(0, 180) : "";
  const circleId = typeof input.circleId === "string" ? input.circleId.trim().slice(0, 180) : "";
  if (!recipientUserId || recipientUserId === issuerUserId || !circleId) throw new Error("A distinct recipient in a shared circle is required.");
  if (!await activeCircleMembership(db, circleId, issuerUserId) || !await activeCircleMembership(db, circleId, recipientUserId)) throw new Error("Both people require an active membership in the same circle.");
  const recognition = recognitionContract(input);
  if (!recognition.valid) throw new Error("A statement and evidence reference are required.");
  const id = crypto.randomUUID();
  await db.insert(teachRecognitions).values({ id, issuerUserId, recipientUserId, circleId, category: recognition.category, statement: recognition.statement, context: recognition.context, evidenceRef: recognition.evidenceRef, status: recognition.status });
  return { id, ...recognition };
}

export async function reviewRecognition(db: ScholariumDb, userId: string, input: Record<string, unknown>) {
  const id = typeof input.id === "string" ? input.id.trim().slice(0, 180) : "";
  const action = ["accept", "contest", "expire"].includes(String(input.action)) ? String(input.action) : "";
  const status = action === "accept" ? "accepted" : action === "contest" ? "contested" : action === "expire" ? "expired" : "";
  if (!id || !status) throw new Error("id and a supported action are required.");
  const [owned] = await db.select({ id: teachRecognitions.id }).from(teachRecognitions).where(and(eq(teachRecognitions.id, id), eq(teachRecognitions.recipientUserId, userId))).limit(1);
  if (!owned) throw new Error("Recognition not found for this recipient.");
  await db.update(teachRecognitions).set({ status, reviewedAt: new Date().toISOString() }).where(eq(teachRecognitions.id, id));
  return { id, status };
}

export async function buildLearningRecap(db: ScholariumDb, userId: string, input: Record<string, unknown>) {
  const period = recapPeriodContract(input);
  if (!period.valid) throw new Error("A valid weekly, monthly, or quarterly period is required.");
  const [attempts, strengths, stories, entries, recognitions] = await Promise.all([
    db.select({ resultingState: learningAttempts.resultingState }).from(learningAttempts).where(and(eq(learningAttempts.userId, userId), gte(learningAttempts.createdAt, period.periodStart), lte(learningAttempts.createdAt, period.periodEnd))),
    db.select({ category: strengthObservations.category, status: strengthObservations.status }).from(strengthObservations).where(and(eq(strengthObservations.userId, userId), gte(strengthObservations.createdAt, period.periodStart), lte(strengthObservations.createdAt, period.periodEnd))),
    db.select({ evidenceRef: growthStories.evidenceRef }).from(growthStories).where(and(eq(growthStories.userId, userId), gte(growthStories.createdAt, period.periodStart), lte(growthStories.createdAt, period.periodEnd))),
    db.select({ kind: teachProjectEntries.kind }).from(teachProjectEntries).where(and(eq(teachProjectEntries.contributorUserId, userId), gte(teachProjectEntries.createdAt, period.periodStart), lte(teachProjectEntries.createdAt, period.periodEnd))),
    db.select({ category: teachRecognitions.category }).from(teachRecognitions).where(and(eq(teachRecognitions.recipientUserId, userId), eq(teachRecognitions.status, "accepted"), gte(teachRecognitions.createdAt, period.periodStart), lte(teachRecognitions.createdAt, period.periodEnd))),
  ]);
  const payload = {
    attemptCount: attempts.length,
    masteryEvidenceCount: attempts.filter((row) => ["recalled", "contextualized", "mastered"].includes(row.resultingState)).length,
    strengthCategories: [...new Set(strengths.filter((row) => row.status === "active").map((row) => row.category))],
    growthStoryCount: stories.length,
    growthStoryProofCount: stories.filter((row) => row.evidenceRef).length,
    projectEntries: Object.fromEntries(["milestone", "version", "file", "source", "contribution"].map((kind) => [kind, entries.filter((row) => row.kind === kind).length])),
    recognitionCategories: [...new Set(recognitions.map((row) => row.category))],
    transcriptIncluded: false,
    popularityMetricsIncluded: false,
  };
  const id = crypto.randomUUID();
  await db.insert(teachRecaps).values({ id, userId, period: period.period, periodStart: period.periodStart, periodEnd: period.periodEnd, payload: JSON.stringify(payload) }).onConflictDoUpdate({ target: [teachRecaps.userId, teachRecaps.period, teachRecaps.periodStart, teachRecaps.periodEnd], set: { payload: JSON.stringify(payload), createdAt: new Date().toISOString() } });
  return { id, ...period, payload };
}

export async function studentSocialDashboard(db: ScholariumDb, userId: string) {
  const [attempts, reminders, strengths, projects, stories, recognitions, objectives] = await Promise.all([
    db.select({ resultingState: learningAttempts.resultingState }).from(learningAttempts).where(eq(learningAttempts.userId, userId)),
    db.select().from(learningReminders).where(and(eq(learningReminders.userId, userId), ne(learningReminders.status, "completed"))).orderBy(learningReminders.dueAt).limit(50),
    db.select().from(strengthObservations).where(eq(strengthObservations.userId, userId)).orderBy(desc(strengthObservations.updatedAt)).limit(100),
    listProjectThreads(db, userId),
    db.select().from(growthStories).where(eq(growthStories.userId, userId)).orderBy(desc(growthStories.createdAt)).limit(50),
    listRecognitions(db, userId),
    db.select().from(teachWeeklyObjectives).where(eq(teachWeeklyObjectives.userId, userId)).orderBy(desc(teachWeeklyObjectives.weekStart)).limit(52),
  ]);
  const masteryCounts = Object.fromEntries(masteryStates.map((state) => [state, attempts.filter((row) => row.resultingState === state).length]));
  const comparison = multidimensionalComparisonContract({ dimensions: [
    { key: "learning_evidence", label: "Learning evidence", left: attempts.filter((row) => ["recalled", "contextualized", "mastered"].includes(row.resultingState)).length, right: attempts.length, provenance: "learning_attempts resulting_state" },
    { key: "project_progress", label: "Project progress", left: projects.reduce((sum, project) => sum + project.entries.filter((entry) => entry.status === "completed").length, 0), right: projects.reduce((sum, project) => sum + project.entries.length, 0), provenance: "teach_project_entries status" },
    { key: "documented_strengths", label: "Documented strengths", left: strengths.filter((row) => row.status === "active").length, right: strengths.length, provenance: "strength_observations learner-reviewed status" },
  ] });
  return {
    schema: teachSocialSchemaVersions.studentDashboard,
    masteryCounts,
    reminders,
    strengths,
    projects,
    growthStories: stories,
    recognitions,
    weeklyObjectives: objectives,
    comparison,
    rawTranscriptIncluded: false,
    authorityBoundary: "The learner dashboard organizes evidence and choices; it does not calculate a worth, intelligence, or popularity score.",
  };
}

async function consentedStudentIdsForCourses(db: ScholariumDb, courseIds: string[]) {
  if (!courseIds.length) return [];
  const enrollments = await db.select({ userId: teachEnrollments.userId }).from(teachEnrollments).where(and(inArray(teachEnrollments.courseId, courseIds), eq(teachEnrollments.role, "student"), eq(teachEnrollments.status, "active")));
  const ids = [...new Set(enrollments.map((row) => row.userId))];
  if (!ids.length) return [];
  const consents = await db.select({ expiresAt: teachPurposeConsents.expiresAt, userId: teachPurposeConsents.userId }).from(teachPurposeConsents).where(and(inArray(teachPurposeConsents.userId, ids), eq(teachPurposeConsents.purpose, "learning"), eq(teachPurposeConsents.status, "granted")));
  return [...new Set(consents.filter((row) => !row.expiresAt || Date.parse(row.expiresAt) > Date.now()).map((row) => row.userId))];
}

export async function teacherSocialDashboard(db: ScholariumDb, teacherUserId: string) {
  const courseRows = await db.select({ courseId: teachEnrollments.courseId }).from(teachEnrollments).where(and(eq(teachEnrollments.userId, teacherUserId), eq(teachEnrollments.role, "teacher"), eq(teachEnrollments.status, "active")));
  const courseIds = [...new Set(courseRows.map((row) => row.courseId))];
  const studentIds = await consentedStudentIdsForCourses(db, courseIds);
  const [attempts, objectives, strengths, preferences] = studentIds.length ? await Promise.all([
    db.select({ confusionCode: learningAttempts.confusionCode, resultingState: learningAttempts.resultingState, userId: learningAttempts.userId }).from(learningAttempts).where(inArray(learningAttempts.userId, studentIds)),
    db.select({ status: teachWeeklyObjectives.status, userId: teachWeeklyObjectives.userId }).from(teachWeeklyObjectives).where(inArray(teachWeeklyObjectives.userId, studentIds)),
    db.select({ category: strengthObservations.category, status: strengthObservations.status, userId: strengthObservations.userId }).from(strengthObservations).where(inArray(strengthObservations.userId, studentIds)),
    db.select({ frequency: teachInterventionPreferences.frequency, userId: teachInterventionPreferences.userId }).from(teachInterventionPreferences).where(inArray(teachInterventionPreferences.userId, studentIds)),
  ]) : [[], [], [], []];
  const learners = await Promise.all(studentIds.map(async (studentId) => ({
    learnerPseudonym: await stablePseudonym(`teacher-dashboard:${teacherUserId}`, studentId),
    objectiveStateCounts: Object.fromEntries(masteryStates.map((state) => [state, attempts.filter((row) => row.userId === studentId && row.resultingState === state).length])),
    confusionCodes: [...new Set(attempts.filter((row) => row.userId === studentId && row.confusionCode !== "none").map((row) => row.confusionCode))],
    acceptedStrengthCategories: [...new Set(strengths.filter((row) => row.userId === studentId && row.status === "active").map((row) => row.category))],
    activeObjectiveCount: objectives.filter((row) => row.userId === studentId && ["planned", "active"].includes(row.status)).length,
    interventionEnabled: preferences.some((row) => row.userId === studentId && row.frequency !== "off"),
  })));
  return {
    schema: teachSocialSchemaVersions.teacherDashboard,
    courseCount: courseIds.length,
    learnerCount: learners.length,
    learners,
    rawAnswersIncluded: false,
    rawGraphIncluded: false,
    authorityBoundary: "This task view supports educator intervention planning and never performs autonomous grading, discipline, or diagnosis.",
  };
}

export async function organizationSocialDashboard(db: ScholariumDb, userId: string) {
  const administrativeRoles = ["administrator", "school_admin", "commission_admin"];
  const [assignment] = await db.select({ organizationId: roleAssignments.organizationId, role: roleAssignments.role }).from(roleAssignments).where(and(eq(roleAssignments.userId, userId), eq(roleAssignments.status, "active"), inArray(roleAssignments.role, administrativeRoles))).limit(1);
  if (!assignment?.organizationId) throw new Error("An active school or commission role is required.");
  const now = new Date().toISOString();
  const scopes = assignment.role === "commission_admin" ? await db.select({ childOrganizationId: teachOrganizationScopes.childOrganizationId }).from(teachOrganizationScopes).where(and(eq(teachOrganizationScopes.parentOrganizationId, assignment.organizationId), eq(teachOrganizationScopes.kind, "commission_school"), eq(teachOrganizationScopes.status, "active"), or(isNull(teachOrganizationScopes.validUntil), gte(teachOrganizationScopes.validUntil, now)))) : [];
  const organizationIds = [...new Set([assignment.organizationId, ...scopes.map((scope) => scope.childOrganizationId)])];
  const courses = await db.select({ id: teachCourses.id }).from(teachCourses).where(inArray(teachCourses.organizationId, organizationIds));
  const studentIds = await consentedStudentIdsForCourses(db, courses.map((course) => course.id));
  const suppressed = studentIds.length < 10;
  if (suppressed) return {
    schema: teachSocialSchemaVersions.organizationDashboard,
    scope: assignment.role === "commission_admin" ? "commission" : "school",
    suppressed: true,
    suppressionReason: "minimum_cohort_10",
    cohortSize: null,
    metrics: null,
    individualIdentifiersIncluded: false,
  };
  const [attempts, projects, stories, recognitions] = await Promise.all([
    db.select({ resultingState: learningAttempts.resultingState }).from(learningAttempts).where(inArray(learningAttempts.userId, studentIds)),
    db.select({ id: teachProjectThreads.id }).from(teachProjectThreads).where(inArray(teachProjectThreads.ownerUserId, studentIds)),
    db.select({ id: growthStories.id }).from(growthStories).where(inArray(growthStories.userId, studentIds)),
    db.select({ id: teachRecognitions.id }).from(teachRecognitions).where(and(inArray(teachRecognitions.recipientUserId, studentIds), eq(teachRecognitions.status, "accepted"))),
  ]);
  return {
    schema: teachSocialSchemaVersions.organizationDashboard,
    scope: assignment.role === "commission_admin" ? "commission" : "school",
    suppressed: false,
    cohortSize: studentIds.length,
    includedOrganizationCount: organizationIds.length,
    metrics: {
      objectiveStateCounts: Object.fromEntries(masteryStates.map((state) => [state, attempts.filter((row) => row.resultingState === state).length])),
      projectCount: projects.length,
      growthStoryCount: stories.length,
      acceptedRecognitionCount: recognitions.length,
    },
    individualIdentifiersIncluded: false,
    smallGroupBreakdownsIncluded: false,
    authorityBoundary: "Organization analytics describe an authorized cohort and cannot reconstruct or decide for an individual learner.",
  };
}

export function parseRecapPayload(payload: string) {
  return parseJson<Record<string, unknown>>(payload, {});
}
