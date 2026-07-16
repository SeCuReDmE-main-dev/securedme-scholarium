import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  exceptionalAccessAdmission,
  exceptionalAccessDecisionContract,
  exceptionalAccessRequestContract,
} from "../lib/teach-exceptional-access-contracts.ts";

const now = Date.parse("2026-07-16T12:00:00.000Z");

test("requires a justified temporary exceptional-access request", () => {
  const valid = exceptionalAccessRequestContract({
    subjectUserId: "learner-1",
    scope: "learning_support_summary",
    justification: "The learner requested urgent continuity support after a documented platform incident.",
    incidentReference: "incident-2026-0716-001",
    expiresAt: "2026-07-16T13:00:00.000Z",
  }, now);
  assert.equal(valid.valid, true);
  assert.equal(valid.requiredApprovalCount, 2);
  assert.equal(valid.maximumUseCount, 1);
  assert.equal(valid.rawGraphIncluded, false);
  assert.equal(exceptionalAccessRequestContract({ ...valid, expiresAt: "2026-07-17T12:00:00.000Z" }, now).valid, false);
  assert.equal(exceptionalAccessRequestContract({ ...valid, justification: "too short" }, now).valid, false);
});

test("requires a detailed approve or deny decision", () => {
  assert.equal(exceptionalAccessDecisionContract({ decision: "approve", rationale: "Verified incident and bounded support scope." }).valid, true);
  assert.equal(exceptionalAccessDecisionContract({ decision: "approve", rationale: "ok" }).valid, false);
  assert.equal(exceptionalAccessDecisionContract({ decision: "maybe", rationale: "Verified incident and bounded support scope." }).valid, false);
});

test("admits only two independent approvers within an unused window", () => {
  const base = {
    requesterUserId: "admin-requester",
    subjectUserId: "learner-1",
    status: "approved",
    expiresAt: "2026-07-16T13:00:00.000Z",
    nowMs: now,
  };
  assert.equal(exceptionalAccessAdmission({ ...base, approvalActorIds: ["admin-2", "admin-3"] }).admitted, true);
  assert.equal(exceptionalAccessAdmission({ ...base, approvalActorIds: ["admin-2"] }).admitted, false);
  assert.equal(exceptionalAccessAdmission({ ...base, approvalActorIds: ["admin-requester", "admin-3"] }).admitted, false);
  assert.equal(exceptionalAccessAdmission({ ...base, approvalActorIds: ["admin-2", "admin-3"], usedAt: "2026-07-16T12:10:00.000Z" }).admitted, false);
});

test("persists dual control, single-use claiming, audit digests, lifecycle transparency, and API contracts", async () => {
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  const migration = await readFile(new URL("../drizzle/0034_teach_exceptional_access.sql", import.meta.url), "utf8");
  const service = await readFile(new URL("../lib/teach-exceptional-access-service.ts", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/api/teach/exceptional-access/route.ts", import.meta.url), "utf8");
  const decisionRoute = await readFile(new URL("../app/api/teach/exceptional-access/decisions/route.ts", import.meta.url), "utf8");
  const openapi = await readFile(new URL("../app/api/openapi.json/route.ts", import.meta.url), "utf8");
  const accountExport = await readFile(new URL("../app/api/account/export/route.ts", import.meta.url), "utf8");
  const deletion = await readFile(new URL("../app/api/teach/data/route.ts", import.meta.url), "utf8");
  for (const table of ["teach_exceptional_access_requests", "teach_exceptional_access_approvals", "teach_exceptional_access_audit_events"]) {
    assert.match(schema, new RegExp(table));
    assert.match(migration, new RegExp(table));
  }
  assert.match(service, /approvalCount >= 2/);
  assert.match(service, /isNull\(teachExceptionalAccessRequests\.usedAt\)/);
  assert.match(service, /eventDigest: await digest/);
  assert.match(service, /rawGraphIncluded: false/);
  assert.match(service, /rawAnswersIncluded: false/);
  assert.match(route, /cache-control.*private, no-store/);
  assert.match(decisionRoute, /decideExceptionalAccessRequest/);
  assert.match(openapi, /teach\/exceptional-access/);
  assert.match(accountExport, /exceptionalAccessAuditEvents/);
  assert.match(deletion, /retainedSecurityRecords/);
});
