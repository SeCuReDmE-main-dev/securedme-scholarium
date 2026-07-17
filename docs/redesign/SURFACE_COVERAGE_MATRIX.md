# Surface coverage matrix

| Surface | Shared component | Contract | Test | Proof |
| --- | --- | --- | --- | --- |
| Landing | Header, Theme/Access, buttons, footer | Public routes and claim boundaries | Build + E2E | Desktop/mobile screenshots |
| Commons | Archive shell, navigation, controls, cards | Existing `/api/*` requests unchanged | API + E2E | Signal/library/studio captures |
| Teach student | Purple/mauve shell | Lesson and checkpoint contracts | Learning loop E2E | Complete Spanish loop |
| Teach teacher | Emerald/teal shell | Teacher dashboard and interventions | Negative permission tests | Authorized-group capture |
| Teach organization | Navy/powder-blue shell | Aggregate dashboard and exceptional access | Cohort and re-identification tests | Threshold-safe capture |

All surfaces use the same local-only `scholarium.theme.v1` and `scholarium.access.v1` preferences. The available global profiles are Base, Autism Calm, ADHD Sprint, and Deep Work.
