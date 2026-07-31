import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  schoolSafetyExceptionalStates,
  schoolSafetyNormalStates,
  schoolSafetyPrivacyContract,
  schoolSafetyTransitionDecision,
  schoolSafetyTransitionTargets,
  schoolSafetyCaseCreateContract,
  schoolSafetyTransitionContract,
  schoolSafetyAppealContract,
  schoolSafetyAppealReviewerDecision,
  schoolSafetyCaseVisibilityDecision,
} from "../lib/teach-safety-case-contracts.ts";
import {
  deliverSchoolSafetyDatadogCase,
  schoolSafetyDatadogPayload,
  schoolSafetyRuntimeConfig,
} from "../lib/teach-safety-datadog.ts";

test("defines the eight normal and five exceptional states without implicit transitions", () => {
  assert.deepEqual(schoolSafetyNormalStates, [
    "received", "triaged", "assigned", "under_review", "action_pending", "resolved", "appealed", "closed",
  ]);
  assert.deepEqual(schoolSafetyExceptionalStates, [
    "urgent_escalation", "insufficient_information", "duplicate", "withdrawn", "telemetry_degraded",
  ]);
  assert.deepEqual(schoolSafetyTransitionTargets("closed"), []);
  assert.equal(schoolSafetyTransitionTargets("received").includes("resolved"), false);
});

test("keeps teachers and students outside adjudication authority", () => {
  assert.equal(schoolSafetyTransitionDecision({
    activeAssignment: true, actorRole: "teacher", fromState: "under_review", isReporter: true, sameOrganization: true, toState: "resolved",
  }).allowed, false);
  assert.equal(schoolSafetyTransitionDecision({
    activeAssignment: true, actorRole: "student", fromState: "received", isReporter: true, sameOrganization: true, toState: "withdrawn",
  }).allowed, true);
  assert.equal(schoolSafetyTransitionDecision({
    activeAssignment: true, actorRole: "student", fromState: "resolved", isReporter: true, sameOrganization: true, toState: "appealed",
  }).allowed, true);
  assert.equal(schoolSafetyTransitionDecision({
    activeAssignment: true, actorRole: "school_admin", fromState: "under_review", isReporter: false, sameOrganization: true, toState: "resolved",
  }).allowed, true);
  assert.equal(schoolSafetyTransitionDecision({
    activeAssignment: true, actorRole: "school_admin", fromState: "under_review", isReporter: false, sameOrganization: false, toState: "resolved",
  }).allowed, false);
  assert.equal(schoolSafetyTransitionDecision({
    activeAssignment: false, actorRole: "school_admin", fromState: "under_review", isReporter: false, sameOrganization: true, toState: "resolved",
  }).allowed, false);
});

test("enforces tenant visibility and a distinct appeal reviewer", () => {
  assert.equal(schoolSafetyCaseVisibilityDecision({
    activeAssignment: true, actorRole: "student", isReporter: true, sameOrganization: true,
  }).allowed, true);
  assert.equal(schoolSafetyCaseVisibilityDecision({
    activeAssignment: true, actorRole: "teacher", isReporter: false, sameOrganization: true,
  }).allowed, false);
  assert.equal(schoolSafetyCaseVisibilityDecision({
    activeAssignment: true, actorRole: "school_admin", isReporter: false, sameOrganization: true,
  }).allowed, true);
  assert.equal(schoolSafetyCaseVisibilityDecision({
    activeAssignment: true, actorRole: "school_admin", isReporter: false, sameOrganization: false,
  }).allowed, false);
  assert.equal(schoolSafetyCaseVisibilityDecision({
    activeAssignment: false, actorRole: "student", isReporter: true, sameOrganization: true,
  }).allowed, false);
  const appeal = {
    activeAssignment: true,
    actorRole: "school_admin",
    appellantUserId: "student-1",
    resolverUserId: "admin-1",
    sameOrganization: true,
  };
  assert.equal(schoolSafetyAppealReviewerDecision({ ...appeal, reviewerUserId: "admin-2" }).allowed, true);
  assert.equal(schoolSafetyAppealReviewerDecision({ ...appeal, reviewerUserId: "admin-1" }).allowed, false);
  assert.equal(schoolSafetyAppealReviewerDecision({ ...appeal, reviewerUserId: "student-1" }).allowed, false);
  assert.equal(schoolSafetyAppealReviewerDecision({ ...appeal, reviewerUserId: "admin-2", sameOrganization: false }).allowed, false);
});

test("bounds create, transition, and appeal inputs", () => {
  const create = schoolSafetyCaseCreateContract({
    organizationId: "synthetic-school-001",
    subjectType: "general",
    category: "unsafe",
    proposedSeverity: "standard",
    summary: "A synthetic situation requiring a calm human review.",
    idempotencyKey: "create-0001",
  });
  assert.equal(create.valid, true);
  assert.equal(schoolSafetyCaseCreateContract({ ...create, summary: "short" }).valid, false);
  assert.equal(schoolSafetyCaseCreateContract({ ...create, summary: "x".repeat(1_201) }).valid, false);
  assert.equal(schoolSafetyTransitionContract({
    caseId: "case-00000001",
    toState: "triaged",
    rationaleCode: "initial_triage",
    rationale: "A human administrator completed the initial bounded triage.",
    idempotencyKey: "transition-0001",
    expectedVersion: 1,
  }).valid, true);
  assert.equal(schoolSafetyAppealContract({
    caseId: "case-00000001",
    rationale: "The reporter requests a second independent review because relevant context was missing.",
    idempotencyKey: "appeal-0001",
    expectedVersion: 4,
  }).valid, true);
});

test("declares zero raw evidence, identity, diagnosis, or automated verdict in telemetry", () => {
  assert.equal(schoolSafetyPrivacyContract.realLearnerDataAllowed, false);
  assert.equal(schoolSafetyPrivacyContract.humanDecisionRequired, true);
  for (const forbidden of ["name", "email", "raw_evidence", "diagnosis", "automated_accusation"]) {
    assert.ok(schoolSafetyPrivacyContract.datadogForbidden.includes(forbidden));
  }
});

test("maps a redacted deterministic Datadog payload", async () => {
  const payload = await schoolSafetyDatadogPayload({
    caseId: "case-opaque-0001",
    organizationId: "synthetic-school-private-id",
    category: "unsafe",
    proposedSeverity: "high",
    state: "under_review",
    createdAt: "2026-07-31T12:00:00.000Z",
    updatedAt: "2026-07-31T12:10:00.000Z",
    environment: "prealpha",
    policyVersion: "synthetic-v1",
  });
  const serialized = JSON.stringify(payload);
  assert.match(payload.tenantRef, /^tenant_[a-f0-9]{24}$/);
  assert.doesNotMatch(serialized, /synthetic-school-private-id/);
  assert.doesNotMatch(serialized, /email|password|report_text|raw_evidence|diagnosis/iu);
});

test("refuses Datadog delivery unless both flags and explicit approval are present", async () => {
  let calls = 0;
  await assert.rejects(() => deliverSchoolSafetyDatadogCase({
    enabled: false,
    writeApproved: false,
    site: null,
    apiKey: null,
    appKey: null,
    projectId: null,
    typeId: null,
    environment: "prealpha",
  }, {
    payload: {
      schema: "scholarium.school-safety-datadog.v1",
      caseId: "case-opaque-0001",
      tenantRef: "tenant_000000000000000000000000",
      category: "unsafe",
      proposedSeverity: "standard",
      state: "received",
      createdAt: "2026-07-31T12:00:00.000Z",
      updatedAt: "2026-07-31T12:00:00.000Z",
      service: "securedme-scholarium",
      environment: "prealpha",
      policyVersion: "synthetic-v1",
      normalizedOutcome: null,
    },
    transport: async () => {
      calls += 1;
      return new Response("{}");
    },
  }), /DATADOG_CASE_SYNC_NOT_APPROVED/);
  assert.equal(calls, 0);
});

test("fails closed when Cloudflare runtime bindings are unavailable", async () => {
  const config = await schoolSafetyRuntimeConfig();
  assert.equal(config.casesEnabled, false);
  assert.equal(config.enabled, false);
  assert.equal(config.writeApproved, false);
  assert.equal(config.apiKey, null);
  assert.equal(config.appKey, null);
});

test("exercises create, status, and attribute Datadog requests with a simulated transport only", async () => {
  const requests = [];
  const transport = async (url, init) => {
    requests.push({ url: String(url), init });
    const body = requests.length === 1
      ? JSON.stringify({ data: [] })
      : requests.length === 2
        ? JSON.stringify({ data: { id: "external-case-001" } })
        : "{}";
    return new Response(body, {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  const payload = {
    schema: "scholarium.school-safety-datadog.v1",
    caseId: "case-opaque-0001",
    tenantRef: "tenant_000000000000000000000000",
    category: "unsafe",
    proposedSeverity: "urgent",
    state: "under_review",
    createdAt: "2026-07-31T12:00:00.000Z",
    updatedAt: "2026-07-31T12:10:00.000Z",
    service: "securedme-scholarium",
    environment: "prealpha",
    policyVersion: "synthetic-v1",
    normalizedOutcome: null,
  };
  const delivered = await deliverSchoolSafetyDatadogCase({
    enabled: true,
    writeApproved: true,
    site: "datadoghq.com",
    apiKey: "fixture-api-key",
    appKey: "fixture-app-key",
    projectId: "fixture-project",
    typeId: "fixture-type",
    environment: "prealpha",
  }, { payload, transport });
  assert.deepEqual(delivered, { externalCaseId: "external-case-001", status: "sent" });
  assert.equal(requests.length, 4);
  assert.match(requests[0].url, /\/api\/v2\/cases\?/);
  assert.equal(requests[0].init?.method, "GET");
  assert.match(requests[1].url, /\/api\/v2\/cases$/);
  assert.match(requests[2].url, /\/status$/);
  assert.match(requests[3].url, /\/attributes$/);
  const bodies = requests.map((request) => String(request.init?.body ?? "")).join("\n");
  assert.doesNotMatch(bodies, /fixture-api-key|fixture-app-key|email|password|raw_evidence|diagnosis/iu);
});

test("reconciles an existing Datadog case before retrying a create", async () => {
  const requests = [];
  const title = "Scholarium school safety case-opaque-retry";
  const transport = async (url, init) => {
    requests.push({ url: String(url), init });
    const body = requests.length === 1
      ? JSON.stringify({ data: [{ id: "existing-case-001", attributes: { title } }] })
      : "{}";
    return new Response(body, { status: 200, headers: { "content-type": "application/json" } });
  };
  const delivered = await deliverSchoolSafetyDatadogCase({
    enabled: true,
    writeApproved: true,
    site: "datadoghq.com",
    apiKey: "fixture-api-key",
    appKey: "fixture-app-key",
    projectId: "fixture-project",
    typeId: "fixture-type",
    environment: "prealpha",
  }, {
    payload: {
      schema: "scholarium.school-safety-datadog.v1",
      caseId: "case-opaque-retry",
      tenantRef: "tenant_000000000000000000000000",
      category: "unsafe",
      proposedSeverity: "standard",
      state: "received",
      createdAt: "2026-07-31T12:00:00.000Z",
      updatedAt: "2026-07-31T12:00:00.000Z",
      service: "securedme-scholarium",
      environment: "prealpha",
      policyVersion: "synthetic-v1",
      normalizedOutcome: null,
    },
    transport,
  });
  assert.deepEqual(delivered, { externalCaseId: "existing-case-001", status: "sent" });
  assert.equal(requests.length, 3);
  assert.equal(requests.filter((request) => request.init?.method === "POST" && /\/api\/v2\/cases$/.test(request.url)).length, 0);
});

test("persists tenant, idempotency, append-only, second-review, API, and UI controls", async () => {
  const [migration, schema, service, openapi, panel, envTemplate, reportRoute] = await Promise.all([
    readFile(new URL("../drizzle/0035_teach_school_safety_cases.sql", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/teach-safety-case-service.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/openapi.json/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/teach/teach-safety-panel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
    readFile(new URL("../app/api/publication-interactions/route.ts", import.meta.url), "utf8"),
  ]);
  for (const table of [
    "teach_school_safety_policies",
    "teach_school_safety_evidence",
    "teach_school_safety_cases",
    "teach_school_safety_assignments",
    "teach_school_safety_events",
    "teach_school_safety_appeals",
    "teach_school_safety_outbox",
  ]) {
    assert.match(migration, new RegExp(table));
    assert.match(schema, new RegExp(table));
  }
  assert.match(migration, /school safety events are append-only/);
  assert.match(migration, /WHERE .*status.* = 'pending'/);
  assert.match(migration, /WHERE .*status.* = 'active'/);
  assert.match(service, /schoolSafetyAppealReviewerDecision/);
  assert.match(service, /inArray\(teachSchoolSafetyCases\.organizationId, adminOrganizationIds\)/);
  assert.match(service, /SCHOOL_SAFETY_VERSION_CONFLICT/);
  assert.match(service, /privateEvidenceIncluded: false/);
  assert.match(openapi, /teach\/safety-cases\/\{caseId\}\/appeals/);
  assert.match(panel, /aria-live="polite"/);
  assert.match(panel, /Une priorité proposée n’est jamais un verdict/);
  assert.match(envTemplate, /SCHOLARIUM_SAFETY_CASES_ENABLED=false/);
  assert.match(envTemplate, /DATADOG_CASE_SYNC_ENABLED=false/);
  assert.match(reportRoute, /schoolSafetyCaseStatus/);
  assert.doesNotMatch(service + panel, /Synthia/iu);
});
