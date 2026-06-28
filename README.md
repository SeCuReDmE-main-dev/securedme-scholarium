# SecuredMe Scholarium

[![SecuredMe Education Suite public calendar](https://img.shields.io/badge/SecuredMe%20Education%20Suite-public%20calendar%20%7C%20alpha%20Aug%203%202026-5484ED?style=for-the-badge&logo=googlecalendar&logoColor=white)](https://calendrier.securedme.ca)

**Attribution:** Jean-Sebastien Beaulieu · [ORCID 0009-0007-2904-0443](https://orcid.org/0009-0007-2904-0443) · [SecuredMe](https://securedme.ca) · [SecuredMe Scholarium](https://scholarium.securedme.ca)

<!-- SECUREDME-SUITE-BADGES:START -->
[![Issues](https://img.shields.io/github/issues/SeCuReDmE-main-dev/securedme-scholarium?color=161B6A)](https://github.com/SeCuReDmE-main-dev/securedme-scholarium/issues)
[![Milestones](https://img.shields.io/badge/milestones-M0--M7-23B8FF)](https://github.com/SeCuReDmE-main-dev/securedme-scholarium/milestones)
[![Project Board](https://img.shields.io/badge/project-kanban-6F42FF)](https://github.com/users/SeCuReDmE-main-dev/projects/3)
[![Branch](https://img.shields.io/badge/branch-main-0E7490)](https://github.com/SeCuReDmE-main-dev/securedme-scholarium/tree/main)
<!-- SECUREDME-SUITE-BADGES:END -->

<!-- SECUREDME-STARTUP-SUPPORT:START -->
<p align="center">
  <a href="https://e2b.dev/startups">
    <img alt="Gateway-ready E2B audit lane" src="https://img.shields.io/badge/Gateway--ready-E2B%20audit%20lane-FF8800?style=for-the-badge" />
  </a>
  <a href="https://www.datadoghq.com/partner/datadog-for-startups/">
    <img alt="Gateway-ready Datadog observability" src="https://img.shields.io/badge/Gateway--ready-Datadog%20observability-632CA6?style=for-the-badge&amp;logo=datadog&amp;logoColor=white" />
  </a>
</p>

> **Gateway support acknowledgement.** This SecuredMe school tool is gateway-compatible. E2B audit support and Datadog observability are routed through the shared SecuredMe gateway when that lane is configured; this repository does not claim a direct E2B or Datadog runtime dependency by default, and no E2B or Datadog secret is stored in this README.
<!-- SECUREDME-STARTUP-SUPPORT:END -->




## School Authentication And Secret Boundary
This repository is a small SecuredMe school tool. Official classroom use must not require `.env` files, API keys, raw tokens, or local model secrets. Student and teacher workflows must use Codex/OpenAI or Antigravity/Gemini through browser WebAuth, fingerprinted session approval, and encrypted local session records when authentication is needed.

The reason for excluding generic local AI routes from official school mode is student and teacher safety: education accounts, provider-side account controls, browser login, and governed AI refusal behavior are safer than unguided local model endpoints for classroom cybersecurity and algorithm-building tools.

> **Development status.** This school tool is currently tagged **pre-alpha / in development**. External PRs are not evaluated for merge until the maintained tool reaches a stable, fully functional 100% classroom release after the pre-alpha phase. Issues and forks remain allowed, but official PR review is paused until that stability gate is met.

> **SecuredMe Education visual theme.** This pre-alpha school tool uses the shared SecuredMe Education open-source visual identity. See [assets/securedme/education](assets/securedme/education) for light/dark logo and thin banner assets.


SecuredMe Scholarium is a public, pre-alpha research commons for white papers, publication records, book-submission workflows, and research-note discovery.

> **Official school governance.** This maintained classroom tool is open source, PR-reviewed, and supported for Codex/OpenAI or Antigravity/Gemini-assisted school workflows only. See [SCHOOL_TOOL_GOVERNANCE.md](SCHOOL_TOOL_GOVERNANCE.md) and [AGENTS.md](AGENTS.md).

> **License.** This project uses the Secured Educational License 2.0 (SEL-2.0). See [LICENSE](LICENSE), [NOTICE](NOTICE), and [DISCLAIMER](DISCLAIMER).

The project is inspired by public academic publishing and discovery patterns, but it is intentionally locked in pre-alpha:

- public reading is open;
- public uploads are disabled;
- public account/profile edits are disabled;
- comments and unaudited publishing are disabled;
- owner/Codex publishing remains the only write path until alpha approval.

## Current Engine

The first implementation is an Omeka Classic theme and content model. Omeka Items represent publications, book submissions, white papers, and research notes. Collections group topic areas. Tags/research interests power discovery.

## Repository Boundary

This public repo contains only public-safe application/theme code and public design notes.

Private infrastructure, credentials, cPanel/WHC/Cloudflare details, deployment notes, raw research dumps, and admin records remain in the private SecuredMe admin repository.

## Status

Pre-alpha. Community feedback is welcome through GitHub Issues, but public publishing is not open yet.







