#!/usr/bin/env node
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(repoRoot, "apps", "web", "public", "webmcp", "securedme-scholarium.manifest.json");
const fixturePath = join(repoRoot, "tools", "webmcp-fixtures", "scholarium.json");
const themePath = join(repoRoot, "companion", "theme-registry.json");
const extensionPath = join(repoRoot, "companion", "manifest.json");
const matrixPath = join(repoRoot, "tools", "webmcp-product-matrix.json");
const outputRoot = join(repoRoot, "output", "webmcp-evidence");
const checkOnly = process.argv.includes("--check");
const failOnGrade = process.argv.includes("--require-b-plus");
const requireSuiteComplete = process.argv.includes("--require-suite-complete");

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const fixtures = JSON.parse(readFileSync(fixturePath, "utf8"));
const themes = JSON.parse(readFileSync(themePath, "utf8"));
const extension = JSON.parse(readFileSync(extensionPath, "utf8"));
const matrix = JSON.parse(readFileSync(matrixPath, "utf8"));
const checks = [];
const barriers = [];
const fixtureResults = [];

function record(id, pass, detail, section = "contracts", barrier = false) {
  const item = { id, pass: Boolean(pass), detail, section, barrier };
  checks.push(item);
  if (barrier && !pass) barriers.push(item);
}

function typeMatches(type, value) {
  if (Array.isArray(type)) return type.some((item) => typeMatches(item, value));
  if (type === "object") return value !== null && typeof value === "object" && !Array.isArray(value);
  if (type === "array") return Array.isArray(value);
  if (type === "integer") return Number.isInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  if (type === "string") return typeof value === "string";
  if (type === "boolean") return typeof value === "boolean";
  if (type === "null") return value === null;
  return true;
}

function validate(schema, value, path = "input") {
  const errors = [];
  if (schema.const !== undefined && value !== schema.const) errors.push(`${path} must equal its const`);
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${path} is outside enum`);
  if (schema.type && !typeMatches(schema.type, value)) return [...errors, `${path} has wrong type`];
  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) errors.push(`${path} is too short`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength) errors.push(`${path} is too long`);
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${path} is below minimum`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${path} is above maximum`);
  }
  if (Array.isArray(value)) {
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${path} has too many items`);
    if (schema.items) value.forEach((item, index) => errors.push(...validate(schema.items, item, `${path}[${index}]`)));
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const properties = schema.properties || {};
    for (const required of schema.required || []) if (!(required in value)) errors.push(`${path}.${required} is required`);
    if (schema.additionalProperties === false) for (const key of Object.keys(value)) if (!(key in properties)) errors.push(`${path}.${key} is not allowed`);
    for (const [key, nested] of Object.entries(value)) if (properties[key]) errors.push(...validate(properties[key], nested, `${path}.${key}`));
  }
  return errors;
}

function stableResult(tool, input) {
  const status = tool.availability !== "available" ? "unavailable" : tool.mode === "READ" ? "completed" : tool.mode === "STAGE" ? "staged" : "executed";
  const digest = createHash("sha256").update(JSON.stringify({ tool: tool.name, input, status })).digest("hex");
  return { schema: "securedme.webmcp.fixture-result.v1", tool: tool.name, status, digest };
}

function unauthorizedResult(tool, input) {
  const status = tool.availability !== "available" ? "unavailable" : "unauthorized";
  const digest = createHash("sha256").update(JSON.stringify({ tool: tool.name, input, status, authorized: false })).digest("hex");
  return { schema: "securedme.webmcp.fixture-result.v1", tool: tool.name, status, digest };
}

function hexRgb(hex) {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16));
}

function luminance(hex) {
  const channel = (value) => { const normalized = value / 255; return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4; };
  const [red, green, blue] = hexRgb(hex).map(channel);
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrast(first, second) {
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

function candidatePath(entry, patterns, overrideKind) {
  const overridePrefix = `--${overrideKind}=${entry.slug}=`;
  const override = process.argv.find((argument) => argument.startsWith(overridePrefix));
  if (override) return resolve(override.slice(overridePrefix.length));
  const repositoryRoot = resolve(repoRoot, matrix.suiteRoot, entry.repository);
  for (const pattern of patterns) {
    const candidate = join(repositoryRoot, pattern.replaceAll("{slug}", entry.slug));
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function evaluateProduct(entry) {
  const productManifestPath = candidatePath(entry, matrix.manifestCandidates, "manifest");
  const productFixturePath = candidatePath(entry, matrix.fixtureCandidates, "fixtures");
  if (!productManifestPath) return { slug: entry.slug, repository: entry.repository, status: "not_available", manifestPath: null, fixturePath: productFixturePath, score: null, grade: null, barriersFailed: 0, descriptors: 0, journeys: 0, toolNames: [], checks: ["manifest export not found"] };
  try {
    const productManifest = JSON.parse(readFileSync(productManifestPath, "utf8"));
    const productFixtures = productFixturePath ? JSON.parse(readFileSync(productFixturePath, "utf8")) : null;
    const productNames = Array.isArray(productManifest.tools) ? productManifest.tools.map((tool) => tool.name) : [];
    const contractPass = productManifest.schema === "securedme.webmcp.v1" && productManifest.product?.slug === entry.slug && productNames.length === 12 && new Set(productNames).size === 12 && matrix.commonTools.every((name) => productNames.includes(name));
    const schemaPass = contractPass && productManifest.tools.every((tool) => tool.inputSchema?.type === "object" && tool.inputSchema?.additionalProperties === false && tool.outputSchema?.type === "object" && ["READ", "STAGE", "EXECUTE"].includes(tool.mode));
    const handlerPass = contractPass && productManifest.tools.every((tool) => tool.handler?.kind && (tool.availability === "available" || tool.unavailableReason));
    const securityPass = contractPass && productManifest.product?.canonicalStateOwner === "algoquest" && productManifest.boundaries?.authority && productManifest.boundaries?.secrets && productManifest.boundaries?.externalWrites && productManifest.boundaries?.heroProgression && productManifest.tools.filter((tool) => tool.mode === "EXECUTE" && tool.availability === "available").every((tool) => tool.inputSchema.required?.includes("approval") && tool.inputSchema.required?.includes("idempotencyKey"));
    const fixtureTools = productFixtures?.tools ?? {};
    const fixturePass = contractPass && productManifest.tools.every((tool) => {
      const fixture = fixtureTools[tool.name];
      if (!fixture) return false;
      const valid = validate(tool.inputSchema, fixture.validInput).length === 0;
      const invalid = validate(tool.inputSchema, fixture.invalidInput).length > 0;
      const first = valid ? stableResult(tool, fixture.validInput) : null;
      const second = valid ? stableResult(tool, fixture.validInput) : null;
      const unauthorizedPass = tool.mode !== "EXECUTE" || (fixture.unauthorizedInput && unauthorizedResult(tool, fixture.unauthorizedInput).status === fixture.expectedUnauthorizedStatus);
      return valid && invalid && first?.digest === second?.digest && first?.status === fixture.expectedStatus && unauthorizedPass;
    });
    const journeys = Array.isArray(productFixtures?.journeys) ? productFixtures.journeys : [];
    const journeysPass = journeys.length === 6 && journeys.every((journey) => Array.isArray(journey) && journey.length >= 2 && journey.every((name) => productNames.includes(name)));
    const productScore = (contractPass ? 10 : 0) + (schemaPass ? 15 : 0) + (handlerPass && fixturePass ? 20 : 0) + (securityPass ? 25 : 0) + (journeysPass ? 15 : 0) + (productManifest.boundaries ? 10 : 0);
    const productGrade = productScore >= 90 ? "A-" : productScore >= 85 ? "B+" : productScore >= 80 ? "B" : "below-B";
    const productBarriers = [contractPass, schemaPass, securityPass].filter((pass) => !pass).length;
    return { slug: entry.slug, repository: entry.repository, status: "evaluated", manifestPath: productManifestPath, fixturePath: productFixturePath, score: productScore, grade: productGrade, barriersFailed: productBarriers, descriptors: productNames.length, journeys: journeys.length, toolNames: productNames, checks: { contractPass, schemaPass, handlerPass, securityPass, fixturePass, journeysPass } };
  } catch (error) {
    return { slug: entry.slug, repository: entry.repository, status: "invalid_export", manifestPath: productManifestPath, fixturePath: productFixturePath, score: 0, grade: "below-B", barriersFailed: 1, descriptors: 0, journeys: 0, toolNames: [], checks: [error instanceof Error ? error.message : "invalid export"] };
  }
}

record("manifest.schema", manifest.schema === "securedme.webmcp.v1", `schema=${manifest.schema}`);
record("manifest.product", manifest.product?.slug === "scholarium", `product=${manifest.product?.slug}`);
record("manifest.hero_owner", manifest.product?.canonicalStateOwner === "algoquest" && manifest.product?.applicationStateOwner === "scholarium", "Hero Book owner is AlgoQuest; application state owner is Scholarium.");
record("manifest.tool_count", manifest.tools?.length === 12, `tools=${manifest.tools?.length}`, "discovery");
const names = manifest.tools.map((tool) => tool.name);
record("manifest.unique_names", new Set(names).size === names.length, "Tool names are unique.");
record("manifest.common_tools", names.includes("securedme_companion_context") && names.includes("securedme_qbit_plan_handoff"), "Both common tools are present.");
record("manifest.product_tools", names.filter((name) => name.startsWith("scholarium_")).length === 10, "Exactly ten Scholarium tools are present.");
record("manifest.modes", manifest.tools.every((tool) => ["READ", "STAGE", "EXECUTE"].includes(tool.mode)), "All tools declare READ, STAGE or EXECUTE.");
record("manifest.schemas", manifest.tools.every((tool) => tool.inputSchema?.type === "object" && tool.inputSchema?.additionalProperties === false && tool.outputSchema?.type === "object"), "Every descriptor has closed object input and object output schemas.");
record("manifest.handlers", manifest.tools.every((tool) => tool.handler?.kind && (tool.availability === "available" || tool.unavailableReason)), "Every tool has a handler or explicit unavailability.", "exactness");

const executeTools = manifest.tools.filter((tool) => tool.mode === "EXECUTE");
record("security.execute_approval", executeTools.every((tool) => tool.inputSchema.required?.includes("approval") && tool.inputSchema.required?.includes("idempotencyKey")), "EXECUTE inputs require approval and idempotency.", "security", true);
record("security.execute_fail_closed", executeTools.every((tool) => tool.availability !== "available" && tool.handler.kind === "unavailable" && tool.unavailableReason), "Unfinished execute boundaries fail closed.", "security", true);
record("security.hero_authority", /AlgoQuest alone owns Hero Book progression/u.test(manifest.boundaries.heroProgression), "AlgoQuest authority is explicit.", "security", true);
record("security.no_destructive_hint", !JSON.stringify(manifest).includes('"destructiveHint":true'), "No destructive descriptor is declared.", "security", true);
record("security.permissions", JSON.stringify(extension.permissions) === JSON.stringify(["activeTab", "scripting", "sidePanel", "storage"]) && !extension.host_permissions, "MV3 uses only approved permissions and no host permissions.", "security", true);
record("security.no_content_capture", !/(raw learner|raw prompt|provider token).*(store|retain|capture)/iu.test(manifest.tools.map((tool) => tool.description).join("\n")), "Descriptors do not claim raw-content retention.", "security", true);

for (const tool of manifest.tools) {
  const fixture = fixtures.tools[tool.name];
  const present = Boolean(fixture);
  const validErrors = present ? validate(tool.inputSchema, fixture.validInput) : ["missing fixture"];
  const invalidErrors = present ? validate(tool.inputSchema, fixture.invalidInput) : [];
  const first = present && validErrors.length === 0 ? stableResult(tool, fixture.validInput) : null;
  const second = present && validErrors.length === 0 ? stableResult(tool, fixture.validInput) : null;
  const deterministic = first && second && first.digest === second.digest;
  const expected = first?.status === fixture?.expectedStatus;
  const unauthorized = tool.mode === "EXECUTE" ? unauthorizedResult(tool, fixture?.unauthorizedInput ?? {}).status === fixture?.expectedUnauthorizedStatus : true;
  fixtureResults.push({ tool: tool.name, present, valid: validErrors.length === 0, invalidRejected: invalidErrors.length > 0, unauthorizedRejected: unauthorized, deterministic: Boolean(deterministic), expectedStatus: Boolean(expected), digest: first?.digest ?? null });
}
record("fixtures.complete", fixtureResults.length === 12 && fixtureResults.every((item) => item.present), "A fixture exists for every descriptor.", "exactness");
record("fixtures.positive", fixtureResults.every((item) => item.valid && item.expectedStatus), "All positive fixtures validate and return the declared state.", "exactness");
record("fixtures.invalid", fixtureResults.every((item) => item.invalidRejected), "All invalid fixtures are rejected.", "security", true);
record("fixtures.unauthorized", fixtureResults.every((item) => item.unauthorizedRejected), "Every EXECUTE fixture refuses an unauthorized call or remains explicitly unavailable.", "security", true);
record("fixtures.deterministic", fixtureResults.every((item) => item.deterministic), "Every fixture replay has the same digest.", "exactness");
record("journeys.six", fixtures.journeys?.length === 6 && fixtures.journeys.every((journey) => journey.length >= 2 && journey.every((name) => names.includes(name))), "Six valid agentic journeys reference registered tools.", "agentic");

const productSlugs = ["algoquest", "algorithm-builder", "visual-algorithm-designer", "scholarium", "ffed-qlc", "fnp-qnn", "gateway", "quanthor", "synthia", "retailguard", "tesla-workbench", "vot-guardian"];
record("themes.coverage", productSlugs.every((slug) => themes.themes?.[slug]), "Theme registry covers all twelve product slugs.", "resilience");
record("themes.provenance", productSlugs.every((slug) => themes.themes[slug].source?.includes("stitch_") && themes.themes[slug].sourceStatus), "Every theme records a Stitch source and provenance status.", "resilience");
const contrastResults = productSlugs.map((slug) => ({ slug, ratio: contrast(themes.themes[slug].tokens.text, themes.themes[slug].tokens.background) }));
record("themes.contrast", contrastResults.every((item) => item.ratio >= 4.5), `Minimum text contrast=${Math.min(...contrastResults.map((item) => item.ratio)).toFixed(2)}:1`, "resilience", true);

const scoreSections = {
  discovery: { earned: checks.find((item) => item.id === "manifest.tool_count")?.pass ? 10 : 0, possible: 15, note: "Static discovery and page registration are checked; live Chrome and Edge discovery are not run by this local CLI." },
  contracts: { earned: checks.filter((item) => item.section === "contracts").every((item) => item.pass) ? 15 : 0, possible: 15 },
  exactness: { earned: checks.filter((item) => item.section === "exactness").every((item) => item.pass) ? 20 : 0, possible: 20 },
  security: { earned: checks.filter((item) => item.section === "security").every((item) => item.pass) ? 25 : 0, possible: 25 },
  agentic: { earned: checks.filter((item) => item.section === "agentic").every((item) => item.pass) ? 15 : 0, possible: 15 },
  resilienceAccessibilityDocumentation: { earned: checks.filter((item) => item.section === "resilience").every((item) => item.pass) ? 10 : 0, possible: 10 }
};
const score = Object.values(scoreSections).reduce((sum, section) => sum + section.earned, 0);
const grade = score >= 90 ? "A-" : score >= 85 ? "B+" : score >= 80 ? "B" : "below-B";
const gitSha = (() => { try { return execFileSync("git", ["-C", repoRoot, "rev-parse", "HEAD"], { encoding: "utf8" }).trim(); } catch { return "unknown"; } })();
const workingTreeDirty = (() => { try { return execFileSync("git", ["-C", repoRoot, "status", "--porcelain"], { encoding: "utf8" }).trim().length > 0; } catch { return null; } })();
const suiteProducts = matrix.products.map(evaluateProduct);
const loadedProducts = suiteProducts.filter((product) => product.status === "evaluated");
const occurrences = new Map();
for (const product of loadedProducts) for (const name of product.toolNames) occurrences.set(name, [...(occurrences.get(name) ?? []), product.slug]);
const invalidCollisions = [...occurrences.entries()].filter(([name, slugs]) => slugs.length > 1 && !matrix.commonTools.includes(name)).map(([name, slugs]) => ({ name, slugs }));
const descriptorCount = suiteProducts.reduce((sum, product) => sum + product.descriptors, 0);
const journeyCount = suiteProducts.reduce((sum, product) => sum + product.journeys, 0);
const uniqueToolCount = occurrences.size;
const commonToolCounts = Object.fromEntries(matrix.commonTools.map((name) => [name, occurrences.get(name)?.length ?? 0]));
const suiteComplete = loadedProducts.length === 12 && descriptorCount === 144 && journeyCount === 72 && uniqueToolCount === 122 && invalidCollisions.length === 0 && Object.values(commonToolCounts).every((count) => count === 12);
const aggregateScore = Math.round(suiteProducts.reduce((sum, product) => sum + (product.score ?? 0), 0) / suiteProducts.length);
const aggregateGrade = aggregateScore >= 90 ? "A-" : aggregateScore >= 85 ? "B+" : aggregateScore >= 80 ? "B" : "below-B";
const suitePassed = suiteComplete && suiteProducts.every((product) => product.status === "evaluated" && product.score >= 85 && product.barriersFailed === 0);
const suite = {
  schema: "securedme.webmcp.suite-evidence.v1",
  status: suiteComplete ? "complete_static_evaluation" : "incomplete_exports",
  passed: suitePassed,
  aggregateScore,
  aggregateGrade,
  productsLoaded: loadedProducts.length,
  productsExpected: 12,
  descriptorCount,
  descriptorExpected: 144,
  uniqueToolCount,
  uniqueToolExpected: 122,
  journeyCount,
  journeyExpected: 72,
  commonToolCounts,
  invalidCollisions,
  browsers: { chrome: "not_run", edge: "not_run" },
  products: suiteProducts,
};
const passed = barriers.length === 0 && (!failOnGrade || score >= 85) && (!requireSuiteComplete || suitePassed);
const report = {
  schema: "securedme.webmcp.evidence-report.v1",
  product: "scholarium",
  sourceSha: gitSha,
  workingTreeDirty,
  manifestDigest: `sha256:${createHash("sha256").update(JSON.stringify(manifest)).digest("hex")}`,
  score, grade, passed,
  scoreSections, barriers,
  browsers: { chrome: "not_run", edge: "not_run", note: "Use the unpacked companion and browser WebMCP flags for live discovery qualification." },
  checks, fixtureResults, contrastResults, suite
};

function escapeHtml(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
function markdown() {
  return `# Scholarium WebMCP Evidence Gate\n\n- Source SHA: \`${gitSha}\`\n- Working tree dirty: **${workingTreeDirty === null ? "unknown" : workingTreeDirty ? "yes" : "no"}**\n- Scholarium score: **${score}/100 (${grade})**\n- Suite aggregate: **${aggregateScore}/100 (${aggregateGrade})** — ${suite.status}\n- Suite exports: **${loadedProducts.length}/12**\n- Descriptors: **${descriptorCount}/144**; unique names: **${uniqueToolCount}/122**\n- Agentic journeys: **${journeyCount}/72**\n- Absolute Scholarium barriers failed: **${barriers.length}**\n- Chrome live discovery: **not run**\n- Edge live discovery: **not run**\n\n## Product matrix\n\n${suiteProducts.map((product) => `- \`${product.slug}\`: ${product.status}${product.score === null ? "" : `, ${product.score}/100 (${product.grade})`}, ${product.descriptors} descriptors, ${product.journeys} journeys`).join("\n")}\n\n## Scholarium checks\n\n${checks.map((item) => `- ${item.pass ? "PASS" : "FAIL"} \`${item.id}\` — ${item.detail}`).join("\n")}\n`;
}
function html() { return `<!doctype html><html lang="en"><meta charset="utf-8"><title>SecuredMe WebMCP Evidence</title><style>body{font:16px/1.5 system-ui;max-width:1100px;margin:auto;padding:2rem;background:#061026;color:#f7fbff}table{border-collapse:collapse;width:100%;margin:1rem 0}td,th{border:1px solid #557;padding:.5rem;text-align:left}.pass{color:#60d184}.fail{color:#ff8a80}</style><h1>SecuredMe WebMCP Evidence Gate</h1><p>Source <code>${escapeHtml(gitSha)}</code> · working tree <strong>${workingTreeDirty === null ? "unknown" : workingTreeDirty ? "dirty" : "clean"}</strong> · Scholarium <strong>${score}/100 (${grade})</strong> · suite <strong>${aggregateScore}/100 (${aggregateGrade})</strong> · live browsers not run</p><h2>Product matrix</h2><table><thead><tr><th>Product</th><th>Status</th><th>Score</th><th>Descriptors</th><th>Journeys</th></tr></thead><tbody>${suiteProducts.map((product) => `<tr><td>${escapeHtml(product.slug)}</td><td>${escapeHtml(product.status)}</td><td>${product.score ?? "—"}</td><td>${product.descriptors}</td><td>${product.journeys}</td></tr>`).join("")}</tbody></table><h2>Scholarium checks</h2><table><thead><tr><th>Check</th><th>Result</th><th>Evidence</th></tr></thead><tbody>${checks.map((item) => `<tr><td>${escapeHtml(item.id)}</td><td class="${item.pass ? "pass" : "fail"}">${item.pass ? "PASS" : "FAIL"}</td><td>${escapeHtml(item.detail)}</td></tr>`).join("")}</tbody></table></html>`; }
function sarif() { return { version: "2.1.0", $schema: "https://json.schemastore.org/sarif-2.1.0.json", runs: [{ tool: { driver: { name: "SecuredMe WebMCP Evidence Gate", version: "1.0.0", rules: checks.map((item) => ({ id: item.id, shortDescription: { text: item.detail } })) } }, results: checks.filter((item) => !item.pass).map((item) => ({ ruleId: item.id, level: item.barrier ? "error" : "warning", message: { text: item.detail } })) }] }; }

if (!checkOnly) {
  mkdirSync(outputRoot, { recursive: true });
  writeFileSync(join(outputRoot, "scholarium-report.json"), `${JSON.stringify(report, null, 2)}\n`);
  writeFileSync(join(outputRoot, "scholarium-report.md"), markdown());
  writeFileSync(join(outputRoot, "scholarium-report.html"), html());
  writeFileSync(join(outputRoot, "scholarium-report.sarif"), `${JSON.stringify(sarif(), null, 2)}\n`);
  writeFileSync(join(outputRoot, "suite-report.json"), `${JSON.stringify(suite, null, 2)}\n`);
  writeFileSync(join(outputRoot, "suite-report.md"), markdown());
  writeFileSync(join(outputRoot, "suite-report.html"), html());
  writeFileSync(join(outputRoot, "suite-report.sarif"), `${JSON.stringify(sarif(), null, 2)}\n`);
  const receipt = { schema: "securedme.webmcp.evidence-receipt.v1", sourceSha: gitSha, workingTreeDirty, manifestDigest: report.manifestDigest, score, grade, passed, absoluteBarriersFailed: barriers.length, suite: { passed: suitePassed, aggregateScore, aggregateGrade, productsLoaded: loadedProducts.length, descriptors: descriptorCount, uniqueTools: uniqueToolCount, journeys: journeyCount }, reportFiles: ["scholarium-report.json", "scholarium-report.md", "scholarium-report.html", "scholarium-report.sarif", "suite-report.json", "suite-report.md", "suite-report.html", "suite-report.sarif"] };
  writeFileSync(join(outputRoot, `scholarium-receipt-${gitSha.slice(0, 12)}.json`), `${JSON.stringify(receipt, null, 2)}\n`);
}

process.stdout.write(`${JSON.stringify({ passed, score, grade, barriersFailed: barriers.length, checks: checks.length, fixtures: fixtureResults.length, suite: { passed: suitePassed, aggregateScore, aggregateGrade, productsLoaded: loadedProducts.length, descriptors: descriptorCount, uniqueTools: uniqueToolCount, journeys: journeyCount, status: suite.status }, output: checkOnly ? null : outputRoot }, null, 2)}\n`);
if (!passed) process.exitCode = 1;
