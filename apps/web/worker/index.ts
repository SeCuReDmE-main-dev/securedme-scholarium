/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

/**
 * Apply browser-facing security controls once at the Worker boundary instead
 * of relying on every page and route to remember the same headers. The CSP is
 * intentionally compatible with Vinext's current inline hydration/style
 * output; tightening it further requires a nonce-based framework build.
 */
function withSecurityHeaders(request: Request, response: Response): Response {
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
    "connect-src 'self'",
    "form-action 'self' https://www.sandbox.paypal.com https://www.paypal.com",
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
function requestForCanonicalApi(request: Request): Request {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/v1/") || url.pathname.startsWith("/api/v1/auth/")) return request;
  url.pathname = `/api/${url.pathname.slice("/api/v1/".length)}`;
  return new Request(url, request);
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const response = await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
      return withSecurityHeaders(request, response);
    }

    return withSecurityHeaders(request, await handler.fetch(requestForCanonicalApi(request), env, ctx));
  },
};

export default worker;
