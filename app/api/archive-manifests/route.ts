import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { archiveManifests, publications, users } from "../../../db/schema";
import { archiveManifestPolicy, normalizeArchiveAction, normalizeArchivePath, normalizeArchiveProvider, normalizeObjectCount } from "../../../lib/archive-manifest";
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
  const manifests = await account.db.select().from(archiveManifests).where(eq(archiveManifests.userId, account.user.id));
  return Response.json({ manifests, policy: archiveManifestPolicy }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  const account = await currentAccount();
  if (!account) return signInRequired();
  const input = await request.json() as { objectCount?: unknown; provider?: unknown; providerPath?: unknown; publicationId?: unknown };
  const provider = normalizeArchiveProvider(input.provider);
  const providerPath = normalizeArchivePath(input.providerPath);
  if (!provider) return Response.json({ error: "provider must be google_drive, microsoft_drive, local_sync, or r2_cold" }, { status: 400 });
  if (!providerPath) return Response.json({ error: "providerPath is required and must not contain credentials" }, { status: 400 });
  let publicationId: string | null = null;
  if (typeof input.publicationId === "string" && input.publicationId.trim()) {
    const [publication] = await account.db.select({ id: publications.id }).from(publications).where(and(eq(publications.id, input.publicationId), eq(publications.authorId, account.user.id))).limit(1);
    if (!publication) return Response.json({ error: "Publication was not found or is not owned by this account" }, { status: 404 });
    publicationId = publication.id;
  }
  const now = new Date().toISOString();
  const values = { id: crypto.randomUUID(), userId: account.user.id, publicationId, provider, providerPath, objectCount: normalizeObjectCount(input.objectCount), status: "planned", updatedAt: now };
  await account.db.insert(archiveManifests).values(values).onConflictDoUpdate({
    target: [archiveManifests.userId, archiveManifests.provider, archiveManifests.providerPath],
    set: { objectCount: values.objectCount, publicationId, status: "planned", updatedAt: now },
  });
  return Response.json({ manifest: values, policy: archiveManifestPolicy }, { status: 201, headers: { "cache-control": "private, no-store" } });
}

export async function PUT(request: Request) {
  const account = await currentAccount();
  if (!account) return signInRequired();
  const input = await request.json() as { action?: unknown; id?: unknown };
  if (typeof input.id !== "string") return Response.json({ error: "id is required" }, { status: 400 });
  const action = normalizeArchiveAction(input.action);
  if (!action) return Response.json({ error: "action must be restore or resync" }, { status: 400 });
  const now = new Date().toISOString();
  const set = action === "restore" ? { restoreRequestedAt: now, status: "restore_requested", updatedAt: now } : { resyncRequestedAt: now, status: "resync_requested", updatedAt: now };
  await account.db.update(archiveManifests).set(set).where(and(eq(archiveManifests.id, input.id), eq(archiveManifests.userId, account.user.id)));
  return Response.json({ action, policy: archiveManifestPolicy, requestedAt: now }, { headers: { "cache-control": "private, no-store" } });
}
