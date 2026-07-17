import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("shares one local-only Theme and Access contract across Scholarium", async () => {
  const controls = await source("app/components/scholarium-controls.tsx");
  const layout = await source("app/layout.tsx");
  const landing = await source("app/page.tsx");
  const app = await source("app/scholarium-client.tsx");
  const teach = await source("app/teach/teach-client.tsx");

  assert.match(controls, /scholarium\.theme\.v1/);
  assert.match(controls, /scholarium\.access\.v1/);
  assert.match(controls, /Autism Calm/);
  assert.match(controls, /ADHD Sprint/);
  assert.match(controls, /Deep Work/);
  assert.match(controls, /Stored only in this browser/);
  assert.doesNotMatch(controls, /fetch\(|XMLHttpRequest|navigator\.sendBeacon/);
  assert.match(layout, /data-theme="dark"/);
  assert.match(layout, /data-access="base"/);
  assert.doesNotMatch(layout, /support-widget|<script[^>]+src=/);
  for (const surface of [landing, app, teach]) assert.match(surface, /ScholariumControls/);
});

test("keeps the student, teacher, and organization visual identities explicit", async () => {
  const teach = await source("app/teach/teach-client.tsx");
  const styles = await source("app/teach/teach.css");

  assert.match(teach, /view === "teacher" \? "teacher" : view === "administration" \? "organization" : "student"/);
  assert.match(teach, /"teacher"/);
  assert.match(teach, /"organization"/);
  assert.match(teach, /data-teach-role/);
  assert.match(styles, /\.teach-role-student/);
  assert.match(styles, /\.teach-role-teacher/);
  assert.match(styles, /\.teach-role-organization/);
  assert.match(styles, /--teach-accent:\s*#7c3aed/);
  assert.match(styles, /--teach-accent:\s*#0aa67a/);
  assert.match(styles, /--teach-accent:\s*#83b9e6/);
});

test("keeps public claims pre-alpha and preserves the Teach legal blockers", async () => {
  const landing = await source("app/page.tsx");
  const state = JSON.parse(await source("../../docs/teach/EXECUTION_STATE.json"));

  assert.match(landing, /Public pre-alpha/i);
  assert.match(landing, /not currently presented as deployed in a school/i);
  assert.match(landing, /not a legal verdict, peer review, or scientific authority/i);
  assert.doesNotMatch(landing, /certified|approved for schools|production-ready/i);
  assert.deepEqual(state.blockers.map((blocker) => blocker.action), [48, 157]);
  assert.equal(state.programCompletion.honestHundredPercentClaimAllowed, false);
});
