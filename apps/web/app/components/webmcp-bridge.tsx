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
type ModelContext = { registerTool?: (definition: Record<string, unknown>, options: { signal: AbortSignal }) => Promise<void> };

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
    const lifetime = new AbortController();
    const registered: string[] = [];
    const setup = async () => {
      try {
        const response = await fetch("/api/v1/webmcp/manifest", { credentials: "same-origin", signal: lifetime.signal });
        if (!response.ok) return;
        const manifest = await response.json() as WebMcpManifest;
        if (!active || manifest.schema !== "securedme.webmcp.v1" || manifest.product.slug !== "scholarium" || manifest.tools.length !== 12) return;
        window.__SECUREDME_WEBMCP_MANIFEST__ = manifest;
        const modelContext = (document as Document & { modelContext?: ModelContext }).modelContext;
        if (!modelContext?.registerTool) return;
        for (const tool of manifest.tools) {
          if (!active || lifetime.signal.aborted) return;
          await modelContext.registerTool({
            name: tool.name,
            description: tool.description,
            inputSchema: tool.inputSchema,
            annotations: {
              readOnlyHint: tool.mode === "READ",
              consequentialHint: tool.mode === "EXECUTE",
            },
            execute: (input: unknown, options: { signal?: AbortSignal } = {}) => executeScholariumTool(tool, input, {
              ...session, heroBookState: session.authenticated ? storedHeroBookState() : null,
              signal: options.signal ? AbortSignal.any([lifetime.signal, options.signal]) : lifetime.signal,
            }),
          }, { signal: lifetime.signal });
          registered.push(tool.name);
        }
        document.documentElement.dataset.securedmeWebmcp = "ready";
        document.documentElement.dataset.securedmeWebmcpToolCount = String(registered.length);
      } catch {
        lifetime.abort();
        if (active) document.documentElement.dataset.securedmeWebmcp = "unavailable";
      }
    };
    void setup();
    return () => {
      active = false;
      lifetime.abort();
      delete document.documentElement.dataset.securedmeWebmcp;
      delete document.documentElement.dataset.securedmeWebmcpToolCount;
      delete window.__SECUREDME_WEBMCP_MANIFEST__;
    };
  }, [session.authenticated, session.provider]);
  return null;
}
