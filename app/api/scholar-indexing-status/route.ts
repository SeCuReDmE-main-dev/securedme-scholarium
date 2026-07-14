import { and, eq, notInArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { publications } from "../../../db/schema";

const canonicalOrigin = "https://www.scholarium.securedme.ca";

/**
 * Reports Scholarium-controlled crawl prerequisites only. Google Scholar does
 * not expose a general publisher submission API, so this endpoint never
 * claims that a record is indexed by Google or any other external service.
 */
export async function GET(request: Request) {
  try {
    const publicationId = new URL(request.url).searchParams.get("publicationId");
    if (!publicationId || !/^[0-9a-f-]{16,64}$/i.test(publicationId)) return Response.json({ error: "A valid publicationId is required" }, { status: 400 });
    const db = await getDb();
    const [publication] = await db.select({ id: publications.id, publishedAt: publications.publishedAt, status: publications.verificationStatus, title: publications.title, visibility: publications.visibility }).from(publications).where(and(eq(publications.id, publicationId), notInArray(publications.verificationStatus, ["quarantined", "removed"]))).limit(1);
    if (!publication || publication.visibility !== "public") return Response.json({ error: "A public, eligible publication was not found" }, { status: 404 });
    const publicUrl = `${canonicalOrigin}/publication/${encodeURIComponent(publication.id)}`;
    return Response.json({
      publication: { id: publication.id, publishedAt: publication.publishedAt, status: publication.status, title: publication.title },
      crawlPrerequisites: {
        canonicalUrl: publicUrl,
        citationMetadata: ["citation_title", "citation_author", "citation_publication_date", "citation_abstract_html_url"],
        robotsAllowed: true,
        sitemap: `${canonicalOrigin}/sitemap-publications.xml`,
      },
      indexability: publication.status === "verified" ? "eligible_for_external_crawling" : "public_but_verification_labelled",
      externalIndexingClaim: "none",
      note: "Scholarium publishes machine-readable public metadata. External services decide whether and when to crawl or index it.",
    }, { headers: { "cache-control": "public, max-age=300" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to read scholar indexing status" }, { status: 500 });
  }
}
