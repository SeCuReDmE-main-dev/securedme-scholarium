import type { MetadataRoute } from "next";

/**
 * Public profiles and already-public work can be discovered without an
 * account. API, account, and authoring surfaces stay out of crawler scope.
 * This is an access boundary, not an authentication bypass.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/profile/", "/publication/", "/sitemap-publications.xml"],
      disallow: ["/api/", "/app", "/privacy", "/terms"],
    },
    sitemap: "https://www.scholarium.securedme.ca/sitemap.xml",
  };
}
