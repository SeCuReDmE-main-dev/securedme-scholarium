import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("implements the admitted Scholarium landing without exposing the internal asset gallery", async () => {
  const [page, css, system] = await Promise.all([
    read("../app/page.tsx"),
    read("../app/landing-evidence.css"),
    read("../app/scholarium-system.css"),
  ]);
  assert.match(page, /Scholarium/);
  assert.match(page, /Knowledge with/);
  assert.match(page, /visible <em>history/);
  assert.match(page, /A DURABLE KNOWLEDGE TRAIL/);
  assert.match(page, /The receipt does not claim truth/);
  assert.match(page, /SCHOLARIUM TEACH/);
  assert.match(page, /ORGANIZATION DIRECTION/);
  assert.match(page, /landing-hero-dark\.webp/);
  assert.doesNotMatch(page, /asset-gallery|tier-button|logoDraftPaths|badgeDarkPaths/);
  for (const token of ["--sch-midnight", "--sch-ivory", "--sch-gold", "--sch-student", "--sch-teacher", "--sch-org"]) {
    assert.match(system, new RegExp(token));
  }
  assert.match(css, /\.sch-hero[^}]+min-height:680px/);
  assert.match(css, /font-family:\s*var\(--font-display\)/);
  assert.match(css, /html\[data-theme="light"\]/);
});

test("exposes the accepted research sitemap and hash-addressable Teach views", async () => {
  const [app, teach] = await Promise.all([read("../app/scholarium-client.tsx"), read("../app/teach/teach-client.tsx")]);
  for (const label of ["Signal", "Bibliotheque", "Studio", "Sauvegardes", "Formalisation"]) assert.match(app, new RegExp(`label: "${label}"`));
  assert.match(app, /Scholarium Teach/);
  assert.match(app, />Profil</);
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
