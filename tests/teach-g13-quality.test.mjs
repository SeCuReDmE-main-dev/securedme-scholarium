import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { adminAssistantProjection, assistantExchangeEnvelopeContract } from "../lib/teach-contracts.ts";
import { createGate5Envelope } from "../lib/teach-gate5-contracts.ts";
import {
  Gate5CircuitBreaker,
  Gate5QueueModel,
  evaluateGate5Load,
  firstGate5LoadBreakpoint,
  gate5FailurePolicies,
  gate5RetryDecision,
} from "../lib/teach-resilience-contracts.ts";

const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
async function textFiles(root) {
  const output = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) output.push(...await textFiles(path));
    else if ([".ts", ".tsx", ".mjs", ".md", ".json"].includes(extname(entry.name))) output.push(path);
  }
  return output;
}

test("binds Teach API contracts to canonical errors, schemas, and idempotency", async () => {
  const openapi = await readFile(join(webRoot, "app", "api", "openapi.json", "route.ts"), "utf8");
  const gate5Route = await readFile(join(webRoot, "app", "api", "teach", "gate5", "route.ts"), "utf8");
  const workerRoute = await readFile(join(webRoot, "app", "api", "teach", "gate5", "worker", "route.ts"), "utf8");
  assert.match(openapi, /scholarium\.gate5-adapter-envelope\.v1/);
  assert.match(openapi, /"\/api\/v1\/teach\/gate5"/);
  assert.match(gate5Route, /idempotencyKey/);
  assert.match(gate5Route, /onConflictDoNothing/);
  assert.match(workerRoute, /status: 400/);
  assert.match(workerRoute, /status: 401/);
  assert.match(workerRoute, /status: 404/);
  assert.match(workerRoute, /status: 409/);
  assert.match(workerRoute, /status: 503/);
});

test("keeps consent, role, tenant, export, and deletion boundaries explicit", async () => {
  const consentRoute = await readFile(join(webRoot, "app", "api", "teach", "consents", "route.ts"), "utf8");
  const dataRoute = await readFile(join(webRoot, "app", "api", "teach", "data", "route.ts"), "utf8");
  const exportRoute = await readFile(join(webRoot, "app", "api", "account", "export", "route.ts"), "utf8");
  assert.match(consentRoute, /learning.*personalization.*profiling.*sharing.*media/s);
  assert.match(consentRoute, /eq\(teachPurposeConsents\.userId, identity\.userId\)/);
  assert.match(dataRoute, /Scholarium identity and non-Teach publications were retained/);
  for (const table of ["teachAssistantGraphRecords", "teachPurposeConsents", "teachGate5Jobs", "learningAttempts"]) assert.match(dataRoute, new RegExp(`delete\\(${table}\\)`));
  assert.match(exportRoute, /teachPurposeConsents/);
  assert.match(exportRoute, /teachGate5Jobs/);

  const projection = adminAssistantProjection({ cohortSize: 9, masteryCounts: { mastered: 4 }, interventionCount: 2 });
  assert.equal(projection.suppressed, true);
  assert.equal("learners" in projection, false);
  const invalidRoleEnvelope = assistantExchangeEnvelopeContract({ purpose: "support", consentReceiptId: "consent", expiresAt: "2026-07-15T20:10:00.000Z", senderRole: "student", recipientRole: "unknown" });
  assert.equal(invalidRoleEnvelope.valid, false);

  const envelope = await createGate5Envelope({
    consentReceiptId: "consent-g13", idempotencyKey: "idem-g13", payload: { authority: "traceability_support" }, purpose: "classify a bounded source",
    requestId: "request-g13", secret: "g13-secret-longer-than-thirty-two-characters", subjectId: "raw-subject", target: "synthia", tenantId: "raw-tenant",
  });
  assert.equal(envelope.privacy.crossTenantLookupAllowed, false);
  assert.doesNotMatch(JSON.stringify(envelope), /raw-subject|raw-tenant/);
});

test("finds no high-confidence secrets or learner content in Teach logs and adapter proof surfaces", async () => {
  const roots = [join(webRoot, "app", "api", "teach"), join(webRoot, "lib")];
  const files = (await Promise.all(roots.map(textFiles))).flat().filter((path) => /teach|platform-identity|provider-capabilities/u.test(path));
  const secretPattern = /AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|ghp_[A-Za-z0-9]{20,}|sk-proj-[A-Za-z0-9_-]{20,}/u;
  const unsafeLogPattern = /console\.(?:log|info|debug)\([^\n]*(?:email|transcript|rawText|learnerId|studentId)/iu;
  for (const path of files) {
    const source = await readFile(path, "utf8");
    assert.doesNotMatch(source, secretPattern, path);
    assert.doesNotMatch(source, unsafeLogPattern, path);
  }
  const gate5 = await readFile(join(webRoot, "lib", "teach-gate5-contracts.ts"), "utf8");
  assert.match(gate5, /rawIdentityIncluded: false/);
  assert.match(gate5, /externalAdapterReceivesUserId: false/);
  const localInsights = await readFile(join(webRoot, "lib", "local-insights.ts"), "utf8");
  assert.match(localInsights, /Datadog may receive platform-level reliability metadata only/);
  assert.match(localInsights, /never receives a per-user container, publication content, or personal behavior record/);
});

test("defines a fail-closed degraded mode for every active private adapter", () => {
  assert.deepEqual(Object.keys(gate5FailurePolicies), ["synthia", "memory-lake", "hipporag", "fnp-qnn", "quantech-vid"]);
  for (const policy of Object.values(gate5FailurePolicies)) {
    assert.equal(policy.coreLearningContinues, true);
    assert.ok(policy.degradedBehavior.length > 20);
    assert.ok(policy.maxRetries >= 2 && policy.maxRetries <= 4);
  }
  assert.match(gate5FailurePolicies["fnp-qnn"].degradedBehavior, /FNP-QNN\/FfeD/);
  assert.match(gate5FailurePolicies.hipporag.degradedBehavior, /without generating/);
});

test("bounds retries and transitions a circuit through open, half-open, and recovery", () => {
  const first = gate5RetryDecision({ attempt: 1, errorCode: "timeout", nowMs: 1_000, target: "hipporag" });
  assert.deepEqual(first, { action: "retry", attempt: 1, delayMs: 1_000, nextAttemptAt: new Date(2_000).toISOString() });
  assert.equal(gate5RetryDecision({ attempt: 4, errorCode: "timeout", nowMs: 1_000, target: "hipporag" }).action, "degrade");
  assert.equal(gate5RetryDecision({ attempt: 1, errorCode: "contract_violation", nowMs: 1_000, target: "hipporag" }).action, "degrade");

  const breaker = new Gate5CircuitBreaker(3, 10_000);
  assert.equal(breaker.admit(0), true);
  breaker.recordFailure(1_000);
  breaker.recordFailure(2_000);
  assert.equal(breaker.recordFailure(3_000), "open");
  assert.equal(breaker.admit(12_999), false);
  assert.equal(breaker.admit(13_000), true);
  assert.equal(breaker.state(13_000), "half_open");
  breaker.recordSuccess();
  assert.equal(breaker.state(13_001), "closed");
});

test("keeps the queue idempotent, delayed, bounded, and recoverable", () => {
  const queue = new Gate5QueueModel();
  const now = Date.parse("2026-07-15T20:00:00.000Z");
  const expiresAtMs = now + 60_000;
  assert.deepEqual(queue.enqueue({ id: "job-1", idempotencyKey: "idem-1", target: "memory-lake", expiresAtMs }, now), { created: true, id: "job-1" });
  assert.deepEqual(queue.enqueue({ id: "job-duplicate", idempotencyKey: "idem-1", target: "memory-lake", expiresAtMs }, now), { created: false, id: "job-1" });
  assert.equal(queue.claim("memory-lake", now).length, 1);
  const retry = queue.fail("job-1", "timeout", now);
  assert.equal(retry.action, "retry");
  assert.equal(queue.claim("memory-lake", now + 999).length, 0);
  assert.equal(queue.claim("memory-lake", now + 1_000).length, 1);
  const restored = Gate5QueueModel.restore(queue.snapshot());
  assert.equal(restored.claim("memory-lake", now + 1_000).length, 1);
  assert.equal(restored.complete("job-1"), true);
  assert.equal(restored.claim("memory-lake", now + 1_000).length, 0);
});

test("measures 1x, 10x, and 100x load and identifies the first backpressure point", () => {
  const one = evaluateGate5Load(1);
  const ten = evaluateGate5Load(10);
  const hundred = evaluateGate5Load(100);
  assert.deepEqual([one.state, ten.state, hundred.state], ["within_window", "within_window", "backpressure_required"]);
  assert.equal(one.jobs, 20);
  assert.equal(ten.jobs, 200);
  assert.equal(hundred.jobs, 2_000);
  assert.equal(hundred.backlog, 1_800);
  assert.deepEqual(firstGate5LoadBreakpoint(), hundred);
});
