# Architecture

A React and TypeScript learning client organized around challenges, governed Hero Books missions, guided planning, and reviewable learner actions.

## Data flow

```text
AlgoQuest mission -> MV3 Builder artifact -> broker admission -> Colab evidence -> AlgoQuest progression decision
```

AlgoQuest remains the canonical mission and progression owner. The Chromium extension transports typed evidence without reading the Colab DOM. Narrative rewards, learning evidence, execution receipts, and ephemeral observations remain separate records.

## Provenance

Record the repository commit, configuration, input identifiers, execution command, output location, and validation result. A screenshot alone is not a reproducible artifact.

## Failure behavior

Missing configuration, unavailable dependencies, invalid input, and failed tests must remain visible. The tool must not replace a failure with invented success.
