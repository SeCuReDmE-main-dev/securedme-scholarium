import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("ships exactly forty formative Life Science prompts with evidence and human review gates", async () => {
  const book = await readFile(new URL("../../../docs/teach/LIFE_SCIENCE_40_PROMPT_BOOK.md", import.meta.url), "utf8");
  const promptIds = [...book.matchAll(/^## (LS-\d{2})\b/gmu)].map((match) => match[1]);
  assert.deepEqual(promptIds, Array.from({ length: 40 }, (_, index) => `LS-${String(index + 1).padStart(2, "0")}`));
  assert.equal((book.match(/\*\*Starter prompt\.\*\*/gu) ?? []).length, 40);
  assert.equal((book.match(/\*\*Preuves\.\*\*/gu) ?? []).length, 40);
  assert.equal((book.match(/\*\*Revue\.\*\*/gu) ?? []).length, 40);
  assert.match(book, /research-router-skill/);
  assert.match(book, /central-knowledge-gateway\.v1/);
  assert.match(book, /aucune décision clinique autonome/);
});
