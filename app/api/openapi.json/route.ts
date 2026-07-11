const contract = {
  openapi: "3.1.0",
  info: {
    title: "Scholarium API",
    version: "0.1.0",
    description: "Open contracts for the Scholarium scientific and educational community.",
  },
  paths: {
    "/api/v1/account": { get: { summary: "Read the signed-in Scholarium account" } },
    "/api/v1/health": { get: { summary: "Read service health" } },
    "/api/v1/artifacts": { post: { summary: "Upload a hashed scholarly artifact" } },
    "/api/v1/integrations": { get: { summary: "List consent-first integrations" }, post: { summary: "Prepare an explicit provider consent flow" } },
    "/api/v1/local-insights": { get: { summary: "Read the device-local-only privacy analytics contract" } },
    "/api/v1/onboarding": { post: { summary: "Create a role-aware account" } },
    "/api/v1/profile-media": { get: { summary: "Read private profile media" }, post: { summary: "Store a validated private avatar or profile banner" } },
    "/api/v1/publications": {
      get: { summary: "List public publications" },
      post: { summary: "Create a versioned publication and provenance receipt" },
    },
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
  },
};

export function GET() {
  return Response.json(contract, { headers: { "cache-control": "public, max-age=3600" } });
}
