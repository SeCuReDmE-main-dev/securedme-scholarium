# Interfaces

- **Public research commons:** use only through the documented repository route.
- **Teach workspace:** use only through the documented repository route.
- **Publication routes:** use only through the documented repository route.
- **Sphinx documentation aggregator:** use only through the documented repository route.

## Interface contract

Inputs must be explicit, outputs must be inspectable, errors must be returned as errors, and consequential external actions require human approval.

## Compatibility

Treat undocumented endpoints, commands, and browser controls as unsupported. Confirm the current repository version before integrating another system.

## WebMCP interface

The real `/app` page owns a machine-readable `securedme.webmcp.v1` manifest and registers exactly twelve descriptors when the browser provides the experimental WebMCP runtime. Ten descriptors belong to Scholarium; `securedme_companion_context` and `securedme_qbit_plan_handoff` are shared suite contracts.

READ tools inspect public or capability-only projections. STAGE tools prepare reviewable local proposals. The only declared EXECUTE tool is currently `planned` and returns explicit unavailability because the publication service does not yet consume a tool-bound one-use approval and idempotency key.

See [the complete WebMCP contract](../../webmcp/README.md).
