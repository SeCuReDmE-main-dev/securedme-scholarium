const projectEntryKinds = ["milestone", "version", "file", "source", "contribution"] as const;
const circleKinds = ["class", "team", "music", "art", "interest", "peer_support"] as const;
const recognitionKinds = ["perseverance", "creativity", "leadership", "peer_support", "clarity", "progress"] as const;
const recapPeriods = ["weekly", "monthly", "quarterly"] as const;

export const teachSocialSchemaVersions = {
  growthCapsule: "scholarium.growth-capsule.v1",
  projectThread: "scholarium.project-thread.v1",
  projectEntry: "scholarium.project-entry.v1",
  circle: "scholarium.learning-circle.v1",
  recognition: "scholarium.recognition.v1",
  recap: "scholarium.learning-recap.v1",
  integrity: "scholarium.social-integrity.v1",
  comparison: "scholarium.multidimensional-comparison.v1",
  studentDashboard: "scholarium.student-dashboard.v1",
  teacherDashboard: "scholarium.teacher-dashboard.v1",
  organizationDashboard: "scholarium.organization-dashboard.v1",
} as const;

function boundedText(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function finiteScore(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
}

function isoTimestamp(value: unknown) {
  if (typeof value !== "string" || !value.trim() || !Number.isFinite(Date.parse(value))) return "";
  return new Date(value).toISOString();
}

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function socialIntegrityContract(input: Record<string, unknown>) {
  const text = boundedText(input.text, 12_000);
  const concerns: string[] = [];
  if (/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/iu.test(text) || /\b(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/u.test(text)) concerns.push("possible_doxxing");
  if (/\b(?:je vais|on va|nous allons)\s+(?:te|le|la|vous)\s+(?:frapper|tuer|blesser|detruire)\b/iu.test(text)) concerns.push("targeted_threat");
  if (input.authorityClaim === "another_person" && input.identityVerified !== true) concerns.push("unverified_impersonation");
  if (input.evidenceClaim === "verified" && input.serverVerifiedEvidence !== true) concerns.push("unverified_proof_claim");
  return {
    schema: teachSocialSchemaVersions.integrity,
    concerns,
    publishable: concerns.length === 0,
    honestDifficultyAllowed: true,
    profanityAloneIsNotAConcern: true,
    originalExpressionPreserved: true,
    authorityBoundary: "Integrity review protects people and evidence without forcing optimism or erasing an honest difficulty.",
  };
}

export function optionalReframeContract(input: Record<string, unknown>) {
  const originalExpression = boundedText(input.originalExpression, 2_000);
  const suggestedReframe = boundedText(input.suggestedReframe, 2_000);
  const choice = ["keep_original", "use_suggestion", "combine"].includes(String(input.reframeChoice))
    ? String(input.reframeChoice)
    : "keep_original";
  return {
    originalExpression,
    suggestedReframe,
    reframeChoice: choice,
    publishedExpression: choice === "use_suggestion" && suggestedReframe ? suggestedReframe : originalExpression,
    suggestionOptional: true,
    forcedPositivity: false,
  };
}

export function growthCapsuleContract(input: Record<string, unknown>) {
  const visibility = input.visibility === "public" ? "public" : input.visibility === "circle" ? "circle" : "private";
  const reframe = optionalReframeContract(input);
  const reflection = boundedText(input.reflection, 2_000);
  const context = boundedText(input.context, 800);
  const evidenceRef = boundedText(input.evidenceRef, 300);
  const evidenceKind = ["learning", "project", "sport", "music", "art", "community", "other"].includes(String(input.evidenceKind))
    ? String(input.evidenceKind)
    : "other";
  const integrity = socialIntegrityContract({ ...input, text: `${reframe.publishedExpression}\n${reflection}\n${context}` });
  return {
    schema: teachSocialSchemaVersions.growthCapsule,
    domain: boundedText(input.domain, 60),
    title: boundedText(input.title, 180),
    context,
    reflection,
    evidenceRef,
    evidenceKind,
    evidenceStatus: input.serverVerifiedEvidence === true ? "verified" : "self_reported",
    visibility,
    reframe,
    integrity,
    draftValid: Boolean(boundedText(input.domain, 60) && boundedText(input.title, 180) && reflection),
    publicReady: Boolean(evidenceRef && integrity.publishable),
    popularityScore: null,
  };
}

export function projectThreadContract(input: Record<string, unknown>) {
  const status = ["active", "paused", "completed", "archived"].includes(String(input.status)) ? String(input.status) : "active";
  const visibility = ["private", "circle", "public"].includes(String(input.visibility)) ? String(input.visibility) : "private";
  return {
    schema: teachSocialSchemaVersions.projectThread,
    title: boundedText(input.title, 180),
    summary: boundedText(input.summary, 2_000),
    circleId: boundedText(input.circleId, 180) || null,
    status,
    visibility,
    valid: Boolean(boundedText(input.title, 180) && boundedText(input.summary, 2_000)),
  };
}

export function projectEntryContract(input: Record<string, unknown>) {
  const kind = projectEntryKinds.includes(input.kind as (typeof projectEntryKinds)[number])
    ? input.kind as (typeof projectEntryKinds)[number]
    : "milestone";
  const reference = boundedText(input.reference, 600);
  const requiresReference = ["version", "file", "source"].includes(kind);
  return {
    schema: teachSocialSchemaVersions.projectEntry,
    kind,
    label: boundedText(input.label, 180),
    reflection: boundedText(input.reflection, 2_000),
    reference,
    status: ["planned", "active", "completed", "reviewed"].includes(String(input.status)) ? String(input.status) : "active",
    occurredAt: isoTimestamp(input.occurredAt) || new Date().toISOString(),
    valid: Boolean(boundedText(input.label, 180) && (!requiresReference || reference)),
  };
}

export function learningCircleContract(input: Record<string, unknown>) {
  const kind = circleKinds.includes(input.kind as (typeof circleKinds)[number])
    ? input.kind as (typeof circleKinds)[number]
    : "interest";
  const visibility = ["private", "organization", "public"].includes(String(input.visibility)) ? String(input.visibility) : "private";
  return {
    schema: teachSocialSchemaVersions.circle,
    kind,
    title: boundedText(input.title, 120),
    purpose: boundedText(input.purpose, 1_000),
    courseId: boundedText(input.courseId, 180) || null,
    organizationId: boundedText(input.organizationId, 180) || null,
    visibility,
    membershipMode: input.membershipMode === "request" ? "request" : "invite_only",
    valid: Boolean(boundedText(input.title, 120) && boundedText(input.purpose, 1_000)),
  };
}

export function recognitionContract(input: Record<string, unknown>) {
  const category = recognitionKinds.includes(input.category as (typeof recognitionKinds)[number])
    ? input.category as (typeof recognitionKinds)[number]
    : "progress";
  const evidenceRef = boundedText(input.evidenceRef, 300);
  return {
    schema: teachSocialSchemaVersions.recognition,
    category,
    statement: boundedText(input.statement, 500),
    context: boundedText(input.context, 800),
    evidenceRef,
    status: "pending_recipient_review",
    valid: Boolean(boundedText(input.statement, 500) && evidenceRef),
    numericValue: null,
    rankingEffect: "none",
  };
}

export function recapPeriodContract(input: Record<string, unknown>) {
  const period = recapPeriods.includes(input.period as (typeof recapPeriods)[number])
    ? input.period as (typeof recapPeriods)[number]
    : "weekly";
  const periodStart = isoTimestamp(input.periodStart);
  const periodEnd = isoTimestamp(input.periodEnd);
  const limits = { weekly: 8, monthly: 32, quarterly: 100 } as const;
  const spanDays = periodStart && periodEnd ? (Date.parse(periodEnd) - Date.parse(periodStart)) / 86_400_000 : -1;
  return {
    schema: teachSocialSchemaVersions.recap,
    period,
    periodStart,
    periodEnd,
    valid: Boolean(periodStart && periodEnd && spanDays >= 0 && spanDays <= limits[period]),
    authorityBoundary: "A recap summarizes evidence in its period and never becomes a permanent learner label.",
  };
}

export function multidimensionalComparisonContract(input: Record<string, unknown>) {
  const dimensions = Array.isArray(input.dimensions) ? input.dimensions.slice(0, 12).map((item) => {
    const row = recordValue(item);
    const left = finiteScore(row.left);
    const right = finiteScore(row.right);
    return {
      key: boundedText(row.key, 80),
      label: boundedText(row.label, 120),
      left,
      right,
      difference: Math.round((left - right) * 100) / 100,
      provenance: boundedText(row.provenance, 300),
    };
  }).filter((row) => row.key && row.label && row.provenance) : [];
  return {
    schema: teachSocialSchemaVersions.comparison,
    dimensions,
    compositeScore: null,
    rank: null,
    leaderboardPosition: null,
    explainable: true,
    valid: dimensions.length > 1,
    interpretation: "Read each dimension with its provenance; no dimension or total represents the worth or intelligence of a person.",
  };
}

export const teachSocialKinds = { circleKinds, projectEntryKinds, recognitionKinds, recapPeriods } as const;
