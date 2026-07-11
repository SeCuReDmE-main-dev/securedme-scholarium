/**
 * A transparent, bounded feed heuristic inspired by user-controlled
 * recommendation patterns. It is not a truth detector and never decides
 * whether a publication is scientifically correct; safety and review remain
 * separate human/platform processes.
 */
export type FeedClassification = "education" | "media" | "project" | "research";
export type FeedCandidate = {
  abstract: string;
  classification: FeedClassification;
  createdAt: string;
  id: string;
  reactions: number;
  title: string;
  topicSlugs: string[];
  type: string;
  verificationStatus: string;
};
export type FeedPreferences = {
  diversityWeight: number;
  favoriteIds: Set<string>;
  followedTopicSlugs: Set<string>;
  lessLikeIds: Set<string>;
  query: string;
  reactedIds: Set<string>;
  freshnessWeight: number;
  relevanceWeight: number;
};
export type PlithogenicVector = { falsity: number; indeterminacy: number; truth: number };
export type RankedCandidate = FeedCandidate & { score: number; vector: PlithogenicVector; why: string[] };

export function classifyPublication(type: string): FeedClassification {
  if (["video", "short_video", "live_replay"].includes(type)) return "media";
  if (["school_project", "software_project", "git_tree", "project_update"].includes(type)) return "project";
  if (["presentation", "teaching_artifact"].includes(type)) return "education";
  return "research";
}

function clamp(value: number) { return Math.max(0, Math.min(1, value)); }
function normalizedWeight(value: number) { return clamp(value / 100); }

function textRelevance(candidate: FeedCandidate, query: string) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return 0.45;
  const text = `${candidate.title} ${candidate.abstract} ${candidate.topicSlugs.join(" ")}`.toLowerCase();
  return terms.filter((term) => text.includes(term)).length / terms.length;
}

function freshness(createdAt: string) {
  const ageDays = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 86_400_000);
  return Math.exp(-ageDays / 30);
}

/** A T/I/F vector expresses evidence confidence, not factual truth. */
export function plithogenicVector(candidate: FeedCandidate, preferences: FeedPreferences): PlithogenicVector {
  const topicAffinity = candidate.topicSlugs.some((slug) => preferences.followedTopicSlugs.has(slug)) ? 1 : 0;
  const explicitAffinity = preferences.favoriteIds.has(candidate.id) ? 1 : preferences.reactedIds.has(candidate.id) ? 0.65 : 0;
  const evidence = candidate.verificationStatus === "verified" ? 1 : candidate.verificationStatus === "processing" ? 0.55 : 0.25;
  const relevance = textRelevance(candidate, preferences.query);
  const engagement = clamp(Math.log1p(candidate.reactions) / Math.log(51));
  const truth = clamp(relevance * 0.38 + topicAffinity * 0.20 + explicitAffinity * 0.16 + evidence * 0.20 + engagement * 0.06);
  const indeterminacy = clamp((candidate.verificationStatus === "verified" ? 0.05 : 0.34) + (candidate.topicSlugs.length ? 0 : 0.18));
  const falsity = preferences.lessLikeIds.has(candidate.id) ? 1 : 0;
  return { falsity, indeterminacy, truth };
}

export function scoreCandidate(candidate: FeedCandidate, preferences: FeedPreferences): RankedCandidate {
  const vector = plithogenicVector(candidate, preferences);
  const freshnessScore = freshness(candidate.createdAt);
  const relevanceWeight = normalizedWeight(preferences.relevanceWeight);
  const freshnessWeight = normalizedWeight(preferences.freshnessWeight);
  // Explicit negative feedback is a strong personal suppression, not a content verdict.
  const score = clamp(vector.truth * (0.45 + relevanceWeight * 0.30) + freshnessScore * (0.12 + freshnessWeight * 0.18) - vector.indeterminacy * 0.20 - vector.falsity * 0.95);
  const why = [
    ...(preferences.favoriteIds.has(candidate.id) ? ["saved as a favorite"] : []),
    ...(preferences.reactedIds.has(candidate.id) ? ["you reacted to this work"] : []),
    ...(candidate.topicSlugs.some((slug) => preferences.followedTopicSlugs.has(slug)) ? ["matches a hashtag you follow"] : []),
    ...(candidate.verificationStatus === "verified" ? ["has a verified provenance state"] : candidate.verificationStatus === "processing" ? ["is awaiting verification"] : []),
    ...(freshnessScore > 0.7 ? ["recently published"] : []),
  ];
  return { ...candidate, score, vector, why: why.length ? why : ["shown to preserve a diverse public research feed"] };
}

/**
 * Diversifies only among already eligible candidates. It never suppresses an
 * author for payment, identity, popularity, or a protected characteristic.
 */
export function rankPlithogenicFeed(candidates: FeedCandidate[], preferences: FeedPreferences) {
  const diversityWeight = normalizedWeight(preferences.diversityWeight);
  const ordered = candidates.map((candidate) => scoreCandidate(candidate, preferences)).sort((left, right) => right.score - left.score);
  const classificationCounts = new Map<FeedClassification, number>();
  return ordered.map((candidate) => {
    const prior = classificationCounts.get(candidate.classification) ?? 0;
    classificationCounts.set(candidate.classification, prior + 1);
    const diversityPenalty = Math.min(0.22, prior * 0.055 * diversityWeight);
    return { ...candidate, score: clamp(candidate.score - diversityPenalty), why: prior > 0 && diversityWeight > 0 ? [...candidate.why, "diversity is preserving multiple work formats"] : candidate.why };
  }).sort((left, right) => right.score - left.score);
}
