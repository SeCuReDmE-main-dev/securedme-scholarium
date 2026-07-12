import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
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

async function listApiRouteFiles(dir) {
  const dirPath = typeof dir === "string" ? dir : fileURLToPath(dir);
  const entries = await readdir(dirPath, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) return listApiRouteFiles(full);
    return entry.isFile() && entry.name === "route.ts" ? [full] : [];
  }));
  return nested.flat();
}

function toVersionedContractPath(rootDir, routeFile) {
  const relative = path.relative(rootDir, path.dirname(routeFile)).split(path.sep).join("/");
  const templated = relative.replace(/\[([^\]]+)\]/g, "{$1}");
  return `/api/v1/${templated}`;
}

function exportedRouteMethods(routeSource) {
  return [...routeSource.matchAll(/export\s+(?:async\s+)?function\s+(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)\s*\(/g)]
    .map((match) => match[1].toLowerCase())
    .sort();
}

function documentedOpenApiMethods(openapiSource, route) {
  const routeMarker = `"${route}":`;
  const start = openapiSource.indexOf(routeMarker);
  if (start === -1) return [];
  const nextRoute = openapiSource.indexOf('\n    "/api/v1/', start + routeMarker.length);
  const contractEnd = openapiSource.indexOf("\n  },\n};", start + routeMarker.length);
  const end = nextRoute === -1 ? contractEnd : (contractEnd === -1 ? nextRoute : Math.min(nextRoute, contractEnd));
  const block = openapiSource.slice(start, end === -1 ? undefined : end);
  return [...block.matchAll(/\b(get|post|put|delete|patch|options|head)\b\s*:/g)]
    .map((match) => match[1])
    .sort();
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
  assert.match(html, /SecuredMe root/);
  assert.match(html, /SecuredMe public root/);
  assert.match(html, /https:\/\/securedme\.ca/);
  assert.doesNotMatch(html, /Your site is taking shape|Codex is working|react-loading-skeleton/i);
});

test("keeps the anti-pay-to-rank contract in the user interface", async () => {
  const page = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  const publications = await readFile(new URL("../app/api/publications/route.ts", import.meta.url), "utf8");
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
  const feedback = await readFile(new URL("../app/api/feed-feedback/route.ts", import.meta.url), "utf8");
  const feedModel = await readFile(new URL("../lib/plithogenic-feed.ts", import.meta.url), "utf8");
  assert.match(page, /setFeedMode\("verified"\)/);
  assert.match(page, /setFeedMode\("chronological"\)/);
  assert.match(page, /fetch\(`\/api\/v1\/publications\?\$\{params\.toString\(\)\}`\)/);
  assert.match(page, /fetch\("\/api\/v1\/ranking-preferences"/);
  assert.match(publications, /type FeedMode = "chronological" \| "discovery" \| "following" \| "verified"/);
  assert.match(publications, /rankPlithogenicFeed/);
  assert.match(page, /setInterval\(refresh, 30_000\)/);
  assert.match(page, /Show new posts/);
  assert.match(page, /pendingLiveFeed/);
  assert.match(page, /appliedFeedPublicationIds/);
  assert.match(page, /feed-feedback/);
  assert.match(page, /Why you see this/);
  assert.match(page, /Open score lanes/);
  assert.match(page, /Follow author/);
  assert.match(feedback, /favorite, less_like, or neutral/);
  assert.match(feedModel, /not a truth detector/);
  assert.match(feedModel, /Global likes and/);
  assert.match(feedModel, /feedScorecard/);
  assert.match(feedModel, /author for payment, identity, popularity/);
  assert.match(publications, /plithogenic-explainable-v3/);
  assert.match(publications, /public eligibility is resolved before ranking/);
});

test("uses opaque public profile identifiers for author following", async () => {
  const follows = await readFile(new URL("../app/api/user-follows/route.ts", import.meta.url), "utf8");
  const publications = await readFile(new URL("../app/api/publications/route.ts", import.meta.url), "utf8");
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  assert.match(follows, /You cannot follow yourself/);
  assert.match(follows, /publicProfileId/);
  assert.match(publications, /authors and hashtags explicitly followed by this account/);
  assert.match(publications, /followingAuthor/);
  assert.match(schema, /public_profiles/);
  assert.match(schema, /user_follows/);
});

test("keeps reading lists private and separate from discovery ranking", async () => {
  const client = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  const collections = await readFile(new URL("../app/api/collections/route.ts", import.meta.url), "utf8");
  const items = await readFile(new URL("../app/api/collection-items/route.ts", import.meta.url), "utf8");
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  const exportRoute = await readFile(new URL("../app/api/account/export/route.ts", import.meta.url), "utf8");
  assert.match(client, /Your saved collections are private, portable in your data export/);
  assert.match(client, /saveToReadingList/);
  assert.match(client, /Show new posts/);
  assert.match(collections, /cache-control": "private, no-store/);
  assert.match(items, /Only currently public, eligible work can be saved/);
  assert.match(items, /notInArray\(publications\.verificationStatus, \["quarantined", "removed"\]\)/);
  assert.match(schema, /collection_items/);
  assert.match(schema, /collections_user_title_idx/);
  assert.match(exportRoute, /savedCollections/);
  assert.match(exportRoute, /savedCollectionItems/);
});

test("keeps public profile visuals and public work behind explicit owner visibility", async () => {
  const client = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  const media = await readFile(new URL("../app/api/profile-media/route.ts", import.meta.url), "utf8");
  const profile = await readFile(new URL("../app/api/public-profiles/[publicId]/route.ts", import.meta.url), "utf8");
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  const page = await readFile(new URL("../app/profile/[publicId]/public-profile-client.tsx", import.meta.url), "utf8");
  assert.match(client, /Make my profile, chosen picture\/banner, and public work viewable/);
  assert.match(client, /profileVisibility: publicProfileVisible \? "public" : "private"/);
  assert.match(media, /publicProfileId/);
  assert.match(media, /preferences\?\.profileVisibility !== "public"/);
  assert.match(media, /accountAudience/);
  assert.match(media, /public, max-age=300/);
  assert.match(profile, /profile\.profileVisibility !== "public"/);
  assert.match(profile, /accountAudience/);
  assert.match(profile, /notInArray\(publications\.verificationStatus, \["quarantined", "removed"\]\)/);
  assert.match(schema, /profile_visibility/);
  assert.match(page, /does not reveal provider identities, email, private settings, or private media/);
});

test("keeps a manual ORCID claim private until an authenticated provider connection exists", async () => {
  const client = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  const identifiers = await readFile(new URL("../app/api/author-identifiers/route.ts", import.meta.url), "utf8");
  const guidance = await readFile(new URL("../app/api/orcid-guidance/route.ts", import.meta.url), "utf8");
  const orcid = await readFile(new URL("../lib/orcid.ts", import.meta.url), "utf8");
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  assert.match(client, /ORCID iD \(optional\)/);
  assert.match(client, /No DOI, ISBN, or ORCID yet\?/);
  assert.match(client, /Create one free/);
  assert.match(identifiers, /self-claimed ORCID iD/);
  assert.match(identifiers, /private until an authenticated ORCID OAuth connection/);
  assert.match(guidance, /https:\/\/orcid\.org\/register/);
  assert.match(orcid, /MOD 11-2/);
  assert.match(orcid, /\^\\d\{15\}\[\\dX\]\$/);
  assert.match(schema, /author_identifiers/);
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

test("prepares reader accessibility, notification, and translation preferences without ranking leakage", async () => {
  const accessibility = await readFile(new URL("../app/api/accessibility-preferences/route.ts", import.meta.url), "utf8");
  const notifications = await readFile(new URL("../app/api/notification-preferences/route.ts", import.meta.url), "utf8");
  const translations = await readFile(new URL("../app/api/translation-preferences/route.ts", import.meta.url), "utf8");
  const contract = await readFile(new URL("../lib/reader-preferences.ts", import.meta.url), "utf8");
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  const onboarding = await readFile(new URL("../app/api/onboarding/route.ts", import.meta.url), "utf8");
  const exportRoute = await readFile(new URL("../app/api/account/export/route.ts", import.meta.url), "utf8");
  const openapi = await readFile(new URL("../app/api/openapi.json/route.ts", import.meta.url), "utf8");
  const docs = await readFile(new URL("../../../docs/READER-PREFERENCES.md", import.meta.url), "utf8");
  assert.match(accessibility, /getPlatformIdentity/);
  assert.match(accessibility, /readerPreferences/);
  assert.match(accessibility, /onConflictDoUpdate/);
  assert.match(accessibility, /private, no-store/);
  assert.match(notifications, /getPlatformIdentity/);
  assert.match(notifications, /readerPreferences/);
  assert.match(notifications, /onConflictDoUpdate/);
  assert.match(notifications, /private, no-store/);
  assert.match(translations, /getPlatformIdentity/);
  assert.match(translations, /readerPreferences/);
  assert.match(translations, /onConflictDoUpdate/);
  assert.match(translations, /private, no-store/);
  assert.match(contract, /status: "persisted"/);
  assert.match(contract, /topic notifications are opt-in and never feed-ranking signals/);
  assert.match(contract, /original publication remains canonical/);
  assert.match(contract, /formulas/);
  assert.match(schema, /reader_preferences/);
  assert.match(schema, /notification_channels/);
  assert.match(onboarding, /readerPreferenceInsert\(userId\)/);
  assert.match(exportRoute, /readerPreferences: readerPreferenceRows\[0\] \?\? null/);
  assert.match(openapi, /accessibility-preferences/);
  assert.match(openapi, /notification-preferences/);
  assert.match(openapi, /translation-preferences/);
  assert.match(docs, /backed by the durable `reader_preferences` table/);
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

test("delivers only active artifacts for public publications through a safe download path", async () => {
  const artifacts = await readFile(new URL("../app/api/artifacts/route.ts", import.meta.url), "utf8");
  assert.match(artifacts, /List active artifacts or download one artifact belonging to a public publication/);
  assert.match(artifacts, /eq\(publications\.visibility, "public"\)/);
  assert.match(artifacts, /content-disposition/);
  assert.match(artifacts, /x-content-type-options/);
  assert.match(artifacts, /archiveStatus, "active"/);
  assert.doesNotMatch(artifacts, /objectKey: artifact\.objectKey/);
});

test("prepares profile tool connections through explicit consent", async () => {
  const page = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  const integrations = await readFile(new URL("../app/api/integrations/route.ts", import.meta.url), "utf8");
  assert.match(page, /fetch\("\/api\/v1\/integrations"/);
  assert.match(page, /Provider sessions and tokens stay with their provider/);
  assert.match(page, /Prepared — consent pending/);
  assert.match(integrations, /pending_consent/);
  assert.match(integrations, /cache-control": "private, no-store/);
  assert.match(integrations, /connection: connections\.find/);
  assert.match(integrations, /getPlatformIdentity/);
});

test("keeps PayPal checkout server-side, receipt-bound, and independent from discovery", async () => {
  const order = await readFile(new URL("../app/api/payments/paypal/order/route.ts", import.meta.url), "utf8");
  const returnRoute = await readFile(new URL("../app/api/payments/paypal/return/route.ts", import.meta.url), "utf8");
  const webhook = await readFile(new URL("../app/api/webhooks/paypal/route.ts", import.meta.url), "utf8");
  const checkout = await readFile(new URL("../lib/paypal-checkout.ts", import.meta.url), "utf8");
  const client = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  const crypto = await readFile(new URL("../lib/crypto-payment-contract.ts", import.meta.url), "utf8");
  const openapi = await readFile(new URL("../app/api/openapi.json/route.ts", import.meta.url), "utf8");
  assert.match(order, /profileVerifications/);
  assert.match(order, /createVerifiedContributorOrder/);
  assert.match(order, /paymentReceipts/);
  assert.match(order, /\/api\/v1\/payments\/paypal\/return/);
  assert.match(returnRoute, /capturePayPalOrder/);
  assert.match(returnRoute, /status: "active"/);
  assert.match(webhook, /verifyPayPalWebhook/);
  assert.match(webhook, /PAYMENT.CAPTURE.COMPLETED/);
  assert.match(openapi, /"\/api\/v1\/payments\/paypal\/return"/);
  assert.match(checkout, /verify-webhook-signature/);
  assert.match(checkout, /PAYPAL_CHECKOUT_WEBHOOK_ID/);
  assert.match(client, /Continue with PayPal/);
  assert.match(client, /never affects your reach, ranking, moderation/);
  assert.match(crypto, /provider_controlled/);
  assert.match(crypto, /not_connected/);
});

test("offers an owner-confirmed Academia migration with private-by-default review and no account bypass", async () => {
  const client = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/api/academia-migrations/route.ts", import.meta.url), "utf8");
  const boundary = await readFile(new URL("../../../docs/ACADEMIA-MIGRATION.md", import.meta.url), "utf8");
  const robots = await readFile(new URL("../app/robots.ts", import.meta.url), "utf8");
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  assert.match(client, /OWNER-CONFIRMED IMPORT/);
  assert.match(client, /Every item starts private/);
  assert.match(client, /\/api\/v1\/academia-migrations/);
  assert.match(route, /sourceOwnershipConfirmed !== true/);
  assert.match(route, /visibility: "private"/);
  assert.match(route, /getPlatformIdentity/);
  assert.match(route, /accountAudience/);
  assert.match(route, /sourceProfileUrl/);
  assert.match(schema, /academia_migrations/);
  assert.match(schema, /academia_migration_items/);
  assert.match(boundary, /not a bulk scraping tool/);
  assert.match(boundary, /not a WebAuth bypass/);
  assert.match(robots, /disallow: \["\/api\/", "\/app"/);
});

test("records author-declared source relationships without turning attribution into a truth verdict", async () => {
  const route = await readFile(new URL("../app/api/publication-relationships/route.ts", import.meta.url), "utf8");
  const input = await readFile(new URL("../lib/publication-relationship.ts", import.meta.url), "utf8");
  const academia = await readFile(new URL("../app/api/academia-migrations/route.ts", import.meta.url), "utf8");
  const docs = await readFile(new URL("../../../docs/PUBLICATION-RELATIONSHIPS.md", import.meta.url), "utf8");
  const accountExport = await readFile(new URL("../app/api/account/export/route.ts", import.meta.url), "utf8");
  assert.match(route, /eq\(publications\.authorId, user\.id\)/);
  assert.match(route, /eq\(publications\.visibility, "public"\)/);
  assert.match(input, /derived_from/);
  assert.match(input, /translation_of/);
  assert.match(input, /Source URLs must use HTTPS/);
  assert.match(academia, /imports_record_from/);
  assert.match(accountExport, /publicationRelationships/);
  assert.match(docs, /not an automated copyright ruling/);
});

test("keeps provider video callbacks minimal, authenticated, and fail-closed", async () => {
  const webhook = await readFile(new URL("../app/api/webhooks/youtube/route.ts", import.meta.url), "utf8");
  const parser = await readFile(new URL("../lib/youtube-webhook.ts", import.meta.url), "utf8");
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  assert.match(webhook, /YOUTUBE_WEBHOOK_VERIFY_TOKEN/);
  assert.match(webhook, /validYouTubeWebhookSignature/);
  assert.match(webhook, /x-hub-signature/);
  assert.match(webhook, /YouTube channel is not linked to a Scholarium account/);
  assert.match(webhook, /onConflictDoNothing/);
  assert.match(parser, /SHA-1/);
  assert.match(schema, /media_webhook_events/);
});

test("ships a developer seed contract without exposing a certified-engine formula or credentials", async () => {
  const manifest = await readFile(new URL("../lib/developer-seed.ts", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/api/developer-seed/route.ts", import.meta.url), "utf8");
  const seedContract = await readFile(new URL("../../../templates/scholarium-seed/src/discovery-contract.ts", import.meta.url), "utf8");
  const seedClient = await readFile(new URL("../../../templates/scholarium-seed/src/protected-engine-client.ts", import.meta.url), "utf8");
  const seedReadme = await readFile(new URL("../../../templates/scholarium-seed/README.md", import.meta.url), "utf8");
  const docs = await readFile(new URL("../../../docs/DEVELOPER-SEED-PROTOCOL.md", import.meta.url), "utf8");
  assert.match(manifest, /not_provisioned/);
  assert.match(manifest, /cannot be represented as a trade secret/);
  assert.match(route, /developerSeedManifest/);
  assert.match(route, /public, max-age=3600/);
  assert.match(seedContract, /scholarium-seed\/v1/);
  assert.match(seedClient, /x-seed-signature/);
  assert.match(seedClient, /crypto\.subtle\.verify/);
  assert.match(seedClient, /invalid or expired/);
  assert.match(seedClient, /keep chronological discovery active/);
  assert.doesNotMatch(seedClient, /rankPlithogenicFeed/);
  assert.match(seedReadme, /Never transmit publication files, private comments, raw watch time/);
  assert.match(docs, /No engine endpoint, key, registration, or certification mark is active/);
});

test("offers an author-led podcast and video production brief without uploading or publishing media", async () => {
  const client = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/api/video-production-plan/route.ts", import.meta.url), "utf8");
  const handoff = await readFile(new URL("../app/api/quantech-render-request/route.ts", import.meta.url), "utf8");
  const integrationsRoute = await readFile(new URL("../app/api/integrations/route.ts", import.meta.url), "utf8");
  const integrations = await readFile(new URL("../lib/integration-catalog.ts", import.meta.url), "utf8");
  const plan = await readFile(new URL("../lib/media-production-plan.ts", import.meta.url), "utf8");
  const openapi = await readFile(new URL("../app/api/openapi.json/route.ts", import.meta.url), "utf8");
  const exportRoute = await readFile(new URL("../app/api/account/export/route.ts", import.meta.url), "utf8");
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  assert.match(client, /PODCAST & VIDEO STUDIO/);
  assert.match(client, /Nothing is uploaded, rendered, or shared/);
  assert.match(client, /Future VideoPrism and YOLO checks/);
  assert.match(client, /Minimal provider payload only/);
  assert.match(client, /Private QuaNTecH request history/);
  assert.match(client, /Chrome extension ↗/);
  assert.match(client, /Prepare provider connection/);
  assert.match(client, /Provider connection status:/);
  assert.match(route, /No video, image, transcript, identity information, or provider credential is uploaded/);
  assert.match(handoff, /minimal provider handoff contract/);
  assert.match(handoff, /Create your Scholarium profile before preparing a QuaNTecH handoff/);
  assert.match(handoff, /private, no-store/);
  assert.match(integrationsRoute, /integrations: integrationCatalog\.map/);
  assert.match(integrations, /id: "quantech_vid"/);
  assert.match(route, /cache-control": "no-store/);
  assert.match(plan, /1920 × 1080/);
  assert.match(plan, /VideoPrism helps semantic review; it does not enhance pixels or determine truth/);
  assert.match(plan, /not identity or biometric analysis/);
  assert.match(schema, /quantech_render_requests/);
  assert.match(exportRoute, /quantechRenderRequests/);
  assert.match(openapi, /video-production-plan/);
  assert.match(openapi, /quantech-render-request/);
  assert.match(openapi, /handoff history without raw scripts/);
});

test("documents a private owner-only trace for verified YouTube callback deliveries", async () => {
  const trace = await readFile(new URL("../app/api/media-webhook-events/route.ts", import.meta.url), "utf8");
  const openapi = await readFile(new URL("../app/api/openapi.json/route.ts", import.meta.url), "utf8");
  const client = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  assert.match(trace, /getPlatformIdentity/);
  assert.match(trace, /eq\(mediaWebhookEvents\.userId, user\.id\)/);
  assert.match(trace, /The raw provider payload is never retained/);
  assert.match(trace, /private, no-store/);
  assert.match(openapi, /media-webhook-events/);
  assert.match(client, /YouTube delivery trace/);
  assert.match(client, /A prepared connection is not a linked channel or an active webhook/);
});

test("keeps the v3 discovery model explicit about what it adopts and rejects", async () => {
  const publications = await readFile(new URL("../app/api/publications/route.ts", import.meta.url), "utf8");
  const client = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  assert.match(publications, /eligibility before ranking and format diversity/);
  assert.match(publications, /engagement or viewing surveillance/);
  assert.match(publications, /a single opaque feed/);
  assert.match(client, /YouTube pattern/);
  assert.match(client, /Meta pattern/);
  assert.match(client, /Netflix pattern/);
  assert.match(client, /never hidden watch time/);
});

test("offers an explainable public research search without paid or behavioural ranking", async () => {
  const route = await readFile(new URL("../app/api/search/route.ts", import.meta.url), "utf8");
  const engine = await readFile(new URL("../lib/publication-search.ts", import.meta.url), "utf8");
  assert.match(route, /q must be between 2 and 160 characters/);
  assert.match(route, /quarantined/);
  assert.match(route, /private behavioural signals/);
  assert.match(route, /lexical-research-v1/);
  assert.match(engine, /not personalised/);
  assert.match(engine, /exact title phrase/);
  assert.match(engine, /topic term/);
  const client = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  assert.match(client, /\/api\/v1\/search/);
  assert.match(client, /Search work, not popularity/);
  assert.match(client, /Matched by/);
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
  assert.match(exportRoute, /quantechRenderRequests/);
  assert.match(exportRoute, /raw QuaNTecH scripts, media, provider credentials, and render internals/);
});

test("sends authenticated publications and attached artifacts through the server contracts", async () => {
  const page = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  const publications = await readFile(new URL("../app/api/publications/route.ts", import.meta.url), "utf8");
  const publicationTypes = await readFile(new URL("../lib/publication-types.ts", import.meta.url), "utf8");
  const mediaLinks = await readFile(new URL("../app/api/media-links/route.ts", import.meta.url), "utf8");
  const repositoryLinks = await readFile(new URL("../app/api/repository-links/route.ts", import.meta.url), "utf8");
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
  assert.match(page, /External video URL/);
  assert.match(page, /Source repository URL/);
  assert.match(page, /Open on YouTube/);
  assert.match(page, /Open source on GitHub/);
  assert.match(page, /code changes, forks, and permissions stay with the source provider/i);
  assert.match(page, /Hosted by the author’s provider/);
  assert.match(mediaLinks, /YouTube or TikTok/);
  assert.match(mediaLinks, /canonicalUrl/);
  assert.match(repositoryLinks, /GitHub, GitLab, or SourceForge/);
  assert.match(repositoryLinks, /canonicalRepositoryLink/);
  assert.match(repositoryLinks, /accountAudience/);
  assert.match(publications, /externalMediaLinks/);
  assert.match(publications, /repositoryLinks/);
  assert.match(publications, /externalMedia: mediaByPublication/);
});

test("quarantines narrow credential-shaped publication content without judging scientific claims", async () => {
  const publicationRoute = await readFile(new URL("../app/api/publications/route.ts", import.meta.url), "utf8");
  const moderationRoute = await readFile(new URL("../app/api/publication-moderation/route.ts", import.meta.url), "utf8");
  const safety = await readFile(new URL("../lib/publication-safety.ts", import.meta.url), "utf8");
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  assert.match(safety, /does not/);
  assert.match(safety, /scientific truth/);
  assert.match(safety, /possible_private_key/);
  assert.match(safety, /possible_api_secret/);
  assert.match(publicationRoute, /safety\.action === "quarantine" \? "quarantined" : "processing"/);
  assert.match(publicationRoute, /db\.insert\(moderationCases\)/);
  assert.match(moderationRoute, /eq\(publications\.authorId, identity\.userId\)/);
  assert.match(schema, /moderation_cases/);
});

test("verifies a public provenance version without exposing the author account identifier", async () => {
  const provenance = await readFile(new URL("../lib/provenance.ts", import.meta.url), "utf8");
  const verifier = await readFile(new URL("../app/api/provenance/verify/route.ts", import.meta.url), "utf8");
  assert.match(provenance, /provenanceContentHash/);
  assert.match(verifier, /Recalculate a supplied public version without persisting the submitted content/);
  assert.match(verifier, /eq\(publications\.visibility, "public"\)/);
  assert.match(verifier, /computedHash === stored\.version\.contentHash/);
  assert.match(verifier, /excludes provider identity and author account ID/);
});

test("applies youth safeguards before public discovery or cross-platform media linking", async () => {
  const page = await readFile(new URL("../app/scholarium-client.tsx", import.meta.url), "utf8");
  const policy = await readFile(new URL("../lib/audience-policy.ts", import.meta.url), "utf8");
  const audience = await readFile(new URL("../lib/account-audience.ts", import.meta.url), "utf8");
  const consents = await readFile(new URL("../app/api/guardian-consents/route.ts", import.meta.url), "utf8");
  const publications = await readFile(new URL("../app/api/publications/route.ts", import.meta.url), "utf8");
  const mediaLinks = await readFile(new URL("../app/api/media-links/route.ts", import.meta.url), "utf8");
  assert.match(policy, /guardianConsentScopes = \["public_publication", "external_media", "live"\]/);
  assert.match(policy, /canLinkExternalMedia: scopeIsApproved\("external_media"\)/);
  assert.match(policy, /canPublishPublicly: scopeIsApproved\("public_publication"\)/);
  assert.match(audience, /does not return guardian identities or consent content/);
  assert.match(publications, /accountAudience\(db, author\.id\)/);
  assert.match(publications, /canPublishPublicly \? "public" : "private"/);
  assert.match(mediaLinks, /canLinkExternalMedia/);
  assert.match(mediaLinks, /guardian consent or verified school relationship/);
  assert.match(consents, /Guardian activation requires document verification and a verified passkey/);
  assert.match(consents, /status: "revoked"/);
  assert.match(consents, /supportedScopes: guardianConsentScopes/);
  assert.match(page, /guardian consent or verified school supervision permits public discovery/);
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
  const docs = await readFile(new URL("../../../docs/API-VERSIONING.md", import.meta.url), "utf8");
  const paypalOrder = await readFile(new URL("../app/api/payments/paypal/order/route.ts", import.meta.url), "utf8");
  const subscription = await readFile(new URL("../app/api/verified-subscription/route.ts", import.meta.url), "utf8");
  assert.match(worker, /requestForCanonicalApi/);
  assert.match(worker, /new Request\(url\.toString\(\), request\)/);
  assert.match(worker, /Deprecation/);
  assert.match(worker, /API-Version/);
  assert.match(openapi, /"\/api\/v1\/openapi\.json"/);
  assert.match(openapi, /"\/api\/v1\/publications"/);
  assert.match(openapi, /"\/api\/v1\/verified-subscription"/);
  assert.match(client, /\/api\/v1\/publications/);
  assert.match(docs, /\/api\/v1\/openapi\.json/);
  assert.match(docs, /\/api\/v1\/verified-subscription/);
  assert.match(paypalOrder, /\/api\/v1\/payments\/paypal\/return/);
  assert.match(subscription, /rankingEffect: "none"/);
});

test("keeps every non-auth route in the canonical OpenAPI v1 contract", async () => {
  const apiRoot = new URL("../app/api/", import.meta.url);
  const routeFiles = await listApiRouteFiles(apiRoot);
  const openapi = await readFile(new URL("../app/api/openapi.json/route.ts", import.meta.url), "utf8");
  const documented = new Set([...openapi.matchAll(/"(\/api\/v1[^"]+)"/g)].map((match) => match[1]));
  const apiRootPath = fileURLToPath(apiRoot);

  const requiredRoutes = routeFiles
    .map((file) => path.resolve(file))
    .filter((file) => !file.includes(`${path.sep}auth${path.sep}`))
    .map((file) => toVersionedContractPath(apiRootPath, file))
    .sort();

  const missing = requiredRoutes.filter((route) => !documented.has(route));
  assert.deepEqual(missing, []);
});

test("keeps every non-auth route method aligned with the canonical OpenAPI v1 contract", async () => {
  const apiRoot = new URL("../app/api/", import.meta.url);
  const routeFiles = await listApiRouteFiles(apiRoot);
  const openapi = await readFile(new URL("../app/api/openapi.json/route.ts", import.meta.url), "utf8");
  const apiRootPath = fileURLToPath(apiRoot);

  const mismatches = [];

  for (const routeFile of routeFiles.map((file) => path.resolve(file)).filter((file) => !file.includes(`${path.sep}auth${path.sep}`))) {
    const route = toVersionedContractPath(apiRootPath, routeFile);
    const source = await readFile(routeFile, "utf8");
    const implemented = exportedRouteMethods(source);
    const documented = documentedOpenApiMethods(openapi, route);
    if (implemented.join(",") !== documented.join(",")) {
      mismatches.push({ documented, implemented, route });
    }
  }

  assert.deepEqual(mismatches, []);
});
