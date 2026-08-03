# Syllabic engine traceability matrix

| Principle | Requirement | Component | Gate evidence |
| --- | --- | --- | --- |
| Syllable first | Present pronounceable syllables before isolated letters | Castellano block | pack validation |
| Silabario | Compile an explicit progression graph | block compiler | graph tests |
| Vowels in syllables | Reject isolated-vowel entry nodes | block compiler | policy test |
| No picture answer | Reject answer-revealing cards | block compiler | publication test |
| Visual cards | Stable corners, composition and non-revealing setting | Teach UI | visual test |
| Read before write | Writing requires reading evidence | mastery engine | transition test |
| Composition | Combine known syllables only | decision engine | prerequisite test |
| Syllable audio | Bounded audio references and observations | audio adapter | privacy tests |
| Multiple profiles | Shared kernel, explicit presentation profile | block and UI | accessibility tests |
| Castellano label | `es-419` with Castellano display name | language profile | contract test |
| Provenance | Source and evidence references on every block | registry | provenance test |
| Real lesson path | Syllable to sound to composition to reading to writing | block graph | end-to-end test |
| No speculative authority | Child-facing records exclude speculative claims | compiler and UI | content scan |
