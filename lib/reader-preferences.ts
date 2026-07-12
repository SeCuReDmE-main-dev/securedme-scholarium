const supportedInterfaceLanguages = new Set(["en", "fr", "es", "pt", "de"]);
const supportedDigestCadences = new Set(["off", "daily", "weekly"]);
const supportedNotificationChannels = new Set(["in_app", "email"]);

export type AccessibilityPreferenceInput = {
  keyboardFirst?: unknown;
  reducedMotion?: unknown;
  screenReaderOptimized?: unknown;
};

export type NotificationPreferenceInput = {
  channels?: unknown;
  digestCadence?: unknown;
  moderationAlerts?: unknown;
  topicAlerts?: unknown;
};

export type TranslationPreferenceInput = {
  allowPublicationTranslation?: unknown;
  glossaryTerms?: unknown;
  interfaceLanguage?: unknown;
  showOriginalFirst?: unknown;
};

function booleanWithDefault(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function boundedString(value: unknown, fallback: string, supported: Set<string>) {
  if (typeof value !== "string") return fallback;
  const normalized = value.trim().toLowerCase();
  return supported.has(normalized) ? normalized : fallback;
}

function normalizedChannels(value: unknown) {
  if (!Array.isArray(value)) return ["in_app"];
  const channels = value
    .filter((channel): channel is string => typeof channel === "string")
    .map((channel) => channel.trim().toLowerCase())
    .filter((channel) => supportedNotificationChannels.has(channel));
  return [...new Set(channels)].slice(0, 2);
}

function normalizedGlossaryTerms(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .filter((term): term is string => typeof term === "string")
    .map((term) => term.trim())
    .filter(Boolean)
    .slice(0, 40))]
    .map((term) => term.length > 80 ? term.slice(0, 80) : term);
}

export function accessibilityPreferenceContract(input: AccessibilityPreferenceInput = {}) {
  return {
    status: "persisted",
    keyboardFirst: booleanWithDefault(input.keyboardFirst, true),
    reducedMotion: booleanWithDefault(input.reducedMotion, false),
    screenReaderOptimized: booleanWithDefault(input.screenReaderOptimized, false),
    guarantees: [
      "keyboard navigation remains a first-class path",
      "reduced motion disables non-essential animation",
      "screen-reader mode keeps semantic labels visible to assistive technology",
    ],
    persistenceBoundary: "durably stored in reader_preferences and portable in account export",
  };
}

export function notificationPreferenceContract(input: NotificationPreferenceInput = {}) {
  const channels = normalizedChannels(input.channels);
  return {
    status: "persisted",
    channels: channels.length > 0 ? channels : ["in_app"],
    digestCadence: boundedString(input.digestCadence, "off", supportedDigestCadences),
    topicAlerts: booleanWithDefault(input.topicAlerts, true),
    moderationAlerts: booleanWithDefault(input.moderationAlerts, true),
    guarantees: [
      "topic notifications are opt-in and never feed-ranking signals",
      "moderation and archive alerts stay account-bound",
      "email delivery is disabled unless the user explicitly selects email",
    ],
    persistenceBoundary: "durably stored in reader_preferences and portable in account export",
  };
}

export function translationPreferenceContract(input: TranslationPreferenceInput = {}) {
  return {
    status: "persisted",
    interfaceLanguage: boundedString(input.interfaceLanguage, "en", supportedInterfaceLanguages),
    showOriginalFirst: booleanWithDefault(input.showOriginalFirst, true),
    allowPublicationTranslation: booleanWithDefault(input.allowPublicationTranslation, false),
    glossaryTerms: normalizedGlossaryTerms(input.glossaryTerms),
    canonicalOriginalPolicy: "the original publication remains canonical and every automatic translation must be labeled",
    protectedContent: ["formulas", "citations", "identifiers", "provenance receipts"],
    persistenceBoundary: "durably stored in reader_preferences and portable in account export",
  };
}

export function readerPreferenceInsert(userId: string) {
  const accessibility = accessibilityPreferenceContract();
  const notifications = notificationPreferenceContract();
  const translations = translationPreferenceContract();
  return {
    allowPublicationTranslation: translations.allowPublicationTranslation,
    digestCadence: notifications.digestCadence,
    glossaryTerms: JSON.stringify(translations.glossaryTerms),
    interfaceLanguage: translations.interfaceLanguage,
    keyboardFirst: accessibility.keyboardFirst,
    moderationAlerts: notifications.moderationAlerts,
    notificationChannels: JSON.stringify(notifications.channels),
    reducedMotion: accessibility.reducedMotion,
    screenReaderOptimized: accessibility.screenReaderOptimized,
    showOriginalFirst: translations.showOriginalFirst,
    topicAlerts: notifications.topicAlerts,
    userId,
  };
}

export function accessibilityPreferenceFromRow(row: { keyboardFirst: boolean; reducedMotion: boolean; screenReaderOptimized: boolean } | null | undefined) {
  return accessibilityPreferenceContract(row ?? {});
}

export function notificationPreferenceFromRow(row: { digestCadence: string; moderationAlerts: boolean; notificationChannels: string; topicAlerts: boolean } | null | undefined) {
  return notificationPreferenceContract({
    channels: safeJsonArray(row?.notificationChannels, ["in_app"]),
    digestCadence: row?.digestCadence,
    moderationAlerts: row?.moderationAlerts,
    topicAlerts: row?.topicAlerts,
  });
}

export function translationPreferenceFromRow(row: { allowPublicationTranslation: boolean; glossaryTerms: string; interfaceLanguage: string; showOriginalFirst: boolean } | null | undefined) {
  return translationPreferenceContract({
    allowPublicationTranslation: row?.allowPublicationTranslation,
    glossaryTerms: safeJsonArray(row?.glossaryTerms, []),
    interfaceLanguage: row?.interfaceLanguage,
    showOriginalFirst: row?.showOriginalFirst,
  });
}

function safeJsonArray(value: string | null | undefined, fallback: string[]) {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}
