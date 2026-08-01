const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const baseUrl = process.argv[2] || "http://127.0.0.1:8769";
const output = path.resolve(process.argv[3] || "qa/evidence/sphinx-preview");
fs.mkdirSync(output, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function inspect(page, relativeUrl, name, viewport) {
  await page.setViewportSize(viewport);
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  page.on("pageerror", (error) => errors.push(`page: ${error.message}`));
  const response = await page.goto(`${baseUrl}${relativeUrl}`, { waitUntil: "networkidle" });
  assert(response && response.ok(), `${relativeUrl} did not return HTTP success`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  assert(!overflow, `${relativeUrl} has horizontal overflow at ${viewport.width}px`);
  const accessibility = await page.evaluate(() => ({
    headings: document.querySelectorAll("h1").length,
    imagesWithoutAlt: document.querySelectorAll("img:not([alt])").length,
    unnamedButtons: [...document.querySelectorAll("button")].filter((button) => !button.textContent.trim() && !button.getAttribute("aria-label") && !button.getAttribute("title")).length,
    unnamedLinks: [...document.querySelectorAll("a")].filter((link) => !link.textContent.trim() && !link.getAttribute("aria-label") && !link.getAttribute("title") && !link.querySelector("img[alt]")) .length,
  }));
  assert(accessibility.headings === 1, `${relativeUrl} must expose exactly one h1`);
  assert(accessibility.imagesWithoutAlt === 0, `${relativeUrl} contains images without alt attributes`);
  assert(accessibility.unnamedButtons === 0, `${relativeUrl} contains unnamed buttons`);
  assert(accessibility.unnamedLinks === 0, `${relativeUrl} contains unnamed links`);
  assert(errors.length === 0, `${relativeUrl} emitted errors: ${errors.join(" | ")}`);
  await page.screenshot({ path: path.join(output, `${name}-${viewport.width}.png`), fullPage: true });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const desktop = { width: 1440, height: 1000 };
  const mobile = { width: 390, height: 844 };

  await inspect(page, "/en/", "home-en", desktop);
  const theme = page.locator(".se-theme-toggle");
  await theme.click();
  assert((await page.locator("html").getAttribute("data-theme")) === "night", "theme control did not activate night mode");
  await page.locator(".se-access-controls summary").click();
  await page.locator("[data-se-contrast]").check();
  await page.locator("[data-se-font-scale]").selectOption("larger");
  await page.locator("[data-se-motion]").check();
  const accessState = await page.locator("html").evaluate((root) => ({
    contrast: root.dataset.contrast,
    fontScale: root.dataset.fontScale,
    motion: root.dataset.motion,
  }));
  assert(accessState.contrast === "high", "contrast control did not activate");
  assert(accessState.fontScale === "larger", "text-size control did not activate");
  assert(accessState.motion === "reduced", "reduced-motion control did not activate");
  await page.evaluate(() => localStorage.removeItem("securedme-ui-state"));
  await inspect(page, "/en/tools/quanthor/index.html", "quanthor-en", desktop);
  const logoWorks = await page.locator(".se-tool-header img").evaluate((image) => image.complete && image.naturalWidth > 0);
  assert(logoWorks, "QuaNThoR identity image did not render");

  await inspect(page, "/en/prompts/index.html", "prompts-en", desktop);
  assert((await page.locator(".se-prompt-card").count()) === 40, "prompt index does not contain 40 cards");
  await page.locator('select[data-field="data-tool"]').selectOption("quanthor");
  assert((await page.locator(".se-prompt-card:not([hidden])").count()) === 3, "QuaNThoR prompt filter is incorrect");
  const frLink = await page.locator('.se-language-switcher a:has-text("FR")').getAttribute("href");
  assert(frLink === "/fr/prompts/index.html", "language switcher does not preserve the current page");

  await inspect(page, "/fr/prompts/index.html", "prompts-fr", desktop);
  assert((await page.locator("h1").first().innerText()).includes("Bibliotheque"), "French prompt-library heading is not localized");
  assert((await page.locator(".se-prompt-card").first().locator("strong").innerText()).includes("Choisir"), "French prompt titles are not active");
  await inspect(page, "/es/prompts/index.html", "prompts-es", mobile);
  assert((await page.locator("h1").first().innerText()).includes("Biblioteca"), "Spanish prompt-library heading is not localized");
  assert((await page.locator(".se-prompt-card").first().locator("strong").innerText()).includes("Elegir"), "Spanish prompt titles are not active");

  await inspect(page, "/en/media/video-library.html", "videos-en", desktop);
  assert((await page.locator(".se-video-card").count()) === 15, "video index does not preserve 15 historical videos");
  await page.locator('select[data-field="data-format"]').selectOption("short");
  assert((await page.locator(".se-video-card:not([hidden])").count()) === 5, "short-video filter is incorrect");
  await inspect(page, "/fr/getting-started/15-minute-tutorial.html", "tutorial-fr", mobile);
  assert((await page.locator("h1").first().innerText()).includes("15 minutes"), "French tutorial heading is not localized");
  assert((await page.locator('.document h2').count()) === 4, "tutorial must contain one four-step language edition, not repeated language blocks");

  await browser.close();
  const result = {
    base_url: baseUrl,
    screenshots: fs.readdirSync(output).filter((name) => name.endsWith(".png")).sort(),
    checks: {
      routes: 7,
      prompts: 40,
      filtered_quanthor_prompts: 3,
      videos: 15,
      filtered_short_videos: 5,
      desktop_width: desktop.width,
      mobile_width: mobile.width,
      console_errors: 0,
      horizontal_overflow: 0,
      unnamed_controls: 0,
      images_without_alt: 0,
      theme_and_access_controls: "passed",
    },
  };
  fs.writeFileSync(path.join(output, "qa-result.json"), `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result));
})().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
