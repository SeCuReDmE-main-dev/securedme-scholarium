import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { artifacts, publications } from "../../../db/schema";
import { getMediaStore } from "../../../lib/media-store";

const acceptedTypes = new Set([
  "application/epub+zip",
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.oasis.opendocument.presentation",
  "application/vnd.oasis.opendocument.spreadsheet",
  "application/vnd.oasis.opendocument.text",
  "application/zip",
]);
const maximumUploadBytes = 25 * 1024 * 1024;

function isAccepted(file: File) {
  return acceptedTypes.has(file.type) || file.type.startsWith("text/") || file.type.startsWith("video/");
}

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const publicationId = formData.get("publicationId");
    const file = formData.get("file");
    if (typeof publicationId !== "string" || !publicationId.trim()) {
      return Response.json({ error: "publicationId is required" }, { status: 400 });
    }
    if (!(file instanceof File) || !file.name) {
      return Response.json({ error: "A file is required" }, { status: 400 });
    }
    if (!isAccepted(file)) {
      return Response.json({ error: "This file type is not accepted" }, { status: 415 });
    }
    if (file.size > maximumUploadBytes) {
      return Response.json({ error: "This upload is too large for direct processing. Use the resumable media path." }, { status: 413 });
    }

    const db = await getDb();
    const [publication] = await db.select({ id: publications.id }).from(publications).where(eq(publications.id, publicationId.trim())).limit(1);
    if (!publication) return Response.json({ error: "Publication was not found" }, { status: 404 });

    const bytes = await file.arrayBuffer();
    const artifactId = crypto.randomUUID();
    const objectKey = `publications/${publication.id}/${artifactId}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const sha256 = toHex(await crypto.subtle.digest("SHA-256", bytes));
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
    return Response.json({ error: error instanceof Error ? error.message : "Unable to upload artifact" }, { status: 500 });
  }
}
