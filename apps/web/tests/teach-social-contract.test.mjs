import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  growthCapsuleContract,
  learningCircleContract,
  multidimensionalComparisonContract,
  projectEntryContract,
  recapPeriodContract,
  recognitionContract,
  socialIntegrityContract,
} from "../lib/teach-social-contracts.ts";

test("preserves honest difficulty and makes a reframe optional", () => {
  const capsule = growthCapsuleContract({
    domain: "mathematics and soccer",
    title: "A difficult grade and a spatial success",
    context: "This week included a D in mathematics and a decisive soccer goal.",
    reflection: "I want to test trajectories and angles in geometry.",
    originalExpression: "Tabarnak, encore un D en math. J'ai besoin d'aide.",
    suggestedReframe: "The grade is difficult, and I want to test another strategy.",
    reframeChoice: "keep_original",
    evidenceRef: "project:geometry-soccer-01",
    evidenceKind: "sport",
    visibility: "public",
  });
  assert.equal(capsule.reframe.publishedExpression, capsule.reframe.originalExpression);
  assert.equal(capsule.reframe.suggestionOptional, true);
  assert.equal(capsule.reframe.forcedPositivity, false);
  assert.equal(capsule.publicReady, true);
  assert.equal(capsule.popularityScore, null);
});

test("protects people and proof without treating profanity as harm", () => {
  assert.equal(socialIntegrityContract({ text: "Tabarnak, cette note est difficile." }).publishable, true);
  assert.equal(socialIntegrityContract({ text: "Contacte le 514-555-0100." }).publishable, false);
  assert.equal(socialIntegrityContract({ text: "Je vais te frapper." }).publishable, false);
  assert.equal(socialIntegrityContract({ text: "A result", evidenceClaim: "verified", serverVerifiedEvidence: false }).concerns.includes("unverified_proof_claim"), true);
});

test("models complete project threads and bounded learning circles", () => {
  for (const kind of ["milestone", "version", "file", "source", "contribution"]) {
    const entry = projectEntryContract({ kind, label: `${kind} item`, reference: ["version", "file", "source"].includes(kind) ? `ref:${kind}` : "" });
    assert.equal(entry.kind, kind);
    assert.equal(entry.valid, true);
  }
  for (const kind of ["class", "team", "music", "art", "interest", "peer_support"]) {
    assert.equal(learningCircleContract({ kind, title: `${kind} circle`, purpose: "Learn and help each other." }).valid, true);
  }
});

test("keeps recognitions evidence-bound and outside ranking", () => {
  for (const category of ["perseverance", "creativity", "leadership", "peer_support", "clarity", "progress"]) {
    const recognition = recognitionContract({ category, statement: "A documented contribution.", evidenceRef: `evidence:${category}` });
    assert.equal(recognition.valid, true);
    assert.equal(recognition.rankingEffect, "none");
    assert.equal(recognition.numericValue, null);
  }
});

test("bounds weekly monthly and quarterly recap windows", () => {
  assert.equal(recapPeriodContract({ period: "weekly", periodStart: "2026-07-01T00:00:00Z", periodEnd: "2026-07-08T00:00:00Z" }).valid, true);
  assert.equal(recapPeriodContract({ period: "weekly", periodStart: "2026-07-01T00:00:00Z", periodEnd: "2026-08-01T00:00:00Z" }).valid, false);
  assert.equal(recapPeriodContract({ period: "monthly", periodStart: "2026-07-01T00:00:00Z", periodEnd: "2026-07-31T23:59:59Z" }).valid, true);
  assert.equal(recapPeriodContract({ period: "quarterly", periodStart: "2026-07-01T00:00:00Z", periodEnd: "2026-09-30T23:59:59Z" }).valid, true);
});

test("compares dimensions transparently without a person-level total or rank", () => {
  const comparison = multidimensionalComparisonContract({ dimensions: [
    { key: "learning", label: "Learning evidence", left: 7, right: 10, provenance: "attempt states" },
    { key: "projects", label: "Project progress", left: 3, right: 4, provenance: "project milestones" },
    { key: "strengths", label: "Accepted strengths", left: 4, right: 5, provenance: "learner-reviewed observations" },
  ] });
  assert.equal(comparison.valid, true);
  assert.equal(comparison.compositeScore, null);
  assert.equal(comparison.rank, null);
  assert.equal(comparison.leaderboardPosition, null);
  assert.equal(comparison.dimensions.every((dimension) => Boolean(dimension.provenance)), true);
});

test("ships durable social routes, lifecycle handling, dashboards, and a growth_story publication type", async () => {
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  const migration = await readFile(new URL("../drizzle/0031_teach_social_portfolio.sql", import.meta.url), "utf8");
  const service = await readFile(new URL("../lib/teach-social-service.ts", import.meta.url), "utf8");
  const openapi = await readFile(new URL("../app/api/openapi.json/route.ts", import.meta.url), "utf8");
  const exportRoute = await readFile(new URL("../app/api/account/export/route.ts", import.meta.url), "utf8");
  const deleteRoute = await readFile(new URL("../app/api/teach/data/route.ts", import.meta.url), "utf8");
  const publicationTypes = await readFile(new URL("../lib/publication-types.ts", import.meta.url), "utf8");
  for (const table of ["teach_project_threads", "teach_project_entries", "teach_circles", "teach_circle_memberships", "teach_recognitions", "teach_recaps", "teach_organization_scopes"]) {
    assert.match(schema, new RegExp(table));
    assert.match(migration, new RegExp(table));
  }
  assert.match(publicationTypes, /growth_story/);
  assert.match(service, /minimum_cohort_10/);
  assert.match(service, /individualIdentifiersIncluded: false/);
  assert.match(service, /rawAnswersIncluded: false/);
  for (const path of ["teach/projects", "teach/circles", "teach/recognitions", "teach/recaps", "dashboard/student", "dashboard/teacher", "dashboard/organization"]) assert.match(openapi, new RegExp(path.replaceAll("/", "\\/")));
  assert.match(exportRoute, /projectThreads: ownedProjectRows/);
  assert.match(deleteRoute, /delete\(teachRecaps\)/);
  assert.match(deleteRoute, /delete\(teachCircleMemberships\)/);
});
