import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  Gate5ReplayLedger,
  activeGate5Adapters,
  createGate5Envelope,
  gate5ReceiptSigningMessage,
  verifyBouncyCastleGate5Receipt,
  verifyGate5Envelope,
} from "../lib/teach-gate5-contracts.ts";
import { computeQuasicrystalStructuralAddress, validateEphemeralReceiptForMemoryAdmission } from "../lib/teach-quasicrystal-address.ts";

const secret = "gate5-test-secret-that-is-longer-than-thirty-two-characters";
const digest = (character) => `sha256:${character.repeat(64)}`;
const webRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(webRoot, "..", "..");

const fnpPayload = () => ({
  carrier: {
    hierarchy: "I -> I_system^S -> D_f -> dF -> i_fractal",
    D_f: 1.62,
    D_f_hat: 0.62,
    dF: 0.31,
    i_fractal_candidate: null,
  },
  configurationDigest: digest("a"),
  pluginPolicySchema: "fnp-qnn.ffed-plugin-policy.v1",
  pluginIds: ["p011", "p046", "p097", "p109", "p114"],
});

const createFnpEnvelope = (overrides = {}) => createGate5Envelope({
  consentReceiptId: "consent-1",
  idempotencyKey: "idem-1",
  issuedAt: new Date("2026-07-15T20:00:00.000Z"),
  expiresAt: new Date("2026-07-15T20:10:00.000Z"),
  nonce: "nonce-1",
  payload: fnpPayload(),
  purpose: "Evaluate a bounded pseudonymous carrier",
  requestId: "request-1",
  secret,
  subjectId: "student-source-id-never-exported",
  target: "fnp-qnn",
  tenantId: "school-source-id-never-exported",
  ...overrides,
});

test("registers exactly the five active Gate5 adapters while Tenebris stays research-gated", () => {
  assert.deepEqual(activeGate5Adapters().map((adapter) => adapter.id), ["synthia", "memory-lake", "hipporag", "fnp-qnn", "quantech-vid"]);
});

test("creates a signed FNP-QNN packet without raw identity and preserves both hierarchies", async () => {
  const envelope = await createFnpEnvelope();
  const serialized = JSON.stringify(envelope);
  assert.doesNotMatch(serialized, /student-source-id|school-source-id/);
  assert.match(envelope.tenantPseudonym, /^tenant_[a-f0-9]{32}$/);
  assert.match(envelope.subjectPseudonym, /^subject_[a-f0-9]{32}$/);
  assert.equal(envelope.payload.carrier.hierarchy, "I -> I_system^S -> D_f -> dF -> i_fractal");
  assert.deepEqual(await verifyGate5Envelope(envelope, secret, new Date("2026-07-15T20:01:00.000Z")), { valid: true, reason: "verified" });
});

test("rejects raw identity, generated HippoRAG answers, and altered signatures", async () => {
  await assert.rejects(() => createFnpEnvelope({ payload: { ...fnpPayload(), student_email: "person@example.test" } }), /forbidden/);
  await assert.rejects(() => createGate5Envelope({
    consentReceiptId: "consent-2", idempotencyKey: "idem-2", payload: { method: "rag_qa", queryDigest: digest("b") }, purpose: "retrieve", requestId: "request-2",
    secret, subjectId: "subject", target: "hipporag", tenantId: "tenant",
  }), /retrieval-only/);
  const envelope = await createFnpEnvelope();
  const altered = structuredClone(envelope);
  altered.payload.carrier.dF = 0.99;
  assert.equal((await verifyGate5Envelope(altered, secret, new Date("2026-07-15T20:01:00.000Z"))).valid, false);
});

test("fails closed on replay, expiry and revocation and restores its ledger", async () => {
  const envelope = await createFnpEnvelope();
  const ledger = new Gate5ReplayLedger();
  assert.deepEqual(await ledger.admit(envelope, secret, new Date("2026-07-15T20:01:00.000Z")), { admitted: true, reason: "accepted" });
  assert.deepEqual(await ledger.admit(envelope, secret, new Date("2026-07-15T20:02:00.000Z")), { admitted: false, reason: "replay" });
  const restored = Gate5ReplayLedger.restore(ledger.snapshot());
  restored.revoke(envelope.requestId);
  const renewed = await createFnpEnvelope({ idempotencyKey: "idem-renewed", nonce: "nonce-renewed" });
  assert.deepEqual(await restored.admit(renewed, secret, new Date("2026-07-15T20:03:00.000Z")), { admitted: false, reason: "revoked" });
  assert.deepEqual(await ledger.admit(envelope, secret, new Date("2026-07-15T20:11:00.000Z")), { admitted: false, reason: "expired_or_lifetime" });
});

test("admits only one concurrent use of the same nonce", async () => {
  const envelope = await createFnpEnvelope();
  const ledger = new Gate5ReplayLedger();
  const attempts = await Promise.all(Array.from({ length: 32 }, () => ledger.admit(envelope, secret, new Date("2026-07-15T20:01:00.000Z"))));
  assert.equal(attempts.filter((attempt) => attempt.admitted).length, 1);
  assert.equal(attempts.filter((attempt) => attempt.reason === "replay").length, 31);
});

const hilbertLocation = () => ({
  schema: "scholarium.hilbert-location.v1",
  basisId: "ordered-adjacency-laplacian-degree.v1",
  algorithmVersion: "1.0.0",
  dimension: 5,
  normalization: "l2",
  sourceNodeIds: ["a", "b"],
  vector: [0.1, 0.2, 0.3, 0.4, 0.5],
  norm: 0.74161984871,
  projectionDigest: digest("c"),
  uncertainty: 1,
  authority: "computational_representation_only",
});

test("produces deterministic quasicrystal cells and keeps geometry outside cryptographic material", async () => {
  const first = await computeQuasicrystalStructuralAddress({ hilbertLocation: hilbertLocation() });
  const second = await computeQuasicrystalStructuralAddress({ hilbertLocation: hilbertLocation() });
  assert.deepEqual(first, second);
  assert.match(first.cell, /^qc5:/);
  assert.match(first.projectionFingerprint, /^sha256:[a-f0-9]{64}$/);
  assert.equal(first.cryptographicUse, "forbidden");
  const changed = await computeQuasicrystalStructuralAddress({ hilbertLocation: { ...hilbertLocation(), vector: [0.1, 0.2, 0.3, 0.4, 0.6] } });
  assert.notEqual(changed.projectionFingerprint, first.projectionFingerprint);
  assert.notEqual(changed.cell, first.cell);
  await assert.rejects(() => computeQuasicrystalStructuralAddress({ hilbertLocation: { ...hilbertLocation(), keyMaterial: "not-allowed" } }), /cryptographic material/);
});

test("admits only complete content-free Tenebris destruction receipts", () => {
  const receipt = {
    schema: "scholarium.ephemeral-processing-receipt.v1",
    requestId: "ephemeral-1",
    policyVersion: "tenebris-research-v1",
    openedAt: "2026-07-15T20:00:00.000Z",
    completedAt: "2026-07-15T20:00:01.000Z",
    expiresAt: "2026-07-15T20:05:00.000Z",
    destruction: {
      temporaryFilesPurged: true,
      memoryCleared: true,
      keyRevoked: true,
      workerDestructionDigest: digest("d"),
      keyRevocationDigest: digest("e"),
      residualArtifacts: [],
    },
    auditDigest: digest("f"),
    status: "complete",
  };
  assert.deepEqual(validateEphemeralReceiptForMemoryAdmission(receipt), { admitted: true, reason: "bounded_receipt_only", receiptDigest: digest("f") });
  assert.deepEqual(validateEphemeralReceiptForMemoryAdmission({ ...receipt, status: "violation" }), { admitted: false, reason: "destruction_not_complete" });
  assert.throws(() => validateEphemeralReceiptForMemoryAdmission({ ...receipt, transcript: "raw" }), /forbidden content/);
});

test("verifies the standard Ed25519 terminal receipt contract", async () => {
  const keys = await crypto.subtle.generateKey("Ed25519", true, ["sign", "verify"]);
  const publicKey = new Uint8Array(await crypto.subtle.exportKey("raw", keys.publicKey));
  const values = { context: "gate5:fnp-qnn", jobId: "job-1", requestDigest: digest("1"), receiptDigest: digest("2"), status: "completed" };
  const signature = new Uint8Array(await crypto.subtle.sign("Ed25519", keys.privateKey, new TextEncoder().encode(gate5ReceiptSigningMessage(values))));
  const verified = await verifyBouncyCastleGate5Receipt({ ...values, publicKeyB64: Buffer.from(publicKey).toString("base64"), signatureB64: Buffer.from(signature).toString("base64") });
  assert.equal(verified.valid, true);
  const altered = await verifyBouncyCastleGate5Receipt({ ...values, receiptDigest: digest("3"), publicKeyB64: Buffer.from(publicKey).toString("base64"), signatureB64: Buffer.from(signature).toString("base64") });
  assert.equal(altered.valid, false);
});

test("computes structural addresses within a bounded performance budget", async () => {
  const started = performance.now();
  await Promise.all(Array.from({ length: 250 }, (_, index) => computeQuasicrystalStructuralAddress({
    hilbertLocation: { ...hilbertLocation(), projectionDigest: `sha256:${index.toString(16).padStart(64, "0")}` },
  })));
  assert.ok(performance.now() - started < 5_000);
});

test("keeps external runtimes and private Bouncy Castle keys outside the web bundle", () => {
  const gatewaySource = readFileSync(join(webRoot, "lib", "teach-gate5-contracts.ts"), "utf8");
  const knowledgeSource = readFileSync(join(webRoot, "lib", "teach-knowledge-gateway.ts"), "utf8");
  const environmentTemplate = readFileSync(join(webRoot, ".env.example"), "utf8");
  const adapterSource = readFileSync(join(repoRoot, "adapters", "bouncy-castle", "Program.cs"), "utf8");
  for (const source of [gatewaySource, knowledgeSource]) assert.doesNotMatch(source, /from ["'][^"']*(pluginpack|HippoRAG|FfeD|FNP-QNN|V\.o\.T)/iu);
  assert.doesNotMatch(environmentTemplate, /SCHOLARIUM_BC_ED25519_PRIVATE_KEY_B64/);
  assert.doesNotMatch(adapterSource, /LocalApplicationData|state\.json|File\.WriteAllText/);
  assert.doesNotMatch(adapterSource, /D_f|dF|i_fractal|Hilbert|Penrose|quasicrystal/iu);
});
