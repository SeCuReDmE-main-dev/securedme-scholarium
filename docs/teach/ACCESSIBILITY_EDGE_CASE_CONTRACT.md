# Scholarium Teach Accessibility Contract

Status: implemented and browser-validated on synthetic education data.

## Product boundary

Teach accessibility profiles are interface preferences selected by the learner
or their authorized support person. They are never diagnoses, disability
inferences, intelligence labels or eligibility decisions. Profiles can be
combined, changed or disabled without changing academic evaluation.

## Profiles

| Profile | Executable contract |
| --- | --- |
| Sourd / langue signee | Transcript, visual sequence and text response remain available; signed content is shown only when a human-verified resource exists. |
| Communication non verbale | Text area and a response choice board replace any voice requirement. |
| Autism Calm | Predictable sequence, lower density and reduced motion are applied without surprise transitions. |
| Tourette Safe | Delay, movement and vocalization do not affect attempt evaluation. |
| ADHD Sprint | A short optional timer, a visible next action, pause and reset controls are supplied. |
| Lecture dyslexie | Reading measure, spacing and optional read-aloud speed are adjustable. |
| Motricite dyspraxie | Targets are enlarged and essential actions do not require drag, hover or fine-precision gestures. |

## Shared controls

The learner controls transcript, translation, phonetic support, contrast,
saturation, density, motion, sound, data usage, reading measure, reading
spacing, audio rate and sprint length. Essential interactions use native
buttons, inputs, fieldsets and landmarks. Keyboard focus is visible; the first
tab stop is a skip link to the active question; Teach view tabs support arrow,
Home and End keys; dynamic learning feedback uses polite live status.

## Source alignment

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/) supplies the testable keyboard,
  focus, labels, reflow, contrast and motion baseline.
- [COGA Making Content Usable](https://www.w3.org/TR/coga-usable/) supports
  familiar controls, visible orientation, reduced memory burden,
  personalization and validation with representative users.
- [WAI transcripts](https://www.w3.org/WAI/media/av/transcripts/) and
  [captions](https://www.w3.org/WAI/media/av/captions/) support equivalent text
  access to audio and synchronized media.
- [WAI sign languages](https://www.w3.org/WAI/media/av/sign-languages/)
  establishes that sign languages vary by region. Teach does not substitute an
  automatic avatar for human-verified signed content.

## Offline and bandwidth boundary

Data-saver mode is an interface preference and the already-loaded lesson can
continue from its local checkpoint after an offline event. This gate does not
claim a complete offline application shell, reload while offline, background
sync or signed-in server persistence.

## Validation boundary

Automated checks, browser interaction and visual review cannot replace testing
with Deaf, non-verbal, autistic, Tourette, ADHD, dyslexic and dyspraxic users.
Representative-user validation remains required before a real school pilot.
