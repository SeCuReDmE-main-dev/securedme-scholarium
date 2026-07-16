# Mission 060 - Retrieval Benchmark

Generated: `2026-07-15T17:43:07.363707+00:00`

This benchmark uses synthetic education data only. The dense lane implements the
HippoRAG `retrieve_dpr` port with a local SentenceTransformer; it does not execute
the full HippoRAG graph, OpenIE, reranking, or answer generation.

Corpus: 10 documents, 6 queries, `k=3`.

| Engine | Precision@k | Recall@k | Provenance | Suppression leakage | Reconstruction |
|---|---:|---:|---:|---:|---:|
| memory_lake_only | 0.333 | 0.833 | 1.000 | 0.000 | 1.000 |
| hipporag_dpr_compatible_adapter | 0.389 | 1.000 | 1.000 | 0.000 | 1.000 |

The DPR-compatible lane improved mean precision@3 by `0.055556` and mean recall@3 by `0.166667` on this fixture. MemoryLake missed `q-signed-access`; the DPR-compatible lane retrieved the expected signed-access source for all six queries. This is a diagnostic result, not a product-quality conclusion.

## Lifecycle Proof

- Before deletion, both engines retrieved `source-spatial-soccer` for the spatial-geometry query.
- After deletion, neither engine returned the deleted provenance (`suppression_leakage=0.0`).
- After controlled reindexing, both engines returned it again (`reconstruction_recovery=1.0`).
- Every baseline hit carried a non-empty provenance identifier (`provenance_coverage=1.0`).

The machine-readable evidence is `docs/teach/evidence/mission-060-retrieval-benchmark.json`, SHA-256 `2D4CCD1B4A7F4EA001F92BB21D1EBEC435988A18FEF49B963DD7F2C12E3A1F54`.

## Runtime Profile

- Memory lane: real `MemoryLake.index_records`, `MemoryLake.search`, and `MemoryLake.delete_sources`, with Chroma disabled for an isolated local run.
- Dense lane: local cached `sentence-transformers/all-MiniLM-L6-v2`, normalized embeddings, and dot-product ranking behind Synthia's retrieval-only gateway.
- No student data, OpenAI API key, OpenIE, graph reranking, QA generation, or external publication was used.
- The dense result proves the adapter-compatible `retrieve_dpr` profile only. It is not evidence for full HippoRAG graph performance.

## Reproduction

Run from the Synthia repository with the central development virtual environment:

```powershell
python -m synthia_core.retrieval_benchmark `
  --corpus tests/fixtures/education_retrieval_benchmark.v1.json `
  --memory-plugin-root <codex-memory-systeme-plugin-root> `
  --output <scholarium-repo>/docs/teach/evidence/mission-060-retrieval-benchmark.json `
  --report <scholarium-repo>/docs/teach/MISSION_060_RETRIEVAL_BENCHMARK.md
```

## Interpretation Boundary

These measurements compare retrieval profiles on a small controlled fixture. They do not prove educational efficacy, student classification quality, or production readiness.

## Metric Definitions

- `precision_at_k`: mean relevant retrieved divided by k.
- `recall_at_k`: mean relevant retrieved divided by relevant ground-truth count.
- `provenance_coverage`: retrieved hits with non-empty provenance divided by retrieved hits.
- `suppression_leakage`: 1 if deleted provenance remains retrievable, otherwise 0.
- `reconstruction_recovery`: 1 if controlled reindex restores target retrieval, otherwise 0.
