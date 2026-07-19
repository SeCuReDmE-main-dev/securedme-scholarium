export const teachSchemaVersions = {
  learningObjective: "scholarium.learning-objective.v1",
  learningAttempt: "scholarium.learning-attempt.v1",
  masteryEvidence: "scholarium.mastery-evidence.v1",
  strengthObservation: "scholarium.strength-observation.v1",
  growthStory: "scholarium.growth-story.v1",
  algoquestEvent: "scholarium.algoquest.learning-event.v1",
  assistantGraphRecord: "scholarium.assistant-graph-record.v1",
  assistantExchange: "scholarium.assistant-exchange.v1",
  weeklyObjective: "scholarium.weekly-objective.v1",
  interventionPreferences: "scholarium.intervention-preferences.v1",
  mediaRequest: "scholarium.media-generation-request.v1",
} as const;

export const masteryStates = ["new", "guided", "recalled", "contextualized", "mastered", "review"] as const;
export type MasteryState = (typeof masteryStates)[number];

export const assistanceLevels = ["wait", "hint", "first_segment", "segmented", "full_model"] as const;
export type AssistanceLevel = (typeof assistanceLevels)[number];

export type LearningAttemptInput = {
  answer?: unknown;
  assistanceLevel?: unknown;
  delayedRecall?: unknown;
  expectedQuestionId?: unknown;
  questionId?: unknown;
  recallDelaySeconds?: unknown;
  restartedWithoutConfusion?: unknown;
  responseTimeMs?: unknown;
  targetAnswer?: unknown;
  transferDemonstrated?: unknown;
};

function boundedText(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function boundedInteger(value: unknown, fallback: number, minimum: number, maximum: number) {
  return Number.isInteger(value) ? Math.min(maximum, Math.max(minimum, Number(value))) : fallback;
}

function normalizedSpeech(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9\s]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

export function evaluateLearningAttempt(input: LearningAttemptInput) {
  const answer = boundedText(input.answer, 600);
  const targetAnswer = boundedText(input.targetAnswer, 600);
  const questionId = boundedText(input.questionId, 160);
  const expectedQuestionId = boundedText(input.expectedQuestionId, 160);
  const assistanceLevel = assistanceLevels.includes(input.assistanceLevel as AssistanceLevel)
    ? input.assistanceLevel as AssistanceLevel
    : "full_model";
  const answerMatches = Boolean(answer && targetAnswer && normalizedSpeech(answer) === normalizedSpeech(targetAnswer));
  const unaided = assistanceLevel === "wait";
  const contextMatched = Boolean(questionId && expectedQuestionId && questionId === expectedQuestionId);
  const recallDelaySeconds = boundedInteger(input.recallDelaySeconds, 0, 0, 31_536_000);
  const delayedRecall = input.delayedRecall === true && recallDelaySeconds >= 600;
  const restartedWithoutConfusion = input.restartedWithoutConfusion === true;
  const transferDemonstrated = input.transferDemonstrated === true;
  const responseTimeMs = boundedInteger(input.responseTimeMs, 0, 0, 3_600_000);
  const masteryEvidenceCount = [answerMatches, unaided, contextMatched, delayedRecall, restartedWithoutConfusion, transferDemonstrated].filter(Boolean).length;

  let nextState: MasteryState = "guided";
  if (!answerMatches || !contextMatched) nextState = "review";
  else if (masteryEvidenceCount >= 6) nextState = "mastered";
  else if (delayedRecall && unaided) nextState = "contextualized";
  else if (unaided) nextState = "recalled";

  const errorCode = !answer
    ? "no_response"
    : !contextMatched
      ? "question_context_mismatch"
      : !answerMatches
        ? "target_expression_mismatch"
        : assistanceLevel === "full_model"
          ? "model_repetition"
          : "none";
  const confusionCode = errorCode === "question_context_mismatch"
    ? "active_question_binding"
    : errorCode === "target_expression_mismatch"
      ? "target_expression"
      : "none";

  return {
    schema: teachSchemaVersions.learningAttempt,
    answerMatches,
    assistanceLevel,
    contextMatched,
    delayedRecall,
    errorCode,
    confusionCode,
    masteryEvidenceCount,
    nextState,
    questionId,
    recallDelaySeconds,
    responseTimeMs,
    restartedWithoutConfusion,
    transferDemonstrated,
    masteryPolicy: "A confirmation, reading, or immediate repetition is never sufficient evidence of mastery.",
  };
}

export const spanishStarterLesson = {
  id: "spanish-daily-conversation-01",
  schema: teachSchemaVersions.learningObjective,
  course: { id: "spanish-conversation-course", title: "Espagnol conversationnel" },
  module: { id: "spanish-foundations-module", title: "Premiers echanges", position: 0 },
  title: "Conversation quotidienne - premiers echanges",
  durationMinutes: 60,
  locale: "es",
  objectives: [
    {
      id: "greeting", notion: "saluer et retourner la question", prompt: "Hola, como estas?", answer: "Muy bien, y tu?", translation: "Bonjour, comment vas-tu?", phonetic: "O-la, co-mo ess-tass?",
      question: { id: "greeting-primary", contextKey: "daily-greeting", kind: "primary" },
      segments: ["Muy bien", "y tu"], hint: "Reponds que tu vas bien, puis retourne la question.",
    },
    {
      id: "name", notion: "se presenter", prompt: "Como te llamas?", answer: "Me llamo Jean-Sebastien.", translation: "Comment t'appelles-tu?", phonetic: "Co-mo te ya-mass?",
      question: { id: "name-primary", contextKey: "self-introduction", kind: "primary" },
      segments: ["Me llamo", "Jean-Sebastien"], hint: "Commence par la structure espagnole pour dire ton nom.",
    },
    {
      id: "origin", notion: "indiquer son origine", prompt: "De donde eres?", answer: "Soy de Montreal.", translation: "D'ou viens-tu?", phonetic: "De don-de e-ress?",
      question: { id: "origin-primary", contextKey: "place-of-origin", kind: "primary" },
      segments: ["Soy de", "Montreal"], hint: "Utilise la structure qui signifie: je suis de...",
    },
    {
      id: "age", notion: "indiquer son age", prompt: "Cuantos anos tienes?", answer: "Tengo cuarenta y tres anos.", translation: "Quel age as-tu?", phonetic: "Couan-toss a-gnoss tie-ness?",
      question: { id: "age-primary", contextKey: "personal-age", kind: "primary" },
      segments: ["Tengo", "cuarenta y tres", "anos"], hint: "En espagnol, on dit litteralement que l'on a un nombre d'annees.",
    },
  ],
  reminders: { immediateMinutes: 5, delayedMinutes: 30, spacedHours: 72 },
  finalConversation: {
    id: "spanish-conversation-final-01",
    requiredObjectiveIds: ["greeting", "name", "origin", "age"],
    prompt: "Reponds sans modele a une conversation qui combine salutation, nom, origine et age.",
  },
  guarantees: ["one active expression at a time", "resume from the exact checkpoint", "advance only from mastery evidence"],
} as const;

export type SpanishObjective = (typeof spanishStarterLesson.objectives)[number];

export function assistancePayload(objective: SpanishObjective, level: AssistanceLevel) {
  const payloads = {
    wait: { content: [] as string[], exposesTarget: false },
    hint: { content: [objective.hint], exposesTarget: false },
    first_segment: { content: [objective.segments[0]], exposesTarget: false },
    segmented: { content: [...objective.segments], exposesTarget: true },
    full_model: { content: [objective.answer], exposesTarget: true },
  } as const;
  return { level, ...payloads[level] };
}

export function reminderForState(state: MasteryState, from: Date = new Date()) {
  const schedule = state === "mastered" || state === "contextualized"
    ? { cadence: "spaced", delayMinutes: spanishStarterLesson.reminders.spacedHours * 60 }
    : state === "recalled"
      ? { cadence: "delayed", delayMinutes: spanishStarterLesson.reminders.delayedMinutes }
      : { cadence: "immediate", delayMinutes: spanishStarterLesson.reminders.immediateMinutes };
  return { ...schedule, dueAt: new Date(from.getTime() + schedule.delayMinutes * 60_000).toISOString() };
}

export type StructuredAttempt = {
  assistanceLevel: AssistanceLevel;
  confusionCode: string;
  createdAt: string;
  errorCode: string;
  objectiveId: string;
  recallDelaySeconds: number;
  responseTimeMs: number;
  resultingState: MasteryState;
  transferDemonstrated: boolean;
};

export function teacherSessionSummary(attempts: StructuredAttempt[]) {
  const objectives = new Map<string, StructuredAttempt[]>();
  for (const attempt of attempts) objectives.set(attempt.objectiveId, [...(objectives.get(attempt.objectiveId) ?? []), attempt]);
  const frequency = (values: string[]) => Object.fromEntries([...new Set(values)].sort().map((value) => [value, values.filter((candidate) => candidate === value).length]));
  return {
    schema: "scholarium.teacher-session-summary.v1",
    rawTranscriptIncluded: false,
    attemptCount: attempts.length,
    objectiveCount: objectives.size,
    objectives: [...objectives.entries()].map(([objectiveId, rows]) => ({
      objectiveId,
      attemptCount: rows.length,
      latestState: rows.at(-1)?.resultingState ?? "new",
      assistance: frequency(rows.map((row) => row.assistanceLevel)),
      errors: frequency(rows.map((row) => row.errorCode).filter((value) => value !== "none")),
      confusions: frequency(rows.map((row) => row.confusionCode).filter((value) => value !== "none")),
      averageResponseTimeMs: Math.round(rows.reduce((sum, row) => sum + row.responseTimeMs, 0) / rows.length),
      maximumRecallDelaySeconds: Math.max(...rows.map((row) => row.recallDelaySeconds), 0),
      transferEvidenceCount: rows.filter((row) => row.transferDemonstrated).length,
    })),
    authorityBoundary: "This structured summary supports educator review and never includes raw private answers or autonomous grading.",
  };
}

export const spanishHourValidationScenario = {
  schema: "scholarium.spanish-session-validation.v1",
  synthetic: true,
  durationMinutes: 60,
  events: [
    { minute: 0, type: "session_start" },
    { minute: 3, type: "guided_attempt", objectiveId: "greeting" },
    { minute: 8, type: "immediate_reminder", objectiveId: "greeting" },
    { minute: 12, type: "guided_attempt", objectiveId: "name" },
    { minute: 18, type: "guided_attempt", objectiveId: "origin" },
    { minute: 24, type: "guided_attempt", objectiveId: "age" },
    { minute: 30, type: "delayed_reminder", objectiveId: "greeting" },
    { minute: 36, type: "independent_recall", objectiveId: "name" },
    { minute: 42, type: "context_transfer", objectiveId: "origin" },
    { minute: 48, type: "spaced_reminder_scheduled", objectiveId: "age" },
    { minute: 55, type: "final_conversation", objectiveIds: ["greeting", "name", "origin", "age"] },
    { minute: 60, type: "session_summary" },
  ],
  finalConversationId: spanishStarterLesson.finalConversation.id,
} as const;

export function validateSpanishHourScenario() {
  const objectiveIds = new Set(spanishStarterLesson.objectives.map((objective) => objective.id));
  const exercised = new Set(spanishHourValidationScenario.events.flatMap((event) => "objectiveId" in event ? [event.objectiveId] : "objectiveIds" in event ? [...event.objectiveIds] : []));
  const eventTypes = new Set(spanishHourValidationScenario.events.map((event) => event.type));
  return {
    valid: spanishHourValidationScenario.durationMinutes >= 55
      && spanishHourValidationScenario.durationMinutes <= 65
      && [...objectiveIds].every((objectiveId) => exercised.has(objectiveId))
      && eventTypes.has("immediate_reminder")
      && eventTypes.has("delayed_reminder")
      && eventTypes.has("spaced_reminder_scheduled")
      && eventTypes.has("final_conversation"),
    durationMinutes: spanishHourValidationScenario.durationMinutes,
    exercisedObjectiveIds: [...exercised].sort(),
    eventTypes: [...eventTypes].sort(),
  };
}

export type StrengthObservationInput = {
  category?: unknown;
  confidence?: unknown;
  contradiction?: unknown;
  expiresAt?: unknown;
  evidence?: unknown;
  learnerCorrection?: unknown;
  sourceKind?: unknown;
  statement?: unknown;
};

export function strengthObservationContract(input: StrengthObservationInput) {
  const sourceKinds = ["declared", "observed", "proposed"];
  const sourceKind = typeof input.sourceKind === "string" && sourceKinds.includes(input.sourceKind) ? input.sourceKind : "proposed";
  return {
    schema: teachSchemaVersions.strengthObservation,
    category: boundedText(input.category, 80),
    statement: boundedText(input.statement, 500),
    evidence: boundedText(input.evidence, 1_200),
    contradiction: boundedText(input.contradiction, 1_200),
    learnerCorrection: boundedText(input.learnerCorrection, 1_200),
    confidence: Math.min(1, Math.max(0, typeof input.confidence === "number" && Number.isFinite(input.confidence) ? input.confidence : 0)),
    sourceKind,
    status: sourceKind === "declared" ? "active" : "pending_student_review",
    expiresAt: isoTimestamp(input.expiresAt) || null,
    authorityBoundary: "This is a contestable learning hypothesis, never a diagnosis or fixed intelligence label.",
  };
}

export function soccerMathBridge() {
  return strengthObservationContract({
    category: "spatial_strategy",
    confidence: 0.65,
    sourceKind: "proposed",
    statement: "Reading space, timing a run, and choosing a shot may support work with angles, trajectories, geometry, and conditional strategy.",
    evidence: "The learner reported scoring a soccer goal during a week that also included difficulty in mathematics.",
    contradiction: "Sport success does not prove mathematics mastery; the bridge must be tested through a learner-chosen activity.",
  });
}

const assistantGraphRecordKinds = ["learning_evidence", "accepted_strength", "weekly_objective", "learner_preference"] as const;
const assistantExchangePurposes = ["progress_review", "intervention_planning", "weekly_alignment"] as const;
const assistantRoles = ["student_assistant", "teacher_assistant"] as const;
const interventionContexts = ["lesson", "reminder", "project", "growth_story"] as const;
const interventionFrequencies = ["off", "daily", "school_days", "weekly"] as const;

function boundedStringList(value: unknown, supported: readonly string[] | null, maximumItems: number, maximumLength: number) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, maximumLength))
    .filter((item) => item && (!supported || supported.includes(item))))]
    .slice(0, maximumItems);
}

function isoTimestamp(value: unknown) {
  if (typeof value !== "string" || !value.trim() || !Number.isFinite(Date.parse(value))) return "";
  return new Date(value).toISOString();
}

export function assistantGraphRecordContract(input: Record<string, unknown>) {
  const recordKind = assistantGraphRecordKinds.includes(input.recordKind as (typeof assistantGraphRecordKinds)[number])
    ? input.recordKind as (typeof assistantGraphRecordKinds)[number]
    : "learning_evidence";
  return {
    schema: teachSchemaVersions.assistantGraphRecord,
    recordKind,
    subjectRef: boundedText(input.subjectRef, 240),
    summary: boundedText(input.summary, 600),
    provenanceRef: boundedText(input.provenanceRef, 300),
    expiresAt: isoTimestamp(input.expiresAt) || null,
    visibility: "private_owner_only" as const,
    authorityBoundary: "This private graph record supports the learner assistant and is never an official grade, diagnosis, or fixed learner label.",
  };
}

export function weeklyObjectiveContract(input: Record<string, unknown>) {
  const schoolYear = typeof input.schoolYear === "string" && /^\d{4}-\d{4}$/u.test(input.schoolYear.trim()) ? input.schoolYear.trim() : "";
  const status = ["planned", "active", "completed", "paused"].includes(String(input.status)) ? String(input.status) : "planned";
  return {
    schema: teachSchemaVersions.weeklyObjective,
    title: boundedText(input.title, 180),
    subject: boundedText(input.subject, 80),
    schoolYear,
    weekStart: isoTimestamp(input.weekStart),
    targetDate: isoTimestamp(input.targetDate),
    status,
    evidenceRefs: boundedStringList(input.evidenceRefs, null, 12, 300),
    learnerControl: "The learner can pause, edit, complete, or delete this objective.",
  };
}

export function interventionPreferencesContract(input: Record<string, unknown>) {
  const frequency = interventionFrequencies.includes(input.frequency as (typeof interventionFrequencies)[number])
    ? input.frequency as (typeof interventionFrequencies)[number]
    : "off";
  const quietUntil = isoTimestamp(input.quietUntil);
  const maxDailyInterventions = frequency === "off" ? 0 : boundedInteger(input.maxDailyInterventions, 1, 0, 3);
  return {
    schema: teachSchemaVersions.interventionPreferences,
    frequency,
    contexts: boundedStringList(input.contexts, interventionContexts, interventionContexts.length, 40),
    quietMode: input.quietMode === true || frequency === "off",
    quietUntil: quietUntil || null,
    maxDailyInterventions,
    hiddenMonitoring: false,
    learnerControl: "Silence is a valid preference and can be changed without penalty.",
  };
}

function assistantProjectionContract(input: unknown) {
  const projection = recordValue(input);
  const stateSource = recordValue(projection.objectiveStateCounts);
  const proposedRecommendation = boundedText(projection.recommendation, 600);
  const prohibitedRecommendation = /\b(?:diagnostic|tu es autiste|est autiste|tu es tdah|est tdah|tu es surdoue|est surdoue|tu es nul|est nul|tu es un genie|tout va bien)\b/iu.test(proposedRecommendation);
  const objectiveStateCounts = Object.fromEntries(masteryStates.map((state) => [
    state,
    boundedInteger(stateSource[state], 0, 0, 100_000),
  ]));
  return {
    objectiveStateCounts,
    confusionCodes: boundedStringList(projection.confusionCodes, null, 12, 80),
    acceptedStrengthCategories: boundedStringList(projection.acceptedStrengthCategories, null, 12, 80),
    weeklyObjectiveCount: boundedInteger(projection.weeklyObjectiveCount, 0, 0, 1_000),
    recommendation: prohibitedRecommendation ? "" : proposedRecommendation,
    recommendationRejected: prohibitedRecommendation,
    rawGraphIncluded: false,
    rawAnswersIncluded: false,
  };
}

export function assistantExchangeEnvelopeContract(input: Record<string, unknown>) {
  const senderRoleRecognized = assistantRoles.includes(input.senderRole as (typeof assistantRoles)[number]);
  const recipientRoleRecognized = assistantRoles.includes(input.recipientRole as (typeof assistantRoles)[number]);
  const senderRole = senderRoleRecognized
    ? input.senderRole as (typeof assistantRoles)[number]
    : "student_assistant";
  const recipientRole = recipientRoleRecognized
    ? input.recipientRole as (typeof assistantRoles)[number]
    : "teacher_assistant";
  const purpose = assistantExchangePurposes.includes(input.purpose as (typeof assistantExchangePurposes)[number])
    ? input.purpose as (typeof assistantExchangePurposes)[number]
    : "";
  const expiresAt = isoTimestamp(input.expiresAt);
  const projection = assistantProjectionContract(input.projection);
  return {
    schema: teachSchemaVersions.assistantExchange,
    senderRole,
    recipientRole,
    purpose,
    consentReceiptId: boundedText(input.consentReceiptId, 160),
    idempotencyKey: boundedText(input.idempotencyKey, 160),
    expiresAt,
    projection,
    valid: Boolean(senderRoleRecognized && recipientRoleRecognized && purpose && expiresAt && senderRole !== recipientRole && (senderRole !== "teacher_assistant" || (projection.recommendation && !projection.recommendationRejected))),
    privacyBoundary: "Assistant exchange carries a server-built projection, never the learner's private graph or raw answers.",
  };
}

export function adminAssistantProjection(input: { cohortSize?: unknown; masteryCounts?: unknown; interventionCount?: unknown }) {
  const cohortSize = boundedInteger(input.cohortSize, 0, 0, 1_000_000);
  const suppressed = cohortSize < 10;
  return {
    schema: "scholarium.admin-assistant-aggregate.v1",
    cohortSize: suppressed ? null : cohortSize,
    masteryCounts: suppressed ? null : assistantProjectionContract({ objectiveStateCounts: input.masteryCounts }).objectiveStateCounts,
    interventionCount: suppressed ? null : boundedInteger(input.interventionCount, 0, 0, 1_000_000),
    suppressed,
    suppressionReason: suppressed ? "minimum_cohort_10" : null,
    individualIdentifiersIncluded: false,
    authorityBoundary: "Administrative assistants receive authorized aggregates only and cannot make disciplinary or learner-level decisions.",
  };
}

export function empowermentResponseContract(input: { difficulty?: unknown; strengthCategory?: unknown; strengthEvidence?: unknown }) {
  const difficulty = boundedText(input.difficulty, 500);
  const strengthCategory = boundedText(input.strengthCategory, 80);
  const strengthEvidence = boundedText(input.strengthEvidence, 600);
  const spatialBridge = /spatial|soccer|sport|football/iu.test(`${strengthCategory} ${strengthEvidence}`);
  return {
    schema: "scholarium.empowerment-response.v1",
    acknowledgement: difficulty
      ? "La difficulte est reelle et merite une strategie precise; elle ne resume pas la personne."
      : "Il faut d'abord nommer la difficulte avant de proposer une strategie.",
    candidateBridge: spatialBridge
      ? "Tester une representation par espace, angles, trajectoires, sequences et decisions conditionnelles."
      : "Choisir avec l'eleve une force documentee et tester un pont concret vers la notion travaillee.",
    evidenceBoundary: "Une reussite dans un domaine ne prouve pas la maitrise d'un autre domaine; le pont reste une hypothese a tester.",
    nextAction: "Proposer une petite experience, recueillir la reponse de l'eleve, puis conserver ou corriger l'hypothese.",
    learnerControl: "L'eleve peut accepter, reformuler, contester, expirer ou supprimer cette interpretation.",
    diagnosis: null,
    fixedIntelligenceLabel: null,
    automaticFlattery: false,
    forcedPositivity: false,
  };
}

export const teachAccessibilityProfiles = {
  deafSigned: { label: "Sourd / langue signée", transcript: true, audioRequired: false, visualSequence: true, signedContentWhenAvailable: true, humanVerifiedSignOnly: true },
  nonVerbal: { label: "Communication non verbale", voiceRequired: false, text: true, choiceBoard: true, assistiveCommunication: true },
  autismCalm: { label: "Autism Calm", predictableSequence: true, surpriseTransitions: false, reducedDensity: true },
  touretteSafe: { label: "Tourette Safe", penalizeDelay: false, penalizeMovement: false, penalizeVocalization: false },
  adhdSprint: { label: "ADHD Sprint", visibleNextAction: true, optionalTimer: true, shortActivationLoop: true },
  dyslexiaReading: { label: "Lecture adaptée à la dyslexie", adjustableSpacing: true, adjustableMeasure: true, readAloud: true },
  dyspraxiaMotor: { label: "Motricité adaptée à la dyspraxie", oversizedTargets: true, precisionGesturesRequired: false },
} as const;

export const teachAccessibilityProfileIds = Object.keys(teachAccessibilityProfiles) as Array<keyof typeof teachAccessibilityProfiles>;
export type TeachAccessibilityProfileId = (typeof teachAccessibilityProfileIds)[number];

export type TeachAccessibilitySettings = {
  profiles: Record<TeachAccessibilityProfileId, boolean>;
  contrast: "standard" | "high";
  dataSaver: boolean;
  density: "standard" | "reduced";
  motion: "standard" | "reduced";
  readingMeasure: "standard" | "narrow";
  readingSpacing: "standard" | "relaxed";
  saturation: "standard" | "reduced";
  selectionBoundary: string;
  showTranscript: boolean;
  sound: "on" | "muted";
  speechRate: number;
  sprintMinutes: number;
};

export const defaultTeachAccessibilitySettings: TeachAccessibilitySettings = {
  profiles: {
    deafSigned: false,
    nonVerbal: false,
    autismCalm: false,
    touretteSafe: false,
    adhdSprint: false,
    dyslexiaReading: false,
    dyspraxiaMotor: false,
  },
  contrast: "standard",
  dataSaver: false,
  density: "standard",
  motion: "standard",
  readingMeasure: "standard",
  readingSpacing: "standard",
  saturation: "standard",
  selectionBoundary: "User-controlled interface preferences; never a diagnosis, disability inference, or fixed learner label.",
  showTranscript: false,
  sound: "on",
  speechRate: 0.85,
  sprintMinutes: 10,
};

function recordValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function supportedValue<T extends string>(value: unknown, supported: readonly T[], fallback: T): T {
  return typeof value === "string" && supported.includes(value as T) ? value as T : fallback;
}

export function teachAccessibilitySettingsContract(input: unknown = {}): TeachAccessibilitySettings {
  const source = recordValue(input);
  const profileSource = recordValue(source.profiles);
  const profiles = Object.fromEntries(teachAccessibilityProfileIds.map((profileId) => [
    profileId,
    profileSource[profileId] === true,
  ])) as Record<TeachAccessibilityProfileId, boolean>;
  const speechRate = typeof source.speechRate === "number" && Number.isFinite(source.speechRate)
    ? Math.round(Math.min(1.2, Math.max(0.6, source.speechRate)) * 20) / 20
    : defaultTeachAccessibilitySettings.speechRate;
  const sprintMinutes = Number.isInteger(source.sprintMinutes)
    ? Math.min(25, Math.max(3, Number(source.sprintMinutes)))
    : defaultTeachAccessibilitySettings.sprintMinutes;

  return {
    profiles,
    contrast: supportedValue(source.contrast, ["standard", "high"], "standard"),
    dataSaver: source.dataSaver === true,
    density: supportedValue(source.density, ["standard", "reduced"], profiles.autismCalm ? "reduced" : "standard"),
    motion: supportedValue(source.motion, ["standard", "reduced"], profiles.autismCalm ? "reduced" : "standard"),
    readingMeasure: supportedValue(source.readingMeasure, ["standard", "narrow"], profiles.dyslexiaReading ? "narrow" : "standard"),
    readingSpacing: supportedValue(source.readingSpacing, ["standard", "relaxed"], profiles.dyslexiaReading ? "relaxed" : "standard"),
    saturation: supportedValue(source.saturation, ["standard", "reduced"], "standard"),
    selectionBoundary: defaultTeachAccessibilitySettings.selectionBoundary,
    showTranscript: source.showTranscript === true || profiles.deafSigned,
    sound: supportedValue(source.sound, ["on", "muted"], "on"),
    speechRate,
    sprintMinutes,
  };
}

export const mediaDailyLimits = {
  video: { dailyCount: 3, maximumMinutes: 5 },
  podcast: { dailyCount: 5, maximumMinutes: 30 },
} as const;

export function mediaGenerationContract(input: { durationMinutes?: unknown; kind?: unknown; sourceRef?: unknown; userTriggered?: unknown }) {
  const kind = input.kind === "podcast" ? "podcast" : "video";
  const limit = mediaDailyLimits[kind];
  const durationMinutes = boundedInteger(input.durationMinutes, limit.maximumMinutes, 1, limit.maximumMinutes);
  return {
    schema: teachSchemaVersions.mediaRequest,
    kind,
    durationMinutes,
    sourceRef: boundedText(input.sourceRef, 300),
    userTriggered: input.userTriggered === true,
    status: input.userTriggered === true ? "quota_check_required" : "rejected",
    publicationBoundary: "Generation never publishes to an external provider without a separate confirmation.",
  };
}
