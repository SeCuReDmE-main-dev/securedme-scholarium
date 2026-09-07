import manifest from "../../../../public/webmcp/securedme-scholarium.manifest.json";

export const dynamic = "force-static";

export async function GET() {
  return Response.json(manifest, {
    headers: {
      "cache-control": "public, max-age=300",
      "x-content-type-options": "nosniff",
    },
  });
}
