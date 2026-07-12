import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { liveSessions, publications, users } from "../../../db/schema";
import { accountAudience } from "../../../lib/account-audience";
import { liveSessionPolicy, normalizeLiveAgenda, normalizeLiveAudienceMode, normalizeLiveModeratorPlan, normalizeLiveSchedule, normalizeLiveTitle, normalizeReplayConsent } from "../../../lib/live-session-policy";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

async function currentAccount() {
  const identity = await getPlatformIdentity();
  if (!identity) return null;
  const db = await getDb();
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1);
  return user ? { db, user } : null;
}

export async function GET() {
  const account = await currentAccount();
  if (!account) return signInRequired();
  const sessions = await account.db.select().from(liveSessions).where(eq(liveSessions.userId, account.user.id)).orderBy(desc(liveSessions.scheduledAt)).limit(20);
  return Response.json({ policy: liveSessionPolicy, sessions }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  const account = await currentAccount();
  if (!account) return signInRequired();
  const input = await request.json() as { agenda?: unknown; audienceMode?: unknown; moderatorPlan?: unknown; publicationId?: unknown; replayConsent?: unknown; scheduledAt?: unknown; title?: unknown };
  const title = normalizeLiveTitle(input.title);
  const scheduledAt = normalizeLiveSchedule(input.scheduledAt);
  if (!title) return Response.json({ error: "title is required and must be at least 6 characters" }, { status: 400 });
  if (!scheduledAt) return Response.json({ error: "scheduledAt must be an ISO date" }, { status: 400 });

  const audience = await accountAudience(account.db, account.user.id);
  const audienceMode = normalizeLiveAudienceMode(input.audienceMode);
  if (audience.ageBand === "minor" && !audience.capabilities.canJoinLive) {
    return Response.json({ error: "Minor accounts need active guardian or verified school consent before planning a public Live", policy: liveSessionPolicy }, { status: 403 });
  }

  let publicationId: string | null = null;
  if (typeof input.publicationId === "string" && input.publicationId.trim()) {
    const [publication] = await account.db.select({ id: publications.id }).from(publications).where(and(eq(publications.id, input.publicationId), eq(publications.authorId, account.user.id))).limit(1);
    if (!publication) return Response.json({ error: "Publication was not found or is not owned by this account" }, { status: 404 });
    publicationId = publication.id;
  }

  const now = new Date().toISOString();
  const session = {
    agenda: normalizeLiveAgenda(input.agenda),
    audienceMode,
    createdAt: now,
    id: crypto.randomUUID(),
    moderatorPlan: normalizeLiveModeratorPlan(input.moderatorPlan),
    publicationId,
    replayConsent: normalizeReplayConsent(input.replayConsent),
    scheduledAt,
    status: "planned",
    title,
    updatedAt: now,
    userId: account.user.id,
    youthMode: audience.ageBand === "adult" ? "standard" : "restricted_until_consent",
  };
  await account.db.insert(liveSessions).values(session);
  return Response.json({ policy: liveSessionPolicy, session }, { status: 201, headers: { "cache-control": "private, no-store" } });
}
