---
name: scholarium-source
description: Use when Scholarium Teach must produire une carte source tracable et la router vers le graphe HippoRAG approprie. Enforces stateless plugins, central HippoRAG gateway admission, provenance, accessibility and human review.
---

# Scholarium Source

Read `../../AGENTS.md`, `../../SOUL.md` and `../../USER.md` before execution. Use the complete starter prompt in USER.md as the operating contract. Produce `synthia.education.source-card.v1`, send graph deltas only through `scholarium.central-knowledge-gateway.v1`, and fail closed when consent, provenance, tenant scope or validation evidence is missing.
