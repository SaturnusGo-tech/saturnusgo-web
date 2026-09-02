import type { TmsLocale } from "../../../localization/model/locale";

export function formatCaseEstimate(locale: TmsLocale, minutes: number) {
  if (minutes < 60) return `${minutes} ${locale === "ru" ? "мин" : "min"}`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  const duration = locale === "ru" ? `${hours} ч` : `${hours} h`;
  return remainder > 0
    ? `${duration} ${remainder} ${locale === "ru" ? "мин" : "min"}`
    : duration;
}
