import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const stateUrl = new URL("../../../docs/teach/EXECUTION_STATE.json", import.meta.url);

test("resumes at G14 without rewinding completed mission bundles", async () => {
  const state = JSON.parse(await readFile(stateUrl, "utf8"));
  assert.equal(state.schema, "scholarium.teach-execution-state.v1");
  assert.equal(state.executionFrontier, 156);
  assert.equal(state.activeGate, "G14");
  assert.equal(state.activeAction, 162);
  assert.equal(state.resumePolicy.historicalDebtCanRewind, false);
  assert.equal(state.resumePolicy.completedMissionBundlesCanBeRestarted, false);
  assert.ok(state.validatedMissionBundles.includes("145-156"));
  assert.deepEqual(state.completedIndependentActions, [158, 159, 160, 161]);
  assert.deepEqual(state.nextIndependentActions, [162, 163]);

  const tunnelBlocker = state.blockers.find((item) => item.action === 157);
  assert.equal(tunnelBlocker?.code, "vscode_tunnel_authentication_required");
  assert.equal(tunnelBlocker?.rewindsExecution, false);
});

test("records the visible telemetry task as disabled", async () => {
  const state = JSON.parse(await readFile(stateUrl, "utf8"));
  const correction = state.operationalCorrections.find(
    (item) => item.id === "datadog-visible-task-disabled",
  );
  assert.equal(correction?.status, "applied");
  assert.match(correction.detail, /must not be re-enabled in an interactive user session/i);
});
