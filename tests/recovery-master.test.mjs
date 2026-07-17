import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const root = path.resolve(import.meta.dirname, "../../..");
const recovery = path.join(root, "docs", "teach", "deliverables", "recovery");
const markdownPath = path.join(recovery, "Scholarium_Teach_Recovery_Master.md");
const docxPath = path.join(recovery, "Scholarium_Teach_Recovery_Master.docx");
const pdfPath = path.join(recovery, "Scholarium_Teach_Recovery_Master.pdf");

test("recovery master contains every action exactly once", () => {
  const markdown = fs.readFileSync(markdownPath, "utf8");
  const actionRows = markdown.split(/\r?\n/u).filter((line) => /^\| \d{3} \| G\d{1,2} \|/u.test(line));
  assert.equal(actionRows.length, 163);
  const ids = actionRows.map((line) => line.match(/^\| (\d{3}) \|/u)?.[1]);
  assert.equal(new Set(ids).size, 163);
  assert.deepEqual(ids, Array.from({ length: 163 }, (_, index) => String(index + 1).padStart(3, "0")));
});

test("recovery master preserves the honest closeout state", () => {
  const markdown = fs.readFileSync(markdownPath, "utf8");
  assert.match(markdown, /161\/163 actions sont terminées/u);
  assert.match(markdown, /048:\*\* obtenir une revue Loi 25 qualifiée/u);
  assert.match(markdown, /157:\*\* terminer l'authentification interactive du tunnel VS Code/u);
  assert.match(markdown, /PR #2 est fusionnée/u);
  assert.match(markdown, /I -> I_system\^S -> H_lex -> G_lex -> I_lexicon/u);
  assert.doesNotMatch(markdown, /sk-[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{20,}|AKIA[A-Z0-9]{16}/u);
});

test("recovery master ships synchronized editable and fixed artifacts", () => {
  assert.ok(fs.statSync(markdownPath).size > 50_000);
  assert.ok(fs.statSync(docxPath).size > 100_000);
  assert.ok(fs.statSync(pdfPath).size > 100_000);
  for (const chart of ["action-status.png", "gate-completion.png", "project-timeline.png"]) {
    assert.ok(fs.statSync(path.join(recovery, "assets", chart)).size > 5_000);
  }
  const runtime = JSON.parse(fs.readFileSync(path.join(root, "docs", "teach", "evidence", "recovery-master-runtime.json"), "utf8"));
  assert.equal(runtime.production.length, 5);
  assert.ok(runtime.production.every((surface) => surface.status === 200));
  assert.equal(runtime.pullRequest.state, "MERGED");
});
