"use client";

import { useEffect } from "react";

export type ScholariumLocale = "fr-CA" | "en-CA" | "es";

type Catalog = {
  $locale: ScholariumLocale;
  $sourceRevision: string;
  $translationStatus: string;
  strings: Record<string, string>;
};

type LocaleRuntime = {
  locale: ScholariumLocale;
  setLocale: (locale: ScholariumLocale, persist?: boolean) => Promise<void>;
};

declare global {
  interface Window {
    ScholariumI18n?: LocaleRuntime;
  }
}

const STORAGE_KEY = "scholarium.locale.v1";
const CANONICAL_LOCALE: ScholariumLocale = "en-CA";
const ACTIVE_LOCALES: ScholariumLocale[] = ["fr-CA", "en-CA", "es"];
const aliases: Record<string, ScholariumLocale> = {
  en: "en-CA", "en-ca": "en-CA", fr: "fr-CA", "fr-ca": "fr-CA", es: "es",
};
const profiles = {
  "fr-CA": { direction: "ltr", fontProfile: "latin-canadian" },
  "en-CA": { direction: "ltr", fontProfile: "latin-canadian" },
  es: { direction: "ltr", fontProfile: "latin-spanish" },
} as const;
const catalogCache = new Map<ScholariumLocale, Catalog>();
const canonicalText = new WeakMap<Text, string>();
const translatedAttributes = ["aria-label", "placeholder", "title"] as const;
let activeLocale: ScholariumLocale = CANONICAL_LOCALE;
let activeSelectedCatalog: Catalog | null = null;
let activeCanonicalCatalog: Catalog | null = null;
let applying = false;

function normalizeLocale(value: string | null | undefined): ScholariumLocale | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return aliases[normalized] ?? aliases[normalized.split("-")[0]] ?? null;
}

function resolveLocale(): ScholariumLocale {
  const query = normalizeLocale(new URLSearchParams(window.location.search).get("lang"));
  if (query) return query;
  const stored = normalizeLocale(window.localStorage.getItem(STORAGE_KEY));
  if (stored) return stored;
  for (const language of navigator.languages.length ? navigator.languages : [navigator.language]) {
    const locale = normalizeLocale(language);
    if (locale) return locale;
  }
  return CANONICAL_LOCALE;
}

async function loadCatalog(locale: ScholariumLocale): Promise<Catalog> {
  const cached = catalogCache.get(locale);
  if (cached) return cached;
  const response = await fetch(`/i18n/${locale}.json`, { cache: "no-cache" });
  if (!response.ok) throw new Error(`Unable to load Scholarium locale ${locale}`);
  const catalog = await response.json() as Catalog;
  catalogCache.set(locale, catalog);
  return catalog;
}

function normalizedText(value: string | null): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function isInterfaceText(node: Text): boolean {
  const parent = node.parentElement;
  if (!parent || !normalizedText(node.nodeValue)) return false;
  if (parent.matches(".publication-content h2, .publication-content > p, .publication-body h3, .publication-body > p, .library-result h2, .library-result > p, .profile-bio")) return false;
  return !parent.closest("script, style, code, pre, textarea, [contenteditable], [data-no-ui-translate], [data-user-content]");
}

function translatedValue(value: string, selected: Catalog, canonical: Catalog): string {
  return selected.strings[value] ?? canonical.strings[value] ?? value;
}

function applyCatalog(selected: Catalog, canonical: Catalog, root: ParentNode = document.body): void {
  applying = true;
  try {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        return isInterfaceText(node as Text) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      },
    });
    let current = walker.nextNode() as Text | null;
    while (current) {
      const source = canonicalText.get(current) ?? normalizedText(current.nodeValue);
      canonicalText.set(current, source);
      const translated = translatedValue(source, selected, canonical);
      if (translated !== normalizedText(current.nodeValue)) {
        const leading = current.nodeValue?.match(/^\s*/)?.[0] ?? "";
        const trailing = current.nodeValue?.match(/\s*$/)?.[0] ?? "";
        current.nodeValue = `${leading}${translated}${trailing}`;
      }
      current = walker.nextNode() as Text | null;
    }

    const elements = root instanceof Element ? [root, ...root.querySelectorAll("*")] : [...root.querySelectorAll("*")];
    for (const element of elements) {
      if (element.closest("[data-no-ui-translate], [data-user-content]")) continue;
      for (const attribute of translatedAttributes) {
        const currentValue = element.getAttribute(attribute);
        if (!currentValue) continue;
        const key = `schCanonical${attribute.replace(/(^|-)([a-z])/g, (_, __, letter: string) => letter.toUpperCase())}`;
        const source = (element as HTMLElement).dataset[key] ?? normalizedText(currentValue);
        (element as HTMLElement).dataset[key] = source;
        element.setAttribute(attribute, translatedValue(source, selected, canonical));
      }
    }

    const titleSource = document.documentElement.dataset.schCanonicalTitle ?? document.title;
    document.documentElement.dataset.schCanonicalTitle = titleSource;
    document.title = translatedValue(titleSource, selected, canonical);
    document.querySelectorAll<HTMLMetaElement>('meta[name="description"], meta[property="og:title"], meta[property="og:description"], meta[name="twitter:title"], meta[name="twitter:description"]').forEach((meta) => {
      const source = meta.dataset.schCanonicalContent ?? meta.content;
      meta.dataset.schCanonicalContent = source;
      meta.content = translatedValue(source, selected, canonical);
    });
  } finally {
    applying = false;
  }
}

async function setLocale(locale: ScholariumLocale, persist = true): Promise<void> {
  const normalized = ACTIVE_LOCALES.includes(locale) ? locale : CANONICAL_LOCALE;
  const canonical = await loadCatalog(CANONICAL_LOCALE);
  const selected = normalized === CANONICAL_LOCALE ? canonical : await loadCatalog(normalized).catch(() => canonical);
  activeLocale = selected.$locale;
  activeCanonicalCatalog = canonical;
  activeSelectedCatalog = selected;
  if (persist) window.localStorage.setItem(STORAGE_KEY, activeLocale);
  const profile = profiles[activeLocale];
  document.documentElement.lang = activeLocale;
  document.documentElement.dir = profile.direction;
  document.documentElement.dataset.locale = activeLocale;
  document.documentElement.dataset.fontProfile = profile.fontProfile;
  document.documentElement.dataset.translationStatus = selected.$translationStatus;
  document.documentElement.dataset.sourceRevision = selected.$sourceRevision;
  applyCatalog(selected, canonical);
  window.dispatchEvent(new CustomEvent("scholarium:locale-changed", { detail: { locale: activeLocale } }));
}

export function ScholariumLocaleRuntime() {
  useEffect(() => {
    let observer: MutationObserver | null = null;
    window.ScholariumI18n = {
      get locale() { return activeLocale; },
      setLocale,
    };
    void setLocale(resolveLocale(), false).then(() => {
      observer = new MutationObserver((mutations) => {
        if (applying || !activeSelectedCatalog || !activeCanonicalCatalog) return;
        for (const mutation of mutations) {
          mutation.addedNodes.forEach((node) => {
            if (node instanceof Element) applyCatalog(activeSelectedCatalog!, activeCanonicalCatalog!, node);
            else if (node instanceof Text && node.parentElement) applyCatalog(activeSelectedCatalog!, activeCanonicalCatalog!, node.parentElement);
          });
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }).catch(() => {
      document.documentElement.lang = CANONICAL_LOCALE;
    });
    return () => {
      observer?.disconnect();
      delete window.ScholariumI18n;
    };
  }, []);

  return null;
}
