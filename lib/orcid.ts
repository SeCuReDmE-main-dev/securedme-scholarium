export type OrcidIdentifier = { canonicalUrl: string; identifier: string };

/** Validate the ISO 7064 MOD 11-2 check digit used by a 16-character ORCID iD. */
export function canonicalOrcid(value: unknown): OrcidIdentifier | null {
  if (typeof value !== "string" || value.length > 200) return null;
  const compact = value.trim().replace(/^https:\/\/(?:www\.)?orcid\.org\//iu, "").replaceAll("-", "").toUpperCase();
  if (!/^\d{15}[\dX]$/u.test(compact)) return null;
  let total = 0;
  for (const digit of compact.slice(0, 15)) total = (total + Number(digit)) * 2;
  const expected = (12 - (total % 11)) % 11;
  const checkDigit = expected === 10 ? "X" : String(expected);
  if (compact.at(-1) !== checkDigit) return null;
  const identifier = `${compact.slice(0, 4)}-${compact.slice(4, 8)}-${compact.slice(8, 12)}-${compact.slice(12)}`;
  return { canonicalUrl: `https://orcid.org/${identifier}`, identifier };
}
