import { and, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { artifacts, publications } from "../../../db/schema";
import { requestExceedsArtifactLimit, validateArtifactFile } from "../../../lib/artifact-validation";
import { getMediaStore } from "../../../lib/media-store";
import { getPlatformIdentity, signInRequired } from "../../../lib/platform-identity";

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
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
