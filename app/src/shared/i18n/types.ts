export const SUPPORTED_LOCALES = ["ru", "en", "es"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ru";

export const LOCALE_STORAGE_KEY = "saturnusgo.locale.v1";
export const LOCALE_COOKIE_NAME = "saturnusgo_locale";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export const LOCALE_META: Record<
  Locale,
  { nativeName: string; shortName: string; htmlLang: string }
> = {
  ru: { nativeName: "Русский", shortName: "RU", htmlLang: "ru" },
  en: { nativeName: "English", shortName: "EN", htmlLang: "en" },
  es: { nativeName: "Español", shortName: "ES", htmlLang: "es" },
};

export function isLocale(value: string | null | undefined): value is Locale {
  return SUPPORTED_LOCALES.some((locale) => locale === value);
}
