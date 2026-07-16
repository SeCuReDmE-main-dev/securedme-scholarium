# Scholarium Teach Assistant and Strength Contract

Status: implemented on synthetic education data. This contract supplies
traceable support to learners and authorized educators; it does not create an
autonomous pedagogical, clinical, disciplinary or administrative authority.

## Assistant boundaries

| Surface | May read | Must never receive |
| --- | --- | --- |
| Learner assistant | Its owner's private graph, weekly objectives and intervention preferences | Another person's graph or identity credentials |
| Teacher assistant | Course-authorized pedagogical summaries for learners with active learning consent | Raw answers, raw graph records, private notes or diagnostic labels |
| Administrative assistant | Organization-authorized aggregates for cohorts of at least 10 | Learner identifiers, small-cohort metrics or individual recommendations |

The learner graph is stored in `teach_assistant_graph_records` and is always
`private_owner_only`. Teacher and administrative views are reconstructed from
allowed product records. They never query or copy this table.

## Assistant exchange protocol

`scholarium.assistant-exchange.v1` requires:

- sender and recipient assistants with opposite learner/teacher roles;
- active enrollment in the same course;
- an active learner `sharing` consent receipt;
- one of `progress_review`, `intervention_planning` or `weekly_alignment`;
- an idempotency key unique for the sender;
- expiry in the next seven days;
- a server-built projection with no raw graph and no raw answer;
- an explicit receipt when the recipient reads the exchange.

Teacher recommendations are bounded to 600 characters. Narrow diagnostic,
fixed-label, insulting, automatic-flattery and forced-positivity patterns are
rejected before persistence. This validation is a product boundary, not a
claim that all harmful language can be detected automatically.

## Objectives and interventions

Weekly objectives use `scholarium.weekly-objective.v1`, identify the real
school year, and keep a target inside a two-week execution window. A supplied
objective identifier can update only a record owned by the current learner.

Intervention preferences use
`scholarium.intervention-preferences.v1`. Frequency, allowed contexts, quiet
mode, quiet-until and a maximum of three daily interventions are explicit. An
`off` frequency always means zero interventions. Silence is valid and never
penalized; hidden monitoring is false.

## Strength mirror

Declared, observed and proposed observations preserve evidence,
contradiction, confidence, source, creation time, expiry and learner
correction. A learner-declared strength may be active immediately. Observed or
proposed interpretations remain `pending_student_review` and expire by default
after 90 days.

The learner can accept, reformulate, contest, expire or delete an
interpretation. Reformulation requires both a replacement statement and a
learner correction. No observation is a diagnosis or fixed intelligence
label.

The math-to-soccer bridge is an experiment:

1. Acknowledge the mathematical difficulty without reducing the learner to a
   grade.
2. Observe documented spatial, timing or conditional-decision evidence from
   soccer.
3. Offer angles, trajectories, sequences or spatial representation as a
   candidate strategy.
4. Test the strategy on one learning task.
5. Let the learner accept, correct or reject the bridge.

Sport success does not prove mathematics mastery.

## Synthia classification result

The live Synthia CLI classified the G8 term set under the `education` domain.
No existing education terms matched, so no autonomous lexicon claim was
promoted. Synthia preserved the uncertainty chain
`I -> I_system^S -> H_lex -> G_lex -> I_lexicon`; the product therefore keeps
the new terms as explicit versioned contracts pending a later sourced lexicon
admission process.

## Deletion and export

Account export includes the owner's graph, objectives, preferences and bounded
exchange records while omitting sender and recipient user identifiers. Teach
domain deletion removes exchanges in either direction before deleting owned
courses, then removes graph records, objectives and preferences. Base
Scholarium identity remains outside the Teach deletion boundary.
