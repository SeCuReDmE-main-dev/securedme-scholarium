import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  adminAssistantProjection,
  assistantExchangeEnvelopeContract,
  assistantGraphRecordContract,
  assistancePayload,
  defaultTeachAccessibilitySettings,
  empowermentResponseContract,
  evaluateLearningAttempt,
  interventionPreferencesContract,
  reminderForState,
  spanishStarterLesson,
  teachAccessibilityProfileIds,
  teachAccessibilitySettingsContract,
  teacherSessionSummary,
  validateSpanishHourScenario,
  weeklyObjectiveContract,
} from "../lib/teach-contracts.ts";

test("defines evidence-based mastery without treating confirmation as mastery", async () => {
  const contract = await readFile(new URL("../lib/teach-contracts.ts", import.meta.url), "utf8");
  assert.match(contract, /scholarium\.learning-attempt\.v1/);
  assert.match(contract, /delayedRecall/);
  assert.match(contract, /restartedWithoutConfusion/);
  assert.match(contract, /transferDemonstrated/);
  assert.match(contract, /confirmation, reading, or immediate repetition is never sufficient evidence of mastery/);
  assert.match(contract, /spanish-daily-conversation-01/);
  assert.match(contract, /Me llamo Jean-Sebastien/);
});

test("keeps strength observations contestable and non-diagnostic", async () => {
  const contract = await readFile(new URL("../lib/teach-contracts.ts", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/api/teach/strengths/route.ts", import.meta.url), "utf8");
  assert.match(contract, /pending_student_review/);
  assert.match(contract, /never a diagnosis or fixed intelligence label/);
  assert.match(contract, /Sport success does not prove mathematics mastery/);
  assert.match(route, /contested/);
  assert.match(route, /delete\(strengthObservations\)/);
  assert.match(route, /"accept", "reformulate", "contest", "expire"/);
  assert.match(route, /learnerCorrection/);
});

test("keeps the learner assistant graph private and exchanges projection-only", () => {
  const graphRecord = assistantGraphRecordContract({
    recordKind: "accepted_strength",
    subjectRef: "strength:spatial-strategy",
    summary: "The learner accepted a spatial-strategy observation.",
    provenanceRef: "strength-observation:example",
  });
  const envelope = assistantExchangeEnvelopeContract({
    senderRole: "student_assistant",
    recipientRole: "teacher_assistant",
    purpose: "progress_review",
    consentReceiptId: "consent-sharing-1",
    idempotencyKey: "exchange-1",
    expiresAt: "2026-07-20T12:00:00.000Z",
    projection: {
      objectiveStateCounts: { recalled: 2, review: 1 },
      confusionCodes: ["target_expression"],
      acceptedStrengthCategories: ["spatial_strategy"],
      weeklyObjectiveCount: 2,
      rawGraph: { private: true },
      rawAnswers: ["private answer"],
    },
  });

  assert.equal(graphRecord.visibility, "private_owner_only");
  assert.equal(envelope.valid, true);
  assert.equal(envelope.projection.rawGraphIncluded, false);
  assert.equal(envelope.projection.rawAnswersIncluded, false);
  assert.doesNotMatch(JSON.stringify(envelope), /private answer/u);

  const diagnosticRecommendation = assistantExchangeEnvelopeContract({
    senderRole: "teacher_assistant",
    recipientRole: "student_assistant",
    purpose: "intervention_planning",
    consentReceiptId: "consent-sharing-1",
    idempotencyKey: "exchange-2",
    expiresAt: "2026-07-20T12:00:00.000Z",
    projection: { recommendation: "Tu es autiste, donc utilise ce mode." },
  });
  assert.equal(diagnosticRecommendation.valid, false);
  assert.equal(diagnosticRecommendation.projection.recommendationRejected, true);
});

test("binds weekly objectives to a school year and treats silence as a valid preference", () => {
  const objective = weeklyObjectiveContract({
    title: "Revoir les angles avec une trajectoire de ballon",
    subject: "mathematics",
    schoolYear: "2026-2027",
    weekStart: "2026-09-07T00:00:00-04:00",
    targetDate: "2026-09-11T16:00:00-04:00",
    evidenceRefs: ["lesson:geometry-01"],
  });
  const quiet = interventionPreferencesContract({ frequency: "off", contexts: ["lesson", "private-monitoring"], maxDailyInterventions: 3 });

  assert.equal(objective.schoolYear, "2026-2027");
  assert.equal(objective.evidenceRefs.length, 1);
  assert.equal(quiet.quietMode, true);
  assert.equal(quiet.maxDailyInterventions, 0);
  assert.deepEqual(quiet.contexts, ["lesson"]);
  assert.equal(quiet.hiddenMonitoring, false);
});

test("suppresses administrative assistant output below the cohort threshold", () => {
  const suppressed = adminAssistantProjection({ cohortSize: 9, masteryCounts: { recalled: 8 }, interventionCount: 4 });
  const aggregate = adminAssistantProjection({ cohortSize: 10, masteryCounts: { recalled: 8 }, interventionCount: 4 });
  assert.equal(suppressed.suppressed, true);
  assert.equal(suppressed.cohortSize, null);
  assert.equal(suppressed.masteryCounts, null);
  assert.equal(aggregate.suppressed, false);
  assert.equal(aggregate.cohortSize, 10);
  assert.equal(aggregate.individualIdentifiersIncluded, false);
});

test("turns the math-soccer example into a learner-controlled experiment without diagnosis or forced positivity", () => {
  const response = empowermentResponseContract({
    difficulty: "Encore un D en mathematiques et je ne sais plus quoi faire.",
    strengthCategory: "soccer spatial strategy",
    strengthEvidence: "The learner scored a goal by reading space and timing a run.",
  });
  assert.match(response.candidateBridge, /angles, trajectoires, sequences/u);
  assert.match(response.evidenceBoundary, /ne prouve pas/u);
  assert.equal(response.diagnosis, null);
  assert.equal(response.fixedIntelligenceLabel, null);
  assert.equal(response.automaticFlattery, false);
  assert.equal(response.forcedPositivity, false);
  assert.doesNotMatch(JSON.stringify(response), /genie|surdoue|tout va bien/iu);
});

test("implements assistants, receipts, goals and interventions as durable bounded routes", async () => {
  const service = await readFile(new URL("../lib/teach-assistant-service.ts", import.meta.url), "utf8");
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  const migration = await readFile(new URL("../drizzle/0030_teach_assistants_and_goals.sql", import.meta.url), "utf8");
  const studentRoute = await readFile(new URL("../app/api/teach/assistant/student/route.ts", import.meta.url), "utf8");
  const teacherRoute = await readFile(new URL("../app/api/teach/assistant/teacher/route.ts", import.meta.url), "utf8");
  const adminRoute = await readFile(new URL("../app/api/teach/assistant/admin/route.ts", import.meta.url), "utf8");
  const exchangeRoute = await readFile(new URL("../app/api/teach/assistant/exchanges/route.ts", import.meta.url), "utf8");
  const goalRoute = await readFile(new URL("../app/api/teach/goals/route.ts", import.meta.url), "utf8");
  const interventionRoute = await readFile(new URL("../app/api/teach/interventions/route.ts", import.meta.url), "utf8");
  const algoquestRoute = await readFile(new URL("../app/api/algoquest/events/route.ts", import.meta.url), "utf8");

  assert.match(schema, /teach_assistant_graph_records/);
  assert.match(schema, /teach_assistant_exchanges/);
  assert.match(schema, /teach_weekly_objectives/);
  assert.match(schema, /teach_intervention_preferences/);
  assert.match(migration, /teach_assistant_exchange_idempotency_idx/);
  assert.match(service, /active relationship in the same course/);
  assert.match(service, /within the next seven days/);
  assert.match(service, /active learner sharing consent receipt/);
  assert.match(service, /Weekly objective not found for this learner/);
  assert.match(service, /teachPurposeConsents\.purpose, "learning"/);
  assert.match(service, /rawGraphIncluded: false/);
  assert.doesNotMatch(teacherRoute, /teachAssistantGraphRecords/u);
  assert.match(adminRoute, /administrativeAssistantView/);
  assert.match(studentRoute, /studentAssistantHome/);
  assert.match(exchangeRoute, /receipt: true/);
  assert.match(goalRoute, /saveWeeklyObjective/);
  assert.match(interventionRoute, /saveInterventionPreferences/);
  assert.match(algoquestRoute, /idempotencyKey/);
  assert.match(algoquestRoute, /status: "pending"/);
});

test("persists exact checkpoints and purpose-separated Teach consent", async () => {
  const service = await readFile(new URL("../lib/teach-service.ts", import.meta.url), "utf8");
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  const migration = await readFile(new URL("../drizzle/0029_scholarium_teach_core.sql", import.meta.url), "utf8");
  const consent = await readFile(new URL("../app/api/teach/consents/route.ts", import.meta.url), "utf8");
  assert.match(service, /teachCheckpoints/);
  assert.match(service, /onConflictDoUpdate/);
  assert.match(schema, /teach_purpose_consents/);
  assert.match(migration, /CREATE TABLE `teach_checkpoints`/);
  assert.match(migration, /CREATE TABLE `teach_modules`/);
  assert.match(migration, /CREATE TABLE `learning_questions`/);
  assert.match(migration, /CREATE TABLE `learning_hints`/);
  assert.match(migration, /CREATE TABLE `learning_reminders`/);
  assert.match(migration, /`submitted_question_id` text NOT NULL/);
  assert.match(consent, /"learning", "personalization", "profiling", "sharing", "media"/);
});

test("binds each answer to the active question and rejects OK or model repetition as mastery", () => {
  const objective = spanishStarterLesson.objectives[0];
  const correct = evaluateLearningAttempt({
    answer: objective.answer,
    assistanceLevel: "wait",
    expectedQuestionId: objective.question.id,
    questionId: objective.question.id,
    targetAnswer: objective.answer,
  });
  const wrongQuestion = evaluateLearningAttempt({
    answer: objective.answer,
    assistanceLevel: "wait",
    expectedQuestionId: objective.question.id,
    questionId: spanishStarterLesson.objectives[1].question.id,
    targetAnswer: objective.answer,
  });
  const confirmation = evaluateLearningAttempt({
    answer: "OK",
    assistanceLevel: "wait",
    expectedQuestionId: objective.question.id,
    questionId: objective.question.id,
    targetAnswer: objective.answer,
  });
  const repetition = evaluateLearningAttempt({
    answer: objective.answer,
    assistanceLevel: "full_model",
    expectedQuestionId: objective.question.id,
    questionId: objective.question.id,
    targetAnswer: objective.answer,
  });

  assert.equal(correct.nextState, "recalled");
  assert.equal(wrongQuestion.nextState, "review");
  assert.equal(wrongQuestion.errorCode, "question_context_mismatch");
  assert.equal(confirmation.nextState, "review");
  assert.equal(repetition.nextState, "guided");
  assert.notEqual(repetition.nextState, "mastered");
});

test("exposes five progressive assistance levels and immediate delayed spaced reminders", () => {
  const objective = spanishStarterLesson.objectives[0];
  assert.deepEqual(assistancePayload(objective, "wait").content, []);
  assert.deepEqual(assistancePayload(objective, "first_segment").content, ["Muy bien"]);
  assert.deepEqual(assistancePayload(objective, "segmented").content, ["Muy bien", "y tu"]);
  assert.deepEqual(assistancePayload(objective, "full_model").content, [objective.answer]);
  assert.equal(reminderForState("review", new Date(0)).cadence, "immediate");
  assert.equal(reminderForState("recalled", new Date(0)).cadence, "delayed");
  assert.equal(reminderForState("mastered", new Date(0)).cadence, "spaced");
});

test("builds a structured teacher summary without raw private answers", () => {
  const summary = teacherSessionSummary([{
    assistanceLevel: "hint",
    confusionCode: "target_expression",
    createdAt: new Date(0).toISOString(),
    errorCode: "target_expression_mismatch",
    objectiveId: "greeting",
    recallDelaySeconds: 0,
    responseTimeMs: 2_000,
    resultingState: "review",
    transferDemonstrated: false,
  }, {
    assistanceLevel: "wait",
    confusionCode: "none",
    createdAt: new Date(1_000).toISOString(),
    errorCode: "none",
    objectiveId: "greeting",
    recallDelaySeconds: 1_800,
    responseTimeMs: 1_000,
    resultingState: "contextualized",
    transferDemonstrated: true,
  }]);

  assert.equal(summary.rawTranscriptIncluded, false);
  assert.equal(summary.objectives[0].errors.target_expression_mismatch, 1);
  assert.equal(summary.objectives[0].maximumRecallDelaySeconds, 1_800);
  assert.equal(summary.objectives[0].transferEvidenceCount, 1);
  assert.doesNotMatch(JSON.stringify(summary), /"answer"/u);
});

test("validates the synthetic one-hour Spanish session with all four objectives and final conversation", () => {
  const validation = validateSpanishHourScenario();
  assert.equal(validation.valid, true);
  assert.equal(validation.durationMinutes, 60);
  assert.deepEqual(validation.exercisedObjectiveIds, ["age", "greeting", "name", "origin"]);
  assert.ok(validation.eventTypes.includes("final_conversation"));
  assert.ok(validation.eventTypes.includes("spaced_reminder_scheduled"));
});

test("normalizes seven user-controlled Teach accessibility profiles without diagnosis", () => {
  const settings = teachAccessibilitySettingsContract({
    profiles: {
      adhdSprint: true,
      autismCalm: true,
      deafSigned: true,
      dyslexiaReading: true,
      dyspraxiaMotor: true,
      nonVerbal: true,
      touretteSafe: true,
    },
    speechRate: 9,
    sprintMinutes: 1,
  });

  assert.equal(teachAccessibilityProfileIds.length, 7);
  assert.equal(Object.values(settings.profiles).filter(Boolean).length, 7);
  assert.equal(settings.showTranscript, true);
  assert.equal(settings.density, "reduced");
  assert.equal(settings.motion, "reduced");
  assert.equal(settings.readingMeasure, "narrow");
  assert.equal(settings.readingSpacing, "relaxed");
  assert.equal(settings.speechRate, 1.2);
  assert.equal(settings.sprintMinutes, 3);
  assert.match(settings.selectionBoundary, /never a diagnosis/);
  assert.equal(defaultTeachAccessibilitySettings.profiles.touretteSafe, false);
});

test("enforces edge-case-first accessibility as a CI contract", async () => {
  const client = await readFile(new URL("../app/teach/teach-client.tsx", import.meta.url), "utf8");
  const panel = await readFile(new URL("../app/teach/teach-accessibility-panel.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/teach/teach.css", import.meta.url), "utf8");

  for (const profile of ["deafSigned", "nonVerbal", "autismCalm", "touretteSafe", "adhdSprint", "dyslexiaReading", "dyspraxiaMotor"]) {
    assert.match(client + panel, new RegExp(profile));
  }
  assert.match(client, /teach-skip-link/);
  assert.match(client, /role="tablist"/);
  assert.match(client, /aria-live="polite"/);
  assert.match(client, /Tableau de communication/);
  assert.match(client, /Aucun avatar automatique/);
  assert.match(client, /Delai, mouvement et vocalisation ne modifient pas/);
  assert.match(panel, /Contraste eleve/);
  assert.match(panel, /Saturation reduite/);
  assert.match(panel, /Donnees reduites/);
  assert.match(panel, /Vitesse audio/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /teach-high-contrast/);
  assert.match(css, /teach-dyslexia-reading/);
  assert.match(css, /teach-large-targets/);
  assert.doesNotMatch(client, /onDrag|draggable|onPointerMove/);
});

test("enforces user-triggered, source-bound daily media quotas", async () => {
  const contract = await readFile(new URL("../lib/teach-contracts.ts", import.meta.url), "utf8");
  const mediaContract = await readFile(new URL("../lib/teach-media-contracts.ts", import.meta.url), "utf8");
  const service = await readFile(new URL("../lib/teach-service.ts", import.meta.url), "utf8");
  assert.match(contract, /dailyCount: 3, maximumMinutes: 5/);
  assert.match(contract, /dailyCount: 5, maximumMinutes: 30/);
  assert.match(mediaContract, /requires an explicit user action/);
  assert.match(mediaContract, /evidence reference and one provenance source id are required/);
  assert.match(service, /Daily \$\{draft\.kind\} quota reached/);
});

test("ships an edge-case-first learner and teacher interface", async () => {
  const client = await readFile(new URL("../app/teach/teach-client.tsx", import.meta.url), "utf8");
  const panel = await readFile(new URL("../app/teach/teach-accessibility-panel.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../app/teach/teach.css", import.meta.url), "utf8");
  assert.match(client + panel, /autismCalm/);
  assert.match(client + panel, /Voix facultative/);
  assert.match(client + panel, /Aucune penalite de delai/);
  assert.match(client, /MIROIR DES FORCES/);
  assert.match(client, /VUE ENSEIGNANT/);
  assert.match(client, /scholarium\.teach\.spanish\.checkpoint\.v1/);
  assert.match(css, /teach-large-targets/);
  assert.match(css, /teach-reduced-motion/);
  assert.match(css, /@media \(max-width: 480px\)/);
});

test("tracks exactly 163 accepted actions on disk", async () => {
  const matrix = await readFile(new URL("../../../docs/teach/ACTION_MATRIX.csv", import.meta.url), "utf8");
  const rows = matrix.trim().split(/\r?\n/u);
  assert.equal(rows.length, 164);
  assert.match(matrix, /"001"/);
  assert.match(matrix, /"163"/);
  assert.match(matrix, /See docs\/teach\/EVIDENCE_REGISTER\.md/);
});

test("documents external engines as adapters instead of web-bundle imports", async () => {
  const architecture = await readFile(new URL("../../../docs/teach/ARCHITECTURE.md", import.meta.url), "utf8");
  const contracts = await readFile(new URL("../lib/teach-contracts.ts", import.meta.url), "utf8");
  assert.match(architecture, /does not import `pluginpack`, the FfeD kernel, HippoRAG/);
  assert.doesNotMatch(contracts, /from ["'](?:pluginpack|hipporag|ffed)/i);
  assert.match(architecture, /Penrose or physics values never enter KDF, AAD, vault, or key material/);
});
