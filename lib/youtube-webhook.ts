const encoder = new TextEncoder();

export type YouTubeAtomEvent = { channelId: string; videoId: string };

export function youtubeTopicChannelId(topic: string | null) {
  if (!topic) return null;
  try {
    const url = new URL(topic);
    const channelId = url.searchParams.get("channel_id");
    return url.protocol === "https:" && url.hostname === "www.youtube.com" && url.pathname === "/feeds/videos.xml" && channelId && /^UC[a-zA-Z0-9_-]{20,}$/u.test(channelId) ? channelId : null;
  } catch {
    return null;
  }
}

/** Atom feeds are verified before extraction; only identifiers are retained. */
export function youtubeAtomEvent(atom: string): YouTubeAtomEvent | null {
  const videoId = atom.match(/<yt:videoId>\s*([^<\s]+)\s*<\/yt:videoId>/u)?.[1] ?? null;
  const channelId = atom.match(/<yt:channelId>\s*([^<\s]+)\s*<\/yt:channelId>/u)?.[1] ?? null;
  return videoId && channelId && /^[\w-]{6,128}$/u.test(videoId) && /^UC[a-zA-Z0-9_-]{20,}$/u.test(channelId) ? { channelId, videoId } : null;
}

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (value) => value.toString(16).padStart(2, "0")).join("");
}

function constantTimeEquals(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

export async function validYouTubeWebhookSignature(body: string, signature: string | null, secret: string) {
  if (!signature?.startsWith("sha1=") || !secret) return false;
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { hash: "SHA-1", name: "HMAC" }, false, ["sign"]);
  const expected = `sha1=${hex(await crypto.subtle.sign("HMAC", key, encoder.encode(body)))}`;
  return constantTimeEquals(expected, signature);
}

export async function sha256Hex(value: string) {
  return hex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}
