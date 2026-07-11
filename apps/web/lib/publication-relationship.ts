const relationshipTypes = new Set(["derived_from", "translation_of", "version_of", "imports_record_from", "cites"]);

function optionalText(value: unknown, maximum: number) { return typeof value === "string" && value.trim() ? value.trim().slice(0, maximum) : null; }

export function publicationRelationshipInput(input: Record<string, unknown>) {
  const relationType = typeof input.relationType === "string" && relationshipTypes.has(input.relationType) ? input.relationType : null;
  if (!relationType) throw new Error("A supported source relationship is required");
  if (typeof input.sourceUrl !== "string" || input.sourceUrl.length > 2_048) throw new Error("A source URL is required");
  let url: URL; try { url = new URL(input.sourceUrl); } catch { throw new Error("A valid source URL is required"); }
  if (url.protocol !== "https:") throw new Error("Source URLs must use HTTPS");
  url.hash = "";
  const declaration = optionalText(input.declaration, 1_200) ?? "The author declares this relationship and remains responsible for attribution and licensing.";
  return { declaration, relationType, sourceLicense: optionalText(input.sourceLicense, 160), sourceTitle: optionalText(input.sourceTitle, 240), sourceUrl: url.toString() };
}
