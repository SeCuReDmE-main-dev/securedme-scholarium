import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { externalMediaLinks, feedFeedback, moderationCases, profilePreferences, publicProfiles, publicationComments, publicationReactions, publicationTopics, publicationVersions, publications, rankingPreferences, repositoryLinks, topicFollows, topics, userFollows, users } from "../../../db/schema";
import { accountAudience } from "../../../lib/account-audience";
import { createProvenanceReceipt } from "../../../lib/provenance";
import { classifyPublication, rankPlithogenicFeed } from "../../../lib/plithogenic-feed";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";
import { publicationTypes } from "../../../lib/publication-types";
import { publicationSafetyDecision } from "../../../lib/publication-safety";
import { normalizedTopicSlugs, topicLabel } from "../../../lib/topics";

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

type FeedMode = "chronological" | "discovery" | "following" | "verified";

function selectedFeedMode(value: string | null): FeedMode {
  return value === "chronological" || value === "following" || value === "verified" ? value : "discovery";
}

function boundedQuery(value: string | null) {
  return value?.trim().slice(0, 160).toLowerCase() ?? "";
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
        authorId: publications.authorId,
        authorPublicId: publicProfiles.publicId,
        profileVisibility: profilePreferences.profileVisibility,
        createdAt: publications.createdAt,
        id: publications.id,
        status: publications.verificationStatus,
        title: publications.title,
        type: publications.type,
      })
      .from(publications)
      .innerJoin(users, eq(publications.authorId, users.id))
      .leftJoin(publicProfiles, eq(publicProfiles.userId, publications.authorId))
      .leftJoin(profilePreferences, eq(profilePreferences.userId, publications.authorId))
      .where(eq(publications.visibility, "public"))
      .orderBy(desc(publications.createdAt))
      .limit(100);

    const publicationIds = rows.map((publication) => publication.id);
    const assignedTopics = publicationIds.length === 0 ? [] : await db.select({ label: topics.label, publicationId: publicationTopics.publicationId, slug: topics.slug }).from(publicationTopics).innerJoin(topics, eq(publicationTopics.topicId, topics.id)).where(inArray(publicationTopics.publicationId, publicationIds));
    const [reactionRows, commentRows, mediaRows, repositoryRows] = publicationIds.length === 0 ? [[], [], [], []] as const : await Promise.all([
      db.select({ publicationId: publicationReactions.publicationId, userId: publicationReactions.userId }).from(publicationReactions).where(inArray(publicationReactions.publicationId, publicationIds)),
      db.select({ publicationId: publicationComments.publicationId }).from(publicationComments).where(and(inArray(publicationComments.publicationId, publicationIds), eq(publicationComments.status, "visible"))),
      db.select({ canonicalUrl: externalMediaLinks.canonicalUrl, provider: externalMediaLinks.provider, publicationId: externalMediaLinks.publicationId }).from(externalMediaLinks).where(inArray(externalMediaLinks.publicationId, publicationIds)),
      db.select({ canonicalUrl: repositoryLinks.canonicalUrl, provider: repositoryLinks.provider, publicationId: repositoryLinks.publicationId }).from(repositoryLinks).where(inArray(repositoryLinks.publicationId, publicationIds)),
    ]);
    const reactionsByPublication = new Map<string, number>();
    const commentsByPublication = new Map<string, number>();
    for (const reaction of reactionRows) reactionsByPublication.set(reaction.publicationId, (reactionsByPublication.get(reaction.publicationId) ?? 0) + 1);
    for (const comment of commentRows) commentsByPublication.set(comment.publicationId, (commentsByPublication.get(comment.publicationId) ?? 0) + 1);
    const topicsByPublication = new Map<string, string[]>();
    const mediaByPublication = new Map<string, Array<{ provider: string; url: string }>>();
    const repositoriesByPublication = new Map<string, Array<{ provider: string; url: string }>>();
    const topicIdsByPublication = new Map<string, string[]>();
    for (const topic of assignedTopics) {
      topicsByPublication.set(topic.publicationId, [...(topicsByPublication.get(topic.publicationId) ?? []), topic.label]);
      topicIdsByPublication.set(topic.publicationId, [...(topicIdsByPublication.get(topic.publicationId) ?? []), topic.slug]);
    }
    for (const media of mediaRows) {
      mediaByPublication.set(media.publicationId, [...(mediaByPublication.get(media.publicationId) ?? []), { provider: media.provider, url: media.canonicalUrl }]);
    }
    for (const repository of repositoryRows) {
      repositoriesByPublication.set(repository.publicationId, [...(repositoriesByPublication.get(repository.publicationId) ?? []), { provider: repository.provider, url: repository.canonicalUrl }]);
    }
    const identity = await getPlatformIdentity();
    const viewer = identity ? await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1) : [];
    const viewerId = viewer[0]?.id ?? null;
    const [ranking, feedbackRows, followRows, authorFollowRows] = viewerId ? await Promise.all([
      db.select().from(rankingPreferences).where(eq(rankingPreferences.userId, viewerId)).limit(1),
      db.select({ preference: feedFeedback.preference, publicationId: feedFeedback.publicationId }).from(feedFeedback).where(eq(feedFeedback.userId, viewerId)),
      db.select({ slug: topics.slug }).from(topicFollows).innerJoin(topics, eq(topicFollows.topicId, topics.id)).where(eq(topicFollows.userId, viewerId)),
      db.select({ targetUserId: userFollows.targetUserId }).from(userFollows).where(eq(userFollows.userId, viewerId)),
    ]) : [[], [], [], []] as const;
    const favoriteIds = new Set(feedbackRows.filter((row) => row.preference === "favorite").map((row) => row.publicationId));
    const lessLikeIds = new Set(feedbackRows.filter((row) => row.preference === "less_like").map((row) => row.publicationId));
    const reactedIds = new Set(reactionRows.filter((row) => row.userId === viewerId).map((row) => row.publicationId));
    const followedTopicSlugs = new Set(followRows.map((row) => row.slug));
    const followedAuthorIds = new Set(authorFollowRows.map((row) => row.targetUserId));
    const preference = ranking[0] ?? { diversityWeight: 66, freshnessWeight: 52, relevanceWeight: 78 };
    const enrichedRows = rows.map((publication) => ({ ...publication, comments: commentsByPublication.get(publication.id) ?? 0, externalMedia: mediaByPublication.get(publication.id) ?? [], reactions: reactionsByPublication.get(publication.id) ?? 0, repositoryLinks: repositoriesByPublication.get(publication.id) ?? [], topics: topicsByPublication.get(publication.id) ?? [] }));
    const eligibleRows = enrichedRows.filter((publication) => !["quarantined", "removed"].includes(publication.status));
    const queryFiltered = query
      ? eligibleRows.filter((publication) => `${publication.title} ${publication.abstract} ${publication.type} ${publication.author} ${publication.topics.join(" ")}`.toLowerCase().includes(query))
      : eligibleRows;
    let statusFiltered = mode === "verified" ? queryFiltered.filter((publication) => publication.status === "verified") : queryFiltered;
    if (mode === "following") {
      if (!identity) return signInRequired();
      statusFiltered = queryFiltered.filter((publication) => followedAuthorIds.has(publication.authorId) || (topicIdsByPublication.get(publication.id) ?? []).some((slug) => followedTopicSlugs.has(slug)));
    }
    const ranked = mode === "discovery"
      ? rankPlithogenicFeed(statusFiltered.map((publication) => ({
        abstract: publication.abstract,
        classification: classifyPublication(publication.type),
        createdAt: publication.createdAt,
        id: publication.id,
        title: publication.title,
        topicSlugs: topicIdsByPublication.get(publication.id) ?? [],
        type: publication.type,
        verificationStatus: publication.status,
      })), { ...preference, favoriteIds, followedTopicSlugs, lessLikeIds, query, reactedIds })
      : [];
    const rankedById = new Map(ranked.map((publication) => [publication.id, publication]));
    const publicFeedItem = (publication: typeof statusFiltered[number], additional: Record<string, unknown>) => {
      const { authorId, profileVisibility, ...publicPublication } = publication;
      return { ...publicPublication, ...additional, followingAuthor: followedAuthorIds.has(authorId), profileVisible: profileVisibility === "public" };
    };
    const feed = mode === "discovery"
      ? ranked.map((rankedPublication) => {
        const publication = statusFiltered.find((item) => item.id === rankedPublication.id)!;
        return publicFeedItem(publication, { feedSignal: { classification: rankedPublication.classification, reasons: rankedPublication.why, scorecard: rankedPublication.scorecard, vector: rankedPublication.vector }, favorite: favoriteIds.has(publication.id) });
      })
      : statusFiltered.map((publication) => publicFeedItem(publication, { feedSignal: { classification: classifyPublication(publication.type), reasons: ["shown in your selected feed mode"], scorecard: rankedById.get(publication.id)?.scorecard ?? null, vector: rankedById.get(publication.id)?.vector ?? null }, favorite: favoriteIds.has(publication.id) }));

    return Response.json({
      publications: feed,
      ranking: {
        excludes: ["subscription tier", "contribution amount", "paid promotion"],
        mode,
        version: "plithogenic-explainable-v2",
        uses: mode === "chronological" ? ["publication time"] : mode === "verified" ? ["public verification status", "publication time"] : mode === "following" ? ["authors and hashtags explicitly followed by this account", "publication time"] : ["explicit satisfaction signals", "hashtag and text relevance", "research provenance context", "freshness", "format diversity"],
        lanes: mode === "discovery" ? [
          { name: "personal relevance", inputs: ["search text", "followed hashtags"], excludes: ["global popularity", "off-platform tracking"] },
          { name: "explicit satisfaction", inputs: ["your favorites", "your reactions"], excludes: ["passive dwell tracking", "other users' reactions"] },
          { name: "research context", inputs: ["publication provenance state", "structured hashtags"], excludes: ["claiming scientific truth", "automated viewpoint judging"] },
        ] : [],
        guardrails: ["public eligibility is resolved before ranking", "quarantined and removed work never enters discovery", "unverified work is labelled as such rather than declared false", "paid promotion is excluded"],
        doesNotDetermine: ["scientific truth", "a moderation decision", "a user's worth", "visibility purchased with money"],
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
    await db.insert(publicProfiles).values({ publicId: crypto.randomUUID(), userId: author.id }).onConflictDoNothing();
    const audience = await accountAudience(db, author.id);
    const safety = publicationSafetyDecision({ abstract, title });
    const visibility = safety.action === "quarantine" ? "private" : audience.capabilities.canPublishPublicly ? "public" : "private";
    const verificationStatus = safety.action === "quarantine" ? "quarantined" : "processing";

    const publicationId = crypto.randomUUID();
    const receipt = await createProvenanceReceipt({ authorId, publicationId, title, abstract, type, version: 1 });
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
        verificationStatus,
        visibility,
      }),
      db.insert(publicationVersions).values({
        contentHash: receipt.contentHash,
        createdAt: now,
        id: crypto.randomUUID(),
        provenanceReceipt: JSON.stringify(receipt),
        publicationId,
        abstract,
        title,
        version: 1,
      }),
      ...(safety.action === "quarantine" && safety.reasonCode ? [db.insert(moderationCases).values({ createdAt: now, id: crypto.randomUUID(), publicationId, reasonCode: safety.reasonCode, source: "publication_secret_scan", status: "open" })] : []),
    ]);
    if (topicSlugs.length) {
      await db.batch(topicSlugs.map((slug) => db.insert(topics).values({ id: crypto.randomUUID(), label: topicLabel(slug), slug }).onConflictDoNothing()));
      const createdTopics = await db.select({ id: topics.id }).from(topics).where(inArray(topics.slug, topicSlugs));
      if (createdTopics.length) await db.batch(createdTopics.map((topic) => db.insert(publicationTopics).values({ id: crypto.randomUUID(), publicationId, topicId: topic.id }).onConflictDoNothing()));
    }

    return Response.json({
      moderation: safety.action === "quarantine" ? { message: safety.authorMessage, status: "quarantined" } : null,
      publication: { abstract, authorId, id: publicationId, status: verificationStatus, title, topicSlugs, type, visibility },
      provenanceReceipt: receipt,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to publish";
    const status = /required|at most/.test(message) ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
