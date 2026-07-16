const accessScopes = ["learning_support_summary", "privacy_request_support", "security_incident_metadata"] as const;
const decisions = ["approve", "deny"] as const;

function boundedText(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export function exceptionalAccessRequestContract(input: Record<string, unknown>, nowMs = Date.now()) {
  const subjectUserId = boundedText(input.subjectUserId, 180);
  const incidentReference = boundedText(input.incidentReference, 180);
  const justification = boundedText(input.justification, 1_200);
  const scope = typeof input.scope === "string" && accessScopes.includes(input.scope as typeof accessScopes[number]) ? input.scope : "";
  const expiresAtMs = typeof input.expiresAt === "string" ? Date.parse(input.expiresAt) : Number.NaN;
  const minimum = nowMs + 5 * 60 * 1_000;
  const maximum = nowMs + 4 * 60 * 60 * 1_000;
  return {
    schema: "scholarium.exceptional-access-request.v1",
    subjectUserId,
    scope,
    justification,
    incidentReference,
    expiresAt: Number.isFinite(expiresAtMs) ? new Date(expiresAtMs).toISOString() : "",
    valid: Boolean(subjectUserId && scope && justification.length >= 40 && incidentReference && expiresAtMs >= minimum && expiresAtMs <= maximum),
    requiredApprovalCount: 2,
    maximumUseCount: 1,
    rawGraphIncluded: false,
    rawAnswersIncluded: false,
  };
}

export function exceptionalAccessDecisionContract(input: Record<string, unknown>) {
  const decision = typeof input.decision === "string" && decisions.includes(input.decision as typeof decisions[number]) ? input.decision : "";
  const rationale = boundedText(input.rationale, 800);
  return { schema: "scholarium.exceptional-access-decision.v1", decision, rationale, valid: Boolean(decision && rationale.length >= 20) };
}

export function exceptionalAccessAdmission(input: {
  approvalActorIds: string[];
  expiresAt: string;
  nowMs?: number;
  requesterUserId: string;
  status: string;
  subjectUserId: string;
  usedAt?: string | null;
}) {
  const nowMs = input.nowMs ?? Date.now();
  const distinctApprovers = [...new Set(input.approvalActorIds)];
  const invalidActor = distinctApprovers.some((id) => id === input.requesterUserId || id === input.subjectUserId);
  const admitted = input.status === "approved"
    && distinctApprovers.length >= 2
    && !invalidActor
    && Date.parse(input.expiresAt) > nowMs
    && !input.usedAt;
  return {
    schema: "scholarium.exceptional-access-admission.v1",
    admitted,
    approvalCount: distinctApprovers.length,
    singleUse: true,
    rawGraphIncluded: false,
    rawAnswersIncluded: false,
    reason: admitted ? "dual_control_satisfied" : "not_admitted",
  };
}
