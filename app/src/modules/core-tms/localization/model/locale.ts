export const TMS_LOCALE_STORAGE_KEY = "tms.locale.v1";

export const TMS_LOCALES = ["en", "ru"] as const;

export type TmsLocale = (typeof TMS_LOCALES)[number];

export const isTmsLocale = (value: unknown): value is TmsLocale =>
  typeof value === "string" && TMS_LOCALES.includes(value as TmsLocale);

export const resolveTmsLocale = (
  savedLocale: unknown,
  browserLanguage: string | null | undefined,
): TmsLocale => {
  if (isTmsLocale(savedLocale)) return savedLocale;
  return browserLanguage?.toLowerCase().startsWith("ru") ? "ru" : "en";
};

export const tmsLanguageTag = (locale: TmsLocale) =>
  locale === "ru" ? "ru-RU" : "en-US";
