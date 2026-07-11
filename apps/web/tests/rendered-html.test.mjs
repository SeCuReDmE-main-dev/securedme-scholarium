import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Scholarium public landing page instead of the starter shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Scholarium — The public commons for serious work<\/title>/i);
  assert.match(html, /Make knowledge/);
  assert.match(html, /0<\/b> paid reach controls/);
  assert.match(html, /Your work is not a product to be ranked by price/);
  assert.doesNotMatch(html, /Your site is taking shape|Codex is working|react-loading-skeleton/i);
});

test("keeps the anti-pay-to-rank contract in the user interface", async () => {
  const page = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  assert.match(page, /Paid tools never change reach, ranking, or your right to publish/);
  assert.match(page, /Visibility is never for sale/);
  assert.match(page, /contribution supports the project, never the feed rank/);
  assert.match(page, /provenance receipt/);
});

test("keeps QuaNthoR educational and non-blocking", async () => {
  const page = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  const contract = await readFile(new URL("../lib/quanthor-formalization.ts", import.meta.url), "utf8");
  assert.match(page, /Educational, non-blocking, and author-led/);
  assert.match(page, /Nothing here prevents you from publishing/);
  assert.match(contract, /publicationGate: "none"/);
  assert.match(contract, /not a verified proof/);
});

test("keeps behavior insights local and opt-in", async () => {
  const page = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  const contract = await readFile(new URL("../lib/local-insights.ts", import.meta.url), "utf8");
  assert.match(page, /Enable local-only activity insights on this device/);
  assert.match(page, /Kept only in this browser/);
  assert.match(contract, /device_local_only/);
  assert.match(contract, /Datadog may receive platform-level reliability metadata only/);
});

test("binds account writes to the platform WebAuth identity", async () => {
  const identity = await readFile(new URL("../lib/platform-identity.ts", import.meta.url), "utf8");
  const onboarding = await readFile(new URL("../app/api/onboarding/route.ts", import.meta.url), "utf8");
  const publications = await readFile(new URL("../app/api/publications/route.ts", import.meta.url), "utf8");
  assert.match(identity, /getChatGPTUser/);
  assert.match(identity, /Sign in with ChatGPT is required/);
  assert.match(onboarding, /const userId = identity.userId/);
  assert.match(publications, /const authorId = identity.userId/);
});

test("shows the same WebAuth state that protects account writes", async () => {
  const page = await readFile(new URL("../app/app/page.tsx", import.meta.url), "utf8");
  const client = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  assert.match(page, /getChatGPTUser/);
  assert.match(page, /chatGPTSignInPath/);
  assert.match(client, /Connected with ChatGPT/);
  assert.match(client, /session\.signOutPath/);
});

test("keeps artifact and contributor-plan actions bound to the signed-in account", async () => {
  const artifacts = await readFile(new URL("../app/api/artifacts/route.ts", import.meta.url), "utf8");
  const subscription = await readFile(new URL("../app/api/verified-subscription/route.ts", import.meta.url), "utf8");
  assert.match(artifacts, /eq\(publications\.authorId, identity\.userId\)/);
  assert.match(subscription, /const userId = identity\.userId/);
  assert.doesNotMatch(subscription, /userId\?: unknown/);
});

test("prepares profile tool connections through explicit consent", async () => {
  const page = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  const integrations = await readFile(new URL("../app/api/integrations/route.ts", import.meta.url), "utf8");
  assert.match(page, /fetch\("\/api\/integrations"/);
  assert.match(page, /Provider sessions and tokens stay with their provider/);
  assert.match(integrations, /pending_consent/);
  assert.match(integrations, /getPlatformIdentity/);
});

test("gives a connected person a role-aware Scholarium onboarding path", async () => {
  const page = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  const account = await readFile(new URL("../app/api/account/route.ts", import.meta.url), "utf8");
  assert.match(page, /Create my Scholarium profile/);
  assert.match(page, /Your role helps us apply the right safety and visibility defaults/);
  assert.match(page, /fetch\("\/api\/onboarding"/);
  assert.match(account, /getPlatformIdentity/);
});

test("sends authenticated publications and attached artifacts through the server contracts", async () => {
  const page = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  assert.match(page, /fetch\("\/api\/publications"/);
  assert.match(page, /fetch\("\/api\/artifacts"/);
  assert.match(page, /Create your Scholarium profile before publishing your first work/);
  assert.match(page, /provenance receipt and safety scan are now processing/);
});
