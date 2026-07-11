const contract = {
  openapi: "3.1.0",
  info: {
    title: "Scholarium API",
    version: "0.1.0",
    description: "Open contracts for the Scholarium scientific and educational community.",
  },
  paths: {
    "/api/account": { get: { summary: "Read the signed-in Scholarium account" } },
    "/api/health": { get: { summary: "Read service health" } },
    "/api/artifacts": { post: { summary: "Upload a hashed scholarly artifact" } },
    "/api/integrations": { get: { summary: "List consent-first integrations" }, post: { summary: "Prepare an explicit provider consent flow" } },
    "/api/local-insights": { get: { summary: "Read the device-local-only privacy analytics contract" } },
    "/api/onboarding": { post: { summary: "Create a role-aware account" } },
    "/api/publications": {
      get: { summary: "List public publications" },
      post: { summary: "Create a versioned publication and provenance receipt" },
    },
    "/api/quanthor-formalization": { get: { summary: "List educational formalization templates" }, post: { summary: "Create a non-blocking QuaNthoR outline" } },
    "/api/ranking-preferences": {
      get: { summary: "Read user-controlled ranking preferences" },
      put: { summary: "Update bounded ranking weights" },
    },
    "/api/topic-follows": {
      get: { summary: "List the signed-in account's followed topics" },
      put: { summary: "Follow a topic without affecting paid reach" },
      delete: { summary: "Stop following one topic" },
    },
  },
};

export function GET() {
  return Response.json(contract, { headers: { "cache-control": "public, max-age=3600" } });
}
