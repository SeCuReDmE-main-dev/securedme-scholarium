export type FormalizationKind =
  | "research_article"
  | "white_paper"
  | "book_chapter"
  | "presentation"
  | "project_brief"
  | "short_video"
  | "life_science_protocol"
  | "mizar_proof";

type Section = { id: string; label: string; guidance: string; required: boolean };
type Template = { kind: FormalizationKind; label: string; description: string; sections: Section[]; formalVerification?: boolean; lifeScienceSources?: boolean };

const commonEvidence: Section[] = [
  { id: "sources", label: "Sources and evidence", guidance: "List primary sources, datasets, repository links, or clearly label what is not yet evidenced.", required: true },
  { id: "limits", label: "Limits and next steps", guidance: "State what the work does not establish and what needs review.", required: true },
];

export const quanthorTemplates: Template[] = [
  { kind: "research_article", label: "Research article", description: "A readable scientific argument with methods and limitations.", sections: [{ id: "question", label: "Research question", guidance: "State the question in one testable sentence.", required: true }, { id: "abstract", label: "Abstract", guidance: "Explain the purpose, approach, key observation, and limit without exaggeration.", required: true }, { id: "method", label: "Method", guidance: "Describe inputs, procedure, and reproducibility details.", required: true }, { id: "findings", label: "Findings", guidance: "Separate observations from interpretation.", required: true }, ...commonEvidence] },
  { kind: "white_paper", label: "White paper", description: "A decision-ready explanation of a problem, proposal, evidence, and risks.", sections: [{ id: "problem", label: "Problem", guidance: "Describe who is affected and why the problem matters.", required: true }, { id: "proposal", label: "Proposal", guidance: "Present the approach in plain language before technical detail.", required: true }, { id: "implementation", label: "Implementation", guidance: "Show milestones, ownership, and dependencies.", required: true }, ...commonEvidence] },
  { kind: "book_chapter", label: "Book chapter", description: "A long-form chapter with a clear narrative spine and reusable citations.", sections: [{ id: "opening", label: "Opening idea", guidance: "Give the reader a concrete question, scene, or problem.", required: true }, { id: "argument", label: "Core argument", guidance: "Develop one argument through short, scannable sections.", required: true }, { id: "examples", label: "Examples", guidance: "Use attributed examples that clarify the argument.", required: true }, ...commonEvidence] },
  { kind: "presentation", label: "Presentation", description: "A card-based narrative that turns an idea into an understandable visual sequence.", sections: [{ id: "audience", label: "Audience promise", guidance: "State what the audience will understand or decide.", required: true }, { id: "story", label: "Story arc", guidance: "Use context, tension, evidence, and conclusion as distinct cards.", required: true }, { id: "speaker_notes", label: "Speaker notes", guidance: "Add the explanation that should not live on the slide.", required: false }, ...commonEvidence] },
  { kind: "project_brief", label: "Project brief", description: "A practical project card for a school, community, or open-source initiative.", sections: [{ id: "goal", label: "Goal", guidance: "Describe the intended outcome and audience.", required: true }, { id: "plan", label: "Plan", guidance: "List deliverables, collaborators, and checkpoints.", required: true }, { id: "contribution", label: "Contribution guide", guidance: "Explain how people can help without changing the original project by accident.", required: true }, ...commonEvidence] },
  { kind: "short_video", label: "Short video", description: "A compact, caption-first explanation connected to its sources.", sections: [{ id: "hook", label: "Opening hook", guidance: "State the question or discovery in the first sentence.", required: true }, { id: "script", label: "Script", guidance: "Write a clear spoken explanation with source references.", required: true }, { id: "captions", label: "Captions and accessibility", guidance: "Prepare accurate captions and a transcript before publishing.", required: true }, ...commonEvidence] },
  { kind: "life_science_protocol", label: "Life-science protocol", description: "A source-aware protocol outline. It is not clinical advice or a validated experiment.", lifeScienceSources: true, sections: [{ id: "question", label: "Study question", guidance: "State the scientific question and scope.", required: true }, { id: "materials", label: "Materials and conditions", guidance: "List materials, controls, and conditions precisely.", required: true }, { id: "ethics", label: "Ethics and safety boundary", guidance: "Record approvals, biosafety limits, and exclusions before any work begins.", required: true }, { id: "analysis", label: "Analysis plan", guidance: "Define outcomes and how they will be reviewed.", required: true }, ...commonEvidence] },
  { kind: "mizar_proof", label: "Formal proof", description: "A guided route from a mathematical claim to a Mizar draft and verifier handoff.", formalVerification: true, sections: [{ id: "statement", label: "Exact theorem statement", guidance: "State the claim, variables, domain, and assumptions without ambiguity.", required: true }, { id: "definitions", label: "Definitions and lemmas", guidance: "List every definition or prior result the proof relies on.", required: true }, { id: "proof_plan", label: "Proof plan", guidance: "Explain the human proof steps before producing formal syntax.", required: true }, { id: "mizar", label: "Mizar draft", guidance: "Generate a draft only; submit it to QuaNthoR/Mizar for formal verification.", required: true }, ...commonEvidence] },
];

export function getQuanthorTemplate(kind: string) {
  return quanthorTemplates.find((template) => template.kind === kind) ?? quanthorTemplates[0];
}

export function createFormalizationPreview(input: { kind?: string; text?: string; title?: string }) {
  const template = getQuanthorTemplate(input.kind ?? "research_article");
  const text = String(input.text ?? "").trim();
  const title = String(input.title ?? "").trim();
  const missing = [!title && "a title", !text && "a working description", !/https?:\/\//i.test(text) && "at least one source or evidence reference"].filter(Boolean);
  return {
    kind: template.kind,
    label: template.label,
    status: missing.length ? "needs_input" : "structured_draft",
    sections: template.sections,
    missing,
    publicationGate: "none" as const,
    learningMode: "coach_not_gatekeeper" as const,
    formalVerification: Boolean(template.formalVerification),
    lifeScienceSources: Boolean(template.lifeScienceSources),
    disclaimer: template.formalVerification
      ? "This is a formalization plan, not a verified proof. Verification must happen in QuaNThoR with Mizar."
      : "QuaNthoR structures the work and identifies missing evidence; it never blocks publication. The author remains responsible for accuracy and review.",
  };
}
