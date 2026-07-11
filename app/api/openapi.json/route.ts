const contract = {
  openapi: "3.1.0",
  info: {
    title: "Scholarium API",
    version: "0.1.0",
    description: "Open contracts for the Scholarium scientific and educational community.",
  },
  paths: {
    "/api/v1/account": { get: { summary: "Read the signed-in Scholarium account" } },
    "/api/v1/account/export": { get: { summary: "Download a private portable export of the signed-in account" } },
    "/api/v1/author-identifiers": { get: { summary: "Read private author identifiers" }, put: { summary: "Save a checksum-validated self-claimed ORCID iD" }, delete: { summary: "Remove a private ORCID claim" } },
    "/api/v1/orcid-guidance": { get: { summary: "Read free ORCID registration and authentication guidance" } },
    "/api/v1/collections": { get: { summary: "List private personal reading collections" }, post: { summary: "Create a private personal collection" }, delete: { summary: "Delete an owner-owned private collection" } },
    "/api/v1/developer-seed": { get: { summary: "Read the public Scholarium Seed Protocol manifest without secrets or a ranking formula" } },
    "/api/v1/collection-items": { get: { summary: "List saved public work inside one owner-owned collection" }, put: { summary: "Save eligible public work to a private reading list or collection" }, delete: { summary: "Remove one saved work item" } },
    "/api/v1/health": { get: { summary: "Read service health" } },
    "/api/v1/artifacts": { get: { summary: "List or download active artifacts attached to a public publication" }, post: { summary: "Upload a hashed scholarly artifact" } },
    "/api/v1/feed-feedback": { put: { summary: "Save an explicit private favorite or less-like-this feed preference" } },
    "/api/v1/guardian-consents": { get: { summary: "Read private guardian consent records without exposing other identities" }, post: { summary: "Request scoped guardian consent" }, put: { summary: "Activate a pending guardian consent after guardian verification" }, delete: { summary: "Revoke a guardian consent" } },
    "/api/v1/integrations": { get: { summary: "List consent-first integrations" }, post: { summary: "Prepare an explicit provider consent flow" } },
    "/api/v1/local-insights": { get: { summary: "Read the device-local-only privacy analytics contract" } },
    "/api/v1/media-links": { get: { summary: "Read public external media links for a publication" }, post: { summary: "Link an author-owned YouTube or TikTok URL without copying the video" } },
    "/api/v1/media-webhook-events": { get: { summary: "Read the signed-in owner's minimal YouTube callback delivery trace" } },
    "/api/v1/repository-links": { get: { summary: "Read public attributed source-repository links for a publication" }, post: { summary: "Link an author-owned GitHub, GitLab, or SourceForge repository without copying code" } },
    "/api/v1/webhooks/youtube": { get: { summary: "Verify a configured YouTube PubSubHubbub callback" }, post: { summary: "Record an HMAC-authenticated YouTube Atom update for a linked channel" } },
    "/api/v1/onboarding": { post: { summary: "Create a role-aware account" } },
    "/api/v1/profile-media": { get: { summary: "Read private media or an owner-enabled public avatar/banner" }, post: { summary: "Store a validated private avatar or profile banner" } },
    "/api/v1/profile-preferences": { get: { summary: "Read private profile appearance and visibility preferences" }, put: { summary: "Update profile appearance and explicit public-profile visibility" } },
    "/api/v1/public-profiles/{publicId}": { get: { summary: "Read an owner-enabled public profile and already-public work" } },
    "/api/v1/publications": {
      get: { summary: "List public publications" },
      post: { summary: "Create a versioned publication and provenance receipt" },
    },
    "/api/v1/publication-moderation": { get: { summary: "Read minimal automated moderation reason codes for an author-owned publication" } },
    "/api/v1/provenance/verify": { get: { summary: "Read a public provenance receipt for one public version" }, post: { summary: "Recalculate a public version hash without storing submitted content" } },
    "/api/v1/search": { get: { summary: "Search public research publications with explicit lexical reasons and filters" } },
    "/api/v1/video-production-plan": { post: { summary: "Create an ephemeral, author-led podcast or video production brief without uploading media" } },
    "/api/v1/publications/{publicationId}/versions": { get: { summary: "Read the immutable public version history" }, post: { summary: "Create a new author-owned publication version from the current version" } },
    "/api/v1/publication-interactions": {
      get: { summary: "Read public reactions and version-bound comments" },
      post: { summary: "Create an academic reaction, limited-depth comment, report, block, or mute" },
      delete: { summary: "Remove the signed-in account's reaction" },
    },
    "/api/v1/quanthor-formalization": { get: { summary: "List educational formalization templates" }, post: { summary: "Create a non-blocking QuaNthoR outline" } },
    "/api/v1/ranking-preferences": {
      get: { summary: "Read user-controlled ranking preferences" },
      put: { summary: "Update bounded ranking weights" },
    },
    "/api/v1/topic-follows": {
      get: { summary: "List the signed-in account's followed topics" },
      put: { summary: "Follow a topic without affecting paid reach" },
      delete: { summary: "Stop following one topic" },
    },
    "/api/v1/user-follows": { get: { summary: "List authors explicitly followed by the signed-in account" }, put: { summary: "Follow one public author without exposing provider identity" }, delete: { summary: "Stop following one public author" } },
  },
};

export function GET() {
  return Response.json(contract, { headers: { "cache-control": "public, max-age=3600" } });
}
