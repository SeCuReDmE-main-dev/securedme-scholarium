import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createSignedMediaJobManifest,
  effectiveTeachMediaLimit,
  mediaPublicationConfirmationContract,
  sourceBoundMediaDraft,
  verifySignedMediaJobManifest,
} from "../lib/teach-media-contracts.ts";

const secret = "synthetic-media-manifest-secret-000000000000000000000000";

function source(kind = "growth_story") {
  return {
    kind,
    ref: `${kind}:synthetic-001`,
    title: "A spatial success connected to geometry",
    context: "A learner selected one sports success and one geometry objective.",
    reflection: "I want to test trajectories and angles.",
    evidenceRefs: ["evidence:goal-001", "lesson:geometry-001"],
    sourceIds: ["source-card:sport-001", "source-card:geometry-001"],
  };
}

test("builds source-bound video and podcast drafts only after an explicit action", async () => {
  const video = await sourceBoundMediaDraft({ kind: "video", durationMinutes: 9, source: source(), userTriggered: true });
  const podcast = await sourceBoundMediaDraft({ kind: "podcast", durationMinutes: 30, source: source("thread"), userTriggered: true });
  assert.equal(video.durationMinutes, 5);
  assert.equal(video.limit.dailyCount, 3);
  assert.equal(podcast.durationMinutes, 30);
  assert.equal(podcast.limit.dailyCount, 5);
  assert.equal(video.script.sourceBound, true);
  assert.equal(video.script.generatedClaimsAllowed, false);
  assert.match(video.script.narration, /Evidence 1/);
  await assert.rejects(() => sourceBoundMediaDraft({ kind: "video", source: source(), userTriggered: false }), /explicit user action/);
  await assert.rejects(() => sourceBoundMediaDraft({ kind: "video", source: { ...source(), evidenceRefs: [] }, userTriggered: true }), /evidence reference/);
});

test("provider capabilities can lower but never raise Scholarium limits", () => {
  assert.deepEqual(effectiveTeachMediaLimit("video", { dailyCount: 1, maximumMinutes: 2, source: "provider-live" }), {
    dailyCount: 1,
    maximumMinutes: 2,
    policy: "minimum_of_scholarium_and_provider",
    source: "provider-live",
    providerConfirmed: true,
    clientMayIncreaseLimit: false,
  });
  const inflated = effectiveTeachMediaLimit("podcast", { dailyCount: 500, maximumMinutes: 500, source: "untrusted-client" });
  assert.equal(inflated.dailyCount, 5);
  assert.equal(inflated.maximumMinutes, 30);
});

test("signs short-lived loopback manifests and rejects tampering or expiry", async () => {
  const now = new Date("2026-07-15T20:00:00.000Z");
  const draft = await sourceBoundMediaDraft({ kind: "video", source: source(), userTriggered: true });
  const manifest = await createSignedMediaJobManifest({
    draft,
    providerProjectManifestPath: "C:/synthetic/project.json",
    requestId: "request-001",
    secret,
    userId: "synthetic-user",
    now,
  });
  assert.equal((await verifySignedMediaJobManifest(manifest, secret, new Date("2026-07-15T20:05:00.000Z"))).valid, true);
  const tampered = structuredClone(manifest);
  tampered.media.source.title = "Tampered";
  assert.equal((await verifySignedMediaJobManifest(tampered, secret, new Date("2026-07-15T20:05:00.000Z"))).reason, "signature_mismatch");
  assert.equal((await verifySignedMediaJobManifest(manifest, secret, new Date("2026-07-15T20:11:00.000Z"))).reason, "expired_or_invalid_lifetime");
  assert.equal(manifest.confirmations.externalPublicationConfirmed, false);
});

test("requires a second artifact-specific publication confirmation", () => {
  const digest = `sha256:${"a".repeat(64)}`;
  const rejected = mediaPublicationConfirmationContract({ requestId: "request-001", destination: "scholarium", artifactDigest: digest, userConfirmed: false });
  const confirmed = mediaPublicationConfirmationContract({ requestId: "request-001", destination: "scholarium", artifactDigest: digest, userConfirmed: true });
  assert.equal(rejected.publicationAuthorized, false);
  assert.equal(confirmed.publicationAuthorized, true);
  assert.equal(confirmed.providerDispatchAuthorized, false);
});

test("ships a private replay-resistant adapter and complete media lifecycle", async () => {
  const adapter = await readFile(new URL("../../../adapters/quantech-vid/worker_adapter.py", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/api/teach/media/route.ts", import.meta.url), "utf8");
  const publication = await readFile(new URL("../app/api/teach/media/publication/route.ts", import.meta.url), "utf8");
  const migration = await readFile(new URL("../drizzle/0032_teach_media_worker.sql", import.meta.url), "utf8");
  const deletion = await readFile(new URL("../app/api/teach/data/route.ts", import.meta.url), "utf8");
  const accountExport = await readFile(new URL("../app/api/account/export/route.ts", import.meta.url), "utf8");
  assert.match(adapter, /hmac\.compare_digest/);
  assert.match(adapter, /already used/);
  assert.match(adapter, /127\.0\.0\.1/);
  assert.match(adapter, /publicationPerformed.*False/);
  assert.match(route, /SCHOLARIUM_MEDIA_MANIFEST_SECRET/);
  assert.match(publication, /published: false/);
  assert.match(migration, /teach_media_publication_confirmations/);
  assert.match(deletion, /delete\(teachMediaPublicationConfirmations\)/);
  assert.match(accountExport, /mediaPublicationConfirmations/);
});
