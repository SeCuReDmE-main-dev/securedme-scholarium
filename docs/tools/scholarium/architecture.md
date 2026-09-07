# Architecture

A public web application and a separate static documentation pipeline share reviewed suite metadata without sharing private state.

## Data flow

```text
Reviewed input -> typed boundary -> tool mechanism -> reviewable artifact -> human decision
```

## Provenance

Record the repository commit, configuration, input identifiers, execution command, output location, and validation result. A screenshot alone is not a reproducible artifact.

## Failure behavior

Missing configuration, unavailable dependencies, invalid input, and failed tests must remain visible. The tool must not replace a failure with invented success.

## Companion layering

The companion keeps a sanitized persistent Hero Book projection separate from the temporary Scholarium specialist surface. AlgoQuest remains the canonical progression owner. Scholarium can inspect context and stage a pointer-only return; it cannot consume a prompt, admit evidence, award a Knowledge Token, or advance a milestone.

The browser bridge reads the canonical manifest, registers descriptors only when `document.modelContext` exists, and delegates to bounded same-origin handlers. The shared MV3 side panel derives forms from those schemas and applies a per-product theme without changing its information architecture.
