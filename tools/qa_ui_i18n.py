from __future__ import annotations

import argparse
import json
from pathlib import Path

from playwright.sync_api import sync_playwright


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "localization" / "browser-qa"
ROUTES = {"landing": "/", "commons": "/app", "teach": "/teach"}
LOCALES = {"fr-CA": "Accès", "en-CA": "Access", "es": "Acceso"}
VIEWPORTS = {"desktop": {"width": 1440, "height": 1000}, "mobile": {"width": 390, "height": 844}}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8796")
    args = parser.parse_args()
    OUTPUT.mkdir(parents=True, exist_ok=True)
    results: list[dict[str, object]] = []

    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(headless=True)
        for route_name, route in ROUTES.items():
            for locale, access_label in LOCALES.items():
                for viewport_name, viewport in VIEWPORTS.items():
                    context = browser.new_context(viewport=viewport)
                    page = context.new_page()
                    errors: list[str] = []
                    http_errors: list[dict[str, object]] = []
                    page.on("console", lambda message: errors.append(message.text) if message.type == "error" else None)
                    page.on("pageerror", lambda error: errors.append(str(error)))
                    page.on(
                        "response",
                        lambda item: http_errors.append({"url": item.url, "status": item.status})
                        if item.status >= 400 else None,
                    )
                    response = page.goto(f"{args.base_url}{route}?lang={locale}", wait_until="networkidle", timeout=45_000)
                    page.wait_for_function("document.documentElement.dataset.translationStatus", timeout=15_000)
                    document_locale = page.locator("html").get_attribute("lang")
                    translation_status = page.locator("html").get_attribute("data-translation-status")
                    selector = page.locator('select[data-control="language"]').first
                    controls_visible = selector.is_visible() and page.get_by_text(access_label, exact=True).first.is_visible()
                    selected_locale = selector.input_value()
                    overflow = page.evaluate("Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth")
                    body_text = page.locator("body").inner_text()
                    screenshot = OUTPUT / f"{route_name}-{locale}-{viewport_name}.png"
                    page.screenshot(path=str(screenshot), full_page=True)
                    unexpected_http_errors = [
                        item for item in http_errors
                        if not (item["status"] == 401 and "/api/account" in str(item["url"]))
                    ]
                    substantive_console_errors = [
                        item for item in errors if not item.startswith("Failed to load resource:")
                    ]
                    passed = bool(
                        response and response.status == 200 and document_locale == locale and selected_locale == locale
                        and controls_visible and overflow <= 2 and access_label in body_text
                        and not substantive_console_errors and not unexpected_http_errors
                    )
                    results.append({
                        "route": route, "surface": route_name, "locale": locale, "viewport": viewport_name,
                        "httpStatus": response.status if response else None, "documentLocale": document_locale,
                        "selectedLocale": selected_locale, "translationStatus": translation_status,
                        "controlsVisible": controls_visible, "overflowPixels": overflow,
                        "consoleErrors": errors, "httpErrors": http_errors,
                        "unexpectedHttpErrors": unexpected_http_errors,
                        "screenshot": str(screenshot.relative_to(ROOT)), "passed": passed,
                    })
                    context.close()
        browser.close()

    report = {
        "schema": "scholarium.ui-i18n-qa.v1",
        "passed": all(item["passed"] for item in results),
        "passedCount": sum(bool(item["passed"]) for item in results),
        "totalCount": len(results),
        "results": results,
    }
    report_path = OUTPUT.parent / "browser-qa-report.json"
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Scholarium i18n browser QA: {report['passedCount']}/{report['totalCount']}")
    if not report["passed"]:
        for result in results:
            if not result["passed"]:
                print(json.dumps(result, ensure_ascii=False))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
