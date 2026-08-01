# Architecture

Local Python modules transform explicit source records into reproducible comparison artifacts.

## Data flow

```text
Reviewed input -> typed boundary -> tool mechanism -> reviewable artifact -> human decision
```

## Provenance

Record the repository commit, configuration, input identifiers, execution command, output location, and validation result. A screenshot alone is not a reproducible artifact.

## Failure behavior

Missing configuration, unavailable dependencies, invalid input, and failed tests must remain visible. The tool must not replace a failure with invented success.
