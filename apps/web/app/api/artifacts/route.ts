import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { artifacts, publications } from "../../../db/schema";
import { requestExceedsArtifactLimit, validateArtifactFile } from "../../../lib/artifact-validation";
import { getMediaStore } from "../../../lib/media-store";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fileName(objectKey: string) {
  return objectKey.split("/").at(-1)?.replace(/["\\\r\n]/gu, "_") || "scholarium-artifact";
}

async function publicPublication(publicationId: string) {
  const db = await getDb();
  const [publication] = await db.select({ id: publications.id }).from(publications).where(and(eq(publications.id, publicationId), eq(publications.visibility, "public"))).limit(1);
  return { db, publication };
}

/** List active artifacts or download one artifact belonging to a public publication. */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const publicationId = url.searchParams.get("publicationId");
    const artifactId = url.searchParams.get("artifactId");
    if (!publicationId) return Response.json({ error: "publicationId is required" }, { status: 400 });
    const { db, publication } = await publicPublication(publicationId);
    if (!publication) return Response.json({ error: "Public publication was not found" }, { status: 404 });
    if (!artifactId) {
      const rows = await db.select({ byteSize: artifacts.byteSize, contentType: artifacts.contentType, id: artifacts.id, objectKey: artifacts.objectKey, sha256: artifacts.sha256 }).from(artifacts).where(and(eq(artifacts.publicationId, publication.id), eq(artifacts.archiveStatus, "active")));
      return Response.json({ artifacts: rows.map((artifact) => ({ byteSize: artifact.byteSize, contentType: artifact.contentType, downloadUrl: `/api/v1/artifacts?publicationId=${encodeURIComponent(publication.id)}&artifactId=${encodeURIComponent(artifact.id)}`, id: artifact.id, name: fileName(artifact.objectKey), sha256: artifact.sha256 })), publicationId: publication.id });
    }
    const [artifact] = await db.select({ byteSize: artifacts.byteSize, contentType: artifacts.contentType, objectKey: artifacts.objectKey }).from(artifacts).where(and(eq(artifacts.id, artifactId), eq(artifacts.publicationId, publication.id), eq(artifacts.archiveStatus, "active"))).limit(1);
    if (!artifact) return Response.json({ error: "Active artifact was not found" }, { status: 404 });
    const object = await (await getMediaStore()).get(artifact.objectKey);
    if (!object) return Response.json({ error: "Artifact object was not found" }, { status: 404 });
    return new Response(object.body, { headers: { "cache-control": "public, max-age=3600", "content-disposition": `attachment; filename="${fileName(artifact.objectKey)}"`, "content-length": String(artifact.byteSize), "content-type": artifact.contentType || object.httpMetadata?.contentType || "application/octet-stream", "x-content-type-options": "nosniff" } });
  } catch (error) {
    console.error("Artifact read failed", { message: error instanceof Error ? error.message : "Unknown error" });
    return Response.json({ error: "Unable to read artifact" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const identity = await getPlatformIdentity();
    if (!identity) return signInRequired();
    if (requestExceedsArtifactLimit(request)) return Response.json({ error: "This request is too large for direct artifact processing" }, { status: 413 });
    const formData = await request.formData();
    const publicationId = formData.get("publicationId");
    const file = formData.get("file");
    if (typeof publicationId !== "string" || !publicationId.trim()) {
      return Response.json({ error: "publicationId is required" }, { status: 400 });
    }
    if (!(file instanceof File) || !file.name) {
      return Response.json({ error: "A file is required" }, { status: 400 });
    }
    const validation = await validateArtifactFile(file);
    if (!validation.ok) return Response.json({ error: validation.error }, { status: validation.status });

    const db = await getDb();
    const [publication] = await db.select({ id: publications.id }).from(publications).where(and(eq(publications.id, publicationId.trim()), eq(publications.authorId, identity.userId))).limit(1);
    if (!publication) return Response.json({ error: "Publication was not found or is not owned by this account" }, { status: 404 });

    const bytes = await file.arrayBuffer();
    const artifactId = crypto.randomUUID();
    const objectKey = `publications/${publication.id}/${artifactId}/${validation.safeName}`;
    const sha256 = toHex(await crypto.subtle.digest("SHA-256", bytes));
    const [duplicate] = await db.select({ id: artifacts.id }).from(artifacts).where(and(eq(artifacts.publicationId, publication.id), eq(artifacts.sha256, sha256))).limit(1);
    if (duplicate) return Response.json({ error: "This exact artifact has already been attached to the publication" }, { status: 409 });
    await (await getMediaStore()).put(objectKey, bytes, { httpMetadata: { contentType: file.type || "application/octet-stream" } });
    await db.insert(artifacts).values({
      archiveStatus: "active",
      byteSize: file.size,
      contentType: file.type || "application/octet-stream",
      id: artifactId,
      objectKey,
      publicationId: publication.id,
      sha256,
    });

    return Response.json({ artifact: { byteSize: file.size, id: artifactId, name: file.name, sha256 } }, { status: 201 });
  } catch (error) {
    console.error("Artifact upload failed", { message: error instanceof Error ? error.message : "Unknown error" });
    return Response.json({ error: "Unable to upload artifact" }, { status: 500 });
  }
}
