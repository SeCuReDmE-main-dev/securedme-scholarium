# Scholarium Teach - Operational Brief

Date: 2026-07-15
Source capture: `docs/idea-captures/2026-07-15_scholarium-teach-spanish-emergent-design.md`
Status: concept preserved from a real Spanish learning session

## Core Idea

Scholarium Teach is an education-first component of Scholarium built from real learning sessions.

The first observed use case is Spanish learning for Jean-Sebastien, with a short-term goal: hold a simple daily conversation by the end of the month.

The product should not behave like a generic chatbot or a fast lesson script. It should adapt its pace to the learner, verify mastery before moving forward, and preserve the learner's state across sessions.

## First Learning Problem Observed

During the Spanish session, the learner could repeat some phrases but confused when to use them.

Examples:

- `Hola, como estas?` -> `Muy bien, y tu?`
- `Como te llamas?` -> `Me llamo Jean-Sebastien.`
- `De donde eres?` -> `Soy de Montreal.`
- `Cuantos anos tienes?` -> `Tengo cuarenta y tres anos.`

Important observation: a learner saying "OK" is not proof of mastery.

Mastery requires:

- unaided recall;
- correct answer to the correct question;
- delayed recall;
- use inside a complete conversation;
- ability to restart from the beginning without confusion.

## Required Teaching Behavior

The system should:

- teach one expression at a time;
- slow down when the learner blocks;
- split phrases into smaller chunks;
- show the written sentence while the learner hears and speaks it;
- provide immediate correction;
- show simple phonetic help;
- repeat without becoming mechanical;
- keep track of mastered, learning, and review-needed items;
- resume exactly where the learner stopped.

## Interface Direction

The desired interface is multimodal:

- live voice conversation;
- visible transcription;
- large current sentence area;
- translation;
- phonetic help;
- progress indicators;
- mastered / learning / to-review lists;
- frequent error list;
- pause and resume without losing context.

The interface should show what is useful at the right moment, not flood the learner with everything.

## Scholarium Teach Vision

Scholarium Teach can grow from the Spanish course into a broader adaptive education layer.

Potential domains:

- languages;
- writing;
- communication;
- sign languages;
- support for deaf or non-verbal users;
- neurodivergent learning support;
- reading, language, and text-difficulty support.

These are directions, not implementation scope for the first prototype.

## Student Assistant

The learner could have a Scholarium assistant on their phone.

It would gradually understand:

- strengths;
- difficulties;
- talents;
- favorite subjects;
- habits;
- rhythm;
- school subjects currently studied;
- progression across the school year.

The assistant should support the student's current school year rather than apply a generic curriculum.

## AlgoQuest Role

AlgoQuest is the existing central entry point for the education suite.

The model has three main actors:

- student;
- teacher;
- their respective assistants.

The teacher should not access the student's raw internal data. Communication should happen through controlled assistant-to-assistant summaries inside AlgoQuest.

Teacher-facing outputs may include:

- recent learning summaries;
- mastered concepts;
- persistent difficulties;
- explanation styles that work;
- global progress;
- signals that human intervention is needed.

## Privacy Boundary

This vision may involve sensitive student data, potentially about minors.

Privacy is a core architecture property, not a later add-on.

Required principles:

- explicit consent;
- age-appropriate consent;
- parent or guardian role where applicable;
- data minimization;
- purpose limitation;
- limited retention;
- student control;
- withdrawal and deletion;
- explainability;
- raw-data and metric separation;
- secure assistant communication;
- access logging;
- prevention of excessive surveillance.

Legal frameworks to validate later:

- Quebec Law 25;
- applicable French laws;
- other obligations depending on school location, student age, and residence.

This brief is not legal advice.

## Plithogenic Analysis Engine

A future engine may use Jean-Sebastien's plithogenic algorithms to organize uncertain, contradictory, evolving educational signals.

It should handle:

- compatible data;
- contradictory data;
- multiple interests;
- uncertainty;
- time evolution;
- context-dependent strengths;
- multiple student-development dimensions.

The math, data model, metrics, and decision rules remain to be designed.

## First Bounded Prototype

Build the smallest useful Scholarium Teach prototype around one Spanish-learning loop:

1. Teacher or assistant selects one target phrase.
2. Student sees and hears the phrase.
3. Student responds by voice or typed input.
4. System checks if the response is correct for the current question.
5. System records the state as mastered, learning, or to review.
6. System repeats, slows down, or advances based on mastery evidence.

Do not start with phone data collection, broad surveillance, legal automation, or full multi-domain support.

## Next Development Step

Create a local prototype surface in the Scholarium repo for:

- one Spanish lesson flow;
- one learner state model;
- one teacher summary;
- one privacy-safe progress report.

Keep all claims pre-alpha and human-reviewed.
