export type SearchablePublication = {
  abstract: string;
  author: string;
  createdAt: string;
  id: string;
  status: string;
  title: string;
  topics: Array<{ label: string; slug: string }>;
  type: string;
};

export type SearchMatch = SearchablePublication & { reasons: string[]; score: number };

function terms(query: string) {
  return [...new Set(query.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}-]*/gu) ?? [])].slice(0, 12);
}

/**
 * A deterministic lexical baseline for the pre-alpha public corpus. It is
 * not personalised and never consumes payments, reactions, favourites, or
 * opaque behavioural signals. PostgreSQL FTS/vector search remains the scale
 * upgrade path once the corpus exceeds this bounded initial window.
 */
export function searchPublications(documents: SearchablePublication[], query: string): SearchMatch[] {
  const queryTerms = terms(query);
  const phrase = query.trim().toLowerCase();
  if (queryTerms.length === 0) return [];

  return documents.map((document) => {
    const title = document.title.toLowerCase();
    const author = document.author.toLowerCase();
    const abstract = document.abstract.toLowerCase();
    const type = document.type.replaceAll("_", " ").toLowerCase();
    const topicText = document.topics.map((topic) => `${topic.label} ${topic.slug.replaceAll("-", " ")}`).join(" ").toLowerCase();
    const reasons = new Set<string>();
    let score = 0;
    if (title.includes(phrase)) { score += 12; reasons.add("exact title phrase"); }
    if (topicText.includes(phrase)) { score += 9; reasons.add("exact topic phrase"); }
    for (const term of queryTerms) {
      if (title.includes(term)) { score += 5; reasons.add("title term"); }
      if (topicText.includes(term)) { score += 4; reasons.add("topic term"); }
      if (author.includes(term)) { score += 3; reasons.add("author term"); }
      if (type.includes(term)) { score += 2; reasons.add("format term"); }
      if (abstract.includes(term)) { score += 1; reasons.add("abstract term"); }
    }
    return { ...document, reasons: [...reasons], score };
  }).filter((document) => document.score > 0).sort((left, right) => right.score - left.score || right.createdAt.localeCompare(left.createdAt) || left.title.localeCompare(right.title));
}
