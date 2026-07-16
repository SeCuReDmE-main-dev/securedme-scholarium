import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("keeps the Teach lesson public and discovers private session capability after hydration", async () => {
  const page = await readFile(new URL("../app/teach/page.tsx", import.meta.url), "utf8");
  const client = await readFile(new URL("../app/teach/teach-client.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(page, /getPlatformIdentity|force-dynamic/);
  assert.match(page, /<TeachClient \/>/);
  assert.match(client, /fetch\("\/api\/account"\)/);
  assert.match(client, /setSessionAuthenticated\(response\.ok\)/);
  assert.match(client, /TeachPortfolioPanel authenticated=\{sessionAuthenticated\}/);
  assert.match(client, /TeachStatisticsPanel authenticated=\{sessionAuthenticated\}/);
  assert.match(client, /TeachAdministrationPanel authenticated=\{sessionAuthenticated\}/);
});
