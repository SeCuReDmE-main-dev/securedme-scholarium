const SUPPORTED_HOSTS = {
  "algoquest.securedme.ca": "algoquest",
  "algorithm-builder.securedme.ca": "algorithm-builder",
  "visual-algorithm.securedme.ca": "visual-algorithm-designer",
  "scholarium.securedme.ca": "scholarium",
  "www.scholarium.securedme.ca": "scholarium",
  "ffed-qlc.securedme.ca": "ffed-qlc",
  "fnpqnn.securedme.ca": "fnp-qnn",
  "gateway.securedme.ca": "gateway",
  "quanthor.securedme.ca": "quanthor",
  "synthia.securedme.ca": "synthia",
  "market-guardian.securedme.ca": "retailguard",
  "tesla-recovery.securedme.ca": "tesla-workbench",
  "vot-guardian.securedme.ca": "vot-guardian"
};

chrome.runtime.onInstalled.addListener(() => chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {}));
chrome.action.onClicked.addListener((tab) => {
  if (tab.windowId !== undefined) chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
});

function productForUrl(value) {
  try {
    const url = new URL(value);
    if ((url.hostname === "localhost" || url.hostname === "127.0.0.1") && url.pathname.startsWith("/app")) return "scholarium";
    return SUPPORTED_HOSTS[url.hostname] || null;
  } catch { return null; }
}

async function activeSurface() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return { product: productForUrl(tab?.url || ""), tabId: tab?.id || null, title: tab?.title || "", url: tab?.url || "" };
}

async function pageManifest(tabId, product) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId }, world: "MAIN", args: [product],
    func: async (activeProduct) => {
      if (window.__SECUREDME_WEBMCP_MANIFEST__) return window.__SECUREDME_WEBMCP_MANIFEST__;
      if (activeProduct !== "scholarium") return null;
      try {
        const response = await fetch("/api/v1/webmcp/manifest", { credentials: "same-origin" });
        return response.ok ? await response.json() : null;
      } catch { return null; }
    }
  });
  return result?.result || null;
}

async function executePageTool(tabId, name, input, heroBookProjection) {
  const [result] = await chrome.scripting.executeScript({
    target: { tabId }, world: "MAIN", args: [name, input, heroBookProjection],
    func: async (toolName, toolInput, heroContext) => {
      const context = document.modelContext;
      if (!context || typeof context.executeTool !== "function") return { schema: "securedme.webmcp.v1", ok: false, status: "unavailable", error: { code: "webmcp_runtime_unavailable", message: "This page/browser does not expose the WebMCP execution runtime." } };
      if (heroContext) window.__SECUREDME_HERO_BOOK_PROJECTION__ = heroContext;
      try { return await context.executeTool(toolName, toolInput); }
      catch (error) { return { schema: "securedme.webmcp.v1", ok: false, status: "failed", error: { code: "execution_failed", message: error instanceof Error ? error.message.slice(0, 240) : "Tool execution failed." } }; }
      finally { delete window.__SECUREDME_HERO_BOOK_PROJECTION__; }
    }
  });
  return result?.result || { schema: "securedme.webmcp.v1", ok: false, status: "failed", error: { code: "missing_result", message: "The page returned no tool result." } };
}

chrome.runtime.onMessage.addListener((message, _sender, respond) => {
  (async () => {
    if (message?.type === "surface") return activeSurface();
    const surface = await activeSurface();
    if (!surface.product || !surface.tabId) return { error: "unsupported_surface" };
    if (message?.type === "manifest") return { surface, manifest: await pageManifest(surface.tabId, surface.product) };
    if (message?.type === "execute") {
      const stored = await chrome.storage.local.get("heroBookProjection");
      return executePageTool(surface.tabId, String(message.name || ""), message.input && typeof message.input === "object" ? message.input : {}, stored.heroBookProjection || null);
    }
    return { error: "unsupported_message" };
  })().then(respond).catch(() => respond({ error: "companion_operation_failed" }));
  return true;
});
