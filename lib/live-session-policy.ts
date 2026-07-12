const liveAudienceModes = new Set(["public_review", "classroom", "private_rehearsal"]);
const liveModeratorPlans = new Set(["author_moderated", "teacher_moderated", "organization_moderated"]);

export const liveSessionPolicy = {
  stores: ["title", "agenda", "schedule", "audience mode", "moderator plan", "replay consent"],
  excludes: ["stream key", "raw chat transcript", "viewer identity list", "provider credential", "biometric signal"],
  youthDefault: "restricted_until_consent",
  replayDefault: "off_until_author_consent",
  moderation: "Questions are moderated before public display; minors require guardian or verified school consent before joining a public Live.",
  launchBoundary: "This is a planning contract. RTMPS/SRT keys, real-time chat, polls, recording, and replay publication remain separate launch-gated services.",
} as const;

export function normalizeLiveTitle(value: unknown) {
  const title = String(value ?? "").trim().slice(0, 180);
  return title.length >= 6 ? title : null;
}

export function normalizeLiveAgenda(value: unknown) {
  return String(value ?? "").trim().slice(0, 4_000);
}

export function normalizeLiveSchedule(value: unknown) {
  if (typeof value !== "string") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export function normalizeLiveAudienceMode(value: unknown) {
  return typeof value === "string" && liveAudienceModes.has(value) ? value : "public_review";
}

export function normalizeLiveModeratorPlan(value: unknown) {
  return typeof value === "string" && liveModeratorPlans.has(value) ? value : "author_moderated";
}

export function normalizeReplayConsent(value: unknown) {
  return value === true;
}
