import type { FolderIconId } from "../../../folders/model/appearance/folder-appearance";

type Tone = "info" | "discovery" | "success" | "neutral";

export const sectionIcons = {
  box: "neutral",
  compass: "info",
  calendar: "info",
  clock: "neutral",
  briefcase: "neutral",
  users: "info",
  shield: "info",
  lock: "info",
  key: "info",
  browser: "info",
  phone: "info",
  devices: "info",
  globe: "success",
  gear: "neutral",
  wrench: "neutral",
  code: "discovery",
  terminal: "discovery",
  robot: "discovery",
  "puzzle-piece": "discovery",
  database: "success",
  cloud: "info",
  chart: "success",
  tag: "success",
  rocket: "discovery",
  flag: "neutral",
  package: "neutral",
  "list-checks": "success",
  clipboard: "neutral",
  "test-tube": "discovery",
  bug: "neutral",
  archive: "neutral",
  image: "discovery",
  video: "discovery",
  bookmark: "neutral",
  map: "success",
} as const satisfies Partial<Record<FolderIconId, Tone>>;

export type SectionIconId = keyof typeof sectionIcons;

const titleRules: readonly (readonly [SectionIconId, RegExp])[] = [
  ["calendar", /брониров|расписан|календар|запис[ьи]|\b(?:bookings?|reservations?|schedul\w*|calendar|appointments?)\b/iu],
  ["shield", /безопасн|авториз|аутентифик|доступ|прав[ао]|рол[ьи]|\b(?:security|permissions?|roles?|access|auth\w*|sso)\b/iu],
  ["rocket", /релиз|выпуск|развертыван|\b(?:releases?|deploy\w*|rollout|changelog)\b/iu],
  ["puzzle-piece", /интеграц|вебхук|\b(?:integrations?|webhooks?|connectors?)\b/iu],
  ["robot", /автоматизац|автотест|\b(?:automation|automated|codex|bots?|agents?)\b/iu],
  ["tag", /оплат|платеж|возврат|финанс|\b(?:payments?|billing|refunds?|invoices?|finance)\b/iu],
  ["bug", /дефект|ошибк|инцидент|\b(?:bugs?|defects?|incidents?|errors?)\b/iu],
  ["list-checks", /провер|тестир|тест[ыо -]|приемочн|чек[ -]?лист|\b(?:tests?|testing|qa|checklists?|regression|checks?)\b/iu],
  ["database", /данны|хранилищ|\b(?:data|database|databases|storage|sql)\b/iu],
  ["chart", /аналитик|метрик|отчет|\b(?:analytics|metrics?|reports?|dashboards?)\b/iu],
  ["code", /разработк|\b(?:api|sdk|cli|code|dev|development)\b/iu],
  ["phone", /мобильн|\b(?:mobile|ios|android)\b/iu],
  ["browser", /браузер|веб|\b(?:web|browsers?|frontend)\b/iu],
  ["globe", /локализац|перевод|\b(?:localization|localisation|translations?|i18n)\b/iu],
  ["cloud", /инфраструктур|облачн|\b(?:cloud|infrastructure|environments?)\b/iu],
  ["users", /команд|сотрудник|пользовател|\b(?:teams?|users?|members?|staff)\b/iu],
  ["gear", /настройк|конфигурац|\b(?:settings|config\w*|preferences)\b/iu],
  ["image", /изображен|дизайн|\b(?:images?|design|media|screenshots?)\b/iu],
  ["archive", /архив|\barchive\w*\b/iu],
  ["map", /объект|локац|карт[аы]|\b(?:locations?|maps?|properties)\b/iu],
  ["compass", /начал|введен|онбординг|\b(?:onboarding|introduction|getting started)\b/iu],
  ["bookmark", /справоч|руководств|инструкц|\b(?:guides?|guidelines?|reference|handbook|faq)\b/iu],
];

export function defaultSectionIcon(title: string): SectionIconId {
  const normalized = title.normalize("NFKC").replace(/ё/giu, "е");
  return titleRules.find(([, pattern]) => pattern.test(normalized))?.[0] ?? "box";
}

export function isSectionIconId(value: string | null): value is SectionIconId {
  return value !== null && Object.prototype.hasOwnProperty.call(sectionIcons, value);
}
