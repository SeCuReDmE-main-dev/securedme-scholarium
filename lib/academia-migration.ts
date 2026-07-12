import { normalizedTopicSlugs } from "./topics";
import { publicationTypes } from "./publication-types";

export type AcademiaImportItem = {
  abstract: string;
  sourceUrl: string;
  title: string;
  topicSlugs: string[];
  type: string;
};

function requiredString(value: unknown, field: string, maximum: number) {
  if (typeof value !== "string") throw new Error(`${field} is required`);
  const text = value.trim();
  if (!text || text.length > maximum) throw new Error(`${field} must be between 1 and ${maximum} characters`);
  return text;
}

function academiaUrl(value: unknown, field: string) {
  const text = requiredString(value, field, 2048);
  let url: URL;
  try { url = new URL(text); } catch { throw new Error(`${field} must be a valid Academia.edu URL`); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || (host !== "academia.edu" && !host.endsWith(".academia.edu"))) {
    throw new Error(`${field} must use https://*.academia.edu`);
  }
  url.hash = "";
  url.search = "";
  return url.toString().replace(/\/$/u, "");
}

export function academyProfileUrl(value: unknown) {
  return academiaUrl(value, "sourceProfileUrl");
}

export function academiaImportItems(value: unknown): AcademiaImportItem[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 50) throw new Error("items must contain between 1 and 50 publications");
  const seen = new Set<string>();
  return value.map((raw) => {
    if (!raw || typeof raw !== "object") throw new Error("Each import item must be an object");
    const item = raw as Record<string, unknown>;
    const sourceUrl = academiaUrl(item.sourceUrl, "item.sourceUrl");
    if (seen.has(sourceUrl)) throw new Error("Each imported source URL must be unique");
    seen.add(sourceUrl);
    const title = requiredString(item.title, "item.title", 240);
    const abstract = typeof item.abstract === "string" ? item.abstract.trim().slice(0, 12_000) : "";
    const type = typeof item.type === "string" && publicationTypes.has(item.type) ? item.type : "research_article";
    return { abstract, sourceUrl, title, topicSlugs: normalizedTopicSlugs(item.topicSlugs), type };
  });
}

export function privateOrPublic(value: unknown) {
  return value === "public" ? "public" : "private";
}
