"use client";

import { useEffect } from "react";
import { executeScholariumTool } from "../../lib/webmcp/scholarium-handlers";

type ToolDescriptor = Parameters<typeof executeScholariumTool>[0] & {
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
};

type WebMcpManifest = { schema: "securedme.webmcp.v1"; product: { slug: string }; tools: ToolDescriptor[] };
type ModelContext = { registerTool?: (definition: Record<string, unknown>) => void; unregisterTool?: (name: string) => void };

declare global {
  interface Window { __SECUREDME_WEBMCP_MANIFEST__?: WebMcpManifest; __SECUREDME_HERO_BOOK_PROJECTION__?: unknown }
}

function storedHeroBookState() {
  if (window.__SECUREDME_HERO_BOOK_PROJECTION__) return window.__SECUREDME_HERO_BOOK_PROJECTION__;
  try {
    const raw = window.localStorage.getItem("securedme.hero-book-panel.v1");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function WebMcpBridge({ session }: { session: { authenticated: boolean; provider: string | null } }) {
  useEffect(() => {
    let active = true;
    const registered: string[] = [];
    const setup = async () => {
      try {
        const response = await fetch("/api/v1/webmcp/manifest", { credentials: "same-origin" });
        if (!response.ok) return;
        const manifest = await response.json() as WebMcpManifest;
        if (!active || manifest.schema !== "securedme.webmcp.v1" || manifest.product.slug !== "scholarium" || manifest.tools.length !== 12) return;
        window.__SECUREDME_WEBMCP_MANIFEST__ = manifest;
        const modelContext = (document as Document & { modelContext?: ModelContext }).modelContext;
        if (!modelContext?.registerTool) return;
        for (const tool of manifest.tools) {
          modelContext.registerTool({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            outputSchema: tool.outputSchema,
            annotations: {
              title: tool.title,
              readOnlyHint: tool.mode === "READ",
              destructiveHint: false,
              idempotentHint: tool.mode !== "EXECUTE",
              openWorldHint: tool.handler.kind === "http",
            },
            execute: (input: unknown) => executeScholariumTool(tool, input, { ...session, heroBookState: storedHeroBookState() }),
          });
          registered.push(tool.name);
        }
        document.documentElement.dataset.securedmeWebmcp = "ready";
        document.documentElement.dataset.securedmeWebmcpToolCount = String(registered.length);
      } catch {
        document.documentElement.dataset.securedmeWebmcp = "unavailable";
      }
    };
    void setup();
    return () => {
      active = false;
      const modelContext = (document as Document & { modelContext?: ModelContext }).modelContext;
      for (const name of registered) modelContext?.unregisterTool?.(name);
      delete window.__SECUREDME_WEBMCP_MANIFEST__;
    };
  }, [session.authenticated, session.provider]);
  return null;
}
