export function GET() {
  return Response.json({
    authenticatedConnection: "An authenticated public ORCID connection requires an ORCID OAuth client and user consent; it is not enabled until those provider credentials are configured.",
    registrationUrl: "https://orcid.org/register",
    verification: "Manual ORCID entries are checksum-validated but remain self-claimed and private. They are never shown as authenticated identity.",
    why: "An ORCID iD is free for researchers and can help distinguish an author across scholarly systems.",
  }, { headers: { "cache-control": "public, max-age=3600" } });
}
