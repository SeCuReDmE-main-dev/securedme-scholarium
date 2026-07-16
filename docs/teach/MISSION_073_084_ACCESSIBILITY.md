# Missions 073-084 - Accessibility Edge-Case-First

Generated: 2026-07-15T19:03:14.4420044Z

Gate G7 is passed on synthetic education data. The seven accessibility profiles
are executable, combinable and controlled by the user. The result is an
interface contract, not a clinical assessment or proof from representative-user
research.

## Activated tranche

- Risk: RagGgE Technical Risk Assessment
- Frontend: Architecte Zero Frontend
- Browser QA: Architecte Zero Browser Visual QA
- Research: Coding Research Primary Docs
- Plugin surfaces: SecuredMe Education Controller, Coding Research, local
  frontend and Playwright

## Action evidence

| Action | Direct evidence | Result |
| --- | --- | --- |
| 073 | Existing preference and checkpoint audit | Three global preferences and the former single Teach toggle were identified; Teach now persists one versioned settings object. |
| 074 | Transcript, visual sequence and signed-content boundary | Deaf/signed mode works without audio and refuses an unverified automatic sign avatar. |
| 075 | Text area and communication choice board | A browser-selected non-verbal response populated the answer and completed an attempt. |
| 076 | Autism Calm profile | Predictable next action, reduced density and reduced motion activate together. |
| 077 | Tourette Safe profile | The interface states and tests that delay, movement and vocalization do not change evaluation. |
| 078 | ADHD Sprint profile | Optional 10-minute timer, next action, pause and reset controls are visible. |
| 079 | Dyslexia Reading profile | Narrow measure, relaxed spacing, audio toggle and adjustable 0.6x-1.2x rate are available. |
| 080 | Dyspraxia Motor profile | Large targets are applied and no essential drag or precision gesture exists. |
| 081 | Shared display and rhythm controls | Contrast, saturation, density, motion, sound, data saver and speed controls persist. |
| 082 | Keyboard and semantic browser proof | Skip link focuses the question H2; arrow key selects and focuses the next tab; live regions and native controls are exposed. |
| 083 | Browser matrices, throttled network and offline event | 1440x1000, 820x1180 and 390x844 have zero horizontal overflow; a 64 kbps/400 ms profile restored the full checkpoint; the loaded lesson retains a local checkpoint offline. |
| 084 | CI contract and Axe scan | Full build and 63 tests pass; Axe reports 29 passes, zero incomplete checks and zero WCAG-tagged violations. |

## Runtime proof

- `npm test`: production build passed; 63 tests passed and none failed.
- `npm run lint`: zero errors; 30 existing warnings remain.
- `git diff --check`: passed with line-ending notices only.
- Action matrix: 163 rows; actions 073-084 are linked to this report.

## Browser proof

All seven profiles were enabled together. The browser observed the transcript,
signed-content boundary, ADHD timer, non-verbal choice board, Tourette note and
data-saver status. The selected choice `Muy bien, y tu?` populated the textarea,
completed an attempt and persisted with all profile settings.

Under an emulated 64 kbps download, 32 kbps upload and 400 ms latency profile,
the hydrated lesson restored the answer, data-saver preference and all seven
profiles in 7.395 seconds. The throttling was then removed.

The first `Tab` focused `Aller a la question`; `Enter` focused
`H2#active-question`. `ArrowRight` on the selected Cours tab focused Forces and
set `aria-selected=true`. Browser console logs contain informational React
development messages only and no errors.

| Viewport | Horizontal overflow | Screenshot |
| --- | --- | --- |
| 1440x1000 | false | `apps/web/output/playwright/g7/teach-accessibility-desktop-top.png` |
| 820x1180 | false | `apps/web/output/playwright/g7/teach-accessibility-tablet-top.png` |
| 390x844 | false | `apps/web/output/playwright/g7/teach-accessibility-mobile-top.png` |
| 390x844, controls | false | `apps/web/output/playwright/g7/teach-accessibility-mobile-controls.png` |

## Evidence integrity

Machine-readable evidence:
`docs/teach/evidence/mission-073-084-accessibility.json`

SHA-256:
`80E16D220D5054C6E3BC7D2FFBC146AEBE6C1AE5018E68C2E350305DF8CC603A`

## Interpretation boundary

The offline proof covers the already-loaded tab and local checkpoint only. It
does not prove offline reload or synchronization. Automated accessibility
results do not replace validation with representative users before a real
school pilot.
