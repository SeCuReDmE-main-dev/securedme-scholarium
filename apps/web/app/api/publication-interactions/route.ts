import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { interactionReports, publicationComments, publicationReactions, publications, userBoundaries, users } from "../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

const reactionKinds = new Set(["insightful", "helpful", "question"]);
const reportReasons = new Set(["harassment", "personal_data", "unsafe", "spam", "copyright", "other"]);
const boundaryKinds = new Set(["block", "mute"]);

type InteractionInput = {
  action?: unknown;
  body?: unknown;
  commentId?: unknown;
  kind?: unknown;
  parentCommentId?: unknown;
  publicationId?: unknown;
  reason?: unknown;
  targetUserId?: unknown;
  details?: unknown;
};

function requiredId(value: unknown, field: string) {
  if (typeof value !== "string" || value.length < 8 || value.length > 200) throw new Error(`${field} is required`);
  return value;
}

function optionalId(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  return requiredId(value, "parentCommentId");
}

function boundedText(value: unknown, field: string, maximum: number, required = true) {
  if (typeof value !== "string") {
    if (required) throw new Error(`${field} is required`);
    return "";
  }
  const normalized = value.trim();
  if (required && !normalized) throw new Error(`${field} is required`);
  if (normalized.length > maximum) throw new Error(`${field} must be at most ${maximum} characters`);
  return normalized;
}

async function signedInAccount() {
  const identity = await getPlatformIdentity();
  if (!identity) return { identity: null, response: signInRequired() };
  const db = await getDb();
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1);
  if (!user) return { identity: null, response: Response.json({ error: "Create a Scholarium account before interacting" }, { status: 404 }) };
  return { identity, db, response: null };
}

async function publicPublication(db: Awaited<ReturnType<typeof getDb>>, publicationId: string) {
  const [publication] = await db.select({ authorId: publications.authorId, id: publications.id }).from(publications).where(and(eq(publications.id, publicationId), eq(publications.visibility, "public"))).limit(1);
  return publication;
}

export async function GET(request: Request) {
  try {
    const publicationId = new URL(request.url).searchParams.get("publicationId");
    if (!publicationId) return Response.json({ error: "publicationId is required" }, { status: 400 });
    const db = await getDb();
    const publication = await publicPublication(db, publicationId);
    if (!publication) return Response.json({ error: "Publication was not found" }, { status: 404 });

    const identity = await getPlatformIdentity();
    const boundaries = identity
      ? await db.select({ targetUserId: userBoundaries.targetUserId }).from(userBoundaries).where(eq(userBoundaries.userId, identity.userId))
      : [];
    const hiddenAuthorIds = new Set(boundaries.map((boundary) => boundary.targetUserId));
    const reactionRows = await db.select({ kind: publicationReactions.kind, userId: publicationReactions.userId }).from(publicationReactions).where(eq(publicationReactions.publicationId, publicationId));
    const comments = await db.select({
      author: users.displayName,
      authorId: publicationComments.authorId,
      body: publicationComments.body,
      createdAt: publicationComments.createdAt,
      id: publicationComments.id,
      parentCommentId: publicationComments.parentCommentId,
    }).from(publicationComments).innerJoin(users, eq(publicationComments.authorId, users.id)).where(and(eq(publicationComments.publicationId, publicationId), eq(publicationComments.status, "visible"))).orderBy(asc(publicationComments.createdAt)).limit(100);
    const visibleComments = comments.filter((comment) => !hiddenAuthorIds.has(comment.authorId));
    const reactionCounts = Object.fromEntries([...reactionKinds].map((kind) => [kind, 0])) as Record<string, number>;
    for (const reaction of reactionRows) reactionCounts[reaction.kind] = (reactionCounts[reaction.kind] ?? 0) + 1;
    return Response.json({
      comments: visibleComments,
      reactions: {
        counts: reactionCounts,
        mine: identity ? reactionRows.find((reaction) => reaction.userId === identity.userId)?.kind ?? null : null,
        total: reactionRows.length,
      },
      safety: { commentsLimitedToOneReplyDepth: true, reportsCreateHumanReviewCase: true },
    });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load interactions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const account = await signedInAccount();
    if (account.response || !account.identity || !account.db) return account.response!;
    const input = await request.json() as InteractionInput;
    const action = boundedText(input.action, "action", 32);
    const publicationId = requiredId(input.publicationId, "publicationId");
    const publication = await publicPublication(account.db, publicationId);
    if (!publication) return Response.json({ error: "Publication was not found" }, { status: 404 });

    if (action === "reaction") {
      const kind = boundedText(input.kind ?? "insightful", "kind", 24);
      if (!reactionKinds.has(kind)) return Response.json({ error: "Unsupported academic reaction" }, { status: 400 });
      const [existing] = await account.db.select({ id: publicationReactions.id }).from(publicationReactions).where(and(eq(publicationReactions.publicationId, publicationId), eq(publicationReactions.userId, account.identity.userId))).limit(1);
      if (existing) await account.db.update(publicationReactions).set({ kind }).where(eq(publicationReactions.id, existing.id));
      else await account.db.insert(publicationReactions).values({ id: crypto.randomUUID(), kind, publicationId, userId: account.identity.userId });
      return Response.json({ reaction: { kind, publicationId } });
    }

    if (action === "comment") {
      const body = boundedText(input.body, "body", 1200);
      const parentCommentId = optionalId(input.parentCommentId);
      if (parentCommentId) {
        const [parent] = await account.db.select({ parentCommentId: publicationComments.parentCommentId, publicationId: publicationComments.publicationId, status: publicationComments.status }).from(publicationComments).where(eq(publicationComments.id, parentCommentId)).limit(1);
        if (!parent || parent.publicationId !== publicationId || parent.status !== "visible") return Response.json({ error: "Reply target was not found" }, { status: 404 });
        if (parent.parentCommentId) return Response.json({ error: "Scholarium limits comment threads to one reply level" }, { status: 400 });
      }
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      await account.db.insert(publicationComments).values({ authorId: account.identity.userId, body, createdAt, id, parentCommentId, publicationId });
      return Response.json({ comment: { author: account.identity.displayName, authorId: account.identity.userId, body, createdAt, id, parentCommentId } }, { status: 201 });
    }

    if (action === "report") {
      const reason = boundedText(input.reason, "reason", 32);
      if (!reportReasons.has(reason)) return Response.json({ error: "Choose a supported report reason" }, { status: 400 });
      const commentId = optionalId(input.commentId);
      if (commentId) {
        const [comment] = await account.db.select({ id: publicationComments.id }).from(publicationComments).where(and(eq(publicationComments.id, commentId), eq(publicationComments.publicationId, publicationId))).limit(1);
        if (!comment) return Response.json({ error: "Comment was not found" }, { status: 404 });
      }
      const details = boundedText(input.details, "details", 1200, false) || null;
      const id = crypto.randomUUID();
      await account.db.insert(interactionReports).values({ commentId, details, id, publicationId, reason, reporterId: account.identity.userId });
      return Response.json({ report: { id, status: "open" }, message: "Report received. The content stays traceable while a human review is prepared." }, { status: 201 });
    }

    if (action === "boundary") {
      const targetUserId = requiredId(input.targetUserId, "targetUserId");
      const kind = boundedText(input.kind, "kind", 16);
      if (targetUserId === account.identity.userId) return Response.json({ error: "You cannot block or mute yourself" }, { status: 400 });
      if (!boundaryKinds.has(kind)) return Response.json({ error: "Choose block or mute" }, { status: 400 });
      const [target] = await account.db.select({ id: users.id }).from(users).where(eq(users.id, targetUserId)).limit(1);
      if (!target) return Response.json({ error: "Member was not found" }, { status: 404 });
      const [existing] = await account.db.select({ id: userBoundaries.id }).from(userBoundaries).where(and(eq(userBoundaries.userId, account.identity.userId), eq(userBoundaries.targetUserId, targetUserId), eq(userBoundaries.kind, kind))).limit(1);
      if (!existing) await account.db.insert(userBoundaries).values({ id: crypto.randomUUID(), kind, targetUserId, userId: account.identity.userId });
      return Response.json({ boundary: { kind, targetUserId } });
    }

    return Response.json({ error: "Unsupported interaction action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save interaction";
    return Response.json({ error: message }, { status: /required|at most/.test(message) ? 400 : 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const account = await signedInAccount();
    if (account.response || !account.identity || !account.db) return account.response!;
    const input = await request.json() as InteractionInput;
    const publicationId = requiredId(input.publicationId, "publicationId");
    const action = boundedText(input.action, "action", 32);
    if (action !== "reaction") return Response.json({ error: "Only reactions can be removed here" }, { status: 400 });
    await account.db.delete(publicationReactions).where(and(eq(publicationReactions.publicationId, publicationId), eq(publicationReactions.userId, account.identity.userId)));
    return Response.json({ removed: true, publicationId });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to remove reaction" }, { status: 500 });
  }
}
