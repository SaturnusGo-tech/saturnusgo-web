export const TMS_LOCALE_STORAGE_KEY = "tms.locale.v1";

export const TMS_LOCALES = ["en", "ru"] as const;

export type TmsLocale = (typeof TMS_LOCALES)[number];

export const isTmsLocale = (value: unknown): value is TmsLocale =>
  typeof value === "string" && TMS_LOCALES.includes(value as TmsLocale);

export function requestedTmsLocale(search: string): TmsLocale | undefined {
  const values = new URLSearchParams(search).getAll("lang");
  return values.length === 1 && isTmsLocale(values[0]) ? values[0] : undefined;
}

export const resolveTmsLocale = (
  savedLocale: unknown,
  browserLanguage: string | null | undefined,
  requestedLocale?: unknown,
): TmsLocale => {
  if (isTmsLocale(requestedLocale)) return requestedLocale;
  if (isTmsLocale(savedLocale)) return savedLocale;
  return browserLanguage?.toLowerCase().startsWith("ru") ? "ru" : "en";
};

export const tmsLanguageTag = (locale: TmsLocale) =>
  locale === "ru" ? "ru-RU" : "en-US";
