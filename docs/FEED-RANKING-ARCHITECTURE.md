# Scholarium Feed Ranking Architecture

## Decision

Scholarium uses a bounded, explainable plithogenic discovery score for public educational work. It learns from product principles published by YouTube, Meta, and Netflix; it does **not** copy their proprietary models, collect passive watch-time, or optimize for addiction.

The public API identifies the implementation as `plithogenic-explainable-v3` and returns reasons, three score lanes, and the visible design principles used for each discovery item.

## Three lanes, then a guard

| Lane | Inputs | Purpose | Explicit exclusions |
| --- | --- | --- | --- |
| Personal relevance | Search terms; hashtags a person follows | Connect a learner to the subject they asked for or chose | Off-platform behaviour; social graph inference; global popularity |
| Explicit satisfaction | That person's favourites and reactions | Respect deliberate feedback without surveilling reading or viewing time | Passive dwell/watch time; other people's likes; creator popularity |
| Research context | Public provenance/verification state; structured hashtags | Prefer work with clearer context while still labelling work awaiting verification | A claim that the work is scientifically true; automated viewpoint judgement |

Before any score is calculated, public eligibility is enforced. Quarantined and removed publications do not enter the candidate set. A lower research-context value means that the publication is awaiting verification or lacks structured context; it is **not** an accusation of falsehood.

The score is then represented as an `I/T/F`-style vector:

- `T` is the bounded combination of relevance, explicit satisfaction, and research context.
- `I` reflects missing verification or topic structure.
- `F` is only a person's own “less like this” suppression signal. It is private and never a label on the publication.

Format diversification runs only over already eligible work. It can prevent a single format from filling the whole page; it never penalizes a person for identity, payment, protected characteristic, or popularity.

## Why this design is different

YouTube describes using satisfaction-oriented signals as well as actions such as likes and dislikes, and says it demotes borderline information in recommendation surfaces. Scholarium adopts the safety-first principle but deliberately does not infer satisfaction from hidden watch time or build an authority/truth classifier. [YouTube: On YouTube’s recommendation system](https://blog.youtube/inside-youtube/on-youtubes-recommendation-system/)

Meta describes a multi-stage retrieval, filtering, and ranking process and multi-task relevance models. Scholarium keeps the architecture boundary — eligibility before ranking, then a small explainable score — but uses no neural profile, social-graph prediction, or global engagement target. [Meta Engineering: News Feed ranking](https://engineering.fb.com/2021/01/26/core-infra/news-feed-ranking/)

Netflix describes distinct recommendation surfaces rather than one universal model. Scholarium therefore keeps Discovery, Following, Verified, and Chronological as separate modes: a person can leave discovery and inspect a non-personalized order at any time. [Netflix TechBlog: Foundation Model for Personalized Recommendation](https://netflixtechblog.com/foundation-model-for-personalized-recommendation-1a0bd8e02d39)

## Live, hashtag, and video behavior

- The client refreshes public feeds every 30 seconds; a newly public post with a followed hashtag can appear without a manual page reload.
- A Following mode uses only authors and hashtags explicitly selected by the signed-in account.
- Favourites, reactions, and “less like this” are account-bound private signals. They neither change public reach nor become a social popularity score.
- YouTube and TikTok links are external, author-owned URLs. Scholarium stores a canonical link rather than copying the video. The YouTube callback remains fail-closed until its verification secret is configured; see [VIDEO-INTEGRATION-BOUNDARY.md](VIDEO-INTEGRATION-BOUNDARY.md).

## What is adapted — and what is refused

| Publicly described pattern | Scholarium adaptation | Deliberately refused |
| --- | --- | --- |
| YouTube’s satisfaction-oriented signals | A person may privately favorite, react to, or reduce similar work. | Hidden watch time, inferred attention, global popularity, and a proprietary satisfaction model. |
| Meta’s retrieval, eligibility, ranking, and diversity stages | Public eligibility and safety are resolved before an explainable three-lane score; formats are diversified after eligibility. | Social-graph prediction, ad optimization, creator popularity, and opaque neural ranking. |
| Netflix’s distinct recommendation surfaces | Discovery, Following, Verified, and Chronological modes remain separate and a person can choose chronological order at any time. | A universal, uninspectable feed driven by broad behavioral history. |

These are product-pattern comparisons, not a claim that Scholarium reproduces any private algorithm. The plithogenic vector expresses relevance and evidence context in the current feed, not a verdict on whether an idea is scientifically true.

## Operational guardrails

1. No payment, contribution, subscription, or promotion affects rank.
2. No opaque “misinformation score” decides scientific correctness.
3. A safety decision is separate, reviewable, and reason-coded; it is not produced by the feed algorithm.
4. Search stays lexical and non-personalized; discovery is the only personalized surface.
5. Ranking inputs, exclusions, and per-item reasons are returned on the versioned API.

## Revisit triggers

Re-evaluate before adding machine learning or external-account data, when the public candidate pool exceeds 100 items per request, or if a safety review finds that the current provenance state is being misunderstood as a truth verdict. Any future model must retain chronological mode, user-visible reasons, data export coverage, and the no-paid-reach invariant.
