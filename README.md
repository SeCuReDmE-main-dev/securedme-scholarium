<h1 align="center">SecuredMe Scholarium</h1>

<p align="center">
  <strong>An open, education-first home for research, projects, teaching work, and the people who make them.</strong><br />
  Publish with context. Learn in public. Keep discovery free.
</p>

<p align="center">
  <a href="https://www.scholarium.securedme.ca">Public pre-alpha</a> ·
  <a href="https://www.scholarium.securedme.ca/privacy">Privacy</a> ·
  <a href="https://github.com/SeCuReDmE-main-dev/securedme-scholarium/issues">Feedback</a>
</p>

[![SecuredMe Education Suite public calendar](https://img.shields.io/badge/SecuredMe%20Education%20Suite-public%20calendar%20%7C%20alpha%20Aug%203%202026-5484ED?style=for-the-badge&logo=googlecalendar&logoColor=white)](https://calendrier.securedme.ca)

**Attribution:** Jean-Sebastien Beaulieu · [ORCID 0009-0007-2904-0443](https://orcid.org/0009-0007-2904-0443) · [SecuredMe](https://securedme.ca) · [Scholarium](https://www.scholarium.securedme.ca)

<!-- SECUREDME-SUITE-BADGES:START -->
[![Issues](https://img.shields.io/github/issues/SeCuReDmE-main-dev/securedme-scholarium?color=161B6A)](https://github.com/SeCuReDmE-main-dev/securedme-scholarium/issues)
[![Milestones](https://img.shields.io/badge/milestones-M0--M7-23B8FF)](https://github.com/SeCuReDmE-main-dev/securedme-scholarium/milestones)
[![Project Board](https://img.shields.io/badge/project-kanban-6F42FF)](https://github.com/users/SeCuReDmE-main-dev/projects/3)
[![Branch](https://img.shields.io/badge/branch-main-0E7490)](https://github.com/SeCuReDmE-main-dev/securedme-scholarium/tree/main)
<!-- SECUREDME-SUITE-BADGES:END -->

<!-- SECUREDME-STARTUP-SUPPORT:START -->
<p align="center">
  <a href="https://e2b.dev/startups"><img alt="Gateway-ready E2B audit lane" src="https://img.shields.io/badge/Gateway--ready-E2B%20audit%20lane-FF8800?style=for-the-badge" /></a>
  <a href="https://www.datadoghq.com/partner/datadog-for-startups/"><img alt="Gateway-ready Datadog observability" src="https://img.shields.io/badge/Gateway--ready-Datadog%20observability-632CA6?style=for-the-badge&amp;logo=datadog&amp;logoColor=white" /></a>
</p>

> **Gateway support acknowledgement.** E2B audit support and Datadog observability are routed through the shared SecuredMe gateway when configured. This repository does not claim a direct E2B or Datadog runtime dependency by default, and no secret is stored in this README.
<!-- SECUREDME-STARTUP-SUPPORT:END -->

> [!IMPORTANT]
> **Pre-alpha / in development.** Scholarium is being built in public, but it is not yet a production social network. The public preview is for product validation. PayPal checkout now fails closed unless dedicated live credentials and a live webhook ID are configured; provider review, public moderation operations, and youth-flow legal review remain gated.

## Why Scholarium exists

Scholarium is a professional, free-first social platform for people who learn, teach, research, maintain open-source work, and build in public. It combines readable social discovery with the discipline of academic context:

- a research note can live next to its sources, files, version history, and license;
- a teacher can celebrate a student project without turning it into a popularity contest;
- a maintainer can show an open project without accepting code changes in the social feed;
- a beginner can use structure without being punished for not knowing formal writing conventions.

### Product invariants

1. **No pay-to-rank.** Subscription tier, contribution amount, and paid tools never change feed reach.
2. **Free core publishing.** A person can share and discover work without buying visibility.
3. **Provenance, not legal overclaiming.** Scholarium creates a timestamped publication receipt; it does not replace copyright registration, DOI, ISBN, or legal advice.
4. **Human review stays human.** AI can structure, explain, and trace work. It does not become a proof authority, taxonomic authority, moderator of last resort, or scientific authority.
5. **Privacy by default.** Local activity insights are off by default, stay in the browser when enabled, and exclude post text, files, contacts, location, and provider tokens.

## What is implemented today

| Surface | Current capability |
| --- | --- |
| Signal | Professional research/education feed, search, followed topics, transparent ranking controls, and chronological option. |
| Publishing | Research notes, white papers, project updates, short videos, and teaching artifacts with a processing status and provenance receipt contract. |
| Files | Typed upload contract, SHA-256 hashing, and R2 metadata shape for supported documents, data files, archives, and video. |
| QuaNthoR | A non-blocking formalization coach for articles, white papers, chapters, presentations, project briefs, videos, life-science protocols, and Mizar-proof handoff. |
| Profiles | Avatar/banner preview, themes, accent colour, badges, local-only insight preference, and consent-first tool connections. |
| Identity | ChatGPT WebAuth plus separate Google, GitHub, and PayPal entry routes. Each provider identity remains separate until an explicit future account-linking flow is reviewed. PayPal is sandbox-configured; Google and GitHub await their own provider credentials. |
| Integrations | Consent preparation contracts for ORCID, GitHub, Zenodo, Google Drive, QuaNthoR, Synthia, SecuredMe Blog, Codex/OpenAI, Antigravity/Gemini, and life-science discovery. |

## QuaNthoR in Scholarium

QuaNthoR is deliberately a **coach, not a gatekeeper**. It helps a person make the structure of their work clearer so formats remain understandable across the community. It never blocks publishing because a source, section, or title is still incomplete.

For formal mathematics, it can prepare a Mizar-oriented plan and hand the draft to QuaNthoR/Mizar. A guide is never represented as a verified proof until the separate formal verifier accepts it.

For life-science work, it can prepare a source-aware protocol outline. This is not clinical advice, ethics approval, biosafety approval, or a scientific conclusion.

## Identity, tools, and privacy

Official AI-assisted school routes are **Codex/OpenAI** and **Antigravity/Gemini** only. Scholarium uses the provider's own browser/WebAuth session where available; it does not request or store a raw provider token in student or teacher flows.

Tool attachments are consent-first. A connection can be prepared in a profile, but it must be explicitly approved before a provider redirect or any external write occurs. GitHub collaboration remains on GitHub: Scholarium can show attribution and project context but is not a replacement code editor.

The optional `Privacy monitor` is intentionally device-local. Datadog is a platform reliability lane, not a per-user container and not a destination for personal content or behavioral profiles.

## Architecture

```text
apps/web/
  app/                 React/Vinext interface and API routes
  db/                  Drizzle D1 schema and migrations
  drizzle/             Generated migration history
  lib/                 Provenance, identity, policy, integration, and privacy contracts
  tests/               Rendered-interface and safety-contract checks
  worker/              Worker entry point
```

The app is a Vinext/React application designed for Cloudflare Workers. Logical D1 (`DB`) and R2 (`MEDIA`) bindings are declared in [`apps/web/.openai/hosting.json`](apps/web/.openai/hosting.json). Files and records are only durable when those bindings are provided by the deployment environment.

## Run locally

Prerequisite: Node.js 22.13 or later.

```powershell
cd apps/web
npm install
npm run dev
```

Then open the local address printed by Vinext (normally `http://localhost:3000`).

### Validate

```powershell
cd apps/web
npm test
```

The suite builds the Worker-compatible application and checks the rendered product contract: anti-pay-to-rank, provenance, QuaNthoR's non-blocking role, local-only insights, WebAuth binding, and consent-first profile connections.

To regenerate Drizzle SQL after a schema change:

```powershell
npm run db:generate
```

## Public repository and contribution boundary

This repository contains the public-safe Scholarium source. Credentials, cPanel details, deployment secrets, identity documents, biometric templates, private correspondence, and unpublished research stay outside this repository.

Community feedback is welcome through GitHub Issues. The maintained school-tool route is still pre-alpha: external pull requests are not considered for merge until the documented stability gate is reached. Do not submit secrets, personal identity documents, private student data, or unsupported provider integrations.

## Not yet launched

- live PayPal provider review and launch credentials;
- payment-provider checkout for the fixed 0.99 USD/month verified-contributor contribution;
- Google and GitHub provider credentials, redirect registration, and launch validation;
- production moderation operation, appeals, and legal review for youth flows;
- resumable uploads, malware scanning, document extraction, video transcoding, and Live infrastructure;
- full external service execution for Drive, GitHub, email, calendar, contacts, DOI, and life-science sources.

These are intentional launch gates, not features silently represented as complete.

## Governance and license

> **Official school governance.** Scholarium follows the SecuredMe Education boundary: Codex/OpenAI and Antigravity/Gemini are the only official AI-assisted school routes. Do not add Ollama Cloud, uncensored local models, raw-token student flows, or unknown provider routes. See [SCHOOL_TOOL_GOVERNANCE.md](SCHOOL_TOOL_GOVERNANCE.md) and [AGENTS.md](AGENTS.md).

> **License.** This project uses the Secured Educational License 2.0 (SEL-2.0). It is provided for education, research, simulation, classroom training, and supervised learning. See [LICENSE](LICENSE), [NOTICE](NOTICE), [DISCLAIMER](DISCLAIMER), and [SAFETY.md](SAFETY.md).
