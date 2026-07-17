# Scholarium visual surgery QA report

Date: 2026-07-16
Branch: `new/scholarium-visual-surgery`
Schema: `scholarium.visual-surgery.v1`

## Scope

The visual surgery covers the public landing, `/app`, and `/teach`. It preserves
the Teach 163-action register and its historical actions 048 and 157. No D1
migration, learner record, or external legal conclusion is part of this pass.

## Automated evidence

- `npm test`: build succeeded and 121 tests passed.
- `npm run lint`: zero errors; 17 pre-existing non-blocking warnings remain.
- `git diff --check`: clean.
- Secret scan: no credential, private key, local `.env`, or operator path found
  in the changed public files.
- Contract tests cover provenance, anti-pay-to-rank, provider consent, learner
  sharing consent, role boundaries, the minimum cohort of ten, and suppression
  of raw private answers.

## Visual matrix

| Surface | Viewport | Theme | Role/profile | Result |
| --- | --- | --- | --- | --- |
| `/` | desktop | dark | Base | passed |
| `/` | mobile 390x844 | light | Base | passed |
| `/app` | desktop | dark | Base | passed |
| `/teach` | mobile | light | student | passed |
| `/teach` | tablet | light | teacher | passed |
| `/teach` | tablet | dark | organization | passed |
| `/teach` | desktop Edge | dark | student | passed |

All inspected views returned HTTP 200, had no horizontal overflow, and produced
no browser-console error. The mobile landing header hides the duplicate `Enter`
command while retaining the hero entry points.

## Theme and Access

The controls apply to the whole document and persist locally:

- `Base`: standard cinematic presentation.
- `Autism Calm`: lower decoration opacity and a calm focus color.
- `ADHD Sprint`: stronger focus and action emphasis.
- `Deep Work`: minimal decoration and reduced distraction.

The profiles were verified by computed-style changes, not only by button state.
Dark and light themes were checked on mobile and desktop.

## Role identities

- Student: mauve, violet, and electric blue.
- Teacher: emerald and teal, including the Education circuit treatment.
- Organization: navy and powder blue with restrained teacher and student
  accents.

The three roles share navigation and accessibility primitives but do not share
their operational color emphasis or their data views.

## Residual boundaries

- Public copy remains pre-alpha and avoids claims of school deployment,
  certification, autonomous scientific authority, or use with real minors.
- The historical Teach actions 048 and 157 remain outside this visual program.
- Production deployment and live-domain proof are recorded separately after a
  saved Sites version succeeds.
