import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { routeLifeScienceResearch } from "../lib/teach-life-science-router.ts";

const purpose = "Teach a student how to collect traceable primary-source evidence.";

test("routes bounded questions to the smallest specialized installed tool set", () => {
  const variant = routeLifeScienceResearch({ question: "Is this ClinVar variant represented in gnomAD?", educationalPurpose: purpose });
  const structure = routeLifeScienceResearch({ question: "Compare an AlphaFold protein structure with a PDB record.", educationalPurpose: purpose });
  assert.equal(variant.lane, "variant");
  assert.deepEqual(variant.tools, ["life-science-research:clinvar-variation-skill", "life-science-research:gnomad-graphql-skill"]);
  assert.equal(structure.lane, "structure");
  assert.equal(structure.executionAuthorized, false);
  assert.ok(structure.boundaries.includes("human_review_required"));
});

test("fails closed without an educational purpose and exposes an authenticated route", async () => {
  assert.throws(() => routeLifeScienceResearch({ question: "Find a gene" }), /educational purpose/);
  const route = await readFile(new URL("../app/api/teach/life-science/router/route.ts", import.meta.url), "utf8");
  assert.match(route, /getPlatformIdentity/);
  assert.match(route, /signInRequired/);
  assert.match(route, /private, no-store/);
});
