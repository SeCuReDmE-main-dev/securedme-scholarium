# Central Knowledge Gateway v1

## Purpose

This gateway is the only memory and graph admission surface used by the six Scholarium education plugins. Plugins are stateless processors. They never create a local MEMORY.md, private long-term store, hidden learner profile, or independent taxonomy.

## Required flow

1. Receive a purpose-bound plugin envelope.
2. Validate schema, tenant, consent receipt, provenance, expiry, and idempotency key.
3. Pseudonymize before external adapter calls.
4. Route source material through Synthia classification.
5. Place graph records in exactly one partition: approved, preparation, or quarantine.
6. Index trace records through MemoryLake into their declared partition; production HippoRAG retrieval reads only the approved partition.
7. Compute graph matrices and location vectors with a declared algorithm version.
8. Return a receipt; never return another learner's graph or raw private memory.

## Graph and Hilbert representation

The gateway models a finite attributed multigraph G=(V,E). It may emit adjacency A, oriented incidence B, degree D, and Laplacian L=D-A matrices. Eulerian analysis reports degree parity, connected-component evidence, and whether an Euler trail or circuit exists; it must not fabricate a traversal when graph conditions fail.

A Hilbert-location record is a reproducible feature embedding, not a claim about cognition. It includes basis_id, algorithm_version, dimension, normalization, source_node_ids, vector, norm, projection_digest, and uncertainty. Matrix-to-vector production must declare ordering for nodes and edges so replay produces the same coordinates.

## Authority boundary

Synthia classifies and organizes with provenance. HippoRAG retrieves and ranks graph evidence. Codex or Gemini generates user-facing language. None of these components independently grades, diagnoses, disciplines, certifies truth, or replaces an educator. Preserve I -> I_system^S -> H_lex -> G_lex -> I_lexicon and I -> I_system^S -> D_f -> dF -> i_fractal.

HippoRAG is invoked only through `synthia.hipporag-retrieval.v1`. The gateway calls only `retrieve_dpr`, the native dense retrieval path that bypasses fact reranking and QA generation. It rejects `rag_qa`, `rag_qa_dpr`, `qa`, and `generate` before the upstream object is called. Retrieval returns questions, source passages, scores, and optional evaluation metrics; it never returns a generated answer. This profile is `hipporag_dpr_only`, not the full graph-reranked HippoRAG runtime.

## Retrieval benchmark contract

The comparison contract is `synthia.education-retrieval-benchmark.v1`. It measures the same versioned synthetic corpus and relevance ground truth through `memory_lake_only` and `hipporag_dpr_compatible_adapter`. A valid result must include precision@k, recall@k, provenance coverage, suppression leakage after explicit deletion, and reconstruction recovery after controlled reindexing. Until the EFVP permits otherwise, benchmark data remains synthetic. A DPR-compatible adapter result must never be presented as a full HippoRAG graph result.

## Failure behavior

Reject missing provenance, unknown schemas, invalid consent, expired envelopes, cross-tenant identifiers, non-finite vectors, inconsistent matrix dimensions, non-replayable ordering, and altered manifests. Rejection goes to quarantine with a machine-readable reason; it never silently becomes approved memory.
