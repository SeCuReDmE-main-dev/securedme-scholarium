import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { drizzle } from "drizzle-orm/d1";
import { build } from "esbuild";

const compiled = await build({ entryPoints: [fileURLToPath(new URL("../lib/teach-safety-case-service.ts", import.meta.url))], bundle: true, platform: "node", format: "esm", write: false, external: ["cloudflare:workers"] });
const service = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text + '\n//# sourceURL=scholarium-safety-service.test.js').toString("base64")}`);

// Real SQLite with D1's prepared-statement and atomic-batch interface. Only
// transport/runtime bindings are absent; the product service and SQL are real.
async function fixture() {
  const sql = new DatabaseSync(":memory:");
  sql.exec(`PRAGMA foreign_keys = ON;
    CREATE TABLE users (id TEXT PRIMARY KEY);
    CREATE TABLE organizations (id TEXT PRIMARY KEY);
    CREATE TABLE interaction_reports (id TEXT PRIMARY KEY);
    CREATE TABLE role_assignments (id TEXT PRIMARY KEY,user_id TEXT,organization_id TEXT,role TEXT,status TEXT);
    INSERT INTO users VALUES ('student-1'),('student-2'),('admin-1'),('admin-2');
    INSERT INTO organizations VALUES ('school-alpha'),('school-bravo');
    INSERT INTO role_assignments VALUES
      ('s1a','student-1','school-alpha','student','active'),
      ('s1b','student-1','school-bravo','student','active'),
      ('s2','student-2','school-bravo','student','active'),
      ('a1','admin-1','school-alpha','school_admin','active'),
      ('a2','admin-2','school-alpha','school_admin','active');`);
  sql.exec(await readFile(new URL("../drizzle/0035_teach_school_safety_cases.sql", import.meta.url), "utf8"));
  // The new additive migration is exercised when present, never applied live.
  try { sql.exec(await readFile(new URL("../drizzle/0038_teach_safety_request_binding.sql", import.meta.url), "utf8")); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
  sql.exec(`INSERT INTO teach_school_safety_policies(id,organization_id,version,status,created_by_user_id) VALUES
    ('pa','school-alpha','synthetic-v1','active','admin-1'),('pb','school-bravo','synthetic-v1','active','admin-1');`);
  function prepared(text, parameters = []) {
    const execute = () => {
      const statement = sql.prepare(text);
      return statement.columns().length ? { results: statement.all(...parameters), success: true, meta: {} }
        : { results: [], success: true, meta: { changes: Number(statement.run(...parameters).changes) } };
    };
    return { bind: (...args) => prepared(text, args), run: async () => execute(), all: async () => execute(),
      raw: async () => { const statement = sql.prepare(text); statement.setReturnArrays(true); return statement.all(...parameters); }, execute };
  }
  const client = { prepare: prepared, batch: async (statements) => {
    sql.exec("BEGIN");
    try { const results = statements.map((statement) => statement.execute()); sql.exec("COMMIT"); return results; }
    catch (error) { sql.exec("ROLLBACK"); throw error; }
  } };
  return { db: drizzle(client), sql };
}

const report = { organizationId: "school-alpha", subjectType: "general", category: "unsafe", proposedSeverity: "standard", summary: "Synthetic report for a bounded human review only.", idempotencyKey: "synthetic-create-0001" };

test("isolates a reporter's idempotency key between organizations", async () => {
  const { db, sql } = await fixture();
  try {
    const first = await service.createSchoolSafetyCase(db, "student-1", report);
    const other = await service.createSchoolSafetyCase(db, "student-1", { ...report, organizationId: "school-bravo" });
    assert.equal(other.case.organizationId, "school-bravo");
    assert.notEqual(other.case.id, first.case.id);
    await assert.rejects(() => service.getSchoolSafetyCase(db, "student-2", first.case.id), /SCHOOL_SAFETY_CASE_ACCESS_DENIED/);
  } finally { sql.close(); }
});

test("exact retries reuse the case; changed payloads cannot reuse the key", async () => {
  const { db, sql } = await fixture();
  try {
    const first = await service.createSchoolSafetyCase(db, "student-1", report);
    const repeat = await service.createSchoolSafetyCase(db, "student-1", report);
    assert.equal(repeat.replayed, true);
    assert.equal(repeat.case.id, first.case.id);
    await assert.rejects(() => service.createSchoolSafetyCase(db, "student-1", { ...report, summary: "Changed synthetic evidence with the same key must be refused." }), /SCHOOL_SAFETY_IDEMPOTENCY_CONFLICT/);
    assert.equal(sql.prepare("SELECT count(*) AS n FROM teach_school_safety_cases").get().n, 1);
    assert.equal(sql.prepare("SELECT count(*) AS n FROM teach_school_safety_events").get().n, 1);
  } finally { sql.close(); }
});

test("persists review, appeal, repeat and independent-reviewer checks", async () => {
  const { db, sql } = await fixture();
  try {
    const { case: row } = await service.createSchoolSafetyCase(db, "student-1", report);
    let version = 1;
    for (const toState of ["triaged", "assigned", "under_review", "resolved"]) {
      await service.transitionSchoolSafetyCase(db, "admin-1", { caseId: row.id, toState, expectedVersion: version++, rationaleCode: "synthetic_review", rationale: "A synthetic human review decision without any real learner data.", idempotencyKey: `transition-${toState}` });
    }
    const appeal = { caseId: row.id, expectedVersion: version, rationale: "Synthetic appeal asking an independent administrator to reconsider missing context.", idempotencyKey: "appeal-test-1" };
    const appealed = await service.appealSchoolSafetyCase(db, "student-1", appeal);
    assert.equal(appealed.case.status, "appealed");
    assert.equal((await service.appealSchoolSafetyCase(db, "student-1", appeal)).replayed, true);
    await assert.rejects(() => service.appealSchoolSafetyCase(db, "student-1", { ...appeal, rationale: "Changed appeal rationale must not be accepted as the same operation." }), /SCHOOL_SAFETY_IDEMPOTENCY_CONFLICT/);
    const review = { caseId: row.id, expectedVersion: version + 1, toState: "under_review", rationaleCode: "second_review", rationale: "Synthetic independent review by a second authorized administrator.", idempotencyKey: "second-review-0001" };
    await assert.rejects(() => service.transitionSchoolSafetyCase(db, "admin-1", review), /SECOND_ADMINISTRATOR_REQUIRED/);
    const result = await service.transitionSchoolSafetyCase(db, "admin-2", review);
    assert.equal(result.case.status, "under_review");
    assert.equal(sql.prepare("SELECT reviewer_user_id FROM teach_school_safety_appeals").get().reviewer_user_id, "admin-2");
    assert.throws(() => sql.exec("UPDATE teach_school_safety_events SET rationale_code='changed'"), /append-only/);
    assert.equal(result.privateEvidenceIncluded, false);
  } finally { sql.close(); }
});

test("collector failure degrades telemetry without changing case decisions", async () => {
  const { db, sql } = await fixture();
  try {
    const { case: row } = await service.createSchoolSafetyCase(db, "student-1", report);
    const config = { casesEnabled: true, enabled: true, endpoint: "http://127.0.0.1:4318/v1/metrics", environment: "test" };
    const input = { confirmation: "APPLY:LOCAL_TELEMETRY", limit: 10 };
    await assert.rejects(() => service.reconcileSchoolSafetyOutbox(db, "student-1", input, async () => new Response("{}"), config), /ACTIVE_SCHOOL_ADMIN_ROLE_REQUIRED/);
    const failed = await service.reconcileSchoolSafetyOutbox(db, "admin-1", input, async () => { throw new Error("private collector diagnostic"); }, config);
    assert.equal(failed.results[0].status, "retry");
    const stored = sql.prepare("SELECT status,version,telemetry_status FROM teach_school_safety_cases WHERE id=?").get(row.id);
    assert.deepEqual({ ...stored }, { status: "received", version: 1, telemetry_status: "degraded" });
    assert.equal(sql.prepare("SELECT last_error_code FROM teach_school_safety_outbox").get().last_error_code, "OTEL_DELIVERY_FAILED");
    const review = await service.transitionSchoolSafetyCase(db, "admin-1", { caseId: row.id, expectedVersion: 1, toState: "triaged", rationaleCode: "synthetic_review", rationale: "The administrator can still triage during a collector outage.", idempotencyKey: "triage-outage-0001" });
    assert.equal(review.case.status, "triaged");
    sql.exec("UPDATE teach_school_safety_outbox SET next_attempt_at=NULL");
    const bodies = [];
    const send = async (_url, init) => { bodies.push(init.body); return new Response("{}"); };
    const sent = await service.reconcileSchoolSafetyOutbox(db, "admin-1", input, send, config);
    assert.equal(sent.processed, 2);
    assert.equal((await service.reconcileSchoolSafetyOutbox(db, "admin-1", input, send, config)).processed, 0);
    assert.doesNotMatch(bodies.join("\n"), /school-alpha|student-1|unsafe|standard|report|caseId|tenant|rationale/);
    assert.equal(sql.prepare("SELECT status,version FROM teach_school_safety_cases").get().status, "triaged");
  } finally { sql.close(); }
});

test("never exports a legacy case-oriented payload", async () => {
  const { db, sql } = await fixture();
  try {
    await service.createSchoolSafetyCase(db, "student-1", report);
    sql.prepare("UPDATE teach_school_safety_outbox SET redacted_payload=?").run(JSON.stringify({ schema: "scholarium.school-safety-datadog.v1", caseId: "private-case", category: "unsafe" }));
    let calls = 0;
    const config = { casesEnabled: true, enabled: true, endpoint: "http://127.0.0.1:4318/v1/metrics", environment: "test" };
    const result = await service.reconcileSchoolSafetyOutbox(db, "admin-1", { confirmation: "APPLY:LOCAL_TELEMETRY" }, async () => { calls++; return new Response("{}"); }, config);
    assert.equal(calls, 0);
    assert.equal(result.results[0].status, "failed");
    assert.equal(sql.prepare("SELECT status FROM teach_school_safety_cases").get().status, "received");
  } finally { sql.close(); }
});
