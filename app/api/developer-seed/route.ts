import { developerSeedManifest } from "../../../lib/developer-seed";

/** A public, no-secret starting contract for independent developer seeds. */
export function GET() {
  return Response.json(developerSeedManifest, { headers: { "cache-control": "public, max-age=3600" } });
}
