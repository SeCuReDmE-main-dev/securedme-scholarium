import { canActivateVerifiedContributor } from "./verified-subscription";

export const quantechProviderSurface = {
  marketUrl: "https://chromewebstore.google.com/detail/hkdelebkhegbiohndnckbmkjhfbnfehd",
  officialUrl: "https://quantech-vid.securedme.ca",
  scholariumUrl: "https://www.scholarium.securedme.ca/app",
} as const;

export type QuantechRenderInput = {
  aspect?: string;
  qualityPreset?: string;
  reviewMode?: string;
  script?: string;
  title?: string;
};

export type QuantechRenderPreparation = {
  requestId: string;
  provider: "QuaNTecH-ViD";
  status: "prepared";
  handoffUrl: string;
  entitlement: {
    status: "scholarium_free_feature" | "bundle_not_connected";
    allowed: true;
    reason: string;
    freeCompletedRendersPerRollingWindow: number;
    rollingWindowHours: number;
  };
  payloadBoundary: {
    transmits: string[];
    excludes: string[];
    scriptDigest: string;
    sourceUrlCount: number;
  };
  reviewBoundary: {
    localOnly: boolean;
    note: string;
  };
  nextStep: string;
};

async function sha256Hex(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function countSourceUrls(script: string) {
  return (script.match(/https?:\/\//giu) ?? []).length;
}

export async function prepareQuantechRenderRequest(input: QuantechRenderInput, context: {
  accountReady: boolean;
  documentStatus: string | null;
  passkeyVerifiedAt: string | null;
}) : Promise<QuantechRenderPreparation> {
  const aspect = input.aspect === "portrait" || input.aspect === "square" ? input.aspect : "landscape";
  const qualityPreset = input.qualityPreset === "high" ? "high" : "standard";
  const reviewMode = input.reviewMode === "local_videoprism" ? "local_videoprism" : "none";
  const title = String(input.title ?? "").trim().slice(0, 240);
  const script = String(input.script ?? "").trim().slice(0, 12_000);
  const providerVerified = canActivateVerifiedContributor({
    documentStatus: context.documentStatus,
    passkeyVerifiedAt: context.passkeyVerifiedAt,
  });

  return {
    requestId: crypto.randomUUID(),
    provider: "QuaNTecH-ViD",
    status: "prepared",
    handoffUrl: quantechProviderSurface.officialUrl,
    entitlement: {
      status: providerVerified ? "bundle_not_connected" : "scholarium_free_feature",
      allowed: true,
      reason: providerVerified
        ? "The account is eligible for verified-provider routing, but no live Scholarium-to-QuaNTecH bundle entitlement is connected yet."
        : "Scholarium can prepare the free feature handoff with the provider's standard default profile.",
      freeCompletedRendersPerRollingWindow: 3,
      rollingWindowHours: 24,
    },
    payloadBoundary: {
      transmits: [
        "requested aspect ratio",
        "requested quality preset",
        "title length and script digest",
        "source URL count",
      ],
      excludes: [
        "raw script text",
        "uploaded media files",
        "provider tokens",
        "ranking weights",
        "badge state",
        "private profile settings",
      ],
      scriptDigest: await sha256Hex(`${title}\n${script}`),
      sourceUrlCount: countSourceUrls(script),
    },
    reviewBoundary: {
      localOnly: reviewMode === "local_videoprism",
      note: reviewMode === "local_videoprism"
        ? "Local semantic review remains on the author device and is not forwarded to QuaNTecH-ViD."
        : "No local semantic review is attached to this request.",
    },
    nextStep: context.accountReady
      ? `Open the provider handoff, review the ${aspect} ${qualityPreset} request, and approve rendering there.`
      : "Create a Scholarium profile before preparing a provider handoff.",
  };
}
