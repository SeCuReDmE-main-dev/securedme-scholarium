/** Publication formats supported by the scholarly record. Media formats remain metadata-first until the Stream handoff is connected. */
export const publicationTypeOptions = [
  { value: "research_article", label: "Research article" },
  { value: "report", label: "Report" },
  { value: "synthesis", label: "Synthesis" },
  { value: "white_paper", label: "White paper" },
  { value: "full_book", label: "Full book" },
  { value: "presentation", label: "Presentation" },
  { value: "dataset", label: "Dataset" },
  { value: "school_project", label: "School project" },
  { value: "software_project", label: "Software project" },
  { value: "git_tree", label: "Git tree" },
  { value: "video", label: "Video record (media handoff pending)" },
  { value: "short_video", label: "Short explainer (media handoff pending)" },
  { value: "live_replay", label: "Live / replay record (media handoff pending)" },
  { value: "teaching_artifact", label: "Teaching artifact" },
  { value: "project_update", label: "Project update" },
  { value: "growth_story", label: "Growth story" },
] as const;

export type PublicationType = (typeof publicationTypeOptions)[number]["value"];
export const publicationTypes = new Set<string>(publicationTypeOptions.map((option) => option.value));

export function publicationTypeForFormalization(kind: string) {
  const mapping: Record<string, PublicationType> = {
    book_chapter: "full_book",
    life_science_protocol: "research_article",
    mizar_proof: "research_article",
    project_brief: "school_project",
    research_article: "research_article",
    presentation: "presentation",
    short_video: "short_video",
    white_paper: "white_paper",
  };
  return mapping[kind] ?? "research_article";
}
