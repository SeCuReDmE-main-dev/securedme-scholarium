import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { externalMediaLinks, publications, users } from "../../../db/schema";
import { accountAudience } from "../../../lib/account-audience";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

type ExternalMedia = { canonicalUrl: string; externalId: string; provider: "tiktok" | "youtube" };

function externalMedia(value: unknown): ExternalMedia | null {
  if (typeof value !== "string" || value.length > 2_048) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    const host = url.hostname.toLowerCase().replace(/^www\./u, "");
    if (host === "youtu.be") {
      const externalId = url.pathname.slice(1).split("/")[0];
      return externalId ? { canonicalUrl: `https://www.youtube.com/watch?v=${externalId}`, externalId, provider: "youtube" } : null;
    }
    if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      const externalId = url.searchParams.get("v") ?? url.pathname.match(/\/(?:shorts|embed)\/([^/?]+)/u)?.[1] ?? null;
      return externalId ? { canonicalUrl: `https://www.youtube.com/watch?v=${externalId}`, externalId, provider: "youtube" } : null;
    }
    if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
      const externalId = url.pathname.match(/\/video\/(\d+)/u)?.[1] ?? null;
      return externalId ? { canonicalUrl: `https://www.tiktok.com/@_/video/${externalId}`, externalId, provider: "tiktok" } : null;
    }
  } catch { return null; }
  return null;
}

export async function GET(request: Request) {
  try {
    const publicationId = new URL(request.url).searchParams.get("publicationId");
    if (!publicationId) return Response.json({ error: "publicationId is required" }, { status: 400 });
    const db = await getDb();
    const [publication] = await db.select({ id: publications.id }).from(publications).where(and(eq(publications.id, publicationId), eq(publications.visibility, "public"))).limit(1);
    if (!publication) return Response.json({ error: "Publication was not found" }, { status: 404 });
    const links = await db.select({ canonicalUrl: externalMediaLinks.canonicalUrl, createdAt: externalMediaLinks.createdAt, provider: externalMediaLinks.provider }).from(externalMediaLinks).where(eq(externalMediaLinks.publicationId, publication.id));
    return Response.json({ links, publicationId: publication.id });
  } catch (error) {
    console.error("External media links read failed", { message: error instanceof Error ? error.message : "Unknown error" });
    return Response.json({ error: "Unable to load external media links" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const input = await request.json() as { publicationId?: unknown; url?: unknown };
    if (typeof input.publicationId !== "string" || input.publicationId.length < 8) return Response.json({ error: "publicationId is required" }, { status: 400 });
    const media = externalMedia(input.url);
    if (!media) return Response.json({ error: "Provide a valid public YouTube or TikTok video URL" }, { status: 400 });
    const db = await getDb();
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, identity.userId)).limit(1);
    if (!user) return Response.json({ error: "Create a Scholarium account before linking media" }, { status: 404 });
    const audience = await accountAudience(db, user.id);
    if (!audience.capabilities.canLinkExternalMedia) {
      return Response.json({ error: "A guardian consent or verified school relationship is required before a minor account can link public external media." }, { status: 403 });
    }
    const [publication] = await db.select({ id: publications.id }).from(publications).where(and(eq(publications.id, input.publicationId), eq(publications.authorId, user.id))).limit(1);
    if (!publication) return Response.json({ error: "Publication was not found or is not owned by this account" }, { status: 404 });
    await db.insert(externalMediaLinks).values({ canonicalUrl: media.canonicalUrl, createdAt: new Date().toISOString(), externalId: media.externalId, id: crypto.randomUUID(), provider: media.provider, publicationId: publication.id, userId: user.id }).onConflictDoUpdate({ target: [externalMediaLinks.provider, externalMediaLinks.externalId], set: { canonicalUrl: media.canonicalUrl, publicationId: publication.id, userId: user.id } });
    return Response.json({ link: media, publicationId: publication.id }, { status: 201 });
  } catch (error) {
    console.error("External media link save failed", { message: error instanceof Error ? error.message : "Unknown error" });
    return Response.json({ error: "Unable to save external media link" }, { status: 500 });
  }
}
