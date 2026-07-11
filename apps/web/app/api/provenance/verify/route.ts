import { and, eq } from "drizzle-orm";
import { getDb } from "../../../../db";
import { publicationVersions, publications } from "../../../../db/schema";
import { provenanceContentHash, type ProvenanceReceipt } from "../../../../lib/provenance";

type VerificationInput = { abstract?: unknown; publicationId?: unknown; title?: unknown; version?: unknown };

function versionNumber(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 ? value : null;
}

function textField(value: unknown, field: string, maximum: number) {
  if (typeof value !== "string" || !value.trim() || value.length > maximum) throw new Error(`${field} is required and must be at most ${maximum} characters`);
  return value.trim();
}

function receipt(value: string): ProvenanceReceipt | null {
  try {
    const parsed = JSON.parse(value) as Partial<ProvenanceReceipt>;
    return parsed.algorithm === "SHA-256" && typeof parsed.contentHash === "string" && /^[a-f0-9]{64}$/u.test(parsed.contentHash) && typeof parsed.issuedAt === "string" && typeof parsed.receiptId === "string" && typeof parsed.version === "number" ? parsed as ProvenanceReceipt : null;
  } catch { return null; }
}

async function publicVersion(publicationId: string, version: number) {
  const db = await getDb();
  const [publication] = await db.select({ authorId: publications.authorId, id: publications.id, type: publications.type }).from(publications).where(and(eq(publications.id, publicationId), eq(publications.visibility, "public"))).limit(1);
  if (!publication) return { db, publication: null, version: null };
  const [storedVersion] = await db.select({ abstract: publicationVersions.abstract, contentHash: publicationVersions.contentHash, provenanceReceipt: publicationVersions.provenanceReceipt, title: publicationVersions.title, version: publicationVersions.version }).from(publicationVersions).where(and(eq(publicationVersions.publicationId, publication.id), eq(publicationVersions.version, version))).limit(1);
  return { db, publication, version: storedVersion ?? null };
}

/** Public receipt summary. It deliberately excludes provider identity and author account ID. */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const publicationId = url.searchParams.get("publicationId");
    const version = versionNumber(Number(url.searchParams.get("version")));
    if (!publicationId || !version) return Response.json({ error: "publicationId and a positive version are required" }, { status: 400 });
    const stored = await publicVersion(publicationId, version);
    if (!stored.publication || !stored.version) return Response.json({ error: "Public publication version was not found" }, { status: 404 });
    const parsedReceipt = receipt(stored.version.provenanceReceipt);
    if (!parsedReceipt) return Response.json({ error: "Stored provenance receipt is invalid" }, { status: 409 });
    return Response.json({ publicationId, receipt: parsedReceipt, storedHash: stored.version.contentHash, version: stored.version.version });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to read provenance receipt" }, { status: 500 });
  }
}

/** Recalculate a supplied public version without persisting the submitted content. */
export async function POST(request: Request) {
  try {
    const input = await request.json() as VerificationInput;
    if (typeof input.publicationId !== "string" || !input.publicationId) return Response.json({ error: "publicationId is required" }, { status: 400 });
    const version = versionNumber(input.version);
    if (!version) return Response.json({ error: "A positive version is required" }, { status: 400 });
    const title = textField(input.title, "title", 240);
    const abstract = textField(input.abstract, "abstract", 12_000);
    const stored = await publicVersion(input.publicationId, version);
    if (!stored.publication || !stored.version) return Response.json({ error: "Public publication version was not found" }, { status: 404 });
    const parsedReceipt = receipt(stored.version.provenanceReceipt);
    if (!parsedReceipt) return Response.json({ error: "Stored provenance receipt is invalid" }, { status: 409 });
    const computedHash = await provenanceContentHash({ abstract, authorId: stored.publication.authorId, publicationId: stored.publication.id, title, type: stored.publication.type, version });
    const matches = computedHash === stored.version.contentHash && computedHash === parsedReceipt.contentHash;
    return Response.json({ matches, publicationId: stored.publication.id, receipt: parsedReceipt, version });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify provenance";
    return Response.json({ error: message }, { status: /required|at most|positive/.test(message) ? 400 : 500 });
  }
}
