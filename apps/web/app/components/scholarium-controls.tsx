"use client";

import { useEffect, useRef, useState } from "react";
import type { ScholariumLocale } from "./scholarium-locale-runtime";

type Theme = "dark" | "light";
type AccessProfile = "base" | "autism-calm" | "adhd-sprint" | "deep-work";

const accessProfiles: Array<{ id: AccessProfile; label: string; note: string }> = [
  { id: "base", label: "Base", note: "Standard Scholarium presentation" },
  { id: "autism-calm", label: "Autism Calm", note: "Softer effects, calmer spacing" },
  { id: "adhd-sprint", label: "ADHD Sprint", note: "Strong focus and action priority" },
  { id: "deep-work", label: "Deep Work", note: "Muted decoration and reading contrast" },
];

function applyPreferences(theme: Theme, access: AccessProfile) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.access = access;
  document.documentElement.style.colorScheme = theme;
}

export function ScholariumControls({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [access, setAccess] = useState<AccessProfile>("base");
  const [locale, setLocale] = useState<ScholariumLocale>("en-CA");
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("scholarium.theme.v1");
    const storedAccess = window.localStorage.getItem("scholarium.access.v1");
    const storedLocale = window.localStorage.getItem("scholarium.locale.v1");
    const nextTheme: Theme = storedTheme === "light" ? "light" : "dark";
    const nextAccess = accessProfiles.some((item) => item.id === storedAccess) ? storedAccess as AccessProfile : "base";
    applyPreferences(nextTheme, nextAccess);
    const frame = window.requestAnimationFrame(() => {
      setTheme(nextTheme);
      setAccess(nextAccess);
      setLocale(storedLocale === "fr-CA" || storedLocale === "es" ? storedLocale : document.documentElement.lang === "fr-CA" || document.documentElement.lang === "es" ? document.documentElement.lang : "en-CA");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const syncLocale = (event: Event) => {
      const next = (event as CustomEvent<{ locale: ScholariumLocale }>).detail?.locale;
      if (next) setLocale(next);
    };
    window.addEventListener("scholarium:locale-changed", syncLocale);
    return () => window.removeEventListener("scholarium:locale-changed", syncLocale);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const changeTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.localStorage.setItem("scholarium.theme.v1", nextTheme);
    applyPreferences(nextTheme, access);
  };

  const changeAccess = (nextAccess: AccessProfile) => {
    setAccess(nextAccess);
    window.localStorage.setItem("scholarium.access.v1", nextAccess);
    applyPreferences(theme, nextAccess);
    setOpen(false);
  };

  const changeLocale = (nextLocale: ScholariumLocale) => {
    setLocale(nextLocale);
    void window.ScholariumI18n?.setLocale(nextLocale);
  };

  return <div className={`sch-controls${compact ? " schol-controls-compact" : ""}`} ref={panelRef}>
    <label className="sch-language-control">
      <span className="sr-only">Language</span>
      <span aria-hidden="true">文</span>
      <select data-control="language" aria-label="Language" value={locale} onChange={(event) => changeLocale(event.target.value as ScholariumLocale)}>
        <option value="fr-CA">FR</option>
        <option value="en-CA">EN</option>
        <option value="es">ES</option>
      </select>
    </label>
    <button className="sch-control-button" type="button" onClick={changeTheme} aria-label={`Use ${theme === "dark" ? "light" : "dark"} theme`}>
      <span aria-hidden="true">{theme === "dark" ? "☾" : "☼"}</span><span>{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
    <button className="sch-control-button" type="button" aria-expanded={open} aria-controls="sch-access-menu" onClick={() => setOpen((value) => !value)}>
      <span aria-hidden="true">◉</span><span>Access</span>
    </button>
    {open && <div className="sch-access-menu" id="sch-access-menu" role="dialog" aria-label="Access profile">
      <header><strong>Choose your reading profile</strong><span>Stored only in this browser.</span></header>
      {accessProfiles.map((profile) => <button key={profile.id} type="button" className={access === profile.id ? "active" : ""} onClick={() => changeAccess(profile.id)}>
        <span>{profile.label}</span><small>{profile.note}</small>
      </button>)}
    </div>}
  </div>;
}
