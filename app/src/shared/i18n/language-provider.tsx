"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { dictionaries, type Dictionary } from "./dictionaries";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_NAME,
  LOCALE_META,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  isLocale,
  type Locale,
} from "./types";

type LanguageContextValue = {
  locale: Locale;
  dictionary: Dictionary;
  setLocale: (locale: Locale) => void;
};

declare global {
  interface Window {
    __SATURNUSGO_INITIAL_LOCALE__?: Locale;
  }
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readCookieLocale() {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${LOCALE_COOKIE_NAME}=`));

  if (!match) {
    return null;
  }

  const value = decodeURIComponent(match.split("=").slice(1).join("="));
  return isLocale(value) ? value : null;
}

function readWindowNameLocale() {
  if (typeof window === "undefined") {
    return null;
  }

  const match = window.name.match(/(?:^|;)saturnusgo_locale=(ru|en|es)(?:;|$)/);
  return isLocale(match?.[1]) ? match[1] : null;
}

function readStoredLocale() {
  if (typeof window === "undefined") {
    return DEFAULT_LOCALE;
  }

  if (isLocale(window.__SATURNUSGO_INITIAL_LOCALE__)) {
    return window.__SATURNUSGO_INITIAL_LOCALE__;
  }

  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (isLocale(stored)) {
      return stored;
    }
  } catch {
    // localStorage can be blocked; cookie fallback keeps the selector usable.
  }

  return readCookieLocale() ?? readWindowNameLocale() ?? DEFAULT_LOCALE;
}

function persistLocale(locale: Locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Ignore storage failures; the cookie below is enough for the session.
  }

  try {
    const entries = window.name
      .split(";")
      .filter((entry) => !entry.startsWith("saturnusgo_locale="));
    entries.push(`saturnusgo_locale=${locale}`);
    window.name = entries.filter(Boolean).join(";");
  } catch {
    // window.name is only a no-storage fallback.
  }

  try {
    document.cookie = `${LOCALE_COOKIE_NAME}=${encodeURIComponent(
      locale,
    )}; Max-Age=${LOCALE_COOKIE_MAX_AGE}; Path=/; SameSite=Lax`;
  } catch {
    // Some embedded browsers disable cookies entirely.
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const hasLoadedStoredLocale = useRef(false);
  const [locale, setLocaleState] = useState<Locale>(() => readStoredLocale());

  useEffect(() => {
    hasLoadedStoredLocale.current = true;
    setLocaleState(readStoredLocale());
  }, []);

  useEffect(() => {
    document.documentElement.lang = LOCALE_META[locale].htmlLang;
    document.documentElement.dataset.locale = locale;

    if (!hasLoadedStoredLocale.current) {
      return;
    }

    persistLocale(locale);
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    hasLoadedStoredLocale.current = true;
    setLocaleState(nextLocale);
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      locale,
      dictionary: dictionaries[locale],
      setLocale,
    }),
    [locale, setLocale],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }

  return context;
}

export { SUPPORTED_LOCALES, LOCALE_META };
export type { Locale };
