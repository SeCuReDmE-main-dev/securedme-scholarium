const supportedCurrencies = new Set(["USD", "CAD", "EUR"]);
const supportedProviders = new Set(["paypal", "stripe_connect"]);

export const fundingPolicy = {
  custody: "Scholarium never stores card data, wallet private keys, or directly holds user funds.",
  ranking: "Funding campaign status, goal, contribution count, and contribution amount are excluded from discovery ranking.",
  minors: "Minor accounts cannot create campaigns or contribute without a reviewed supervised flow.",
  beneficiary: "A beneficiary must complete hosted provider/KYC verification before a campaign can receive funds.",
  publicProgress: "Progress is public only when the owner explicitly enables it; private contribution amounts are never exposed.",
  launchBoundary: "This route prepares campaign and contribution intent records only. Provider onboarding, capture, refund, dispute, and territory approval remain launch-gated.",
} as const;

export function normalizeCampaignTitle(value: unknown) {
  const title = String(value ?? "").trim().slice(0, 160);
  return title.length >= 6 ? title : null;
}

export function normalizeCampaignPurpose(value: unknown) {
  return String(value ?? "").trim().slice(0, 3_000);
}

export function normalizeGoalCents(value: unknown) {
  const cents = Math.round(Number(value));
  if (!Number.isFinite(cents)) return null;
  return cents >= 100 && cents <= 10_000_000 ? cents : null;
}

export function normalizeContributionCents(value: unknown) {
  const cents = Math.round(Number(value));
  if (!Number.isFinite(cents)) return null;
  return cents >= 100 && cents <= 250_000 ? cents : null;
}

export function normalizeCurrency(value: unknown) {
  const currency = String(value ?? "USD").trim().toUpperCase();
  return supportedCurrencies.has(currency) ? currency : "USD";
}

export function normalizeFundingProvider(value: unknown) {
  return typeof value === "string" && supportedProviders.has(value) ? value : "paypal";
}

export function normalizeDeadline(value: unknown) {
  if (!value) return null;
  if (typeof value !== "string") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}
