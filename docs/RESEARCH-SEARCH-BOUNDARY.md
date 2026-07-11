# Research search boundary

The first Scholarium Library search is a deterministic lexical search over a bounded public corpus. It returns why an item matched and lets people filter by publication format, verified status, and one normalized topic.

## What it uses

- exact title phrase;
- title, topic, author, format, and abstract terms;
- recency only as a stable tie-breaker between equal lexical scores.

## What it excludes

Search never consumes subscription tier, contribution amount, paid promotion, reactions, favourites, or private behavioural signals. It also excludes private, quarantined, and removed publications before scoring.

## Current scale boundary

The endpoint scans at most the 250 most recent public records and returns at most 50 results. This makes the pre-alpha behavior inspectable and bounded, but it is not a replacement for the planned PostgreSQL full-text and vector indexes. Move to that infrastructure only after measuring corpus growth, search latency, language coverage, and relevance quality.
