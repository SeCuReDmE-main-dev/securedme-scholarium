import { and, desc, eq, gte, inArray, isNull, or } from "drizzle-orm";
import {
  learningAttempts,
  roleAssignments,
  teachCheckpoints,
  teachCourses,
  teachEnrollments,
  teachExceptionalAccessApprovals,
  teachExceptionalAccessAuditEvents,
  teachExceptionalAccessRequests,
  teachPurposeConsents,
} from "../db/schema";
import { teacherSessionSummary, type AssistanceLevel, type MasteryState } from "./teach-contracts";
import { exceptionalAccessAdmission, exceptionalAccessDecisionContract, exceptionalAccessRequestContract } from "./teach-exceptional-access-contracts";

type ScholariumDb = Awaited<ReturnType<typeof import("../db").getDb>>;
const administrativeRoles = ["administrator", "school_admin", "commission_admin"];

async function digest(value: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function recordAudit(db: ScholariumDb, requestId: string, actorUserId: string, eventType: string, facts: unknown) {
  await db.insert(teachExceptionalAccessAuditEvents).values({
    id: crypto.randomUUID(),
    requestId,
    actorUserId,
    eventType,
    eventDigest: await digest({ requestId, actorUserId, eventType, facts }),
  });
}

async function administrativeOrganization(db: ScholariumDb, userId: string, organizationId?: string) {
  const predicates = [
    eq(roleAssignments.userId, userId),
    eq(roleAssignments.status, "active"),
    inArray(roleAssignments.role, administrativeRoles),
  ];
  if (organizationId) predicates.push(eq(roleAssignments.organizationId, organizationId));
  const [assignment] = await db.select({ organizationId: roleAssignments.organizationId }).from(roleAssignments).where(and(...predicates)).limit(1);
  if (!assignment?.organizationId) throw new Error("An active administrative role in the organization is required.");
  return assignment.organizationId;
}

async function subjectIsInOrganization(db: ScholariumDb, subjectUserId: string, organizationId: string) {
  const [row] = await db.select({ id: teachEnrollments.id }).from(teachEnrollments)
    .innerJoin(teachCourses, eq(teachEnrollments.courseId, teachCourses.id))
    .where(and(
      eq(teachEnrollments.userId, subjectUserId),
      eq(teachEnrollments.status, "active"),
      eq(teachCourses.organizationId, organizationId),
    )).limit(1);
  return Boolean(row);
}

export async function createExceptionalAccessRequest(db: ScholariumDb, requesterUserId: string, input: Record<string, unknown>) {
  const contract = exceptionalAccessRequestContract(input);
  if (!contract.valid || contract.subjectUserId === requesterUserId) throw new Error("A distinct subject, supported scope, detailed justification, incident reference, and expiry within four hours are required.");
  const organizationId = await administrativeOrganization(db, requesterUserId);
  if (!await subjectIsInOrganization(db, contract.subjectUserId, organizationId)) throw new Error("The subject must have an active enrollment in the requester's organization.");
  const id = crypto.randomUUID();
  await db.insert(teachExceptionalAccessRequests).values({
    id,
    requesterUserId,
    subjectUserId: contract.subjectUserId,
    organizationId,
    scope: contract.scope,
    justification: contract.justification,
    incidentReference: contract.incidentReference,
    expiresAt: contract.expiresAt,
    status: "pending_approvals",
  });
  await recordAudit(db, id, requesterUserId, "requested", { organizationId, scope: contract.scope, expiresAt: contract.expiresAt });
  return { id, organizationId, status: "pending_approvals", ...contract };
}

export async function decideExceptionalAccessRequest(db: ScholariumDb, approverUserId: string, input: Record<string, unknown>) {
  const requestId = typeof input.requestId === "string" ? input.requestId.trim().slice(0, 180) : "";
  const decision = exceptionalAccessDecisionContract(input);
  if (!requestId || !decision.valid) throw new Error("requestId, approve or deny, and a detailed rationale are required.");
  const [request] = await db.select().from(teachExceptionalAccessRequests).where(eq(teachExceptionalAccessRequests.id, requestId)).limit(1);
  if (!request || request.status !== "pending_approvals" || Date.parse(request.expiresAt) <= Date.now()) throw new Error("A current pending exceptional-access request is required.");
  await administrativeOrganization(db, approverUserId, request.organizationId);
  if (approverUserId === request.requesterUserId || approverUserId === request.subjectUserId) throw new Error("Requester and subject cannot approve exceptional access.");

  const id = crypto.randomUUID();
  await db.insert(teachExceptionalAccessApprovals).values({ id, requestId, approverUserId, decision: decision.decision, rationale: decision.rationale });
  const now = new Date().toISOString();
  if (decision.decision === "deny") {
    await db.update(teachExceptionalAccessRequests).set({ status: "denied", deniedAt: now, updatedAt: now }).where(eq(teachExceptionalAccessRequests.id, requestId));
    await recordAudit(db, requestId, approverUserId, "denied", { rationaleDigest: await digest(decision.rationale) });
    return { requestId, status: "denied", approvalCount: 0 };
  }
  const approvals = await db.select({ approverUserId: teachExceptionalAccessApprovals.approverUserId }).from(teachExceptionalAccessApprovals).where(and(
    eq(teachExceptionalAccessApprovals.requestId, requestId),
    eq(teachExceptionalAccessApprovals.decision, "approve"),
  ));
  const approvalCount = new Set(approvals.map((row) => row.approverUserId)).size;
  const status = approvalCount >= 2 ? "approved" : "pending_approvals";
  if (status === "approved") await db.update(teachExceptionalAccessRequests).set({ status, approvedAt: now, updatedAt: now }).where(eq(teachExceptionalAccessRequests.id, requestId));
  await recordAudit(db, requestId, approverUserId, "approved", { approvalCount, status });
  return { requestId, status, approvalCount, requiredApprovalCount: 2 };
}

async function boundedProjection(db: ScholariumDb, subjectUserId: string, scope: string) {
  if (scope === "learning_support_summary") {
    const attempts = await db.select({
      assistanceLevel: learningAttempts.assistanceLevel,
      confusionCode: learningAttempts.confusionCode,
      createdAt: learningAttempts.createdAt,
      errorCode: learningAttempts.errorCode,
      objectiveId: learningAttempts.objectiveId,
      recallDelaySeconds: learningAttempts.recallDelaySeconds,
      responseTimeMs: learningAttempts.responseTimeMs,
      resultingState: learningAttempts.resultingState,
      transferDemonstrated: learningAttempts.transferDemonstrated,
    }).from(learningAttempts).where(eq(learningAttempts.userId, subjectUserId));
    return { scope, summary: teacherSessionSummary(attempts.map((row) => ({ ...row, assistanceLevel: row.assistanceLevel as AssistanceLevel, resultingState: row.resultingState as MasteryState }))) };
  }
  const [attempts, checkpoints, consents] = await Promise.all([
    db.select({ id: learningAttempts.id }).from(learningAttempts).where(eq(learningAttempts.userId, subjectUserId)),
    db.select({ userId: teachCheckpoints.userId }).from(teachCheckpoints).where(eq(teachCheckpoints.userId, subjectUserId)),
    db.select({ status: teachPurposeConsents.status }).from(teachPurposeConsents).where(eq(teachPurposeConsents.userId, subjectUserId)),
  ]);
  return {
    scope,
    recordCounts: { learningAttempts: attempts.length, checkpoints: checkpoints.length, purposeConsents: consents.length },
    contentIncluded: false,
  };
}

export async function consumeExceptionalAccessRequest(db: ScholariumDb, requesterUserId: string, input: Record<string, unknown>) {
  const requestId = typeof input.requestId === "string" ? input.requestId.trim().slice(0, 180) : "";
  const [request] = requestId ? await db.select().from(teachExceptionalAccessRequests).where(and(
    eq(teachExceptionalAccessRequests.id, requestId),
    eq(teachExceptionalAccessRequests.requesterUserId, requesterUserId),
  )).limit(1) : [];
  if (!request) throw new Error("Exceptional-access request not found for this requester.");
  const approvals = await db.select({ approverUserId: teachExceptionalAccessApprovals.approverUserId }).from(teachExceptionalAccessApprovals).where(and(
    eq(teachExceptionalAccessApprovals.requestId, request.id),
    eq(teachExceptionalAccessApprovals.decision, "approve"),
  ));
  const admission = exceptionalAccessAdmission({
    approvalActorIds: approvals.map((row) => row.approverUserId),
    expiresAt: request.expiresAt,
    requesterUserId,
    status: request.status,
    subjectUserId: request.subjectUserId,
    usedAt: request.usedAt,
  });
  if (!admission.admitted) throw new Error("Dual approval, an unexpired window, and unused status are required.");
  const usedAt = new Date().toISOString();
  const claimed = await db.update(teachExceptionalAccessRequests).set({ status: "used", usedAt, updatedAt: usedAt }).where(and(
    eq(teachExceptionalAccessRequests.id, request.id),
    eq(teachExceptionalAccessRequests.status, "approved"),
    isNull(teachExceptionalAccessRequests.usedAt),
    gte(teachExceptionalAccessRequests.expiresAt, usedAt),
  )).returning({ id: teachExceptionalAccessRequests.id });
  if (!claimed.length) throw new Error("Exceptional access was already used or expired.");
  const projection = await boundedProjection(db, request.subjectUserId, request.scope);
  await recordAudit(db, request.id, requesterUserId, "used", { scope: request.scope, usedAt, projectionDigest: await digest(projection) });
  return { requestId: request.id, usedAt, projection, admission, rawGraphIncluded: false, rawAnswersIncluded: false };
}

export async function listExceptionalAccess(db: ScholariumDb, userId: string) {
  const organizationId = await administrativeOrganization(db, userId);
  const requests = await db.select().from(teachExceptionalAccessRequests).where(and(
    eq(teachExceptionalAccessRequests.organizationId, organizationId),
    or(eq(teachExceptionalAccessRequests.requesterUserId, userId), eq(teachExceptionalAccessRequests.status, "pending_approvals")),
  )).orderBy(desc(teachExceptionalAccessRequests.createdAt)).limit(100);
  return { requests, rawGraphIncluded: false, rawAnswersIncluded: false, authorityBoundary: "Exceptional access is temporary dual control for human-reviewed support, not surveillance or autonomous authority." };
}
