"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { tmsMessages } from "../catalog/messages";
import type { TmsMessageKey } from "../catalog/messages";
import {
  TMS_LOCALE_STORAGE_KEY,
  resolveTmsLocale,
  tmsLanguageTag,
} from "../model/locale";
import type { TmsLocale } from "../model/locale";
import { interpolateMessage } from "../model/message";
import type { TmsMessageVariables } from "../model/message";

export type TmsLocaleContextValue = {
  locale: TmsLocale;
  languageTag: "en-US" | "ru-RU";
  setLocale: (locale: TmsLocale) => void;
  t: (key: TmsMessageKey, variables?: TmsMessageVariables) => string;
};

export const TmsLocaleContext =
  createContext<TmsLocaleContextValue | null>(null);

type TmsLocaleProviderProps = {
  children: ReactNode;
  initialLocale?: TmsLocale;
};

export function TmsLocaleProvider({
  children,
  initialLocale,
}: TmsLocaleProviderProps) {
  const initialLocaleRef = useRef(initialLocale);
  const [locale, updateLocale] = useState<TmsLocale>(initialLocale ?? "en");
  const [resolved, setResolved] = useState(initialLocale !== undefined);

  useEffect(() => {
    const root = document.documentElement;
    const hadLanguage = root.hasAttribute("lang");
    const previousLanguage = root.getAttribute("lang");
    let savedLocale: string | null = null;
    try {
      savedLocale = window.localStorage.getItem(TMS_LOCALE_STORAGE_KEY);
    } catch {
      // Storage can be disabled; browser language still provides a safe default.
    }
    updateLocale(
      initialLocaleRef.current ??
        resolveTmsLocale(savedLocale, window.navigator.language),
    );
    setResolved(true);
    return () => {
      if (hadLanguage && previousLanguage) root.lang = previousLanguage;
      else root.removeAttribute("lang");
    };
  }, []);

  useEffect(() => {
    if (!resolved) return;
    document.documentElement.lang = locale;
    try {
      window.localStorage.setItem(TMS_LOCALE_STORAGE_KEY, locale);
    } catch {
      // The in-memory selection remains usable when persistence is blocked.
    }
  }, [locale, resolved]);

  const setLocale = useCallback((nextLocale: TmsLocale) => {
    updateLocale(nextLocale);
    setResolved(true);
  }, []);
  const t = useCallback(
    (key: TmsMessageKey, variables?: TmsMessageVariables) =>
      interpolateMessage(tmsMessages[locale][key], variables),
    [locale],
  );
  const value = useMemo<TmsLocaleContextValue>(
    () => ({ locale, languageTag: tmsLanguageTag(locale), setLocale, t }),
    [locale, setLocale, t],
  );
  return (
    <TmsLocaleContext.Provider value={value}>
      {resolved ? children : null}
    </TmsLocaleContext.Provider>
  );
}
