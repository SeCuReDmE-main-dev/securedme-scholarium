import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { publicationTopics, publications, topics, users } from "../../../db/schema";
import { searchPublications } from "../../../lib/publication-search";
import { publicationTypes } from "../../../lib/publication-types";
import { normalizeTopicSlug } from "../../../lib/topics";

function boundedQuery(value: string | null) {
  const query = value?.trim() ?? "";
  return query.length >= 2 && query.length <= 160 ? query : null;
}

function boundedLimit(value: string | null) {
  const limit = Number(value ?? "20");
  return Number.isInteger(limit) && limit >= 1 && limit <= 50 ? limit : null;
}

/** Public lexical research search. Discovery preferences never influence this endpoint. */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = boundedQuery(url.searchParams.get("q"));
    const limit = boundedLimit(url.searchParams.get("limit"));
    const type = url.searchParams.get("type");
    const topic = url.searchParams.get("topic");
    const verified = url.searchParams.get("verified");
    if (!query) return Response.json({ error: "q must be between 2 and 160 characters" }, { status: 400 });
    if (!limit) return Response.json({ error: "limit must be an integer between 1 and 50" }, { status: 400 });
    if (type && !publicationTypes.has(type)) return Response.json({ error: "type is unsupported" }, { status: 400 });
    const topicSlug = topic ? normalizeTopicSlug(topic) : null;
    if (topic && !topicSlug) return Response.json({ error: "topic is unsupported" }, { status: 400 });
    if (verified && verified !== "true") return Response.json({ error: "verified must be true when supplied" }, { status: 400 });

    const db = await getDb();
    const rows = await db.select({ abstract: publications.abstract, author: users.displayName, createdAt: publications.createdAt, id: publications.id, status: publications.verificationStatus, title: publications.title, type: publications.type })
      .from(publications)
      .innerJoin(users, eq(publications.authorId, users.id))
      .where(eq(publications.visibility, "public"))
      .orderBy(desc(publications.createdAt))
      .limit(250);
    const ids = rows.map((row) => row.id);
    const assignedTopics = ids.length === 0 ? [] : await db.select({ label: topics.label, publicationId: publicationTopics.publicationId, slug: topics.slug }).from(publicationTopics).innerJoin(topics, eq(publicationTopics.topicId, topics.id)).where(inArray(publicationTopics.publicationId, ids));
    const topicsByPublication = new Map<string, Array<{ label: string; slug: string }>>();
    for (const assigned of assignedTopics) topicsByPublication.set(assigned.publicationId, [...(topicsByPublication.get(assigned.publicationId) ?? []), { label: assigned.label, slug: assigned.slug }]);
    const candidates = rows
      .filter((row) => !["quarantined", "removed"].includes(row.status))
      .filter((row) => !type || row.type === type)
      .filter((row) => verified !== "true" || row.status === "verified")
      .map((row) => ({ ...row, topics: topicsByPublication.get(row.id) ?? [] }))
      .filter((row) => !topicSlug || row.topics.some((assigned) => assigned.slug === topicSlug));
    const results = searchPublications(candidates, query).slice(0, limit);
    return Response.json({
      filters: { topic: topicSlug, type: type ?? null, verified: verified === "true" },
      query,
      results,
      search: {
        excludes: ["subscription tier", "contribution amount", "paid promotion", "reactions", "favourites", "private behavioural signals"],
        scannedWindow: rows.length,
        version: "lexical-research-v1",
        uses: ["exact title phrases", "title terms", "topic terms", "author terms", "format terms", "abstract terms"],
      },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to search publications" }, { status: 500 });
  }
}
