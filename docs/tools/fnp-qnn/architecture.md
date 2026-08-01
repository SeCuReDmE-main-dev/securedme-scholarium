# Architecture

A Python simulator core feeds CLI, TUI, API, and optional containerized services while retaining an inspectable event trail.

## Data flow

```text
Reviewed input -> typed boundary -> tool mechanism -> reviewable artifact -> human decision
```

## Provenance

Record the repository commit, configuration, input identifiers, execution command, output location, and validation result. A screenshot alone is not a reproducible artifact.

## Failure behavior

Missing configuration, unavailable dependencies, invalid input, and failed tests must remain visible. The tool must not replace a failure with invented success.
