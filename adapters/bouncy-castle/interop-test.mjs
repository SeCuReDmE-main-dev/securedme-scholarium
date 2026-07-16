import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyBouncyCastleGate5Receipt } from "../../apps/web/lib/teach-gate5-contracts.ts";

const root = dirname(fileURLToPath(import.meta.url));
const dll = join(root, "bin", "Release", "net8.0", "Scholarium.BouncyCastle.Adapter.dll");
const run = spawnSync("dotnet", [dll, "self-test"], { encoding: "utf8", windowsHide: true });
assert.equal(run.status, 0, run.stderr || run.stdout);
const output = JSON.parse(run.stdout.trim());
assert.equal(output.verified, true);
assert.equal(output.persisted_key_material, false);
const vector = output.vector;
const verification = await verifyBouncyCastleGate5Receipt({
  context: vector.context,
  jobId: vector.job_id,
  publicKeyB64: vector.public_key_b64,
  receiptDigest: vector.receipt_digest,
  requestDigest: vector.request_digest,
  signatureB64: vector.signature_b64,
  status: vector.terminal_status,
});
assert.equal(verification.valid, true);
process.stdout.write(JSON.stringify({
  schema: "scholarium.bc-webcrypto-interop-proof.v1",
  bouncyCastleSigned: true,
  webCryptoVerified: true,
  persistedKeyMaterial: false,
  publicKeyFingerprint: verification.publicKeyFingerprint,
}));
