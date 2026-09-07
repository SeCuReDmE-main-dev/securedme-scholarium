import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const webRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const repoRoot = dirname(dirname(webRoot));

test("ships exactly twelve honest Scholarium WebMCP descriptors", async () => {
  const manifest = JSON.parse(await readFile(join(webRoot, "public", "webmcp", "securedme-scholarium.manifest.json"), "utf8"));
  const bridge = await readFile(join(webRoot, "app", "components", "webmcp-bridge.tsx"), "utf8");
  const manifestRoute = await readFile(join(webRoot, "app", "api", "webmcp", "manifest", "route.ts"), "utf8");
  assert.equal(manifest.schema, "securedme.webmcp.v1");
  assert.equal(manifest.product.slug, "scholarium");
  assert.equal(manifest.product.canonicalStateOwner, "algoquest");
  assert.equal(manifest.product.applicationStateOwner, "scholarium");
  assert.equal(manifest.tools.length, 12);
  assert.equal(new Set(manifest.tools.map((tool) => tool.name)).size, 12);
  assert.equal(manifest.tools.filter((tool) => tool.name.startsWith("scholarium_")).length, 10);
  assert.ok(manifest.tools.some((tool) => tool.name === "securedme_companion_context"));
  assert.ok(manifest.tools.some((tool) => tool.name === "securedme_qbit_plan_handoff"));
  const envelopeFields = ["schema", "ok", "status", "data", "error", "receipt", "trace"];
  assert.ok(manifest.tools.every((tool) => tool.outputSchema.additionalProperties === false));
  assert.ok(manifest.tools.every((tool) => envelopeFields.every((field) => tool.outputSchema.required.includes(field))));
  const submit = manifest.tools.find((tool) => tool.name === "scholarium_submit_publication");
  assert.equal(submit.availability, "planned");
  assert.equal(submit.handler.kind, "unavailable");
  assert.match(submit.unavailableReason, /idempotency key/);
  assert.match(bridge, /document as Document & \{ modelContext\?: ModelContext \}/);
  assert.match(bridge, /fetch\("\/api\/v1\/webmcp\/manifest"/);
  assert.match(manifestRoute, /securedme-scholarium\.manifest\.json/);
});

test("keeps the shared companion minimal, adaptive and theme-provenanced", async () => {
  const extension = JSON.parse(await readFile(join(repoRoot, "companion", "manifest.json"), "utf8"));
  const themes = JSON.parse(await readFile(join(repoRoot, "companion", "theme-registry.json"), "utf8"));
  assert.equal(extension.manifest_version, 3);
  assert.deepEqual(extension.permissions, ["activeTab", "scripting", "sidePanel", "storage"]);
  assert.equal(extension.host_permissions, undefined);
  const slugs = ["algoquest", "algorithm-builder", "visual-algorithm-designer", "scholarium", "ffed-qlc", "fnp-qnn", "gateway", "quanthor", "synthia", "retailguard", "tesla-workbench", "vot-guardian"];
  assert.ok(slugs.every((slug) => themes.themes[slug]?.source.includes("stitch_")));
  assert.equal(themes.themes["algorithm-builder"].sourceStatus, "fallback_missing_product_stitch");
});

test("defines the twelve-product suite matrix and only two repeatable common tool names", async () => {
  const matrix = JSON.parse(await readFile(join(repoRoot, "tools", "webmcp-product-matrix.json"), "utf8"));
  assert.equal(matrix.schema, "securedme.webmcp.product-matrix.v1");
  assert.equal(matrix.products.length, 12);
  assert.equal(new Set(matrix.products.map((product) => product.slug)).size, 12);
  assert.deepEqual(matrix.commonTools, ["securedme_companion_context", "securedme_qbit_plan_handoff"]);
});

test("passes the deterministic local WebMCP Evidence Gate", () => {
  const gate = spawnSync(process.execPath, [join(repoRoot, "tools", "webmcp_evidence_gate.mjs"), "--check", "--require-b-plus"], { cwd: repoRoot, encoding: "utf8" });
  assert.equal(gate.status, 0, `${gate.stdout}\n${gate.stderr}`);
  const summary = JSON.parse(gate.stdout);
  assert.equal(summary.passed, true);
  assert.ok(summary.score >= 85);
  assert.equal(summary.barriersFailed, 0);
  assert.equal(summary.fixtures, 12);
});
