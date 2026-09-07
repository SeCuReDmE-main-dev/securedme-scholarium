const runtime = globalThis.browser?.runtime || chrome.runtime;
let surface = null;
let manifest = null;
let themes = null;

const $ = (selector) => document.querySelector(selector);
const send = (message) => runtime.sendMessage(message);
const safeText = (value, maximum = 240) => typeof value === "string" ? value.trim().slice(0, maximum) : "";

function applyTheme(slug) {
  const theme = themes?.themes?.[slug] || themes?.themes?.[themes?.fallback];
  if (!theme) return;
  for (const [key, value] of Object.entries(theme.tokens)) document.documentElement.style.setProperty(`--${key}`, value);
  document.documentElement.style.fontFamily = theme.typography;
}

async function storedContext() {
  const data = await chrome.storage.local.get("heroBookProjection");
  return data.heroBookProjection || null;
}

function sanitizeContext(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Context must be a JSON object.");
  const serialized = JSON.stringify(value);
  if (serialized.length > 32_000) throw new Error("Context exceeds 32 KB.");
  if (/"[^"\\]*(token|secret|password|cookie|authorization|email|displayName|rawPrompt|rawAnswer|rawAudio)[^"\\]*"\s*:/iu.test(serialized)) throw new Error("Identity, secret and raw-content fields are forbidden.");
  if (value.schema !== "HeroBookPanelState.v1") throw new Error("schema must be HeroBookPanelState.v1.");
  if (!Number.isInteger(value.revision) || value.revision < 0) throw new Error("revision must be a non-negative integer.");
  const heroBookId = safeText(value.heroBook?.id, 96);
  const missionId = safeText(value.mission?.id, 160);
  if (!heroBookId || !missionId) throw new Error("heroBook.id and mission.id are required.");
  const stringList = (items, maximum = 32) => Array.isArray(items) ? items.map((item) => safeText(item, 160)).filter(Boolean).slice(0, maximum) : [];
  const projection = {
    schema: "HeroBookPanelState.v1",
    revision: value.revision,
    heroBook: { id: heroBookId, adaptation: safeText(value.heroBook?.adaptation, 120) || undefined, audience: safeText(value.heroBook?.audience, 64) || undefined, language: safeText(value.heroBook?.language, 32) || undefined },
    hero: { role: safeText(value.hero?.role, 80) || undefined, narrativeLevel: safeText(value.hero?.narrativeLevel, 80) || undefined },
    mission: { id: missionId, title: safeText(value.mission?.title, 240) || undefined, promptRef: safeText(value.mission?.promptRef, 240) || undefined, step: ["Mission", "Build", "Check", "Colab", "Return", "Reflect"].includes(value.mission?.step) ? value.mission.step : undefined },
    characterSheet: { talents: stringList(value.characterSheet?.talents), capabilities: stringList(value.characterSheet?.capabilities), declaredPreferences: stringList(value.characterSheet?.declaredPreferences) },
    inventory: Array.isArray(value.inventory) ? value.inventory.slice(0, 64).flatMap((item) => {
      const id = safeText(item?.id, 160); const kind = ["tool", "equipment", "symbolic-weapon"].includes(item?.kind) ? item.kind : null;
      return id && kind ? [{ id, kind, state: ["available", "equipped", "locked", "consumed"].includes(item?.state) ? item.state : undefined }] : [];
    }) : [],
    deterministicDie: value.deterministicDie ? { counter: Math.max(0, Number(value.deterministicDie.counter) || 0), lastResult: Number.isInteger(value.deterministicDie.lastResult) ? value.deterministicDie.lastResult : undefined, lastReceiptRef: safeText(value.deterministicDie.lastReceiptRef, 240) || undefined } : undefined,
    decisions: Array.isArray(value.decisions) ? value.decisions.slice(-32).flatMap((item) => { const id = safeText(item?.id, 160); return id ? [{ id, choiceRef: safeText(item.choiceRef, 240) || undefined, consequenceRef: safeText(item.consequenceRef, 240) || undefined, evidenceRef: safeText(item.evidenceRef, 240) || undefined }] : []; }) : [],
    storyPoints: Math.max(0, Number(value.storyPoints) || 0),
    pedagogicalEvidence: Array.isArray(value.pedagogicalEvidence) ? value.pedagogicalEvidence.slice(-32).flatMap((item) => { const id = safeText(item?.id, 160); return id ? [{ id, kind: safeText(item.kind, 64) || undefined, status: safeText(item.status, 64) || undefined }] : []; }) : [],
    knowledge: { tokenCount: Math.max(0, Number(value.knowledge?.tokenCount) || 0), milestoneRefs: stringList(value.knowledge?.milestoneRefs), receiptRefs: stringList(value.knowledge?.receiptRefs) },
    specialist: value.specialist ? { slug: safeText(value.specialist.slug, 64) || undefined, returnChannel: safeText(value.specialist.returnChannel, 160) || undefined } : undefined
  };
  return JSON.parse(JSON.stringify(projection));
}

function renderCockpit(context) {
  $("#hero").textContent = safeText(context?.hero?.role || context?.hero?.narrativeLevel) || "Not provided";
  $("#hero-book").textContent = safeText(context?.heroBook?.id) || "Not provided";
  $("#mission").textContent = safeText(context?.mission?.title || context?.mission?.id) || "Not provided";
  $("#specialist").textContent = safeText(surface?.product) || "None";
  $("#context-json").value = context ? JSON.stringify(context, null, 2) : JSON.stringify({ schema: "HeroBookPanelState.v1", revision: 0, heroBook: { id: "" }, hero: {}, mission: { id: "", step: "Mission" }, inventory: [], decisions: [], pedagogicalEvidence: [], knowledge: { tokenCount: 0, milestoneRefs: [], receiptRefs: [] } }, null, 2);
}

function fieldFor(name, schema) {
  const label = document.createElement("label");
  label.textContent = name;
  let control;
  if (Array.isArray(schema.enum)) {
    control = document.createElement("select");
    for (const value of schema.enum) { const option = document.createElement("option"); option.value = value; option.textContent = value; control.append(option); }
  } else if (schema.type === "integer") {
    control = document.createElement("input"); control.type = "number"; control.min = schema.minimum ?? 0; control.max = schema.maximum ?? Number.MAX_SAFE_INTEGER;
  } else if (schema.type === "array" || schema.type === "object") {
    control = document.createElement("textarea"); control.rows = 4; control.placeholder = schema.type === "array" ? "[]" : "{}";
  } else {
    control = document.createElement("input"); control.type = "text"; if (schema.maxLength) control.maxLength = schema.maxLength;
  }
  control.name = name;
  control.required = (currentTool()?.inputSchema?.required || []).includes(name);
  label.append(control);
  return label;
}

function currentTool() { return manifest?.tools?.find((tool) => tool.name === $("#tool-select").value) || null; }

function renderTool() {
  const tool = currentTool();
  const form = $("#tool-form"); form.replaceChildren(); $("#result").textContent = "";
  if (!tool) { $("#tool-description").textContent = "No WebMCP manifest is available on this page."; return; }
  $("#tool-description").textContent = `${tool.mode} · ${tool.availability} — ${tool.description}`;
  for (const [name, schema] of Object.entries(tool.inputSchema?.properties || {})) form.append(fieldFor(name, schema));
  const submit = document.createElement("button"); submit.type = "submit"; submit.className = "primary"; submit.textContent = tool.mode === "READ" ? "Inspect" : tool.mode === "STAGE" ? "Stage proposal" : "Execute after approval";
  if (tool.availability !== "available" || tool.mode === "EXECUTE") { submit.disabled = true; submit.title = tool.unavailableReason || "This execute boundary is not available in the base companion."; }
  form.append(submit);
}

function parseForm(form) {
  const input = {};
  for (const [name, value] of new FormData(form)) {
    const schema = currentTool()?.inputSchema?.properties?.[name] || {};
    if (!String(value).trim()) continue;
    if (schema.type === "integer") input[name] = Number(value);
    else if (schema.type === "array" || schema.type === "object") input[name] = JSON.parse(String(value));
    else input[name] = String(value);
  }
  return input;
}

async function loadManifest() {
  const response = await send({ type: "manifest" });
  surface = response?.surface || await send({ type: "surface" });
  applyTheme(surface?.product);
  if (!surface?.product) { $("#surface-status").textContent = "Unsupported page. No tool is exposed."; return; }
  $("#surface-status").textContent = `${surface.product} · ${surface.title || "supported page"}`;
  manifest = response?.manifest;
  if (!manifest) $("#surface-status").textContent += " · page WebMCP manifest unavailable";
  const select = $("#tool-select"); select.replaceChildren();
  for (const tool of manifest?.tools || []) { const option = document.createElement("option"); option.value = tool.name; option.textContent = tool.title; select.append(option); }
  renderTool();
}

document.addEventListener("DOMContentLoaded", async () => {
  themes = await (await fetch("theme-registry.json")).json();
  const context = await storedContext(); renderCockpit(context);
  document.querySelectorAll("nav button").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("nav button").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
    document.querySelectorAll(".tab").forEach((tab) => { tab.hidden = tab.id !== button.dataset.tab; });
  }));
  $("#tool-select").addEventListener("change", renderTool);
  $("#tool-form").addEventListener("submit", async (event) => {
    event.preventDefault(); const tool = currentTool(); if (!tool) return;
    $("#result").textContent = "Running bounded handler…";
    try { $("#result").textContent = JSON.stringify(await send({ type: "execute", name: tool.name, input: parseForm(event.currentTarget) }), null, 2); }
    catch { $("#result").textContent = JSON.stringify({ ok: false, status: "failed", error: { code: "companion_execution_failed" } }, null, 2); }
  });
  $("#save-context").addEventListener("click", async () => {
    try { const contextValue = sanitizeContext(JSON.parse($("#context-json").value)); await chrome.storage.local.set({ heroBookProjection: contextValue }); renderCockpit(contextValue); $("#context-status").textContent = "Sanitized local projection saved."; }
    catch (error) { $("#context-status").textContent = error instanceof Error ? error.message : "Invalid context."; }
  });
  $("#prepare-handoff").addEventListener("click", () => {
    const plan = { schema: "securedme.qbit-handoff-plan.v1", status: "staged", canonicalStateOwner: "algoquest", missionRef: safeText($("#handoff-mission").value, 160), specialist: surface?.product || null, artifactPointer: safeText($("#handoff-pointer").value, 240) || null, modifiesProgression: false, admitsEvidence: false };
    $("#handoff-result").textContent = JSON.stringify(plan, null, 2);
  });
  await loadManifest();
});
