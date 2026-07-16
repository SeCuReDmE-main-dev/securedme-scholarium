# Scholarium Teach risk register

| Risk | Severity | Engineering response | Promotion gate |
| --- | --- | --- | --- |
| A learner is reduced to a fixed intelligence label | Critical | contestable observations with evidence, contradiction, expiry, and deletion | tests reject diagnostic or fixed-label output |
| Teacher summary reveals private raw content | Critical | bounded schemas and purpose receipts | cross-role disclosure tests |
| Aggregate metrics re-identify a learner | Critical | cohort thresholds and anti-reconstruction tests | privacy benchmark passes |
| Plugin code changes after approval | Critical | digest and manifest validation before invocation | pluginpack 41/41 and fail-closed test |
| Geometry is mistaken for cryptographic strength | High | standard cryptography remains independent | threat model and claim audit |
| Transitional receipt signer stores keys locally or fails open | Critical | private Bouncy Castle adapter accepts externally injected keys only; unsigned terminal receipts go to quarantine | adapter doctor, self-test, cross-runtime verification, and secret-absence scan |
| HippoRAG indexes rejected evidence | High | physically isolated production/staging graphs | deterministic corpus membership test |
| Media is generated or published without a person asking | High | explicit `userTriggered` contract and second publication confirmation | quota and handoff tests |
| Accessibility mode penalizes involuntary behavior | High | no timing, tic, movement, vocalization, or voice requirement | edge-user scenario tests |
| External worker outage breaks the course | Medium | local deterministic lesson loop and graceful degradation | chaos test |
| An agent worker sees the full workspace or central secrets | Critical | contain worker scope, curate mounts and environment, control every invocation through Gate5 | sandbox manifest and secret-absence tests |
| Docker socket or host process visibility expands observability blast radius | High | isolate the Datadog profile, read-only minimum mounts, technical metadata only, no student payloads | Compose review and runtime mount inspection |
| cPanel cannot run required workers | Medium | deploy only compatible static/domain/proxy surfaces | hosting capability readback |
| Documentation overstates readiness | High | evidence register and pre-alpha labels | publication QA gate |
