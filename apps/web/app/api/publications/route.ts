import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { publicationVersions, publications, users } from "../../../db/schema";
import { createProvenanceReceipt } from "../../../lib/provenance";

const publicationTypes = new Set([
  "research_note",
  "white_paper",
  "project_update",
  "short_video",
  "teaching_artifact",
]);

type PublicationInput = {
  abstract?: unknown;
  authorId?: unknown;
  title?: unknown;
  type?: unknown;
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

export async function GET() {
  try {
    const db = await getDb();
    const rows = await db
      .select({
        abstract: publications.abstract,
        author: users.displayName,
        createdAt: publications.createdAt,
        id: publications.id,
        status: publications.verificationStatus,
        title: publications.title,
        type: publications.type,
      })
      .from(publications)
      .innerJoin(users, eq(publications.authorId, users.id))
      .where(eq(publications.visibility, "public"))
      .orderBy(desc(publications.createdAt))
      .limit(50);

    return Response.json({ publications: rows });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load publications" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as PublicationInput;
    const authorId = stringField(input.authorId, "authorId", 128);
    const type = stringField(input.type, "type", 64);
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

    const publicationId = crypto.randomUUID();
    const receipt = await createProvenanceReceipt({ authorId, publicationId, title, abstract, type });
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
        verificationStatus: "processing",
        visibility: "public",
      }),
      db.insert(publicationVersions).values({
        contentHash: receipt.contentHash,
        createdAt: now,
        id: crypto.randomUUID(),
        provenanceReceipt: JSON.stringify(receipt),
        publicationId,
        version: 1,
      }),
    ]);

    return Response.json({
      publication: { abstract, authorId, id: publicationId, status: "processing", title, type },
      provenanceReceipt: receipt,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to publish";
    const status = /required|at most/.test(message) ? 400 : 500;
    return Response.json({ error: message }, { status });
  }
}
