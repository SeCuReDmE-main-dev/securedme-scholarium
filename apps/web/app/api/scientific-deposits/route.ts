import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { publications, scientificDepositRequests, users } from "../../../db/schema";
import { normalizeDepositLicense, normalizeDepositMetadata, normalizeDepositProvider, normalizeDepositTitle, scientificDepositPolicy } from "../../../lib/scientific-deposit-policy";
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
  const requests = await account.db.select().from(scientificDepositRequests).where(eq(scientificDepositRequests.userId, account.user.id)).orderBy(desc(scientificDepositRequests.createdAt)).limit(20);
  return Response.json({ policy: scientificDepositPolicy, requests }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  const account = await currentAccount();
  if (!account) return signInRequired();
  const input = await request.json() as { coauthors?: unknown; doiNote?: unknown; license?: unknown; provider?: unknown; publicationId?: unknown; references?: unknown; title?: unknown };
  const title = normalizeDepositTitle(input.title);
  if (!title) return Response.json({ error: "title is required and must be at least 6 characters" }, { status: 400 });

  let publicationId: string | null = null;
  if (typeof input.publicationId === "string" && input.publicationId.trim()) {
    const [publication] = await account.db.select({ id: publications.id }).from(publications).where(and(eq(publications.id, input.publicationId), eq(publications.authorId, account.user.id))).limit(1);
    if (!publication) return Response.json({ error: "Publication was not found or is not owned by this account" }, { status: 404 });
    publicationId = publication.id;
  }

  const now = new Date().toISOString();
  const deposit = {
    createdAt: now,
    doi: null,
    id: crypto.randomUUID(),
    irreversibleConfirmedAt: null,
    license: normalizeDepositLicense(input.license),
    metadata: normalizeDepositMetadata(input),
    provider: normalizeDepositProvider(input.provider),
    providerDraftRef: null,
    publicationId,
    status: "draft",
    title,
    updatedAt: now,
    userId: account.user.id,
  };
  await account.db.insert(scientificDepositRequests).values(deposit);
  return Response.json({ deposit, policy: scientificDepositPolicy }, { status: 201, headers: { "cache-control": "private, no-store" } });
}
