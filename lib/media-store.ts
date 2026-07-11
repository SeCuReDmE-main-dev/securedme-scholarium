type MediaBinding = {
  put(key: string, value: ArrayBuffer | ReadableStream, options?: { httpMetadata?: { contentType?: string } }): Promise<unknown>;
};

export async function getMediaStore() {
  const { env } = await import("cloudflare:workers");
  const media = env.MEDIA as MediaBinding | undefined;
  if (!media) {
    throw new Error("Cloudflare R2 binding `MEDIA` is unavailable. Configure the `r2` field in .openai/hosting.json before uploading artifacts.");
  }
  return media;
}
