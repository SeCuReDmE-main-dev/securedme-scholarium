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
  deliverSchoolSafetyMetric,
  schoolSafetyTechnicalMetric,
  schoolSafetyOtlpBody,
  localMetricsEndpoint,
  schoolSafetyRuntimeConfig,
} from "../lib/teach-safety-telemetry.ts";

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
    assert.ok(schoolSafetyPrivacyContract.telemetryForbidden.includes(forbidden));
  }
});

test("projects only technical OTLP counters, without case or learner attributes", () => {
  const metric = schoolSafetyTechnicalMetric("transition", "prealpha");
  assert.deepEqual(metric, { schema: "scholarium.school-safety-technical-metric.v1", operation: "transition", environment: "prealpha" });
  const body = schoolSafetyOtlpBody(metric, 1_800_000_000_000);
  const point = body.resourceMetrics[0].scopeMetrics[0].metrics[0].sum.dataPoints[0];
  assert.equal(point.asInt, "1");
  assert.equal(point.timeUnixNano, "1800000000000000000");
  assert.deepEqual(point.attributes, [{ key: "operation", value: { stringValue: "transition" } }]);
  assert.doesNotMatch(JSON.stringify(body), /case_id|tenant|severity|category|report_text|email|diagnosis|evidence/iu);
  assert.throws(() => schoolSafetyOtlpBody({ ...metric, caseId: "private" }), /OTEL_METRIC_INVALID/);
});

test("disabled telemetry performs no request and missing bindings keep cases closed", async () => {
  let calls = 0;
  const config = await schoolSafetyRuntimeConfig();
  assert.equal(config.casesEnabled, false);
  assert.equal(config.enabled, false);
  assert.equal(config.endpoint, null);
  assert.deepEqual(await deliverSchoolSafetyMetric(config, schoolSafetyTechnicalMetric("create", "test"), async () => { calls++; return new Response("{}"); }), { status: "disabled" });
  assert.equal(calls, 0);
});

test("refuses remote, credential-bearing and redirected collector endpoints", async () => {
  for (const url of ["https://example.com:4318/v1/metrics", "http://localhost:4318/v1/metrics", "http://user:password@127.0.0.1:4318/v1/metrics", "http://127.0.0.1:4318/v1/metrics?secret=private", "http://127.0.0.1:4319/v1/metrics", "http://127.0.0.1:4318/v1/logs"]) assert.equal(localMetricsEndpoint(url), null);
  const config = { casesEnabled: true, enabled: true, endpoint: "https://example.com:4318/v1/metrics", environment: "test" };
  let calls = 0;
  await assert.rejects(() => deliverSchoolSafetyMetric(config, schoolSafetyTechnicalMetric("create", "test"), async () => { calls++; return new Response("{}"); }), /OTEL_LOCAL_ENDPOINT_REQUIRED/);
  assert.equal(calls, 0);
});

test("sends a bounded JSON metric to loopback without credentials", async () => {
  const requests = [];
  const config = { casesEnabled: true, enabled: true, endpoint: "http://127.0.0.1:4318/v1/metrics", environment: "test" };
  const result = await deliverSchoolSafetyMetric(config, schoolSafetyTechnicalMetric("create", "test"), async (url, init) => {
    requests.push({ url, init }); return new Response("{}");
  });
  assert.deepEqual(result, { status: "sent" });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, config.endpoint);
  assert.equal(requests[0].init.method, "POST");
  assert.equal(requests[0].init.credentials, "omit");
  assert.equal(requests[0].init.redirect, "error");
  assert.deepEqual(requests[0].init.headers, { "content-type": "application/json" });
  assert.doesNotMatch(requests[0].init.body, /caseId|organizationId|tenant|category|severity|authorization/iu);
});

test("collector failure and partial success never claim full delivery", async () => {
  const config = { casesEnabled: true, enabled: true, endpoint: "http://127.0.0.1:4318/v1/metrics", environment: "test" };
  const metric = schoolSafetyTechnicalMetric("appeal", "test");
  await assert.rejects(() => deliverSchoolSafetyMetric(config, metric, async () => new Response("private diagnostic", { status: 503 })), /OTEL_HTTP_503/);
  await assert.rejects(() => deliverSchoolSafetyMetric(config, metric, async () => new Response('{"partialSuccess":{"rejectedDataPoints":"1"}}')), /OTEL_PARTIAL_SUCCESS/);
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
  assert.match(envTemplate, /SCHOLARIUM_OTEL_ENABLED=false/);
  assert.doesNotMatch(envTemplate, /DD_API_KEY|DATADOG_CASE/);
  assert.match(reportRoute, /schoolSafetyCaseStatus/);
  assert.doesNotMatch(service + panel, /Synthia/iu);
});
