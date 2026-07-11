export type PublicationSafetyDecision = {
  action: "allow" | "quarantine";
  reasonCode?: "possible_api_secret" | "possible_private_key";
  authorMessage?: string;
};

const privateKey = /-----BEGIN(?: [A-Z]+)? PRIVATE KEY-----/u;
const apiSecretPatterns = [
  /\bghp_[A-Za-z0-9]{30,}\b/u,
  /\bgithub_pat_[A-Za-z0-9_]{30,}\b/u,
  /\bAIza[A-Za-z0-9_-]{35}\b/u,
  /\bAKIA[0-9A-Z]{16}\b/u,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/u,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/u,
];

/**
 * Detects only narrow credential-shaped strings. It deliberately does not
 * evaluate a claim, ideology, author, research field, or scientific truth.
 */
export function publicationSafetyDecision(input: { abstract: string; title: string }): PublicationSafetyDecision {
  const text = `${input.title}\n${input.abstract}`;
  if (privateKey.test(text)) {
    return {
      action: "quarantine",
      authorMessage: "A private-key marker may be exposed. This work was saved privately so you can remove it before publishing.",
      reasonCode: "possible_private_key",
    };
  }
  if (apiSecretPatterns.some((pattern) => pattern.test(text))) {
    return {
      action: "quarantine",
      authorMessage: "A credential-shaped value may be exposed. This work was saved privately so you can remove it before publishing.",
      reasonCode: "possible_api_secret",
    };
  }
  return { action: "allow" };
}
