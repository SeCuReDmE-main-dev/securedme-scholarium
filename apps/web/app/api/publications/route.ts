import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { publicationTopics, publicationVersions, publications, topics, users } from "../../../db/schema";
import { createProvenanceReceipt } from "../../../lib/provenance";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";
import { normalizedTopicSlugs, topicLabel } from "../../../lib/topics";

const publicationTypes = new Set([
  "research_note",
  "white_paper",
  "project_update",
  "short_video",
  "teaching_artifact",
]);

type PublicationInput = {
  abstract?: unknown;
  title?: unknown;
  type?: unknown;
  topicSlugs?: unknown;
};

function stringField(value: unknown, field: string, maximum: number) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }
  const normalized = value.trim();
  if (normalized.length > maximum) {
    throw new Error(`${field} must be at most ${maximum} characters`);
  }
  return normalized;
}

type FeedMode = "chronological" | "discovery" | "verified";

function selectedFeedMode(value: string | null): FeedMode {
  return value === "chronological" || value === "verified" ? value : "discovery";
}

function boundedQuery(value: string | null) {
  return value?.trim().slice(0, 160).toLowerCase() ?? "";
}

function discoveryScore(publication: { abstract: string; createdAt: string; status: string; title: string; type: string }, query: string) {
  const words = query.split(/\s+/).filter(Boolean);
  const haystack = `${publication.title} ${publication.abstract} ${publication.type}`.toLowerCase();
  const textRelevance = words.length === 0 ? 0.45 : words.filter((word) => haystack.includes(word)).length / words.length;
  const ageDays = Math.max(0, (Date.now() - new Date(publication.createdAt).getTime()) / 86_400_000);
  const freshness = Math.max(0, 1 - ageDays / 30);
  const provenance = publication.status === "verified" ? 1 : 0.45;
  return textRelevance * 0.45 + freshness * 0.25 + provenance * 0.3;
}

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const mode = selectedFeedMode(requestUrl.searchParams.get("mode"));
    const query = boundedQuery(requestUrl.searchParams.get("q"));
    const db = await getDb();
    const rows = await db
      .select({
        abstract: publications.abstract,
        author: users.displayName,
        createdAt: publications.createdAt,
        id: publications.id,
        status: publications.verificationStatus,
        title: publications.title,
        type: publications.type,
      })
      .from(publications)
      .innerJoin(users, eq(publications.authorId, users.id))
      .where(eq(publications.visibility, "public"))
      .orderBy(desc(publications.createdAt))
      .limit(100);

    const publicationIds = rows.map((publication) => publication.id);
    const assignedTopics = publicationIds.length === 0 ? [] : await db.select({ label: topics.label, publicationId: publicationTopics.publicationId, slug: topics.slug }).from(publicationTopics).innerJoin(topics, eq(publicationTopics.topicId, topics.id)).where(inArray(publicationTopics.publicationId, publicationIds));
    const topicsByPublication = new Map<string, string[]>();
    for (const topic of assignedTopics) topicsByPublication.set(topic.publicationId, [...(topicsByPublication.get(topic.publicationId) ?? []), topic.label]);
    const enrichedRows = rows.map((publication) => ({ ...publication, topics: topicsByPublication.get(publication.id) ?? [] }));
    const queryFiltered = query
      ? enrichedRows.filter((publication) => `${publication.title} ${publication.abstract} ${publication.type} ${publication.author} ${publication.topics.join(" ")}`.toLowerCase().includes(query))
      : enrichedRows;
    const statusFiltered = mode === "verified" ? queryFiltered.filter((publication) => publication.status === "verified") : queryFiltered;
    const feed = mode === "discovery"
      ? statusFiltered.map((publication) => ({ ...publication, discoveryScore: discoveryScore(publication, query) })).sort((a, b) => b.discoveryScore - a.discoveryScore)
      : statusFiltered;

    return Response.json({
      publications: feed,
      ranking: {
        excludes: ["subscription tier", "contribution amount", "paid promotion"],
        mode,
        version: "prealpha-v1",
        uses: mode === "chronological" ? ["publication time"] : mode === "verified" ? ["public verification status", "publication time"] : ["text relevance", "freshness", "provenance status"],
      },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load publications" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as PublicationInput;
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const authorId = identity.userId;
    const type = stringField(input.type, "type", 64);
    const topicSlugs = normalizedTopicSlugs(input.topicSlugs);
    const title = stringField(input.title, "title", 240);
    const abstract = stringField(input.abstract, "abstract", 12_000);
    if (!publicationTypes.has(type)) {
      return Response.json({ error: "Unsupported publication type" }, { status: 400 });
    }

    const db = await getDb();
    const [author] = await db.select({ id: users.id }).from(users).where(eq(users.id, authorId)).limit(1);
    if (!author) {
      return Response.json({ error: "Author account was not found" }, { status: 404 });
    }

    const publicationId = crypto.randomUUID();
    const receipt = await createProvenanceReceipt({ authorId, publicationId, title, abstract, type });
    const now = new Date().toISOString();

    await db.batch([
      db.insert(publications).values({
        abstract,
        authorId,
        createdAt: now,
        id: publicationId,
        publishedAt: now,
        title,
        type,
        verificationStatus: "processing",
        visibility: "public",
      }),
      db.insert(publicationVersions).values({
        contentHash: receipt.contentHash,
        createdAt: now,
        id: crypto.randomUUID(),
        provenanceReceipt: JSON.stringify(receipt),
        publicationId,
        version: 1,
      }),
    ]);
    if (topicSlugs.length) {
      await db.batch(topicSlugs.map((slug) => db.insert(topics).values({ id: crypto.randomUUID(), label: topicLabel(slug), slug }).onConflictDoNothing()));
      const createdTopics = await db.select({ id: topics.id }).from(topics).where(inArray(topics.slug, topicSlugs));
      if (createdTopics.length) await db.batch(createdTopics.map((topic) => db.insert(publicationTopics).values({ id: crypto.randomUUID(), publicationId, topicId: topic.id }).onConflictDoNothing()));
    }

    return Response.json({
      publication: { abstract, authorId, id: publicationId, status: "processing", title, topicSlugs, type },
      provenanceReceipt: receipt,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to publish";
    const status = /required|at most/.test(message) ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
