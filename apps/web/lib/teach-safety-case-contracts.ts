export const schoolSafetyNormalStates = [
  "received",
  "triaged",
  "assigned",
  "under_review",
  "action_pending",
  "resolved",
  "appealed",
  "closed",
] as const;

export const schoolSafetyExceptionalStates = [
  "urgent_escalation",
  "insufficient_information",
  "duplicate",
  "withdrawn",
  "telemetry_degraded",
] as const;

export const schoolSafetyStates = [...schoolSafetyNormalStates, ...schoolSafetyExceptionalStates] as const;
export const schoolSafetyReporterRoles = ["student", "teacher"] as const;
export const schoolSafetyAdministrativeRoles = ["administrator", "school_admin", "commission_admin"] as const;
export const schoolSafetyActorRoles = [...schoolSafetyReporterRoles, ...schoolSafetyAdministrativeRoles, "system"] as const;
export const schoolSafetyCategories = ["harassment", "personal_data", "unsafe", "spam", "copyright", "other"] as const;
export const schoolSafetySeverities = ["standard", "high", "urgent"] as const;
export const schoolSafetySubjectTypes = ["publication", "comment", "teach_session", "general"] as const;

export type SchoolSafetyState = typeof schoolSafetyStates[number];
export type SchoolSafetyReporterRole = typeof schoolSafetyReporterRoles[number];
export type SchoolSafetyActorRole = typeof schoolSafetyActorRoles[number];
export type SchoolSafetySeverity = typeof schoolSafetySeverities[number];

const transitions: Readonly<Record<SchoolSafetyState, readonly SchoolSafetyState[]>> = {
  received: ["triaged", "urgent_escalation", "insufficient_information", "duplicate", "withdrawn"],
  triaged: ["assigned", "urgent_escalation", "insufficient_information", "duplicate", "withdrawn"],
  assigned: ["under_review", "urgent_escalation", "insufficient_information", "withdrawn"],
  under_review: ["action_pending", "resolved", "urgent_escalation", "insufficient_information"],
  action_pending: ["under_review", "resolved", "urgent_escalation"],
  resolved: ["appealed", "closed"],
  appealed: ["under_review"],
  closed: [],
  urgent_escalation: ["assigned", "under_review", "action_pending", "resolved"],
  insufficient_information: ["triaged", "assigned", "withdrawn"],
  duplicate: ["closed"],
  withdrawn: ["closed"],
  telemetry_degraded: ["received", "triaged", "assigned", "under_review", "action_pending", "resolved"],
};

function boundedText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function oneOf<T extends readonly string[]>(value: unknown, values: T): T[number] | "" {
  return typeof value === "string" && values.includes(value as T[number]) ? value as T[number] : "";
}

export function schoolSafetyCaseCreateContract(input: Record<string, unknown>) {
  const organizationId = boundedText(input.organizationId);
  const subjectType = oneOf(input.subjectType, schoolSafetySubjectTypes);
  const subjectId = boundedText(input.subjectId);
  const category = oneOf(input.category, schoolSafetyCategories);
  const proposedSeverity = oneOf(input.proposedSeverity, schoolSafetySeverities);
  const summary = boundedText(input.summary);
  const idempotencyKey = boundedText(input.idempotencyKey);
  const subjectValid = subjectType === "general" || (subjectId.length >= 8 && subjectId.length <= 200);
  return {
    schema: "scholarium.school-safety-case-create.v1",
    organizationId,
    subjectType,
    subjectId: subjectId || null,
    category,
    proposedSeverity,
    summary,
    idempotencyKey,
    valid: Boolean(
      organizationId.length >= 8 && organizationId.length <= 180
      && subjectType && subjectValid && category && proposedSeverity
      && summary.length >= 20 && summary.length <= 1_200
      && idempotencyKey.length >= 8 && idempotencyKey.length <= 180
    ),
  };
}

export function schoolSafetyTransitionContract(input: Record<string, unknown>) {
  const caseId = boundedText(input.caseId);
  const toState = oneOf(input.toState, schoolSafetyStates);
  const rationaleCode = boundedText(input.rationaleCode);
  const rationale = boundedText(input.rationale);
  const idempotencyKey = boundedText(input.idempotencyKey);
  const expectedVersion = typeof input.expectedVersion === "number" && Number.isInteger(input.expectedVersion) ? input.expectedVersion : 0;
  return {
    schema: "scholarium.school-safety-transition.v1",
    caseId,
    toState,
    rationaleCode,
    rationale,
    idempotencyKey,
    expectedVersion,
    valid: Boolean(
      caseId.length >= 8 && caseId.length <= 180 && toState
      && rationaleCode.length >= 3 && rationaleCode.length <= 80
      && rationale.length >= 20 && rationale.length <= 800
      && idempotencyKey.length >= 8 && idempotencyKey.length <= 180
      && expectedVersion >= 1
    ),
  };
}

export function schoolSafetyAppealContract(input: Record<string, unknown>) {
  const caseId = boundedText(input.caseId);
  const rationale = boundedText(input.rationale);
  const idempotencyKey = boundedText(input.idempotencyKey);
  const expectedVersion = typeof input.expectedVersion === "number" && Number.isInteger(input.expectedVersion) ? input.expectedVersion : 0;
  return {
    schema: "scholarium.school-safety-appeal.v1",
    caseId,
    rationale,
    idempotencyKey,
    expectedVersion,
    valid: Boolean(
      caseId.length >= 8 && caseId.length <= 180
      && rationale.length >= 40 && rationale.length <= 1_200
      && idempotencyKey.length >= 8 && idempotencyKey.length <= 180
      && expectedVersion >= 1
    ),
  };
}

export function schoolSafetyTransitionDecision(input: {
  activeAssignment: boolean;
  actorRole: SchoolSafetyActorRole;
  fromState: SchoolSafetyState;
  isReporter: boolean;
  sameOrganization: boolean;
  toState: SchoolSafetyState;
}) {
  if (input.actorRole !== "system" && !input.activeAssignment) {
    return { allowed: false, code: "ACTIVE_SCHOOL_ASSIGNMENT_REQUIRED" } as const;
  }
  if (!input.sameOrganization || !transitions[input.fromState].includes(input.toState)) {
    return { allowed: false, code: "TRANSITION_FORBIDDEN" } as const;
  }
  if (input.actorRole === "system") {
    const telemetryChange = input.toState === "telemetry_degraded" || input.fromState === "telemetry_degraded";
    return { allowed: telemetryChange, code: telemetryChange ? "SYSTEM_TELEMETRY_TRANSITION" : "SYSTEM_AUTHORITY_BOUNDED" } as const;
  }
  if (schoolSafetyReporterRoles.includes(input.actorRole as SchoolSafetyReporterRole)) {
    const reporterChange = input.isReporter && (input.toState === "withdrawn" || (input.fromState === "resolved" && input.toState === "appealed"));
    return { allowed: reporterChange, code: reporterChange ? "REPORTER_TRANSITION" : "REPORTER_CANNOT_ADJUDICATE" } as const;
  }
  const administrative = schoolSafetyAdministrativeRoles.includes(input.actorRole as typeof schoolSafetyAdministrativeRoles[number]);
  const allowed = administrative && input.toState !== "appealed" && input.toState !== "telemetry_degraded";
  return { allowed, code: allowed ? "ADMINISTRATIVE_TRANSITION" : "ADMINISTRATIVE_TRANSITION_FORBIDDEN" } as const;
}

export function schoolSafetyTransitionTargets(state: SchoolSafetyState) {
  return [...transitions[state]];
}

export function schoolSafetyCaseVisibilityDecision(input: {
  activeAssignment: boolean;
  actorRole: SchoolSafetyActorRole;
  isReporter: boolean;
  sameOrganization: boolean;
}) {
  if (!input.activeAssignment) {
    return { allowed: false, code: "ACTIVE_SCHOOL_ASSIGNMENT_REQUIRED" } as const;
  }
  if (input.isReporter && schoolSafetyReporterRoles.includes(input.actorRole as SchoolSafetyReporterRole)) {
    return { allowed: true, code: "REPORTER_OWN_CASE" } as const;
  }
  const administrative = schoolSafetyAdministrativeRoles.includes(input.actorRole as typeof schoolSafetyAdministrativeRoles[number]);
  return {
    allowed: administrative && input.sameOrganization,
    code: administrative && input.sameOrganization ? "TENANT_ADMIN_CASE" : "CASE_VISIBILITY_FORBIDDEN",
  } as const;
}

export function schoolSafetyAppealReviewerDecision(input: {
  activeAssignment: boolean;
  actorRole: SchoolSafetyActorRole;
  appellantUserId: string;
  resolverUserId: string | null;
  reviewerUserId: string;
  sameOrganization: boolean;
}) {
  const administrative = input.activeAssignment
    && schoolSafetyAdministrativeRoles.includes(input.actorRole as typeof schoolSafetyAdministrativeRoles[number]);
  const independent = input.reviewerUserId !== input.appellantUserId && input.reviewerUserId !== input.resolverUserId;
  return {
    allowed: administrative && input.sameOrganization && independent,
    code: administrative && input.sameOrganization && independent ? "INDEPENDENT_APPEAL_REVIEWER" : "SECOND_ADMINISTRATOR_REQUIRED",
  } as const;
}

export const schoolSafetyPrivacyContract = {
  schema: "scholarium.school-safety-privacy.v1",
  evidenceStorage: "private_d1_reference_only",
  datadogAllowed: ["opaque_case_id", "pseudonymous_tenant", "category", "proposed_severity", "state", "timestamps", "service", "environment", "policy_version", "normalized_outcome"],
  datadogForbidden: ["name", "email", "direct_user_id", "report_text", "image", "audio", "video", "private_conversation", "diagnosis", "psychological_profile", "individual_risk_score", "automated_accusation", "raw_evidence"],
  aiAuthority: "auxiliary_redacted_assistance_only",
  humanDecisionRequired: true,
  realLearnerDataAllowed: false,
} as const;
