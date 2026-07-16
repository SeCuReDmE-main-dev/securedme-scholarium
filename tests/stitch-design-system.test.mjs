import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("implements the canonical Evidence Commons landing without exposing the internal asset gallery", async () => {
  const [page, css, design] = await Promise.all([
    read("../app/page.tsx"),
    read("../app/landing-evidence.css"),
    read("../../../assets/desing/stitch_scholarium_research_commons_design_system/stitch_scholarium_research_commons_design_system/scholarium_design.md"),
  ]);
  assert.match(page, /Scholarium/);
  assert.match(page, /Turn knowledge into traceable evidence/);
  assert.match(page, /THE EVIDENCE COMMONS/);
  assert.match(page, /TRUST BY DESIGN/);
  assert.match(page, /SCHOLARIUM TEACH/);
  assert.doesNotMatch(page, /asset-gallery|tier-button|logoDraftPaths|badgeDarkPaths/);
  for (const token of ["#f7f8fc", "#10172f", "#2157ee", "#23b8ff", "#6f42ff", "#0b1230", "#ffc857"]) {
    assert.match(css.toLowerCase(), new RegExp(token));
    assert.match(design.toLowerCase(), new RegExp(token));
  }
  assert.match(css, /min-height: calc\(100svh - 128px\)/);
  assert.match(css, /font-family: var\(--font-geist\)/);
  assert.doesNotMatch(css, /linear-gradient|radial-gradient/);
});

test("exposes the accepted suite sitemap and hash-addressable Teach views", async () => {
  const [app, teach] = await Promise.all([read("../app/scholarium-client.tsx"), read("../app/teach/teach-client.tsx")]);
  for (const label of ["Signal", "Teach", "AlgoQuest", "Cours", "Projets", "Cercles", "Studio", "Statistiques"]) assert.match(app, new RegExp(`label: "${label}"`));
  for (const hash of ["#cours", "#projects", "#circles", "#statistics", "#sources", "#teacher", "#administration"]) assert.match(teach, new RegExp(hash));
  assert.match(teach, /window\.history\.replaceState/);
});

test("ships Evidence Commons Sources and consent controls as real Teach panels", async () => {
  const [panel, css] = await Promise.all([read("../app/teach/teach-governance-panels.tsx"), read("../app/teach/teach-evidence.css")]);
  assert.match(panel, /teach-sources-panel/);
  assert.match(panel, /125 cartes tracees/);
  assert.match(panel, /HippoRAG/);
  assert.match(panel, /Recuperation seulement/);
  assert.match(panel, /teach-administration-panel/);
  assert.match(panel, /role="switch"/);
  assert.match(panel, /method: "PUT"/);
  assert.match(panel, /method: "DELETE"/);
  assert.match(panel, /\/api\/v1\/teach\/consents/);
  assert.match(css, /teach-source-pipeline/);
  assert.match(css, /teach-consent-list/);
  assert.match(css, /@media \(max-width: 520px\)/);
});

test("keeps the public feed usable in local visual QA without weakening production D1 failure", async () => {
  const route = await read("../app/api/publications/route.ts");
  assert.match(route, /local_preview_no_d1/);
  assert.match(route, /requestUrl\.hostname === "localhost"/);
  assert.match(route, /Cloudflare D1 binding `DB` is unavailable/);
  assert.match(route, /return Response\.json\(\{ error: message \}, \{ status: 500 \}\)/);
  assert.doesNotMatch(route.slice(route.indexOf("export async function POST")), /local_preview_no_d1/);
});
