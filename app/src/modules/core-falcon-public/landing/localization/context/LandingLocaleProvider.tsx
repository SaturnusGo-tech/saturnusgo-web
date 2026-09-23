"use client";
import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import { englishCopy, russianCopy } from "../content/copy";
import { isLandingLocale, LANDING_LOCALE_KEY, resolveLandingLocale, type LandingLocale } from "../model/locale";

const Context = createContext({ locale: "en" as LandingLocale, preference: null as LandingLocale | null,
  copy: englishCopy, setLocale: (_locale: LandingLocale | null) => {} });
const useClientLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
export function LandingLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setResolved] = useState<LandingLocale>("en");
  const [preference, setPreference] = useState<LandingLocale | null>(null);
  const [ready, setReady] = useState(false);
  useClientLayoutEffect(() => {
    const read = () => {
      let saved: string | null = null;
      try { saved = localStorage.getItem(LANDING_LOCALE_KEY); } catch { /* Browsing without storage remains supported. */ }
      setPreference(isLandingLocale(saved) ? saved : null);
      setResolved(resolveLandingLocale(saved, navigator.language));
      setReady(true);
    };
    read();
    const onStorage = (event: StorageEvent) => { if (event.key === LANDING_LOCALE_KEY || event.key === null) read(); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  useEffect(() => {
    const sync = () => { if (!preference) setResolved(resolveLandingLocale(null, navigator.language)); };
    window.addEventListener("languagechange", sync);
    return () => window.removeEventListener("languagechange", sync);
  }, [preference]);
  const copy = locale === "ru" ? russianCopy : englishCopy;
  useClientLayoutEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.falconLandingLocale = locale;
    document.documentElement.lang = locale;
    document.title = copy.title;
    for (const selector of ['meta[name="description"]', 'meta[property="og:description"]', 'meta[name="twitter:description"]'])
      document.querySelector(selector)?.setAttribute("content", copy.description);
    for (const selector of ['meta[property="og:title"]', 'meta[name="twitter:title"]'])
      document.querySelector(selector)?.setAttribute("content", copy.title);
    document.querySelector('meta[property="og:locale"]')?.setAttribute("content", locale === "ru" ? "ru_RU" : "en_US");
  }, [locale, ready, copy]);
  const setLocale = (next: LandingLocale | null) => {
    setPreference(next);
    setResolved(resolveLandingLocale(next, navigator.language));
    try { if (next) localStorage.setItem(LANDING_LOCALE_KEY, next); else localStorage.removeItem(LANDING_LOCALE_KEY); } catch { /* Session preference still applies. */ }
  };
  return <Context.Provider value={{ locale, preference, copy, setLocale }}>{children}</Context.Provider>;
}
export const useLandingLocale = () => useContext(Context);
