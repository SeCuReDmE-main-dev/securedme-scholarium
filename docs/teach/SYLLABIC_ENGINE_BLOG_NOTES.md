# Developer blog side notes

1. The architecture became clearer when storage authority and computational authority were separated. D1 remembers; Python decides from the supplied state; neither can silently replace the other.
2. TimescaleDB remained useful only after its role was narrowed. It compresses and aggregates operational time series, but it never selects a card or reconstructs mastery.
3. CodeProject.AI was retained as an optional observer. Its uncertainty is allowed to produce abstention, never advancement.
4. The first failed test was environmental, not pedagogical: the shared development venv is Python 3.10 while the production contract is 3.12. Compatibility was added without weakening the container requirement.
5. The first integration defect found by cross-reading was the HMAC envelope. TypeScript and Python had individually reasonable signatures that were mutually incompatible. A deterministic system must test the wire contract, not only each side.
6. Idempotence is more than returning an old result. Reusing a key with different content must be rejected, otherwise retries can disguise a different pedagogical event.
7. Keeping the old conversational lesson in the repository preserved history, but removing it from the primary rendering surface prevented its browser-side evaluator from remaining the real authority by accident.
8. A successful build is not visual proof. The local Vinext and workerd failures were recorded as blockers instead of converting an unstyled screenshot into an approval.
9. The legal boundary changed implementation choices immediately: audio is memory-only, minors are blocked before forwarding and no voice sample enters D1, R2, logs or Timescale.
10. A pinned Docker tag was not enough. The original digest behind a `3.12.11` label actually launched Python 3.13.7; runtime inspection caught it, and the image was rebuilt from the verified official 3.12.11 digest.
11. A green health endpoint with zero loaded content was another false positive. Health now fails with `503` when no published pack is available.
12. Local D1 did accept all thirty-seven migrations, including the syllabic tables. The proof had to run from `C:` because Wrangler/Workerd terminated on the shared `Z:` volume; this is an infrastructure constraint, not permission to apply a remote migration.
13. The first Timescale image did not run its SQL under Docker Desktop because a `Z:` bind mount appeared empty inside the Linux container. Baking the immutable migrations into the PostgreSQL image made the deployment reproducible and exposed a second defect: a generated FTS field used a non-immutable expression. The schema was corrected before the first persistent alpha database existed.
14. Five DatasetSlots are intentionally empty. A slot is not a dataset, and an intake receipt is not an approval. Licence, content hash, MIME, encoding, language and PII quarantine now form a deterministic intake boundary before any editorial pack can see a shard.
15. Presentation adaptation was kept separate from the learning graph. The system can offer a reversible modality experiment based on comparable trials, but it cannot infer intelligence, diagnose a learner, or silently alter the order of instruction.
