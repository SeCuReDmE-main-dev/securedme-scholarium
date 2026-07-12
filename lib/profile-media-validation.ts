const imageRules = {
  avatar: { maximumBytes: 3 * 1024 * 1024, label: "profile picture" },
  banner: { maximumBytes: 6 * 1024 * 1024, label: "profile banner" },
} as const;

export type ProfileMediaKind = keyof typeof imageRules;
type ProfileImageFormat = { contentType: "image/jpeg" | "image/png" | "image/webp"; extension: "jpg" | "png" | "webp" };
export type ProfileMediaValidation = (ProfileImageFormat & { ok: true }) | { error: string; ok: false; status: 400 | 413 | 415 };

function isKind(value: string | null): value is ProfileMediaKind {
  return value === "avatar" || value === "banner";
}

function startsWith(bytes: Uint8Array, sequence: number[]) {
  return sequence.every((value, index) => bytes[index] === value);
}

function imageFormat(bytes: Uint8Array): ProfileImageFormat | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { contentType: "image/png", extension: "png" };
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return { contentType: "image/jpeg", extension: "jpg" };
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return { contentType: "image/webp", extension: "webp" };
  return null;
}

/** Images are deliberately raster-only: SVG can execute active content and is not accepted for profile media. */
export async function validateProfileMedia(kind: string | null, file: FormDataEntryValue | null): Promise<ProfileMediaValidation & { kind?: ProfileMediaKind }> {
  if (!isKind(kind)) return { error: "A valid profile media kind is required", ok: false, status: 400 };
  if (!(file instanceof File) || !file.name || file.size === 0) return { error: `A ${imageRules[kind].label} file is required`, ok: false, status: 400 };
  if (file.size > imageRules[kind].maximumBytes) return { error: `This ${imageRules[kind].label} is too large`, ok: false, status: 413 };
  const format = imageFormat(new Uint8Array(await file.slice(0, 16).arrayBuffer()));
  if (!format || file.type !== format.contentType) return { error: "Only valid PNG, JPEG, and WebP images are accepted", ok: false, status: 415 };
  return { ...format, kind, ok: true };
}
