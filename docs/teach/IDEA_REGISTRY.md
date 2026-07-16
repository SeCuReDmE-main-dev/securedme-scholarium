# Scholarium Teach idea registry

Status values: `accepted`, `implemented`, `research-gated`, `deferred`, or `rejected`.

| Idea | Source | Classification | Decision | Destination |
| --- | --- | --- | --- | --- |
| One-hour conversational Spanish lessons | Original learning session | requirement | implemented | `/teach`, lesson contract |
| Mastery requires unaided, contextual, delayed, restart, and transfer evidence | Original learning session | invariant | implemented | `teach-contracts.ts` |
| Exact pause and resume | Original learning session | requirement | implemented | local checkpoint and D1 checkpoint |
| Voice, transcript, translation, and phonetic support | Original learning session | requirement | partially implemented | browser speech and visual lesson; live transcription remains gated |
| AlgoQuest as the education entry point | Original design report | architecture | accepted | durable event outbox |
| Student and teacher assistants exchange bounded summaries | Original design report | architecture | accepted | Gate5 exchange contract |
| Assistant follows the real school year | Brainstorm | requirement | accepted | weekly objectives domain |
| Daily learning guidance without fatigue | Brainstorm | requirement | accepted | intervention preferences; no hidden phone surveillance |
| Recognize academic, spatial, athletic, musical, artistic, and social strengths | Brainstorm | invariant | implemented foundation | contestable strength observations |
| Math difficulty connected to soccer spatial strategy | Brainstorm recovery | example | implemented | strength bridge |
| Honest frustration can become a growth story | Brainstorm recovery | social behavior | accepted | `growth_story` contract |
| Integrity and respect contracts instead of restriction-first design | Brainstorm correction | invariant | accepted | social integrity policy |
| Edge-case-first support | Brainstorm | invariant | implemented foundation | Teach access controls and QA gate |
| Deaf and signed learning | Brainstorm | requirement | research-gated | signed assets and qualified review required |
| Non-verbal and assistive communication | Brainstorm | requirement | accepted | multimodal response contract |
| Autism, Tourette, ADHD, dyslexia, and dyspraxia modes | Brainstorm | requirement | implemented foundation | local accessibility profiles |
| Student-friendly and teacher-practical analytics | Brainstorm | requirement | implemented foundation | learner and teacher Teach views |
| Five social patterns for education | Brainstorm | product direction | accepted | growth stories, project threads, circles, recognition, recaps |
| Three user-triggered videos per day, maximum five minutes | Brainstorm | quota | implemented contract | Teach media API |
| Five user-triggered podcasts per day, maximum thirty minutes | Brainstorm | quota | implemented contract | Teach media API |
| Media generated from a selected lesson, thread, project, or success | Brainstorm | invariant | implemented contract | source-bound media request |
| 125-source educational corpus | Brainstorm | research deliverable | research-gated | Synthia source registry |
| Synthia classification and HippoRAG retrieval | Brainstorm | integration | accepted | adapter boundary |
| MemoryLake as approved durable evidence store | Brainstorm | integration | accepted | `MemoryLake.index_records` boundary |
| Plithogenic handling of compatible, contradictory, uncertain, evolving signals | Brainstorm | algorithm research | accepted | FNP-QNN adapter research lane |
| FNP-QNN five-plugin integration | Existing implementation | integration | accepted after integrity repair | Gate5 to FNP-QNN |
| Import all pluginpack plugins into Scholarium | Repo audit | architecture | rejected | selected capabilities only through Gate5 |
| FfeD as capability, proof, replay, and audit broker | Repo audit | architecture | accepted | internal gateway |
| Quasicrystal geometry as the sole cryptographic protection | Repo audit | security claim | rejected | geometry remains structural proof and addressing |
| Quasicrystal partitioning, projection, replay, and diff | Repo audit | experimental capability | accepted, non-blocking | FfeD sidecar |
| Codex/OpenAI and Antigravity/Gemini browser authentication | School governance | invariant | accepted | existing WebAuth boundary |
| Unknown or raw-token classroom providers | School governance | provider route | rejected | unsupported school route |
| Law 25 and EFVP before real student data | Brainstorm and official law | launch gate | accepted | EFVP dossier |
| Datadog for reliability without personal content | Brainstorm | operations | accepted | gateway metrics only |
| VS Code tunnel | Brainstorm | operations | accepted | authenticated, bounded port surface |
| cPanel deployment | Brainstorm | operations | partially accepted | static, domain, docs, and compatible proxy only |
| Forty-prompt Life Science learning book | Brainstorm | publication | accepted | professional publication lane |
| Six education plugins with complete Codex and Gemini starter prompts | Live implementation clarification | plugin contract | implemented and validated | actions 117-120 plugin prefabs |
| No intra-plugin MEMORY.md | Live implementation clarification | architecture invariant | implemented and validated | central knowledge gateway only |
| HippoRAG central graph classification and Hilbert location vectors | Live implementation clarification | experimental integration | implemented contract, runtime pending | central gateway adapter |
| Euler graph matrices and replayable vector production | Live implementation clarification | computational contract | implemented contract, runtime pending | adjacency, incidence, degree and Laplacian outputs |
| Existing Scholarium assets must replace the starter-template identity | Live implementation clarification | visual product requirement | accepted | actions 133, 137-139 and `VISUAL_IDENTITY_EXECUTION_BRIEF.md` |
| V.O.T Guardian Tenebris as an ephemeral processing envelope | Live implementation clarification and local repo audit | security integration | accepted, research-gated | actions 130+, Gate5 private adapter and `VOT_GUARDIAN_TENEBRIS_INTEGRATION_ASSESSMENT.md` |
| Direct V.O.T voice detector import or automatic student voice analysis | Local repo audit | unsafe coupling | rejected | no direct import; no passive listening or biometric route |
| Military use | Brainstorm detour | excluded scope | rejected | no destination |

The complete action-level mapping is in `ACTION_MATRIX.csv`. No idea is removed silently; rejected and research-gated ideas remain visible with their reason.
