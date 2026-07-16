export const lifeScienceToolCatalog = {
  literature: ["life-science-research:ncbi-pmc-skill", "life-science-research:biorxiv-skill"],
  gene: ["life-science-research:ensembl-skill", "life-science-research:uniprot-skill"],
  variant: ["life-science-research:clinvar-variation-skill", "life-science-research:gnomad-graphql-skill"],
  genetics: ["life-science-research:gwas-catalog-skill", "life-science-research:opentargets-skill"],
  expression: ["life-science-research:gtex-eqtl-skill", "life-science-research:human-protein-atlas-skill", "life-science-research:cellxgene-skill"],
  pathway: ["life-science-research:reactome-skill", "life-science-research:quickgo-skill"],
  interaction: ["life-science-research:string-skill"],
  structure: ["life-science-research:alphafold-skill", "life-science-research:rcsb-pdb-skill"],
  compound: ["life-science-research:chembl-skill", "life-science-research:bindingdb-skill", "life-science-research:pubchem-pug-skill", "life-science-research:chebi-skill"],
  trial: ["life-science-research:clinicaltrials-skill"],
  cancer: ["life-science-research:cbioportal-skill", "life-science-research:civic-skill"],
  dataset: ["life-science-research:biostudies-arrayexpress-skill", "life-science-research:ncbi-datasets-skill"],
} as const;

type LifeScienceLane = keyof typeof lifeScienceToolCatalog;

const laneMatchers: Array<[LifeScienceLane, RegExp]> = [
  ["trial", /\b(clinical trial|essai clinique|nct\d+|recruiting)\b/iu],
  ["cancer", /\b(cancer|tumou?r|oncology|oncologie|somatic)\b/iu],
  ["variant", /\b(variant|mutation|clinvar|gnomad|pathogenic)\b/iu],
  ["genetics", /\b(gwas|genetic association|association genetique|trait|locus)\b/iu],
  ["expression", /\b(expression|single[- ]cell|tissue|tissu|eqtl|transcriptom)\b/iu],
  ["structure", /\b(protein structure|structure proteique|alphafold|pdb|fold)\b/iu],
  ["compound", /\b(compound|molecule|drug|medicament|ligand|binding|bioactivity)\b/iu],
  ["pathway", /\b(pathway|voie biologique|ontology|ontologie|gene ontology|go term)\b/iu],
  ["interaction", /\b(interaction|network|reseau|protein[- ]protein)\b/iu],
  ["dataset", /\b(dataset|jeu de donnees|arrayexpress|biostudies|download sequence)\b/iu],
  ["gene", /\b(gene|gene|protein|proteine|transcript)\b/iu],
  ["literature", /\b(article|paper|publication|literature|litterature|preprint|pmc)\b/iu],
];

function boundedText(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export function routeLifeScienceResearch(input: { question?: unknown; requestedLane?: unknown; educationalPurpose?: unknown }) {
  const question = boundedText(input.question, 2_000);
  const educationalPurpose = boundedText(input.educationalPurpose, 500);
  if (!question || !educationalPurpose) throw new Error("A bounded question and educational purpose are required.");
  const explicitLane = typeof input.requestedLane === "string" && input.requestedLane in lifeScienceToolCatalog
    ? input.requestedLane as LifeScienceLane
    : null;
  const detected = explicitLane ?? laneMatchers.find(([, matcher]) => matcher.test(question))?.[0] ?? "literature";
  const tools = [...lifeScienceToolCatalog[detected]];
  return {
    schema: "scholarium.life-science-route.v1",
    lane: detected,
    question,
    educationalPurpose,
    tools,
    routingPolicy: "smallest_specialized_primary_source_set",
    executionAuthorized: false,
    expectedEvidence: ["query_parameters", "primary_record_identifiers", "source_urls", "retrieval_timestamp", "limitations"],
    handoff: "Execute only the named installed skills, preserve source provenance, then return evidence for human review.",
    boundaries: ["education_only", "no_diagnosis", "no_treatment_decision", "no_autonomous_clinical_authority", "human_review_required"],
  } as const;
}
