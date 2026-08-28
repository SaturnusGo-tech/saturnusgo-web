import type { TmsLocale } from "../model/locale";

const labels: Record<string, readonly [string, string]> = {
  acceptance: ["Acceptance", "Приёмочный"],
  active: ["Active", "Активен"],
  ad_hoc: ["Ad hoc", "Разовый"],
  archived: ["Archived", "В архиве"],
  blocked: ["Blocked", "Заблокирован"],
  checklist: ["Checklist", "Чек-лист"],
  closed: ["Closed", "Закрыт"],
  completed: ["Completed", "Завершён"],
  critical: ["Critical", "Критический"],
  deprecated: ["Deprecated", "Устарел"],
  draft: ["Draft", "Черновик"],
  failed: ["Failed", "Провален"],
  high: ["High", "Высокий"],
  in_progress: ["In progress", "В процессе"],
  low: ["Low", "Низкий"],
  manual: ["Manual", "Ручной"],
  medium: ["Medium", "Средний"],
  not_run: ["Not run", "Не запущен"],
  open: ["Open", "Открыт"],
  passed: ["Passed", "Пройден"],
  quarantined: ["Quarantined", "На карантине"],
  ready: ["Ready", "Готов"],
  regression: ["Regression", "Регресс"],
  skipped: ["Skipped", "Пропущен"],
  smoke: ["Smoke", "Смоук"],
  static: ["Static", "Статический"],
  dynamic: ["Dynamic", "Динамический"],
  verified: ["Verified", "Проверен"],
};

export const localizedLabel = (locale: TmsLocale, value: string) =>
  labels[value]?.[locale === "ru" ? 1 : 0] ?? value.replaceAll("_", " ");
