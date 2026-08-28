import type { TmsLocale } from "../model/locale";

const russianPluralIndex = (value: number) => {
  const absolute = Math.abs(value);
  const lastTwo = absolute % 100;
  const last = absolute % 10;
  if (last === 1 && lastTwo !== 11) return 0;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return 1;
  return 2;
};

export function formatCount(
  locale: TmsLocale,
  value: number,
  english: readonly [string, string],
  russian: readonly [string, string, string],
) {
  const noun =
    locale === "ru"
      ? russian[russianPluralIndex(value)]
      : english[value === 1 ? 0 : 1];
  return `${value} ${noun}`;
}
