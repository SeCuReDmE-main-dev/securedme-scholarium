// Importable Workers resource types avoid injecting HTMLRewriter's Element
// into the browser's DOM type namespace. No credential value is declared here.
declare module "cloudflare:workers" {
  interface ScholariumBindings {
    DB?: import("@cloudflare/workers-types").D1Database;
    MEDIA?: unknown;
    SCHOLARIUM_GATE5_SECRET?: string;
    SCHOLARIUM_GATE5_WORKER_TOKEN?: string;
    SCHOLARIUM_BC_ED25519_PUBLIC_KEY_B64?: string;
    SCHOLARIUM_MEDIA_MANIFEST_SECRET?: string;
    SCHOLARIUM_TEACH_ENGINE_URL?: string;
    SCHOLARIUM_TEACH_ENGINE_HMAC_SECRET?: string;
    YOUTUBE_WEBHOOK_HMAC_SECRET?: string;
    YOUTUBE_WEBHOOK_VERIFY_TOKEN?: string;
    [binding: string]: unknown;
  }
  export const env: ScholariumBindings;
}
