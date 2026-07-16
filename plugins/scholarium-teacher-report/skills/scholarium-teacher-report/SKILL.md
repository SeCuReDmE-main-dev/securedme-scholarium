---
name: scholarium-teacher-report
description: Use when Scholarium Teach must produire un rapport enseignant borne, actionnable et sans transcription privee brute. Enforces stateless plugins, central HippoRAG gateway admission, provenance, accessibility and human review.
---

# Scholarium Teacher Report

Read `../../AGENTS.md`, `../../SOUL.md` and `../../USER.md` before execution. Use the complete starter prompt in USER.md as the operating contract. Produce `scholarium.teacher-report.v1`, send graph deltas only through `scholarium.central-knowledge-gateway.v1`, and fail closed when consent, provenance, tenant scope or validation evidence is missing.
