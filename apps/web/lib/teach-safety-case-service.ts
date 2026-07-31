import { and, asc, desc, eq, inArray, isNull, lte } from "drizzle-orm";
import {
  roleAssignments,
  teachSchoolSafetyAppeals,
  teachSchoolSafetyAssignments,
  teachSchoolSafetyCases,
  teachSchoolSafetyEvidence,
  teachSchoolSafetyEvents,
  teachSchoolSafetyOutbox,
  teachSchoolSafetyPolicies,
} from "../db/schema";
import {
  schoolSafetyAdministrativeRoles,
  schoolSafetyAppealContract,
  schoolSafetyAppealReviewerDecision,
  schoolSafetyCaseCreateContract,
  schoolSafetyCaseVisibilityDecision,
  schoolSafetyReporterRoles,
  schoolSafetyTransitionContract,
  schoolSafetyTransitionDecision,
  schoolSafetyTransitionTargets,
  type SchoolSafetyActorRole,
  type SchoolSafetyReporterRole,
  type SchoolSafetyState,
} from "./teach-safety-case-contracts";
import {
  deliverSchoolSafetyDatadogCase,
  schoolSafetyDatadogPayload,
  schoolSafetyRuntimeConfig,
  type SchoolSafetyDatadogPayload,
} from "./teach-safety-datadog";

type ScholariumDb = Awaited<ReturnType<typeof import("../db").getDb>>;
type RoleContext = {
  organizationId: string;
  role: SchoolSafetyActorRole;
};

export class SchoolSafetyError extends Error {
  constructor(public readonly code: string, public readonly status = 400) {
    super(code);
    this.name = "SchoolSafetyError";
  }
}

export function schoolSafetyErrorResponse(error: unknown) {
  if (error instanceof SchoolSafetyError) {
    return Response.json({ error: error.code }, { status: error.status });
  }
  if (error instanceof Error && error.message === "SCHOOL_SAFETY_CASES_DISABLED") {
    return Response.json({ error: "SCHOOL_SAFETY_CASES_DISABLED" }, { status: 503 });
  }
  return Response.json({ error: "SCHOOL_SAFETY_REQUEST_FAILED" }, { status: 500 });
}

function fail(code: string, status = 400): never {
  throw new SchoolSafetyError(code, status);
}

function boundedText(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function idempotencyDigest(scope: string, userId: string, key: string) {
  return sha256([scope, userId, key].join(":"));
}

async function activeContexts(db: ScholariumDb, userId: string): Promise<RoleContext[]> {
  const supportedRoles = [...schoolSafetyReporterRoles, ...schoolSafetyAdministrativeRoles];
  const rows = await db.select({
    organizationId: roleAssignments.organizationId,
    role: roleAssignments.role,
  }).from(roleAssignments).where(and(
    eq(roleAssignments.userId, userId),
    eq(roleAssignments.status, "active"),
    inArray(roleAssignments.role, supportedRoles),
  ));
  return rows
    .filter((row): row is { organizationId: string; role: string } => Boolean(row.organizationId))
    .map((row) => ({ organizationId: row.organizationId, role: row.role as SchoolSafetyActorRole }));
}

function reporterContext(contexts: RoleContext[], organizationId: string) {
  return contexts.find((context) => context.organizationId === organizationId && context.role === "student")
    ?? contexts.find((context) => context.organizationId === organizationId && context.role === "teacher");
}

function adminContext(contexts: RoleContext[], organizationId: string) {
  return contexts.find((context) => context.organizationId === organizationId && schoolSafetyAdministrativeRoles.includes(context.role as typeof schoolSafetyAdministrativeRoles[number]));
}

async function activeSyntheticPolicy(db: ScholariumDb, organizationId: string) {
  const [policy] = await db.select().from(teachSchoolSafetyPolicies).where(and(
    eq(teachSchoolSafetyPolicies.organizationId, organizationId),
    eq(teachSchoolSafetyPolicies.status, "active"),
    eq(teachSchoolSafetyPolicies.dataMode, "synthetic_only"),
  )).orderBy(desc(teachSchoolSafetyPolicies.activatedAt)).limit(1);
  if (!policy) fail("SYNTHETIC_SCHOOL_POLICY_REQUIRED", 403);
  return policy;
}

function publicCaseProjection(row: typeof teachSchoolSafetyCases.$inferSelect, userId: string, administrative: boolean) {
  return {
    id: row.id,
    organizationId: row.organizationId,
    subjectType: row.subjectType,
    subjectId: row.subjectId,
    category: row.category,
    proposedSeverity: row.proposedSeverity,
    status: row.status,
    policyVersion: row.policyVersion,
    telemetryStatus: row.telemetryStatus,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    resolvedAt: row.resolvedAt,
    closedAt: row.closedAt,
    hasOwner: Boolean(row.assignedAdminUserId),
    assignedToCurrentUser: administrative && row.assignedAdminUserId === userId,
    resolutionCode: administrative ? row.resolutionCode : null,
    privateEvidenceIncluded: false,
    directIdentityIncluded: false,
  };
}

async function latestEvent(db: ScholariumDb, caseId: string) {
  const [event] = await db.select().from(teachSchoolSafetyEvents)
    .where(eq(teachSchoolSafetyEvents.caseId, caseId))
    .orderBy(desc(teachSchoolSafetyEvents.sequence))
    .limit(1);
  return event ?? null;
}

async function eventRecord(input: {
  actorRole: SchoolSafetyActorRole;
  actorUserId: string;
  caseId: string;
  fromState: SchoolSafetyState | null;
  idempotencyKey: string;
  previousHash: string;
  rationale: string;
  rationaleCode: string;
  sequence: number;
  toState: SchoolSafetyState;
}) {
  const createdAt = new Date().toISOString();
  const rationaleDigest = await sha256(input.rationale);
  const eventHash = await sha256(JSON.stringify({
    actorRole: input.actorRole,
    actorUserId: input.actorUserId,
    caseId: input.caseId,
    createdAt,
    fromState: input.fromState,
    idempotencyKey: input.idempotencyKey,
    previousHash: input.previousHash,
    rationaleCode: input.rationaleCode,
    rationaleDigest,
    sequence: input.sequence,
    toState: input.toState,
  }));
  return {
    id: crypto.randomUUID(),
    caseId: input.caseId,
    sequence: input.sequence,
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    fromState: input.fromState,
    toState: input.toState,
    rationaleCode: input.rationaleCode,
    rationaleDigest,
    previousHash: input.previousHash,
    eventHash,
    idempotencyKey: input.idempotencyKey,
    createdAt,
  };
}

async function outboxRecord(input: {
  caseRow: typeof teachSchoolSafetyCases.$inferSelect;
  eventId: string;
  idempotencyKey: string;
  operation: string;
}) {
  const runtime = await schoolSafetyRuntimeConfig();
  const payload = await schoolSafetyDatadogPayload({
    caseId: input.caseRow.id,
    organizationId: input.caseRow.organizationId,
    category: input.caseRow.category,
    proposedSeverity: input.caseRow.proposedSeverity as "standard" | "high" | "urgent",
    state: input.caseRow.status as SchoolSafetyState,
    createdAt: input.caseRow.createdAt,
    updatedAt: input.caseRow.updatedAt,
    environment: runtime.environment,
    policyVersion: input.caseRow.policyVersion,
    resolutionCode: input.caseRow.resolutionCode,
  });
  return {
    id: crypto.randomUUID(),
    caseId: input.caseRow.id,
    eventId: input.eventId,
    operation: input.operation,
    redactedPayload: JSON.stringify(payload),
    idempotencyKey: input.idempotencyKey,
    status: runtime.enabled && runtime.writeApproved ? "pending" : "disabled",
    attempts: 0,
    createdAt: input.caseRow.updatedAt,
    updatedAt: input.caseRow.updatedAt,
  };
}

export async function createSchoolSafetyCase(
  db: ScholariumDb,
  userId: string,
  input: Record<string, unknown>,
  options: { sourceReportId?: string | null } = {},
) {
  const contract = schoolSafetyCaseCreateContract(input);
  if (!contract.valid) fail("SCHOOL_SAFETY_CASE_INPUT_INVALID", 400);
  const contexts = await activeContexts(db, userId);
  const reporter = reporterContext(contexts, contract.organizationId);
  if (!reporter || !schoolSafetyReporterRoles.includes(reporter.role as SchoolSafetyReporterRole)) fail("ACTIVE_SCHOOL_REPORTER_ROLE_REQUIRED", 403);
  const policy = await activeSyntheticPolicy(db, contract.organizationId);
  const idempotencyKey = await idempotencyDigest("create", userId, contract.idempotencyKey);
  const [replay] = await db.select({ caseId: teachSchoolSafetyOutbox.caseId }).from(teachSchoolSafetyOutbox)
    .where(eq(teachSchoolSafetyOutbox.idempotencyKey, idempotencyKey)).limit(1);
  if (replay) {
    const [existing] = await db.select().from(teachSchoolSafetyCases).where(eq(teachSchoolSafetyCases.id, replay.caseId)).limit(1);
    if (existing) return { case: publicCaseProjection(existing, userId, false), replayed: true };
  }

  const now = new Date().toISOString();
  const caseId = crypto.randomUUID();
  const evidenceId = crypto.randomUUID();
  const evidenceHash = await sha256(contract.summary);
  const event = await eventRecord({
    actorRole: reporter.role,
    actorUserId: userId,
    caseId,
    fromState: null,
    idempotencyKey,
    previousHash: "GENESIS",
    rationale: contract.summary,
    rationaleCode: "report_received",
    sequence: 1,
    toState: "received",
  });
  const caseRow: typeof teachSchoolSafetyCases.$inferInsert = {
    id: caseId,
    organizationId: contract.organizationId,
    reporterUserId: userId,
    reporterRole: reporter.role,
    evidenceId,
    sourceReportId: options.sourceReportId ?? null,
    subjectType: contract.subjectType,
    subjectId: contract.subjectId,
    category: contract.category,
    proposedSeverity: contract.proposedSeverity,
    status: "received",
    policyVersion: policy.version,
    telemetryStatus: "disabled",
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
  const outbox = await outboxRecord({
    caseRow: caseRow as typeof teachSchoolSafetyCases.$inferSelect,
    eventId: event.id,
    idempotencyKey,
    operation: "create",
  });
  await db.batch([
    db.insert(teachSchoolSafetyEvidence).values({
      id: evidenceId,
      organizationId: contract.organizationId,
      ownerUserId: userId,
      kind: "initial_report",
      content: contract.summary,
      contentSha256: evidenceHash,
      contentType: "text/plain",
      sizeBytes: new TextEncoder().encode(contract.summary).byteLength,
      createdAt: now,
    }),
    db.insert(teachSchoolSafetyCases).values(caseRow),
    db.insert(teachSchoolSafetyEvents).values(event),
    db.insert(teachSchoolSafetyOutbox).values(outbox),
  ]);
  const [created] = await db.select().from(teachSchoolSafetyCases).where(eq(teachSchoolSafetyCases.id, caseId)).limit(1);
  if (!created) fail("SCHOOL_SAFETY_CASE_CREATE_FAILED", 500);
  return { case: publicCaseProjection(created, userId, false), replayed: false };
}

export async function listSchoolSafetyCases(db: ScholariumDb, userId: string) {
  const contexts = await activeContexts(db, userId);
  const reporterOrganizationIds = [...new Set(contexts
    .filter((context) => schoolSafetyReporterRoles.includes(context.role as SchoolSafetyReporterRole))
    .map((context) => context.organizationId))];
  const adminOrganizationIds = [...new Set(contexts
    .filter((context) => schoolSafetyAdministrativeRoles.includes(context.role as typeof schoolSafetyAdministrativeRoles[number]))
    .map((context) => context.organizationId))];
  const reporterRows = reporterOrganizationIds.length
    ? await db.select().from(teachSchoolSafetyCases).where(and(
      eq(teachSchoolSafetyCases.reporterUserId, userId),
      inArray(teachSchoolSafetyCases.organizationId, reporterOrganizationIds),
    )).orderBy(desc(teachSchoolSafetyCases.updatedAt)).limit(100)
    : [];
  const administratorRows = adminOrganizationIds.length
    ? await db.select().from(teachSchoolSafetyCases).where(inArray(
      teachSchoolSafetyCases.organizationId,
      adminOrganizationIds,
    )).orderBy(desc(teachSchoolSafetyCases.updatedAt)).limit(100)
    : [];
  const rows = [...new Map([...reporterRows, ...administratorRows].map((row) => [row.id, row])).values()]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 100);
  return {
    schema: "scholarium.school-safety-case-list.v1",
    contexts: contexts.map((context) => ({ organizationId: context.organizationId, role: context.role })),
    cases: rows.map((row) => publicCaseProjection(row, userId, adminOrganizationIds.includes(row.organizationId))),
    privateEvidenceIncluded: false,
    crossTenantDataIncluded: false,
  };
}

async function accessibleCase(db: ScholariumDb, userId: string, caseId: string) {
  const [row] = await db.select().from(teachSchoolSafetyCases).where(eq(teachSchoolSafetyCases.id, caseId)).limit(1);
  if (!row) fail("SCHOOL_SAFETY_CASE_NOT_FOUND", 404);
  const contexts = await activeContexts(db, userId);
  const administrativeContext = adminContext(contexts, row.organizationId);
  const activeReporterContext = row.reporterUserId === userId
    ? reporterContext(contexts, row.organizationId)
    : undefined;
  const administrative = Boolean(administrativeContext);
  const reporter = Boolean(activeReporterContext);
  const actorRole = administrativeContext?.role ?? activeReporterContext?.role ?? row.reporterRole as SchoolSafetyActorRole;
  if (!schoolSafetyCaseVisibilityDecision({
    activeAssignment: Boolean(administrativeContext || activeReporterContext),
    actorRole,
    isReporter: reporter,
    sameOrganization: administrative,
  }).allowed) fail("SCHOOL_SAFETY_CASE_ACCESS_DENIED", 403);
  return { administrative, contexts, reporter, row };
}

export async function getSchoolSafetyCase(db: ScholariumDb, userId: string, caseId: string) {
  const access = await accessibleCase(db, userId, boundedText(caseId, 180));
  const events = await db.select({
    actorRole: teachSchoolSafetyEvents.actorRole,
    createdAt: teachSchoolSafetyEvents.createdAt,
    eventHash: teachSchoolSafetyEvents.eventHash,
    fromState: teachSchoolSafetyEvents.fromState,
    rationaleCode: teachSchoolSafetyEvents.rationaleCode,
    sequence: teachSchoolSafetyEvents.sequence,
    toState: teachSchoolSafetyEvents.toState,
  }).from(teachSchoolSafetyEvents).where(eq(teachSchoolSafetyEvents.caseId, access.row.id))
    .orderBy(asc(teachSchoolSafetyEvents.sequence)).limit(200);
  const appeals = await db.select({
    createdAt: teachSchoolSafetyAppeals.createdAt,
    outcomeCode: teachSchoolSafetyAppeals.outcomeCode,
    reviewedAt: teachSchoolSafetyAppeals.reviewedAt,
    status: teachSchoolSafetyAppeals.status,
  }).from(teachSchoolSafetyAppeals).where(eq(teachSchoolSafetyAppeals.caseId, access.row.id))
    .orderBy(desc(teachSchoolSafetyAppeals.createdAt)).limit(20);
  return {
    schema: "scholarium.school-safety-case-detail.v1",
    case: publicCaseProjection(access.row, userId, access.administrative),
    events: events.map((event) => ({
      ...event,
      actorRole: access.administrative
        ? event.actorRole
        : schoolSafetyReporterRoles.includes(event.actorRole as SchoolSafetyReporterRole)
          ? "reporter"
          : event.actorRole === "system" ? "system" : "human_reviewer",
      rationaleCode: access.administrative
        ? event.rationaleCode
        : event.toState === "received" ? "report_received"
          : event.toState === "appealed" ? "reporter_appeal" : "status_updated",
      eventHash: access.administrative ? event.eventHash : undefined,
    })),
    appeals: appeals.map((appeal) => ({
      ...appeal,
      outcomeCode: access.administrative
        ? appeal.outcomeCode
        : appeal.status === "reviewed" ? "review_completed" : null,
    })),
    allowedTransitions: schoolSafetyTransitionTargets(access.row.status as SchoolSafetyState).filter((toState) => {
      const role = access.administrative
        ? adminContext(access.contexts, access.row.organizationId)!.role
        : access.row.reporterRole as SchoolSafetyActorRole;
      return schoolSafetyTransitionDecision({
        activeAssignment: true,
        actorRole: role,
        fromState: access.row.status as SchoolSafetyState,
        isReporter: access.reporter,
        sameOrganization: true,
        toState,
      }).allowed;
    }),
    privateEvidenceIncluded: false,
  };
}

export async function transitionSchoolSafetyCase(db: ScholariumDb, userId: string, input: Record<string, unknown>) {
  const contract = schoolSafetyTransitionContract(input);
  if (!contract.valid) fail("SCHOOL_SAFETY_TRANSITION_INPUT_INVALID", 400);
  if (contract.toState === "appealed") fail("USE_SCHOOL_SAFETY_APPEAL_ROUTE", 400);
  const access = await accessibleCase(db, userId, contract.caseId);
  const idempotencyKey = await idempotencyDigest("transition:" + contract.caseId, userId, contract.idempotencyKey);
  const [replay] = await db.select({ id: teachSchoolSafetyEvents.id }).from(teachSchoolSafetyEvents).where(and(
    eq(teachSchoolSafetyEvents.caseId, contract.caseId),
    eq(teachSchoolSafetyEvents.idempotencyKey, idempotencyKey),
  )).limit(1);
  if (replay) return { ...(await getSchoolSafetyCase(db, userId, contract.caseId)), replayed: true };
  if (access.row.version !== contract.expectedVersion) fail("SCHOOL_SAFETY_VERSION_CONFLICT", 409);

  const administrativeContext = adminContext(access.contexts, access.row.organizationId);
  const actorRole = administrativeContext?.role ?? access.row.reporterRole as SchoolSafetyActorRole;
  const decision = schoolSafetyTransitionDecision({
    activeAssignment: Boolean(administrativeContext || access.reporter),
    actorRole,
    fromState: access.row.status as SchoolSafetyState,
    isReporter: access.reporter,
    sameOrganization: true,
    toState: contract.toState as SchoolSafetyState,
  });
  if (!decision.allowed) fail(decision.code, 403);
  if (["under_review", "action_pending", "resolved", "closed"].includes(contract.toState)
    && access.row.assignedAdminUserId && access.row.assignedAdminUserId !== userId) {
    fail("CASE_ASSIGNED_TO_ANOTHER_ADMINISTRATOR", 409);
  }

  let assigneeUserId = access.row.assignedAdminUserId;
  if (contract.toState === "assigned") {
    const requestedAssignee = boundedText(input.assigneeUserId, 180) || userId;
    const assigneeContexts = await activeContexts(db, requestedAssignee);
    if (!adminContext(assigneeContexts, access.row.organizationId)) fail("ASSIGNEE_ADMIN_ROLE_REQUIRED", 403);
    assigneeUserId = requestedAssignee;
  }

  let pendingAppeal: typeof teachSchoolSafetyAppeals.$inferSelect | null = null;
  if (access.row.status === "appealed" && contract.toState === "under_review") {
    [pendingAppeal] = await db.select().from(teachSchoolSafetyAppeals).where(and(
      eq(teachSchoolSafetyAppeals.caseId, access.row.id),
      eq(teachSchoolSafetyAppeals.status, "pending"),
    )).limit(1);
    if (!pendingAppeal) fail("PENDING_APPEAL_REQUIRED", 409);
    const resolvedEvents = await db.select({ actorUserId: teachSchoolSafetyEvents.actorUserId })
      .from(teachSchoolSafetyEvents).where(and(
        eq(teachSchoolSafetyEvents.caseId, access.row.id),
        eq(teachSchoolSafetyEvents.toState, "resolved"),
      )).orderBy(desc(teachSchoolSafetyEvents.sequence)).limit(1);
    const reviewer = schoolSafetyAppealReviewerDecision({
      activeAssignment: Boolean(administrativeContext),
      actorRole,
      appellantUserId: pendingAppeal.appellantUserId,
      resolverUserId: resolvedEvents[0]?.actorUserId ?? null,
      reviewerUserId: userId,
      sameOrganization: Boolean(administrativeContext),
    });
    if (!reviewer.allowed) fail(reviewer.code, 403);
  }

  const previous = await latestEvent(db, access.row.id);
  if (!previous || previous.sequence !== access.row.version) fail("SCHOOL_SAFETY_HASH_CHAIN_INVALID", 409);
  const event = await eventRecord({
    actorRole,
    actorUserId: userId,
    caseId: access.row.id,
    fromState: access.row.status as SchoolSafetyState,
    idempotencyKey,
    previousHash: previous.eventHash,
    rationale: contract.rationale,
    rationaleCode: contract.rationaleCode,
    sequence: access.row.version + 1,
    toState: contract.toState as SchoolSafetyState,
  });
  const now = event.createdAt;
  const nextRow = {
    ...access.row,
    assignedAdminUserId: assigneeUserId,
    status: contract.toState as SchoolSafetyState,
    version: access.row.version + 1,
    updatedAt: now,
    resolutionCode: ["resolved", "closed"].includes(contract.toState) ? contract.rationaleCode : access.row.resolutionCode,
    resolvedAt: contract.toState === "resolved" ? now : access.row.resolvedAt,
    closedAt: contract.toState === "closed" ? now : access.row.closedAt,
  };
  const outbox = await outboxRecord({
    caseRow: nextRow,
    eventId: event.id,
    idempotencyKey,
    operation: "transition",
  });
  const operations: Parameters<ScholariumDb["batch"]>[0][number][] = [
    db.update(teachSchoolSafetyCases).set({
      assignedAdminUserId: assigneeUserId,
      status: contract.toState,
      version: access.row.version + 1,
      updatedAt: now,
      resolutionCode: nextRow.resolutionCode,
      resolvedAt: nextRow.resolvedAt,
      closedAt: nextRow.closedAt,
    }).where(and(
      eq(teachSchoolSafetyCases.id, access.row.id),
      eq(teachSchoolSafetyCases.version, access.row.version),
    )),
    db.insert(teachSchoolSafetyEvents).values(event),
    db.insert(teachSchoolSafetyOutbox).values(outbox),
  ];
  if (contract.toState === "assigned" && assigneeUserId) {
    operations.push(
      db.update(teachSchoolSafetyAssignments).set({ active: false, releasedAt: now }).where(and(
        eq(teachSchoolSafetyAssignments.caseId, access.row.id),
        eq(teachSchoolSafetyAssignments.active, true),
      )),
      db.insert(teachSchoolSafetyAssignments).values({
        id: crypto.randomUUID(),
        caseId: access.row.id,
        adminUserId: assigneeUserId,
        assignedByUserId: userId,
        active: true,
        createdAt: now,
      }),
    );
  }
  if (pendingAppeal) {
    operations.push(db.update(teachSchoolSafetyAppeals).set({
      reviewerUserId: userId,
      status: "reviewed",
      outcomeCode: contract.rationaleCode,
      reviewedAt: now,
    }).where(and(
      eq(teachSchoolSafetyAppeals.id, pendingAppeal.id),
      eq(teachSchoolSafetyAppeals.status, "pending"),
    )));
  }
  await db.batch(operations as [typeof operations[number], ...typeof operations[number][]]);
  return { ...(await getSchoolSafetyCase(db, userId, access.row.id)), replayed: false };
}

export async function appealSchoolSafetyCase(db: ScholariumDb, userId: string, input: Record<string, unknown>) {
  const contract = schoolSafetyAppealContract(input);
  if (!contract.valid) fail("SCHOOL_SAFETY_APPEAL_INPUT_INVALID", 400);
  const access = await accessibleCase(db, userId, contract.caseId);
  if (!access.reporter || access.row.reporterUserId !== userId) fail("ONLY_REPORTER_CAN_APPEAL", 403);
  if (access.row.status !== "resolved") fail("RESOLVED_CASE_REQUIRED_FOR_APPEAL", 409);
  if (access.row.version !== contract.expectedVersion) fail("SCHOOL_SAFETY_VERSION_CONFLICT", 409);
  const idempotencyKey = await idempotencyDigest("appeal:" + contract.caseId, userId, contract.idempotencyKey);
  const [replay] = await db.select({ id: teachSchoolSafetyEvents.id }).from(teachSchoolSafetyEvents).where(and(
    eq(teachSchoolSafetyEvents.caseId, contract.caseId),
    eq(teachSchoolSafetyEvents.idempotencyKey, idempotencyKey),
  )).limit(1);
  if (replay) return { ...(await getSchoolSafetyCase(db, userId, contract.caseId)), replayed: true };
  const previous = await latestEvent(db, access.row.id);
  if (!previous || previous.sequence !== access.row.version) fail("SCHOOL_SAFETY_HASH_CHAIN_INVALID", 409);

  const now = new Date().toISOString();
  const evidenceId = crypto.randomUUID();
  const event = await eventRecord({
    actorRole: access.row.reporterRole as SchoolSafetyActorRole,
    actorUserId: userId,
    caseId: access.row.id,
    fromState: "resolved",
    idempotencyKey,
    previousHash: previous.eventHash,
    rationale: contract.rationale,
    rationaleCode: "reporter_appeal",
    sequence: access.row.version + 1,
    toState: "appealed",
  });
  const nextRow = { ...access.row, status: "appealed", version: access.row.version + 1, updatedAt: now };
  const outbox = await outboxRecord({
    caseRow: nextRow,
    eventId: event.id,
    idempotencyKey,
    operation: "appeal",
  });
  await db.batch([
    db.insert(teachSchoolSafetyEvidence).values({
      id: evidenceId,
      organizationId: access.row.organizationId,
      ownerUserId: userId,
      kind: "appeal",
      content: contract.rationale,
      contentSha256: await sha256(contract.rationale),
      contentType: "text/plain",
      sizeBytes: new TextEncoder().encode(contract.rationale).byteLength,
      createdAt: now,
    }),
    db.insert(teachSchoolSafetyAppeals).values({
      id: crypto.randomUUID(),
      caseId: access.row.id,
      appellantUserId: userId,
      evidenceId,
      status: "pending",
      createdAt: now,
    }),
    db.update(teachSchoolSafetyCases).set({
      status: "appealed",
      version: access.row.version + 1,
      updatedAt: now,
    }).where(and(
      eq(teachSchoolSafetyCases.id, access.row.id),
      eq(teachSchoolSafetyCases.version, access.row.version),
    )),
    db.insert(teachSchoolSafetyEvents).values(event),
    db.insert(teachSchoolSafetyOutbox).values(outbox),
  ]);
  return { ...(await getSchoolSafetyCase(db, userId, access.row.id)), replayed: false };
}

function safeDatadogError(error: unknown) {
  const message = error instanceof Error ? error.message : "DATADOG_DELIVERY_FAILED";
  return /^DATADOG_[A-Z0-9_]+$/u.test(message) || /^DATADOG_HTTP_[0-9]{3}$/u.test(message)
    ? message
    : "DATADOG_DELIVERY_FAILED";
}

export async function reconcileSchoolSafetyOutbox(
  db: ScholariumDb,
  userId: string,
  input: Record<string, unknown>,
  transport?: typeof fetch,
) {
  if (input.confirmation !== "APPLY:DATADOG_CASES") fail("DATADOG_RECONCILIATION_CONFIRMATION_REQUIRED", 403);
  const config = await schoolSafetyRuntimeConfig();
  if (!config.enabled || !config.writeApproved) fail("DATADOG_CASE_SYNC_NOT_APPROVED", 403);
  const contexts = await activeContexts(db, userId);
  const adminOrganizationIds = [...new Set(contexts
    .filter((context) => schoolSafetyAdministrativeRoles.includes(context.role as typeof schoolSafetyAdministrativeRoles[number]))
    .map((context) => context.organizationId))];
  if (!adminOrganizationIds.length) fail("ACTIVE_SCHOOL_ADMIN_ROLE_REQUIRED", 403);
  const requestedLimit = typeof input.limit === "number" && Number.isInteger(input.limit) ? input.limit : 5;
  const limit = Math.min(10, Math.max(1, requestedLimit));
  const now = new Date().toISOString();
  const rows = await db.select().from(teachSchoolSafetyOutbox).where(and(
    inArray(teachSchoolSafetyOutbox.status, ["disabled", "pending", "retry"]),
    or(isNull(teachSchoolSafetyOutbox.nextAttemptAt), lte(teachSchoolSafetyOutbox.nextAttemptAt, now)),
  )).orderBy(asc(teachSchoolSafetyOutbox.createdAt)).limit(limit);
  const results: Array<{ caseId: string; status: string }> = [];
  for (const row of rows) {
    const [caseRow] = await db.select().from(teachSchoolSafetyCases).where(and(
      eq(teachSchoolSafetyCases.id, row.caseId),
      inArray(teachSchoolSafetyCases.organizationId, adminOrganizationIds),
    )).limit(1);
    if (!caseRow) continue;
    const payload = parseJson<SchoolSafetyDatadogPayload | null>(row.redactedPayload, null);
    if (!payload || payload.schema !== "scholarium.school-safety-datadog.v1") {
      await db.update(teachSchoolSafetyOutbox).set({
        status: "failed",
        lastErrorCode: "DATADOG_REDACTED_PAYLOAD_INVALID",
        updatedAt: now,
      }).where(eq(teachSchoolSafetyOutbox.id, row.id));
      results.push({ caseId: row.caseId, status: "failed" });
      continue;
    }
    try {
      const delivered = await deliverSchoolSafetyDatadogCase(config, {
        externalCaseId: row.externalCaseId,
        payload,
        transport,
      });
      const sentAt = new Date().toISOString();
      await db.batch([
        db.update(teachSchoolSafetyOutbox).set({
          status: "sent",
          attempts: row.attempts + 1,
          externalCaseId: delivered.externalCaseId,
          lastErrorCode: null,
          nextAttemptAt: null,
          sentAt,
          updatedAt: sentAt,
        }).where(eq(teachSchoolSafetyOutbox.id, row.id)),
        db.update(teachSchoolSafetyCases).set({ telemetryStatus: "synced", updatedAt: sentAt })
          .where(eq(teachSchoolSafetyCases.id, row.caseId)),
      ]);
      results.push({ caseId: row.caseId, status: "sent" });
    } catch (error) {
      const attempts = row.attempts + 1;
      const retryAt = new Date(Date.now() + Math.min(3_600_000, 30_000 * (2 ** Math.min(attempts - 1, 7)))).toISOString();
      await db.batch([
        db.update(teachSchoolSafetyOutbox).set({
          status: attempts >= 8 ? "failed" : "retry",
          attempts,
          lastErrorCode: safeDatadogError(error),
          nextAttemptAt: attempts >= 8 ? null : retryAt,
          updatedAt: new Date().toISOString(),
        }).where(eq(teachSchoolSafetyOutbox.id, row.id)),
        db.update(teachSchoolSafetyCases).set({ telemetryStatus: "degraded" })
          .where(eq(teachSchoolSafetyCases.id, row.caseId)),
      ]);
      results.push({ caseId: row.caseId, status: attempts >= 8 ? "failed" : "retry" });
    }
  }
  return {
    schema: "scholarium.school-safety-reconciliation.v1",
    processed: results.length,
    results,
    externalWriteApproved: true,
    privateEvidenceIncluded: false,
  };
}
