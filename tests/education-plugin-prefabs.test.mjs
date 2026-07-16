import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const pluginNames = [
  "scholarium-lesson",
  "scholarium-reminder",
  "scholarium-accessibility",
  "scholarium-source",
  "scholarium-portfolio",
  "scholarium-teacher-report",
];

test("ships six stateless education plugins with complete agent contracts", () => {
  for (const pluginName of pluginNames) {
    const pluginRoot = join(repoRoot, "plugins", pluginName);
    for (const contractFile of ["AGENTS.md", "SOUL.md", "USER.md"]) {
      const path = join(pluginRoot, contractFile);
      assert.ok(existsSync(path), `${pluginName} is missing ${contractFile}`);
      const content = readFileSync(path, "utf8");
      assert.match(content, /central/i);
      assert.match(content, /gateway/i);
    }
    const userContract = readFileSync(join(pluginRoot, "USER.md"), "utf8");
    assert.match(userContract, /Complete starter prompt/);
    assert.match(userContract, /Hilbert/i);
    assert.match(userContract, /Eulerian/i);
    assert.match(userContract, /no MEMORY\.md/i);
    assert.equal(readdirSync(pluginRoot, { recursive: true }).some((entry) => /(^|[\\/])MEMORY\.md$/i.test(String(entry))), false);
  }
});

test("verifies every education plugin through its versioned Gate5 manifest", () => {
  const schema = JSON.parse(readFileSync(join(repoRoot, "docs", "teach", "contracts", "education-plugin-gate5.v1.json"), "utf8"));
  assert.equal(schema.properties.schema.const, "scholarium.education-plugin-gate5.v1");
  for (const pluginName of pluginNames) {
    const pluginRoot = join(repoRoot, "plugins", pluginName);
    const manifest = JSON.parse(readFileSync(join(pluginRoot, "gate5.manifest.json"), "utf8"));
    assert.equal(manifest.schema, "scholarium.education-plugin-gate5.v1");
    assert.equal(manifest.plugin_id, pluginName);
    assert.equal(manifest.stateless, true);
    assert.equal(manifest.memory_model, "central_gateway_only");
    assert.deepEqual(manifest.allowed_callers, ["Codex/OpenAI", "Antigravity/Gemini"]);
    assert.deepEqual(manifest.permissions, ["central_gateway.submit", "central_gateway.read_own_receipt"]);
    assert.ok(manifest.prohibited.includes("plugin_local_memory"));
    assert.ok(manifest.required_contracts.includes("scholarium.central-knowledge-gateway.v1"));
    assert.equal(manifest.integrity.algorithm, "sha256");
    assert.ok(manifest.integrity.files.length >= 5);
    for (const entry of manifest.integrity.files) {
      const content = readFileSync(join(pluginRoot, entry.path));
      assert.equal(createHash("sha256").update(content).digest("hex"), entry.sha256, `${pluginName}/${entry.path} integrity mismatch`);
    }
  }
});

test("defines a central replayable graph and Hilbert-location contract", () => {
  const contract = JSON.parse(readFileSync(join(repoRoot, "docs", "teach", "contracts", "central-knowledge-gateway.v1.json"), "utf8"));
  assert.equal(contract.schema, "scholarium.central-knowledge-gateway.v1");
  assert.equal(contract.memory_model, "central_only");
  assert.equal(contract.plugin_local_memory_forbidden, true);
  assert.deepEqual(contract.partitions, ["approved", "preparation", "quarantine"]);
  assert.deepEqual(contract.graph.matrices, ["adjacency", "oriented_incidence", "degree", "laplacian"]);
  assert.equal(contract.hilbert_location.replayable_ordering_required, true);
  assert.equal(contract.routing.retrieval, "HippoRAG");
});
