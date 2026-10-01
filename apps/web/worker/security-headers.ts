/**
 * Apply browser-facing security controls once at the Worker boundary instead
 * of relying on every page and route to remember the same headers. The CSP is
 * intentionally compatible with Vinext's current inline hydration/style
 * output; tightening it further requires a nonce-based framework build.
 */
export function withSecurityHeaders(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  const path = new URL(request.url).pathname;
  const isVersionedApi = path.startsWith("/api/v1/");
  const isLegacyDataApi = path.startsWith("/api/") && !isVersionedApi && !path.startsWith("/api/auth/");

  headers.set("Content-Security-Policy", [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src 'self' 'unsafe-inline'",
    // Only the public landing page can connect to the public consented ingest.
    // Private pages and all APIs retain same-origin-only network access.
    path === "/" || path === "/landing/" ? "connect-src 'self' https://us.i.posthog.com" : "connect-src 'self'",
    "form-action 'self' https://www.paypal.com",
  ].join("; "));
  headers.set("Permissions-Policy", "camera=(), geolocation=(), microphone=(), payment=()");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");

  if (new URL(request.url).protocol === "https:") {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  if (path.startsWith("/api/auth/") || path.startsWith("/api/v1/auth/")) {
    headers.set("Cache-Control", "no-store");
    headers.set("Pragma", "no-cache");
  }
  if (isVersionedApi) headers.set("API-Version", "1");
  if (isLegacyDataApi) {
    headers.set("Deprecation", "true");
    headers.set("Link", `<${path.replace(/^\/api\//u, "/api/v1/")}>; rel="successor-version"`);
  }

  return new Response(response.body, { headers, status: response.status, statusText: response.statusText });
}

/**
 * Resource APIs are publicly versioned at /api/v1. Existing unversioned
 * routes remain a temporary compatibility surface so deployed clients are not
 * broken while they move to v1. OAuth callbacks are deliberately excluded:
 * providers store those URLs externally and changing them requires a separate
 * provider-console review.
 */
export function requestForCanonicalApi(request: Request): Request {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/v1/") || url.pathname.startsWith("/api/v1/auth/")) return request;
  url.pathname = `/api/${url.pathname.slice("/api/v1/".length)}`;
  // Vinext's deployed fetch adapter resolves a string URL reliably. Passing a
  // URL object with a Request init works in standards-compliant runtimes but
  // did not preserve the rewritten pathname in the production adapter.
  return new Request(url.toString(), request);
}
