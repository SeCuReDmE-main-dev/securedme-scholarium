import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { publications, repositoryLinks, users } from "../../../db/schema";
import { accountAudience } from "../../../lib/account-audience";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";
import { canonicalRepositoryLink } from "../../../lib/repository-link";

export async function GET(request: Request) {
  try {
    const publicationId = new URL(request.url).searchParams.get("publicationId");
    if (!publicationId) return Response.json({ error: "publicationId is required" }, { status: 400 });
    const db = await getDb();
    const [publication] = await db.select({ id: publications.id }).from(publications).where(and(eq(publications.id, publicationId), eq(publications.visibility, "public"))).limit(1);
    if (!publication) return Response.json({ error: "Publication was not found" }, { status: 404 });
    const links = await db.select({ canonicalUrl: repositoryLinks.canonicalUrl, createdAt: repositoryLinks.createdAt, provider: repositoryLinks.provider, repositoryPath: repositoryLinks.repositoryPath }).from(repositoryLinks).where(eq(repositoryLinks.publicationId, publication.id));
    return Response.json({ links, publicationId: publication.id });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load repository links" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const input = await request.json() as { publicationId?: unknown; url?: unknown };
    if (typeof input.publicationId !== "string" || input.publicationId.length < 8) return Response.json({ error: "publicationId is required" }, { status: 400 });
    const link = canonicalRepositoryLink(input.url);
    if (!link) return Response.json({ error: "Provide a public GitHub, GitLab, or SourceForge repository homepage URL" }, { status: 400 });
    const db = await getDb();
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1);
    if (!user) return Response.json({ error: "Create a Scholarium account before linking a repository" }, { status: 404 });
    if (!(await accountAudience(db, user.id)).capabilities.canPublishPublicly) return Response.json({ error: "A guardian consent or verified school relationship is required before a minor account can publish an external repository link." }, { status: 403 });
    const [publication] = await db.select({ id: publications.id }).from(publications).where(and(eq(publications.id, input.publicationId), eq(publications.authorId, user.id))).limit(1);
    if (!publication) return Response.json({ error: "Publication was not found or is not owned by this account" }, { status: 404 });
    await db.insert(repositoryLinks).values({ canonicalUrl: link.canonicalUrl, createdAt: new Date().toISOString(), id: crypto.randomUUID(), provider: link.provider, publicationId: publication.id, repositoryPath: link.repositoryPath, userId: user.id }).onConflictDoUpdate({ target: [repositoryLinks.publicationId, repositoryLinks.provider, repositoryLinks.repositoryPath], set: { canonicalUrl: link.canonicalUrl, userId: user.id } });
    return Response.json({ link, publicationId: publication.id }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to save repository link" }, { status: 500 });
  }
}
