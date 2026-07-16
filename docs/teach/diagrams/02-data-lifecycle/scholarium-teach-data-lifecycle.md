# Scholarium Teach Data Lifecycle

![Data lifecycle from purpose and consent to raw private interaction, observation, algorithmic hypothesis, bounded recommendation, human decision, and correction, alongside private learner, teacher, school, and commission projections.](scholarium-teach-data-lifecycle.svg)

Caption: Figure 2. Facts, observations, hypotheses, recommendations, and human decisions remain distinct while learner controls and aggregate thresholds govern every upward projection.

```dot
digraph ScholariumDataLifecycle {
  graph [rankdir=TB, bgcolor="#F7F8FC", pad="0.25", nodesep="0.45", ranksep="0.55", fontname="Arial"];
  node [shape=box, style="rounded,filled", fontname="Arial", fontsize=11, margin="0.15,0.10", color="#D9E0EF", fillcolor="#FFFFFF", fontcolor="#10172F"];
  edge [color="#63708A", penwidth=1.2, arrowsize=0.7, fontname="Arial", fontsize=9, fontcolor="#44506A"];

  purpose [label="Declared purpose + active consent", fillcolor="#EEF3FF", color="#2157EE"];
  raw [label="Raw learner interaction\nprivate and purpose-bound"];
  observation [label="Observation\nevidence + context + time"];
  inference [label="Algorithmic hypothesis\nconfidence + contradiction + expiry"];
  recommendation [label="Recommendation\ncontestable and bounded"];
  human [label="Human decision\nlearner or authorized educator", fillcolor="#EAF9FF", color="#23B8FF"];
  correction [label="Accept, reformulate, contest,\nexpire, export or delete", fillcolor="#F4F1E8", color="#FFC857"];

  private_graph [label="Private learner graph\nowner only", fillcolor="#F2EEFF", color="#6F42FF"];
  teacher_projection [label="Course-authorized teacher projection\nno raw graph"];
  school_aggregate [label="School aggregate\ncohort threshold enforced"];
  commission_aggregate [label="Commission aggregate\nanti-reconstruction checks"];

  purpose -> raw [label="admit"];
  raw -> observation;
  observation -> inference;
  inference -> recommendation;
  recommendation -> human;
  human -> correction;
  correction -> observation [label="corrects provenance"];

  observation -> private_graph;
  private_graph -> teacher_projection [label="active sharing consent"];
  teacher_projection -> school_aggregate [label="aggregate only"];
  school_aggregate -> commission_aggregate [label="aggregate only"];
  correction -> private_graph [label="lifecycle control"];
}
```
