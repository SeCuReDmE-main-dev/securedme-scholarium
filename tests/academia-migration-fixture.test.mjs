import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("the Academia rehearsal fixture stays synthetic and three items wide", async () => {
  const fixture = JSON.parse(await readFile(new URL("../../../templates/academia-migration/three-publications.example.json", import.meta.url), "utf8"));
  assert.equal(fixture.length, 3);
  assert.ok(fixture.every((item) => item.sourceUrl.startsWith("https://www.academia.edu/")));
  assert.ok(fixture.every((item) => item.title.startsWith("Synthetic publication")));
  assert.deepEqual(fixture.map((item) => item.type), ["article", "report", "white_paper"]);
});
