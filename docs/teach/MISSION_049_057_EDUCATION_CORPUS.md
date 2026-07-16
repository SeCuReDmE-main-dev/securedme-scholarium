# Mission 049-057 - Education corpus and Synthia graph classification

Date: 2026-07-16

## Result

The historical G5 evidence debt is closed without moving the execution frontier backward. The corpus contains exactly 125 unique `synthia.education.source-card.v1` records across eight bounded categories.

| Source lane | Count |
| --- | ---: |
| Mastery and retrieval | 15 |
| Language learning | 15 |
| Accessibility and UDL | 15 |
| Neurodiversity | 20 |
| Strengths and motivation | 15 |
| Social belonging and safety | 15 |
| Sport, music and creativity | 15 |
| Legal and institutional | 15 |

## Synthia execution

Synthia was invoked through its real CLI once for every source card:

```text
python -m synthia_core.cli lexicon classify --text <bounded-source-text> --domain education
```

All 125 receipts preserve `I -> I_system^S -> H_lex -> G_lex -> I_lexicon`. Synthia remains a traceability and uncertainty instrument. It does not certify educational quality, legal applicability, scientific truth or taxonomy.

## Verification and uncertainty

- 125/125 cards contain identifiers, authors, dates, canonical URLs, citations and provenance.
- 66 canonical URLs responded directly.
- 54 responded with an access restriction such as 401, 403, 405 or 429.
- 2 returned HTTP errors and 3 remained unresolved during the bounded network check.
- Every unresolved result remains visible in `url-verifications.jsonl`.
- Journal candidates still require human method and article-level rights review.
- Official documents still require human jurisdiction and applicability review.

## Graph stores

Three durable partition manifests now exist:

- `graphs/approved.json`: 0 sources;
- `graphs/preparation.json`: 125 sources in eight category shards;
- `graphs/quarantine.json`: 0 sources.

No source was promoted automatically. The approved store is operational but empty until qualified review explicitly changes a source-card partition.

Each source also has a source-bound OpenIE packet containing metadata-derived entities, relations, unresolved layers, citation and canonical URL. No causal, legal or pedagogical relation is inferred from a title.

## Central memory boundary

- Durable indexing boundary: `MemoryLake.index_records`.
- Retrieval boundary: `HippoRAG.retrieve_dpr` only.
- User-facing generation: Codex or Gemini.
- Intra-plugin `MEMORY.md`: forbidden.
- Graph partitions never grant authority by themselves.

## Direct validation

```text
node --test tests/education-corpus.test.mjs
3 passed, 0 failed
```

The classification-run SHA-256 is `87ADE1AD8A995D7ABC92F726650EB2354767A3EBA879F234A8D4F22BBEE42D81`.
