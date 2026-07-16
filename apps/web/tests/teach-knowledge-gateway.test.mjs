import assert from "node:assert/strict";
import test from "node:test";
import { computeKnowledgeGatewayReceipt } from "../lib/teach-knowledge-gateway.ts";

const envelope = (graphDelta) => ({
  pluginId: "scholarium-source",
  requestId: "request-1",
  idempotencyKey: "idempotency-1",
  purpose: "Classify sourced lesson evidence",
  consentReceiptId: "consent-1",
  tenantPseudonym: "tenant-1",
  graphDelta,
});

test("computes replayable graph matrices and a normalized Hilbert vector", async () => {
  const receipt = await computeKnowledgeGatewayReceipt(envelope({
    nodes: [{ id: "c" }, { id: "a" }, { id: "b" }],
    edges: [{ id: "edge-2", source: "b", target: "c" }, { id: "edge-1", source: "a", target: "b" }],
  }));

  assert.deepEqual(receipt.ordering.nodes, ["a", "b", "c"]);
  assert.deepEqual(receipt.ordering.edges, ["edge-1", "edge-2"]);
  assert.deepEqual(receipt.matrices.adjacency, [[0, 1, 0], [1, 0, 1], [0, 1, 0]]);
  assert.deepEqual(receipt.matrices.orientedIncidence, [[-1, 0], [1, -1], [0, 1]]);
  assert.deepEqual(receipt.matrices.degree, [[1, 0, 0], [0, 2, 0], [0, 0, 1]]);
  assert.deepEqual(receipt.matrices.laplacian, [[1, -1, 0], [-1, 2, -1], [0, -1, 1]]);
  assert.equal(receipt.eulerian.status, "trail");
  assert.deepEqual(receipt.eulerian.oddDegreeVertices, ["a", "c"]);
  assert.equal(receipt.partition, "preparation");
  assert.equal(receipt.adapterStatus.hippoRag, "registered_retrieval_only");
  assert.equal(receipt.adapterStatus.fnpQnn, "registered_pseudonymous_only");
  assert.equal(receipt.adapterStatus.runtimeInvocationPerformed, false);
  assert.equal(receipt.hilbertLocation.dimension, 21);
  assert.match(receipt.hilbertLocation.projectionDigest, /^sha256:[a-f0-9]{64}$/);
  const vectorNorm = Math.sqrt(receipt.hilbertLocation.vector.reduce((sum, value) => sum + value * value, 0));
  assert.ok(Math.abs(vectorNorm - 1) < 1e-9);
  assert.match(receipt.quasicrystalAddress.cell, /^qc5:/);
  assert.equal(receipt.quasicrystalAddress.cryptographicUse, "forbidden");
});

test("distinguishes Euler circuits from disconnected non-Eulerian graphs", async () => {
  const circuit = await computeKnowledgeGatewayReceipt(envelope({
    nodes: [{ id: "a" }, { id: "b" }, { id: "c" }],
    edges: [{ id: "ab", source: "a", target: "b" }, { id: "bc", source: "b", target: "c" }, { id: "ca", source: "c", target: "a" }],
  }));
  assert.equal(circuit.eulerian.status, "circuit");

  const disconnected = await computeKnowledgeGatewayReceipt(envelope({
    nodes: [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }],
    edges: [{ id: "ab", source: "a", target: "b" }, { id: "cd", source: "c", target: "d" }],
  }));
  assert.equal(disconnected.eulerian.status, "none");
  assert.equal(disconnected.eulerian.connectedComponents.length, 2);
});

test("rejects graph deltas with orphan edges", async () => {
  await assert.rejects(() => computeKnowledgeGatewayReceipt(envelope({
    nodes: [{ id: "a" }], edges: [{ id: "bad-edge", source: "a", target: "missing" }],
  })), /unknown node/);
});
