# Interfaces

- **React Hero Books interface:** owns the current mission, prompt assignment, learner-visible state, and progression decision.
- **MV3 content bridge:** publishes `MissionEnvelope.v2` and admits bound Builder and Colab receipts; it does not use `BroadcastChannel` or scrape Colab.
- **Teacher planning surface:** receives bounded planning projections rather than raw learner evidence.
- **Vite development server:** local browser runtime used by the documented tests.

## Interface contract

Inputs must be explicit, outputs must be inspectable, errors must be returned as errors, and consequential external actions require human approval.

Receipt admission recomputes canonical digests and rejects stale missions, wrong run or artifact bindings, secret-like fields, identity data, failed tests, and malformed broker attestations.

## Compatibility

Treat undocumented endpoints, commands, and browser controls as unsupported. Confirm the current repository version before integrating another system.
