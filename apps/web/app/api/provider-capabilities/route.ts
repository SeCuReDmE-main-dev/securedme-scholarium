import { providerCapabilities } from "../../../lib/provider-capabilities";

/** Public capability catalogue. Connection state is intentionally private. */
export function GET() {
  return Response.json({
    capabilities: providerCapabilities,
    boundary: "A listed capability is not a provider connection, provider endorsement, or automated authority.",
  }, { headers: { "cache-control": "public, max-age=3600" } });
}
