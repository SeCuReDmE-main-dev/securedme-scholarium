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
  assert.match(html, /<title>Scholarium — Turn knowledge into traceable evidence<\/title>/i);
  assert.match(html, /Turn knowledge into/);
  assert.match(html, /traceable evidence/);
  assert.match(html, /0<\/b> paid reach controls/);
  assert.match(html, /Your work is not a product to be ranked by price/);
  assert.doesNotMatch(html, /Your site is taking shape|Codex is working|react-loading-skeleton/i);
});

test("keeps the anti-pay-to-rank contract in the user interface", async () => {
  const page = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  const publications = await readFile(new URL("../app/api/publications/route.ts", import.meta.url), "utf8");
  const publicationTypes = await readFile(new URL("../lib/publication-types.ts", import.meta.url), "utf8");
  assert.match(page, /Paid tools never change reach, ranking, or your right to publish/);
  assert.match(page, /Visibility is never for sale/);
  assert.match(page, /contribution supports the project, never the feed rank/);
  assert.match(page, /provenance receipt/);
  assert.match(publications, /subscription tier/, "The feed API must state that subscriptions are excluded from ranking.");
  assert.match(publications, /contribution amount/, "The feed API must state that contributions are excluded from ranking.");
});

test("uses real public feed modes and stores discovery weights for the signed-in account", async () => {
  const page = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  const publications = await readFile(new URL("../app/api/publications/route.ts", import.meta.url), "utf8");
  assert.match(page, /setFeedMode\("verified"\)/);
  assert.match(page, /setFeedMode\("chronological"\)/);
  assert.match(page, /fetch\(`\/api\/v1\/publications\?\$\{params\.toString\(\)\}`\)/);
  assert.match(page, /fetch\("\/api\/v1\/ranking-preferences"/);
  assert.match(publications, /type FeedMode = "chronological" \| "discovery" \| "following" \| "verified"/);
  assert.match(publications, /discoveryScore/);
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
  assert.match(identity, /supported identity provider/);
  assert.match(onboarding, /const userId = identity.userId/);
  assert.match(publications, /const authorId = identity.userId/);
});

test("shows the same WebAuth state that protects account writes", async () => {
  const page = await readFile(new URL("../app/app/page.tsx", import.meta.url), "utf8");
  const client = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  assert.match(page, /getPlatformIdentity/);
  assert.match(page, /chatGPTSignInPath/);
  assert.match(client, /Connected with ChatGPT/);
  assert.match(client, /session\.signOutPath/);
});

test("offers separate provider sign-in paths without automatic email account merging", async () => {
  const identity = await readFile(new URL("../lib/platform-identity.ts", import.meta.url), "utf8");
  const client = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  const google = await readFile(new URL("../lib/google-oauth.ts", import.meta.url), "utf8");
  const github = await readFile(new URL("../lib/github-oauth.ts", import.meta.url), "utf8");
  const paypal = await readFile(new URL("../lib/paypal-oauth.ts", import.meta.url), "utf8");
  assert.match(client, /Continue with Google/);
  assert.match(client, /Continue with GitHub/);
  assert.match(client, /Continue with PayPal/);
  assert.match(identity, /Matching email addresses are never auto-merged/);
  assert.match(google, /code_challenge_method: "S256"/);
  assert.match(github, /read:user user:email/);
  assert.match(paypal, /openid profile email/);
  assert.match(paypal, /external OAuth handoff/);
  assert.match(paypal, /random CSRF nonce/);
  assert.match(paypal, /The authenticated provider session remains encrypted separately/);
  assert.match(paypal, /new Response\(null, \{ headers, status: 302 \}\)/);
});

test("applies one documented security baseline at the Worker boundary", async () => {
  const worker = await readFile(new URL("../worker/index.ts", import.meta.url), "utf8");
  assert.match(worker, /function withSecurityHeaders/);
  assert.match(worker, /Content-Security-Policy/);
  assert.match(worker, /frame-ancestors 'none'/);
  assert.match(worker, /X-Content-Type-Options/);
  assert.match(worker, /Strict-Transport-Security/);
  assert.match(worker, /path\.startsWith\("\/api\/auth\/"\)/);
  assert.match(worker, /Cache-Control", "no-store/);
});

test("keeps artifact and contributor-plan actions bound to the signed-in account", async () => {
  const artifacts = await readFile(new URL("../app/api/artifacts/route.ts", import.meta.url), "utf8");
  const artifactValidation = await readFile(new URL("../lib/artifact-validation.ts", import.meta.url), "utf8");
  const subscription = await readFile(new URL("../app/api/verified-subscription/route.ts", import.meta.url), "utf8");
  assert.match(artifacts, /eq\(publications\.authorId, identity\.userId\)/);
  assert.match(artifacts, /requestExceedsArtifactLimit/);
  assert.match(artifacts, /validateArtifactFile/);
  assert.match(artifacts, /artifacts\.sha256/);
  assert.match(artifactValidation, /activeTextMarker/);
  assert.match(artifactValidation, /hasExpectedSignature/);
  assert.match(artifactValidation, /MAXIMUM_DIRECT_ARTIFACT_BYTES/);
  assert.match(subscription, /const userId = identity\.userId/);
  assert.doesNotMatch(subscription, /userId\?: unknown/);
});

test("prepares profile tool connections through explicit consent", async () => {
  const page = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  const integrations = await readFile(new URL("../app/api/integrations/route.ts", import.meta.url), "utf8");
  assert.match(page, /fetch\("\/api\/v1\/integrations"/);
  assert.match(page, /Provider sessions and tokens stay with their provider/);
  assert.match(integrations, /pending_consent/);
  assert.match(integrations, /getPlatformIdentity/);
});

test("gives a connected person a role-aware Scholarium onboarding path", async () => {
  const page = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  const account = await readFile(new URL("../app/api/account/route.ts", import.meta.url), "utf8");
  const media = await readFile(new URL("../app/api/profile-media/route.ts", import.meta.url), "utf8");
  assert.match(page, /Create my Scholarium profile/);
  assert.match(page, /Your role helps us apply the right safety and visibility defaults/);
  assert.match(page, /fetch\("\/api\/v1\/onboarding"/);
  assert.match(account, /getPlatformIdentity/);
  assert.match(page, /uploadProfileMedia/);
  assert.match(page, /\/api\/v1\/profile-media/);
  assert.match(media, /validateProfileMedia/);
  assert.match(media, /private, no-store/);
});

test("keeps a private, portable account-data export separate from provider secrets", async () => {
  const page = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  const exportRoute = await readFile(new URL("../app/api/account/export/route.ts", import.meta.url), "utf8");
  assert.match(page, /Export my data/);
  assert.match(exportRoute, /securedme-scholarium-account-export\/v1/);
  assert.match(exportRoute, /private, no-store/);
  assert.match(exportRoute, /integration token vault references and provider tokens/);
});

test("sends authenticated publications and attached artifacts through the server contracts", async () => {
  const page = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  const publications = await readFile(new URL("../app/api/publications/route.ts", import.meta.url), "utf8");
  const publicationTypes = await readFile(new URL("../lib/publication-types.ts", import.meta.url), "utf8");
  const versions = await readFile(new URL("../app/api/publications/[publicationId]/versions/route.ts", import.meta.url), "utf8");
  assert.match(page, /fetch\("\/api\/v1\/publications"/);
  assert.match(page, /fetch\("\/api\/v1\/artifacts"/);
  assert.match(page, /Create your Scholarium profile before publishing your first work/);
  assert.match(page, /provenance receipt and safety scan are now processing/);
  assert.match(publications, /publicationTypes/);
  assert.match(publicationTypes, /full_book/);
  assert.match(publicationTypes, /git_tree/);
  assert.match(publicationTypes, /media handoff pending/);
  assert.match(versions, /baseVersion/);
  assert.match(versions, /A newer publication version already exists/);
  assert.match(versions, /provenanceReceipt/);
});

test("keeps community interactions account-bound, reportable, and limited in depth", async () => {
  const page = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  const interactions = await readFile(new URL("../app/api/publication-interactions/route.ts", import.meta.url), "utf8");
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  assert.match(page, /\/api\/v1\/publication-interactions/);
  assert.match(page, /VERSION-BOUND DISCUSSION/);
  assert.match(interactions, /getPlatformIdentity/);
  assert.match(interactions, /commentsLimitedToOneReplyDepth/);
  assert.match(interactions, /reportsCreateHumanReviewCase/);
  assert.match(interactions, /Scholarium limits comment threads to one reply level/);
  assert.match(schema, /publication_reactions/);
  assert.match(schema, /publication_comments/);
  assert.match(schema, /interaction_reports/);
  assert.match(schema, /user_boundaries/);
});

test("uses a canonical versioned API surface and retains a documented compatibility boundary", async () => {
  const worker = await readFile(new URL("../worker/index.ts", import.meta.url), "utf8");
  const openapi = await readFile(new URL("../app/api/openapi.json/route.ts", import.meta.url), "utf8");
  const client = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  assert.match(worker, /requestForCanonicalApi/);
  assert.match(worker, /new Request\(url\.toString\(\), request\)/);
  assert.match(worker, /Deprecation/);
  assert.match(worker, /API-Version/);
  assert.match(openapi, /"\/api\/v1\/publications"/);
  assert.match(client, /\/api\/v1\/publications/);
});
