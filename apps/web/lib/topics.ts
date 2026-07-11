export function normalizeTopicSlug(value: unknown) {
  if (typeof value !== "string") return null;
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug.length >= 2 && slug.length <= 48 ? slug : null;
}

export function normalizedTopicSlugs(value: unknown) {
  if (!Array.isArray(value)) return [];
  const slugs = value.map(normalizeTopicSlug).filter((slug): slug is string => Boolean(slug));
  return [...new Set(slugs)].slice(0, 8);
}

export function topicLabel(slug: string) {
  return slug.split("-").map((part) => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}
