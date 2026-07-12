import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { projectStarterRequests, publications, repositoryLinks, users } from "../../../db/schema";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";
import { normalizeProjectStarterInput, projectStarterPolicy, targetNameFromRepositoryPath } from "../../../lib/project-starter-policy";

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
  const requests = await account.db.select().from(projectStarterRequests).where(eq(projectStarterRequests.userId, account.user.id)).orderBy(desc(projectStarterRequests.createdAt)).limit(20);
  return Response.json({ policy: projectStarterPolicy, requests }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  const account = await currentAccount();
  if (!account) return signInRequired();
  const input = await request.json() as { publicationId?: unknown; sourceRepositoryUrl?: unknown; targetRepositoryName?: unknown };
  const normalized = normalizeProjectStarterInput(input);
  if (!normalized.publicationId) return Response.json({ error: "publicationId is required" }, { status: 400 });
  if (!normalized.source) return Response.json({ error: "sourceRepositoryUrl must be a public GitHub, GitLab, or SourceForge repository homepage URL" }, { status: 400 });

  const [publication] = await account.db.select({ id: publications.id }).from(publications).where(eq(publications.id, normalized.publicationId)).limit(1);
  if (!publication) return Response.json({ error: "Publication was not found" }, { status: 404 });
  const [sourceLink] = await account.db.select({ canonicalUrl: repositoryLinks.canonicalUrl, provider: repositoryLinks.provider, repositoryPath: repositoryLinks.repositoryPath }).from(repositoryLinks).where(and(eq(repositoryLinks.publicationId, publication.id), eq(repositoryLinks.provider, normalized.source.provider), eq(repositoryLinks.repositoryPath, normalized.source.repositoryPath))).limit(1);
  if (!sourceLink) return Response.json({ error: "The source repository must first be attributed on the publication by its author" }, { status: 409 });

  const now = new Date().toISOString();
  const starter = {
    createdAt: now,
    id: crypto.randomUUID(),
    licenseStatus: "requires_review",
    provenanceManifestStatus: "required",
    publicationId: publication.id,
    sourceProvider: sourceLink.provider,
    sourceRepositoryPath: sourceLink.repositoryPath,
    sourceRepositoryUrl: sourceLink.canonicalUrl,
    status: "provider_auth_required",
    targetProvider: projectStarterPolicy.defaultTargetProvider,
    targetRepositoryName: normalized.targetRepositoryName ?? targetNameFromRepositoryPath(sourceLink.repositoryPath),
    targetVisibility: projectStarterPolicy.defaultTargetVisibility,
    updatedAt: now,
    userId: account.user.id,
  };
  await account.db.insert(projectStarterRequests).values(starter).onConflictDoUpdate({
    target: [projectStarterRequests.userId, projectStarterRequests.publicationId, projectStarterRequests.sourceProvider, projectStarterRequests.sourceRepositoryPath],
    set: {
      sourceRepositoryUrl: starter.sourceRepositoryUrl,
      status: starter.status,
      targetRepositoryName: starter.targetRepositoryName,
      targetVisibility: starter.targetVisibility,
      updatedAt: now,
    },
  });
  return Response.json({ policy: projectStarterPolicy, request: starter }, { status: 202, headers: { "cache-control": "private, no-store" } });
}
