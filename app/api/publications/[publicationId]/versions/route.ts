import { and, desc, eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { publicationVersions, publications } from "../../../../../db/schema";
import { createProvenanceReceipt } from "../../../../../lib/provenance";
import { getPlatformIdentity, signInRequired } from "../../../../../lib/platform-identity";

type VersionInput = { abstract?: unknown; baseVersion?: unknown; title?: unknown };

function textField(value: unknown, field: string, maximum: number) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`);
  const normalized = value.trim();
  if (normalized.length > maximum) throw new Error(`${field} must be at most ${maximum} characters`);
  return normalized;
}

function requestedBaseVersion(value: unknown) {
  if (!Number.isInteger(value) || typeof value !== "number" || value < 1) throw new Error("baseVersion must be the current positive version number");
  return value;
}

export async function GET(_request: Request, context: { params: Promise<{ publicationId: string }> }) {
  try {
    const { publicationId } = await context.params;
    const db = await getDb();
    const [publication] = await db.select({ id: publications.id, visibility: publications.visibility }).from(publications).where(eq(publications.id, publicationId)).limit(1);
    if (!publication || publication.visibility !== "public") return Response.json({ error: "Publication was not found" }, { status: 404 });
    const versions = await db.select({ abstract: publicationVersions.abstract, contentHash: publicationVersions.contentHash, createdAt: publicationVersions.createdAt, provenanceReceipt: publicationVersions.provenanceReceipt, title: publicationVersions.title, version: publicationVersions.version }).from(publicationVersions).where(eq(publicationVersions.publicationId, publication.id)).orderBy(desc(publicationVersions.version));
    return Response.json({ publicationId: publication.id, versions });
  } catch (error) {
    console.error("Publication versions read failed", { message: error instanceof Error ? error.message : "Unknown error" });
    return Response.json({ error: "Unable to load publication versions" }, { status: 500 });
  }
}

export async function POST(request: Request, context: { params: Promise<{ publicationId: string }> }) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    const { publicationId } = await context.params;
    const input = await request.json() as VersionInput;
    const abstract = textField(input.abstract, "abstract", 12_000);
    const baseVersion = requestedBaseVersion(input.baseVersion);
    const title = textField(input.title, "title", 240);
    const db = await getDb();
    const [publication] = await db.select().from(publications).where(and(eq(publications.id, publicationId), eq(publications.authorId, identity.userId))).limit(1);
    if (!publication) return Response.json({ error: "Publication was not found or is not owned by this account" }, { status: 404 });
    const [latest] = await db.select({ version: publicationVersions.version }).from(publicationVersions).where(eq(publicationVersions.publicationId, publication.id)).orderBy(desc(publicationVersions.version)).limit(1);
    if (!latest) return Response.json({ error: "Publication provenance history is unavailable" }, { status: 409 });
    if (latest.version !== baseVersion) return Response.json({ error: "A newer publication version already exists. Reload before revising." }, { status: 409 });

    const version = latest.version + 1;
    const receipt = await createProvenanceReceipt({ abstract, authorId: identity.userId, publicationId: publication.id, title, type: publication.type, version });
    const createdAt = new Date().toISOString();
    await db.batch([
      db.insert(publicationVersions).values({ abstract, contentHash: receipt.contentHash, createdAt, id: crypto.randomUUID(), provenanceReceipt: JSON.stringify(receipt), publicationId: publication.id, title, version }),
      db.update(publications).set({ abstract, title, verificationStatus: "processing" }).where(eq(publications.id, publication.id)),
    ]);
    return Response.json({ publication: { abstract, id: publication.id, status: "processing", title, version }, provenanceReceipt: receipt }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to publish a new version";
    return Response.json({ error: message }, { status: /required|at most|baseVersion/.test(message) ? 400 : 500 });
  }
}
