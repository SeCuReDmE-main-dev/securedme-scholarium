import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("pins the immutable Castellano pack and five-stage path", () => {
  const contracts = read("lib/teach-engine-contracts.ts");
  assert.match(contracts, /castellano-latam-neutral/);
  assert.match(contracts, /sha256:d95b28a584aa13f608eaed1262a7e6d6f24ae573163cf98855a1fe761ff8b26d/);
  for (const stage of ["syllable", "sound", "composition", "reading", "writing"]) assert.match(contracts, new RegExp(stage));
});

test("persists attempt receipt checkpoint and outbox atomically", () => {
  const service = read("lib/teach-engine-service.ts");
  assert.match(service, /await db\.batch\(\[/);
  for (const table of ["teachEngineAttempts", "teachEngineReceipts", "teachEngineSessions", "teachEngineOutbox"]) assert.match(service, new RegExp(table));
  assert.match(service, /previous_checkpoint_digest !== session\.checkpointDigest/);
  assert.match(service, /duplicate\.requestDigest !== requestDigest/);
  assert.match(service, /Idempotency key reused with different content/);
  assert.match(service, /expectedCheckpointDigest: session\.checkpointDigest/);
  assert.match(service, /checkpointDigest, session\.checkpointDigest/);
});

test("treats reused idempotency keys as conflicts and includes engine records in Teach privacy flows", () => {
  const attemptRoute = read("app/api/teach/engine/attempt/route.ts");
  const teachData = read("app/api/teach/data/route.ts");
  const accountExport = read("app/api/account/export/route.ts");
  assert.match(attemptRoute, /message\.includes\("idempotency"\) \? 409/);
  for (const table of ["teachEngineSessions", "teachEngineAttempts", "teachEngineReceipts", "teachEngineOutbox", "teachEnginePrivacyConsents"]) {
    assert.match(teachData, new RegExp(table));
    assert.match(accountExport, new RegExp(table));
  }
});

test("uses signed ephemeral audio and keeps Tenebris results non-authoritative", () => {
  const client = read("lib/teach-engine-client.ts");
  const route = read("app/api/teach/engine/audio-observation/route.ts");
  const observationModule = read("../../services/teach-engine/src/scholarium_teach_engine/ephemeral_observation.py");
  assert.match(client, /requestEphemeralAudioObservation/);
  assert.match(client, /x-teach-observation-id/);
  assert.match(route, /requestEphemeralAudioObservation/);
  assert.match(observationModule, /application-level cleanup claims/);
  assert.match(observationModule, /raw_features_retained/);
  assert.doesNotMatch(observationModule, /V\.O\.T\.|MFCC/i);
});

test("guards group privacy in the D1 schema", () => {
  const migration = read("drizzle/0037_teach_engine_privacy_transactions.sql");
  assert.match(migration, /teach_engine_attempt_checkpoint_guard/);
  assert.match(migration, /teach_engine_aggregate_k_anonymity_violation/);
  assert.match(migration, /cohort_size.*< 10/);
  assert.match(migration, /teach_engine_educator_assignments/);
});

test("uses the same versioned HMAC envelope as the Python verifier", () => {
  const client = read("lib/teach-engine-client.ts");
  assert.match(client, /v1\\nPOST\\n\$\{path\}\\n\$\{timestamp\}\\n\$\{nonce\}\\n/);
  for (const header of ["x-teach-timestamp", "x-teach-nonce", "x-teach-signature"]) assert.match(client, new RegExp(header));
});

test("never lets the browser evaluate canonical mastery", () => {
  const panel = read("app/teach/syllabic-lesson-panel.tsx");
  assert.doesNotMatch(panel, /evaluateLearningAttempt/);
  assert.match(panel, /\/api\/v1\/teach\/engine\/attempt/);
  assert.match(panel, /Aucune progression n’a changé/);
});

test("keeps Timescale telemetry free of identity raw answers and audio", () => {
  const sql = read("../../services/teach-engine/infra/timescale/001_telemetry.sql");
  for (const field of ["contains_identity", "contains_raw_answer", "contains_audio"]) assert.match(sql, new RegExp(`${field} boolean NOT NULL DEFAULT false CHECK \\(${field} = false\\)`));
  assert.doesNotMatch(sql, /user_id|answer text|audio bytea/);
});

test("keeps CodeProject optional and non-authoritative", () => {
  const settings = JSON.parse(read("../../services/teach-engine/infra/codeproject-ai/modulesettings.json"));
  assert.equal(settings.enabled, false);
  assert.equal(settings.canChangeMastery, false);
  assert.equal(settings.retainAudio, false);
  assert.ok(settings.blockedProfiles.includes("minor"));
});
