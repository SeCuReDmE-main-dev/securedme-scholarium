import { and, desc, eq, notInArray } from "drizzle-orm";
import { getDb } from "../../db";
import { publications } from "../../db/schema";

const origin = "https://www.scholarium.securedme.ca";

function xml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

/** Owner-enabled public records only; crawler access never reveals private work. */
export async function GET() {
  try {
    const db = await getDb();
    const rows = await db.select({ id: publications.id, updatedAt: publications.publishedAt }).from(publications).where(and(eq(publications.visibility, "public"), notInArray(publications.verificationStatus, ["quarantined", "removed"]))).orderBy(desc(publications.publishedAt)).limit(50_000);
    const entries = rows.map((row) => `<url><loc>${xml(`${origin}/publication/${encodeURIComponent(row.id)}`)}</loc>${row.updatedAt ? `<lastmod>${xml(row.updatedAt.slice(0, 10))}</lastmod>` : ""}</url>`).join("");
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}/</loc></url>${entries}</urlset>`, { headers: { "cache-control": "public, max-age=300", "content-type": "application/xml; charset=utf-8", "x-content-type-options": "nosniff" } });
  } catch {
    return new Response("<?xml version=\"1.0\" encoding=\"UTF-8\"?><urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\"></urlset>", { status: 503, headers: { "cache-control": "no-store", "content-type": "application/xml; charset=utf-8" } });
  }
}
