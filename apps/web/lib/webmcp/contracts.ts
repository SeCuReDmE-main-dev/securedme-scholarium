export const WEBMCP_SCHEMA = "securedme.webmcp.v1" as const;
export const HERO_BOOK_PANEL_SCHEMA = "HeroBookPanelState.v1" as const;

export type ToolMode = "READ" | "STAGE" | "EXECUTE";

export type HeroBookPanelState = {
  schema: typeof HERO_BOOK_PANEL_SCHEMA;
  revision: number;
  heroBook: { id: string; adaptation?: string; audience?: string; language?: string };
  hero: { id?: string; displayName?: string; role?: string; narrativeLevel?: string };
  mission: { id: string; title?: string; promptRef?: string; step?: "Mission" | "Build" | "Check" | "Colab" | "Return" | "Reflect" };
  characterSheet?: { talents?: string[]; capabilities?: string[]; declaredPreferences?: string[] };
  inventory?: Array<{ id: string; label?: string; kind: "tool" | "equipment" | "symbolic-weapon"; state?: "available" | "equipped" | "locked" | "consumed"; provenanceRef?: string }>;
  deterministicDie?: { seedRef?: string; counter?: number; lastResult?: number; lastReceiptRef?: string };
  decisions?: Array<{ id: string; choiceRef?: string; consequenceRef?: string; evidenceRef?: string }>;
  storyPoints?: number;
  pedagogicalEvidence?: Array<{ id: string; kind?: string; status?: string }>;
  knowledge?: { tokenCount?: number; milestoneRefs?: string[]; receiptRefs?: string[] };
  specialist?: { slug?: string; returnChannel?: string };
};

export type SanitizedHeroBookProjection = {
  schema: typeof HERO_BOOK_PANEL_SCHEMA;
  revision: number;
  heroBook: { id: string; adaptation: string | null; audience: string | null; language: string | null };
  hero: { role: string | null; narrativeLevel: string | null };
  mission: { id: string; title: string | null; promptRef: string | null; step: string | null };
  talents: string[];
  inventory: Array<{ id: string; kind: "tool" | "equipment" | "symbolic-weapon"; state: string | null }>;
  deterministicDie: { counter: number; lastResult: number | null; lastReceiptRef: string | null } | null;
  decisions: Array<{ id: string; choiceRef: string | null; consequenceRef: string | null; evidenceRef: string | null }>;
  storyPoints: number;
  pedagogicalEvidence: Array<{ id: string; kind: string | null; status: string | null }>;
  knowledge: { tokenCount: number; milestoneRefs: string[]; receiptRefs: string[] };
  specialist: { slug: string | null; returnChannel: string | null } | null;
  canonicalStateOwner: "algoquest";
};

const SECRET_KEY = /(token|secret|password|cookie|authorization|raw(prompt|answer|audio|identity)|email|displayname)/iu;

function boundedText(value: unknown, maximum = 240) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function boundedList(value: unknown, maximum = 32) {
  return Array.isArray(value) ? value.map((item) => boundedText(item, 160)).filter(Boolean).slice(0, maximum) : [];
}

export function containsForbiddenField(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsForbiddenField);
  return Object.entries(value as Record<string, unknown>).some(([key, nested]) => SECRET_KEY.test(key) || containsForbiddenField(nested));
}

export function sanitizeHeroBookState(value: unknown): SanitizedHeroBookProjection | null {
  if (!value || typeof value !== "object") return null;
  const state = value as Partial<HeroBookPanelState>;
  if (state.schema !== HERO_BOOK_PANEL_SCHEMA || !state.heroBook || !state.mission) return null;
  const heroBookId = boundedText(state.heroBook.id, 96);
  const missionId = boundedText(state.mission.id, 160);
  const revision = Number(state.revision);
  if (!heroBookId || !missionId || !Number.isInteger(revision) || revision < 0) return null;
  const inventory = Array.isArray(state.inventory) ? state.inventory.slice(0, 64).flatMap((item) => {
    const id = boundedText(item?.id, 160);
    if (!id || !["tool", "equipment", "symbolic-weapon"].includes(item?.kind)) return [];
    return [{ id, kind: item.kind, state: item.state ?? null }];
  }) : [];
  return {
    schema: HERO_BOOK_PANEL_SCHEMA,
    revision,
    heroBook: { id: heroBookId, adaptation: boundedText(state.heroBook.adaptation, 120) || null, audience: boundedText(state.heroBook.audience, 64) || null, language: boundedText(state.heroBook.language, 32) || null },
    hero: { role: boundedText(state.hero?.role, 80) || null, narrativeLevel: boundedText(state.hero?.narrativeLevel, 80) || null },
    mission: { id: missionId, title: boundedText(state.mission.title, 240) || null, promptRef: boundedText(state.mission.promptRef, 240) || null, step: boundedText(state.mission.step, 32) || null },
    talents: boundedList(state.characterSheet?.talents, 32),
    inventory,
    deterministicDie: state.deterministicDie ? { counter: Math.max(0, Number(state.deterministicDie.counter) || 0), lastResult: Number.isInteger(state.deterministicDie.lastResult) ? state.deterministicDie.lastResult! : null, lastReceiptRef: boundedText(state.deterministicDie.lastReceiptRef, 240) || null } : null,
    decisions: Array.isArray(state.decisions) ? state.decisions.slice(-32).flatMap((decision) => {
      const id = boundedText(decision?.id, 160);
      return id ? [{ id, choiceRef: boundedText(decision.choiceRef, 240) || null, consequenceRef: boundedText(decision.consequenceRef, 240) || null, evidenceRef: boundedText(decision.evidenceRef, 240) || null }] : [];
    }) : [],
    storyPoints: Math.max(0, Number(state.storyPoints) || 0),
    pedagogicalEvidence: Array.isArray(state.pedagogicalEvidence) ? state.pedagogicalEvidence.slice(-32).flatMap((evidence) => {
      const id = boundedText(evidence?.id, 160);
      return id ? [{ id, kind: boundedText(evidence.kind, 64) || null, status: boundedText(evidence.status, 64) || null }] : [];
    }) : [],
    knowledge: { tokenCount: Math.max(0, Number(state.knowledge?.tokenCount) || 0), milestoneRefs: boundedList(state.knowledge?.milestoneRefs, 32), receiptRefs: boundedList(state.knowledge?.receiptRefs, 32) },
    specialist: state.specialist ? { slug: boundedText(state.specialist.slug, 64) || null, returnChannel: boundedText(state.specialist.returnChannel, 160) || null } : null,
    canonicalStateOwner: "algoquest",
  };
}

export function safeTrace(tool: string, mode: ToolMode, status: string) {
  return { schema: WEBMCP_SCHEMA, tool, mode, status, contentCaptured: false, secretsCaptured: false };
}
