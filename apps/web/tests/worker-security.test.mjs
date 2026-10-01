import assert from "node:assert/strict";
import test from "node:test";
import { withSecurityHeaders, requestForCanonicalApi } from "../worker/security-headers.ts";

test("consented public analytics has a narrow landing-page network policy", () => {
  const landing = withSecurityHeaders(new Request("https://scholarium.securedme.ca/"), new Response("public"));
  assert.match(landing.headers.get("Content-Security-Policy"), /connect-src 'self' https:\/\/us\.i\.posthog\.com(?:;|$)/);
  for (const path of ["/app", "/teach", "/profile/private", "/api/v1/webmcp/manifest", "/%61pp"]) {
    const response = withSecurityHeaders(new Request(`https://scholarium.securedme.ca${path}`), new Response("private"));
    assert.match(response.headers.get("Content-Security-Policy"), /connect-src 'self';/);
    assert.doesNotMatch(response.headers.get("Content-Security-Policy"), /posthog/);
    assert.equal(response.headers.get("X-Frame-Options"), "DENY");
  }
});

test("canonical API rewriting preserves method, body and auth boundaries", async () => {
  const original = new Request("https://scholarium.securedme.ca/api/v1/publications?q=public", { method: "POST", headers: { "content-type": "application/json" }, body: '{"title":"Synthetic"}' });
  const rewritten = requestForCanonicalApi(original);
  assert.equal(rewritten.url, "https://scholarium.securedme.ca/api/publications?q=public");
  assert.equal(rewritten.method, "POST");
  assert.equal(await rewritten.text(), '{"title":"Synthetic"}');
  const identity = new Request("https://scholarium.securedme.ca/api/v1/auth/google/callback");
  assert.equal(requestForCanonicalApi(identity), identity);
  const authResponse = withSecurityHeaders(identity, new Response(""));
  assert.equal(authResponse.headers.get("Cache-Control"), "no-store");
  assert.equal(authResponse.headers.get("API-Version"), "1");
  assert.match(authResponse.headers.get("Strict-Transport-Security"), /max-age=31536000/);
});
